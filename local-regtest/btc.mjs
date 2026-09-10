#!/usr/bin/env node
/**
 * Talks to the cluster's bitcoind and to electrs, for the things a manual exit
 * test needs: an address to exit to, coins to pay the miners with, blocks to
 * mature timelocks, and a balance to check at the end.
 *
 *   node local-regtest/btc.mjs address
 *   node local-regtest/btc.mjs send <address> <sats>
 *   node local-regtest/btc.mjs mine [blocks]
 *   node local-regtest/btc.mjs balance <address>
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

function env() {
  const path = resolve(here, '..', '.env.local');
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch {
    die(`No ${path}. Start the cluster, then run: npm run regtest:up`);
  }
  const read = key => text.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim();
  const url = read('BITCOIND_RPC_URL');
  if (!url) die('No BITCOIND_RPC_URL in .env.local. Run: npm run regtest:up');
  return {
    url,
    user: read('BITCOIND_RPC_USER') ?? 'rpcuser',
    password: read('BITCOIND_RPC_PASSWORD') ?? 'rpcpassword',
    esplora: read('VITE_ESPLORA_BASE_URL') ?? 'http://localhost:3002',
  };
}

const die = msg => {
  console.error(msg);
  process.exit(1);
};

async function rpc(method, params = []) {
  const { url, user, password } = env();
  const res = await fetch(`${url.replace(/\/$/, '')}/wallet/default`, {
    method: 'POST',
    headers: {
      'content-type': 'text/plain',
      authorization: `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`,
    },
    body: JSON.stringify({ jsonrpc: '1.0', id: 'regtest', method, params }),
  }).catch(e => die(`bitcoind unreachable at ${url}: ${e.message}`));
  const body = await res.json();
  if (body.error) die(`bitcoind: ${body.error.message}`);
  return body.result;
}

const toBtc = sats => (Number(sats) / 1e8).toFixed(8);

// Outside the node's wallet: coinbases piling up there slow later blocks down.
const MINING_ADDRESS = 'bcrt1qs758ursh4q9z627kt3pp5yysm78ddny6txaqgw';
const mine = blocks => rpc('generatetoaddress', [blocks, MINING_ADDRESS]);

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case 'address': {
    console.log(await rpc('getnewaddress', ['regtest-test', 'bech32']));
    break;
  }
  case 'send': {
    const [address, sats] = args;
    if (!address || !sats) die('usage: send <address> <sats>');
    const txid = await rpc('sendtoaddress', [address, toBtc(sats)]);
    // Mined straight away: everything downstream waits on confirmation anyway.
    await mine(1);
    console.log(`sent ${sats} sats to ${address}`);
    console.log(`txid ${txid}, confirmed in block ${await rpc('getblockcount')}`);
    break;
  }
  case 'mine': {
    const blocks = Number(args[0] ?? 1);
    if (!Number.isInteger(blocks) || blocks < 1) die('usage: mine [blocks]');
    await mine(blocks);
    console.log(`mined ${blocks} block(s), tip is now ${await rpc('getblockcount')}`);
    break;
  }
  case 'balance': {
    const [address] = args;
    if (!address) die('usage: balance <address>');
    const { esplora } = env();
    const res = await fetch(`${esplora}/address/${address}`).catch(e =>
      die(`electrs unreachable at ${esplora}: ${e.message}`),
    );
    const { chain_stats: c, mempool_stats: m } = await res.json();
    const confirmed = c.funded_txo_sum - c.spent_txo_sum;
    const pending = m.funded_txo_sum - m.spent_txo_sum;
    console.log(`${confirmed} sats confirmed${pending ? `, ${pending} sats pending` : ''}`);
    break;
  }
  default:
    die(`usage: address | send <address> <sats> | mine [blocks] | balance <address>`);
}
