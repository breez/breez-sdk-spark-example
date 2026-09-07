/**
 * The Spark cluster: three operators, their databases and a bitcoind, started
 * from the sdk's own test fixtures by the `cluster` crate beside this file.
 *
 * It runs detached with its output in a log file, so `regtest:up` can return
 * rather than holding a terminal. `regtest:down` stops it.
 */
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const crate = resolve(here, 'cluster');

export const CONFIG_PATH = '/tmp/spark-regtest.json';
export const LOG_PATH = resolve(here, 'cluster.log');
const PID_PATH = resolve(here, 'cluster.pid');
const FUND_URL = 'http://127.0.0.1:8997/';

const sleep = ms => new Promise(r => setTimeout(r, ms));

const reachable = async url => {
  try {
    return (await fetch(url, { signal: AbortSignal.timeout(2_000) })).ok;
  } catch {
    return false;
  }
};

export const isClusterUp = () => reachable(FUND_URL);

export async function startCluster() {
  if (await isClusterUp()) {
    console.log('Cluster already up.');
    return;
  }

  // Built ahead of spawning: a first build takes minutes, and its progress is
  // worth seeing rather than hiding in the log.
  console.log('Building the cluster runner...');
  execFileSync('cargo', ['build', '--release'], { stdio: 'inherit', cwd: crate });

  rmSync(CONFIG_PATH, { force: true });
  const log = openSync(LOG_PATH, 'w');
  const child = spawn(resolve(crate, 'target', 'release', 'glow-regtest'), [], {
    cwd: crate,
    detached: true,
    stdio: ['ignore', log, log],
    env: { ...process.env, RUST_LOG: process.env.RUST_LOG ?? 'info,testcontainers=warn' },
  });
  child.unref();
  writeFileSync(PID_PATH, String(child.pid));

  console.log('Starting the cluster (bitcoind, 3 operators)...');
  for (let waited = 0; waited < 600_000; waited += 2_000) {
    if (existsSync(CONFIG_PATH) && (await isClusterUp())) return;
    if (child.exitCode !== null) {
      throw new Error(`The cluster exited early. See ${LOG_PATH}`);
    }
    await sleep(2_000);
  }
  throw new Error(`The cluster did not come up in 10 minutes. See ${LOG_PATH}`);
}

export function stopCluster() {
  if (!existsSync(PID_PATH)) return;
  const pid = Number.parseInt(readFileSync(PID_PATH, 'utf8'), 10);
  try {
    // SIGINT, not SIGKILL: the fixtures tear their containers down on Ctrl-C.
    process.kill(pid, 'SIGINT');
  } catch {
    // Already gone.
  }
  rmSync(PID_PATH, { force: true });
}
