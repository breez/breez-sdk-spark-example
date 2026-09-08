import {
  Config,
  Network,
  SdkBuilder,
  SparkConfig,
  connect,
  defaultConfig,
  type BreezSdk,
  type Seed,
} from '@breeztech/breez-sdk-spark';
import { getSettings } from './settings';
import { logger, LogCategory } from './logger';
import { formatError } from '../utils/formatError';
import { USDB_TOKEN_IDENTIFIER, USDB_TICKER } from '../constants/stableBalance';

/**
 * A cluster config fetched at runtime, for a hosted regtest whose operator keys
 * are generated when the cluster starts and so cannot be known at build time.
 * Populated by `loadRuntimeClusterConfig` before anything renders; the built-in
 * env var still wins for a locally-wired cluster.
 */
let runtimeCluster: SparkConfig | null = null;

/**
 * Reads the cluster config a hosted regtest serves alongside the app. Absent
 * (a normal build, or the file is not served) leaves the env var in charge, so
 * this is safe to call unconditionally at startup.
 */
export async function loadRuntimeClusterConfig(url = '/cluster-config.json'): Promise<void> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return;
    runtimeCluster = (await res.json()) as SparkConfig;
    logger.info(LogCategory.SDK, 'Using the cluster config served with the app');
  } catch {
    // No hosted cluster: the env var, or no local cluster at all.
  }
}

function localCluster(): SparkConfig | null {
  const raw = import.meta.env.VITE_SPARK_LOCAL_CONFIG;
  if (!raw) return runtimeCluster;
  try {
    return JSON.parse(raw) as SparkConfig;
  } catch (e) {
    logger.warn(LogCategory.SDK, 'Ignoring unparseable local cluster config', {
      error: formatError(e),
    });
    return null;
  }
}

/**
 * Points the config at a locally-run cluster when one is configured, and
 * reports whether it took over. A local cluster runs no Breez services, so the
 * hosted endpoints have to be cleared or connect fails reaching them. Leaf
 * optimization is turned off so leaves are not split or merged behind a test's
 * back.
 */
function applyLocalCluster(config: Config, network: Network): boolean {
  const cluster = network === 'regtest' ? localCluster() : null;
  if (!cluster) return false;
  config.sparkConfig = cluster;
  config.apiKey = undefined;
  config.lnurlDomain = undefined;
  config.realTimeSyncServerUrl = undefined;
  config.leafOptimizationConfig.autoEnabled = false;
  return true;
}

/**
 * Build a Breez SDK Config from environment and persisted user settings.
 * Pure function — no side effects beyond reading env vars and localStorage.
 */
export function buildConnectConfig(overrideNetwork?: Network): Config {
  const urlParams = new URLSearchParams(window.location.search);
  const network = (overrideNetwork ?? (urlParams.get('network') ?? 'mainnet')) as Network;
  const config: Config = defaultConfig(network);
  config.apiKey = import.meta.env.VITE_BREEZ_API_KEY;

  if (!applyLocalCluster(config, network) && !config.apiKey) {
    throw new Error('Breez API key not found. Create a .env file with VITE_BREEZ_API_KEY=your_key');
  }

  config.stableBalanceConfig = {
    tokens: [{ label: USDB_TICKER, tokenIdentifier: USDB_TOKEN_IDENTIFIER }],
  };
  // Cross-chain sends are mainnet-only: the SDK rejects the config on any
  // other network at connect time, which aborts the whole connection.
  if (network === 'mainnet') {
    config.crossChainConfig = {};
  }

  try {
    const s = getSettings();
    if (s.depositMaxFee) {
      config.maxDepositClaimFee = s.depositMaxFee;
    }
    if (s.syncIntervalSecs != null) {
      config.syncIntervalSecs = s.syncIntervalSecs;
    }
    if (s.lnurlDomain != null) {
      config.lnurlDomain = s.lnurlDomain;
    }
    if (s.preferSparkOverLightning != null) {
      config.preferSparkOverLightning = s.preferSparkOverLightning;
    }
  } catch (e) {
    logger.warn(LogCategory.SDK, 'Failed to apply user settings to config', {
      error: formatError(e),
    });
  }

  return config;
}

/**
 * Connects a wallet. A config built for a local cluster is pointed at that
 * cluster's own indexer, since the hosted one knows nothing about its chain.
 */
export async function connectSdk(params: {
  config: Config;
  seed: Seed;
  storageDir: string;
}): Promise<BreezSdk> {
  const { config, seed, storageDir } = params;
  const chainApiUrl = import.meta.env.VITE_ESPLORA_BASE_URL;
  if (chainApiUrl && config.apiKey == null && config.sparkConfig) {
    const builder = SdkBuilder.new(config, seed).withRestChainService(chainApiUrl, 'esplora');
    return (await builder.withDefaultStorage(storageDir)).build();
  }
  return connect({ config, seed, storageDir });
}
