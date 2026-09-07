#!/usr/bin/env node
/** Tears down everything up.mjs started, the Spark cluster included. */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { stopCluster } from './cluster.mjs';

const here = dirname(fileURLToPath(import.meta.url));
try {
  execFileSync('docker', ['rm', '-f', 'spark-grpcweb'], { stdio: 'ignore' });
} catch {
  // Already gone.
}
execFileSync('docker', ['compose', '--profile', 'explorer', 'down'], { stdio: 'inherit', cwd: here });
stopCluster();
