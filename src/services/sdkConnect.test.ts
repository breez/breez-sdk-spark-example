import { describe, it, expect, vi } from 'vitest';
import { SdkBuilder, connect, type Config, type RestClient, type Seed } from '@breeztech/breez-sdk-spark';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { connectSdk } from './sdkConnect';

vi.mock('@breeztech/breez-sdk-spark', () => ({ connect: vi.fn(), SdkBuilder: { new: vi.fn() } }));
vi.mock('@capacitor/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@capacitor/core')>();
  return {
    ...actual,
    Capacitor: { ...actual.Capacitor, isNativePlatform: vi.fn() },
    CapacitorHttp: { request: vi.fn() },
  };
});

const params = { config: {} as Config, seed: {} as Seed, storageDir: 'dir' };

describe('connectSdk', () => {
  it('keeps the plain connect() on the web', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    await connectSdk(params);
    expect(connect).toHaveBeenCalledWith(params);
    expect(SdkBuilder.new).not.toHaveBeenCalled();
  });

  it('sends LNURL callbacks over native HTTP and hands the SDK the raw body', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    let client: RestClient | undefined;
    const builder = {
      withLnurlClient: vi.fn((c: RestClient) => { client = c; return builder; }),
      withDefaultStorage: vi.fn(async () => builder),
      build: vi.fn(async () => 'sdk'),
    };
    vi.mocked(SdkBuilder.new).mockReturnValue(builder as unknown as SdkBuilder);

    expect(await connectSdk(params)).toBe('sdk');
    expect(builder.withDefaultStorage).toHaveBeenCalledWith('dir');

    // CapacitorHttp parses JSON responses itself and passes other bodies as text.
    vi.mocked(CapacitorHttp.request).mockResolvedValueOnce({ status: 200, data: { status: 'OK' }, headers: {}, url: '' });
    expect(await client!.getRequest('https://svc/cb?k1=aa')).toEqual({ status: 200, body: '{"status":"OK"}' });
    expect(CapacitorHttp.request).toHaveBeenLastCalledWith(expect.objectContaining({ method: 'GET', url: 'https://svc/cb?k1=aa' }));

    vi.mocked(CapacitorHttp.request).mockResolvedValueOnce({ status: 502, data: 'Bad Gateway', headers: {}, url: '' });
    expect(await client!.getRequest('https://svc/cb')).toEqual({ status: 502, body: 'Bad Gateway' });
  });
});
