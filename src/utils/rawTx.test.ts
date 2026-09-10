import { describe, expect, it } from 'vitest';
import { outputTotalSat } from './rawTx';

// version | inputs=1 | outpoint | script=0 | sequence | outputs=1 | value | script | locktime
const legacy =
  '02000000' +
  '01' +
  '00'.repeat(32) + '00000000' +
  '00' +
  'ffffffff' +
  '01' +
  '2c1a090000000000' +
  '160014' + 'ab'.repeat(20) +
  '00000000';

// the same, with the segwit marker/flag and a one-item witness
const segwit =
  '02000000' + '0001' +
  '01' +
  '00'.repeat(32) + '00000000' +
  '00' +
  'ffffffff' +
  '01' +
  '2c1a090000000000' +
  '160014' + 'ab'.repeat(20) +
  '0100' +
  '00000000';

describe('outputTotalSat', () => {
  it('reads the output of a legacy-serialized transaction', () => {
    expect(outputTotalSat(legacy)).toBe(596_524);
  });

  it('steps over the segwit marker and reads the same output', () => {
    expect(outputTotalSat(segwit)).toBe(596_524);
  });

  it('adds every output up', () => {
    const two =
      '02000000' + '01' + '00'.repeat(32) + '00000000' + '00' + 'ffffffff' +
      '02' +
      '0100000000000000' + '160014' + 'ab'.repeat(20) +
      '0200000000000000' + '160014' + 'cd'.repeat(20) +
      '00000000';
    expect(outputTotalSat(two)).toBe(3);
  });

  it('returns nothing for hex that is not a transaction', () => {
    expect(outputTotalSat('deadbeef')).toBeNull();
  });
});
