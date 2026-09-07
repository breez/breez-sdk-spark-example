import JSZip from 'jszip';
import { shareOrDownloadZip } from '@/services/logExport';
import type { UnilateralExitPlan } from './driver';

const readme = (plan: UnilateralExitPlan): string =>
  [
    'Glow exit transactions',
    '',
    `Destination: ${plan.destination}`,
    `Fee rate: ${plan.feeRateSatPerVbyte} sat/vB`,
    `Recoverable: ${plan.exit.recoverableValueSat} sats`,
    '',
    'Broadcast these in the order listed in transactions.json.',
    '',
    'A transaction can go out once every txid in its dependsOn has confirmed',
    'and its csvTimelockBlocks have passed since then.',
    '',
    'A transaction that has a cpfpTxHex pays no fee on its own. Broadcast it',
    'together with its child as a package, with a node that supports package',
    'relay:',
    '',
    '  bitcoin-cli submitpackage \'["<txHex>", "<cpfpTxHex>"]\'',
    '',
    'A transaction with no cpfpTxHex (the fan-out and the sweep) pays its own',
    'fee. Broadcast it on its own, anywhere:',
    '',
    '  bitcoin-cli sendrawtransaction <txHex>',
    '',
    'funding.json holds the Bitcoin that paid these fees. Keep it: rebuilding',
    'the exit later needs it.',
    '',
  ].join('\n');

export async function exportUnilateralExitPackage(plan: UnilateralExitPlan): Promise<void> {
  const zip = new JSZip();
  zip.file('README.txt', readme(plan));
  zip.file('transactions.json', JSON.stringify(plan.exit.transactions, null, 2));
  zip.file('funding.json', JSON.stringify(plan.exit.fundingInputs, null, 2));

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const timestamp = Math.floor(Date.now() / 1000);
  await shareOrDownloadZip(blob, `${timestamp}_glow_unilateral_exit.zip`, 'Glow Unilateral Exit');
}
