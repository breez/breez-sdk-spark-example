import {
  Config,
  Network,
  SdkBuilder,
  SparkConfig,
  connect,
  defaultConfig,
  type BreezSdk,
  type RestClient,
  type RestResponse,
  type Seed,
} from '@breeztech/breez-sdk-spark';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { getSettings } from './settings';
import { logger, LogCategory } from './logger';
import { formatError } from '../utils/formatError';
import { USDB_TOKEN_IDENTIFIER, USDB_TICKER } from '../constants/stableBalance';

function localCluster(): SparkConfig | null {
  const raw = import.meta.env.VITE_SPARK_LOCAL_CONFIG;
  if (!raw) return null;
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

// The SDK's own HTTP timeout. iOS native HTTP would otherwise wait 10 minutes.
const TIMEOUT_MS = 60_000;

async function nativeRequest(
  method: string,
  url: string,
  headers?: Record<string, string>,
  body?: string,
): Promise<RestResponse> {
  const res = await CapacitorHttp.request({
    method,
    url,
    headers,
    data: body,
    connectTimeout: TIMEOUT_MS,
    readTimeout: TIMEOUT_MS,
  });
  // A JSON response arrives already parsed; the SDK wants the raw text.
  return { status: res.status, body: typeof res.data === 'string' ? res.data : JSON.stringify(res.data) };
}

/**
 * LNURL callbacks (auth, pay, withdraw) over native HTTP, which has no CORS.
 *
 * Through the WebView's fetch they need `Access-Control-Allow-Origin` on the
 * response, which LUD-01 requires only for browser-based clients, so services
 * built for native apps often leave it out. The callback still reaches the
 * service (a LNURL-auth login goes through), but the WebView withholds the
 * response and the SDK reports "Failed to fetch".
 */
const nativeLnurlClient: RestClient = {
  getRequest: (url, headers) => nativeRequest('GET', url, headers),
  postRequest: (url, headers, body) => nativeRequest('POST', url, headers, body),
  deleteRequest: (url, headers, body) => nativeRequest('DELETE', url, headers, body),
};

/**
 * Connects a wallet. A config built for a local cluster is pointed at that
 * cluster's own indexer, since the hosted one knows nothing about its chain.
 * On iOS / Android, LNURL callbacks go over native HTTP.
 */
export async function connectSdk(params: {
  config: Config;
  seed: Seed;
  storageDir: string;
}): Promise<BreezSdk> {
  const { config, seed, storageDir } = params;
  const chainApiUrl = import.meta.env.VITE_ESPLORA_BASE_URL;
  const localChainUrl = chainApiUrl && config.apiKey == null && config.sparkConfig ? chainApiUrl : null;
  const native = Capacitor.isNativePlatform();
  if (!localChainUrl && !native) return connect({ config, seed, storageDir });
  let builder = SdkBuilder.new(config, seed);
  if (localChainUrl) builder = builder.withRestChainService(localChainUrl, 'esplora');
  if (native) builder = builder.withLnurlClient(nativeLnurlClient);
  return (await builder.withDefaultStorage(storageDir)).build();
}
