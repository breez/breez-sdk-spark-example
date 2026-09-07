#!/usr/bin/env node
/**
 * Gives the test wallet leaves, against the cluster already running. A wallet in
 * the browser cannot claim its own deposit on a local cluster, so `regtest_up`
 * holds one that can and does it on request.
 *
 *   node local-regtest/fund.mjs <sats> <count> [spark address]
 */
const [sats = '200000', count = '1', address] = process.argv.slice(2);
const base = process.env.FUND_URL ?? 'http://127.0.0.1:8997';

const query = new URLSearchParams({ sats, count });
if (address) query.set('address', address);

console.log(`Funding ${count} x ${sats} sats...`);
let response;
try {
  response = await fetch(`${base}/fund?${query}`, { signal: AbortSignal.timeout(15 * 60_000) });
} catch (e) {
  console.error(`No cluster answering at ${base}. Start it first: npm run regtest:up`);
  process.exit(1);
}

const body = await response.json();
if (body.error) {
  console.error(`Funding failed: ${body.error}`);
  process.exit(1);
}
console.log(`Funded ${body.funded} x ${body.sats} sats.`);
