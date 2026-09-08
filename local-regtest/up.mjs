#!/usr/bin/env node
/**
 * Brings the whole local regtest environment up: the Spark cluster, then the
 * gRPC-web proxy the browser needs, the chain indexer the app reads, and the
 * mempool it submits packages through.
 *
 *   node local-regtest/up.mjs [--no-explorer] [path-to-spark-regtest.json]
 *
 * Pass a config path to wire against a cluster you started yourself.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { startCluster } from './cluster.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
// A zero-fee tree transaction only relays as a package, which is the mempool's
// `/v1/txs/package`, so the explorer stack is part of a working environment
// rather than an extra. `--no-explorer` drops it for chain reads alone.
const explorer = !args.includes('--no-explorer');
const configPath = args.find(a => !a.startsWith('--'));

const run = (cmd, cmdArgs) => execFileSync(cmd, cmdArgs, { stdio: 'inherit', cwd: here });

// A config path means the cluster is someone else's to run.
if (!configPath) await startCluster();

run('node', [resolve(here, 'wire.mjs'), ...(configPath ? [configPath] : [])]);

// Recreated rather than restarted: the operator ports change every run, and the
// config is read once at startup.
try {
  execFileSync('docker', ['rm', '-f', 'spark-grpcweb'], { stdio: 'ignore' });
} catch {
  // Not running yet, which is the normal first-run case.
}
run('docker', [
  'run', '-d', '--name', 'spark-grpcweb',
  // Docker Desktop resolves this name for free; plain Linux (a Codespace, CI)
  // does not, and envoy's upstreams are all addressed by it.
  '--add-host', 'host.docker.internal:host-gateway',
  '-p', '8080:8080', '-p', '8081:8081', '-p', '8082:8082', '-p', '9901:9901',
  '-v', `${resolve(here, 'envoy.yaml')}:/etc/envoy/envoy.yaml:ro`,
  'envoyproxy/envoy:v1.31-latest', '-c', '/etc/envoy/envoy.yaml',
]);

run('docker', ['compose', ...(explorer ? ['--profile', 'explorer'] : []), 'up', '-d']);

console.log(`
Environment up.
  app        npm run dev
  cluster    local-regtest/cluster.log
  indexer    http://localhost:3002${explorer ? '\n  mempool    http://localhost:8998\n  explorer   http://localhost:3001' : '\n  no mempool: package broadcast is unavailable'}

Restart the dev server if it was already running: .env.local changed.`);
