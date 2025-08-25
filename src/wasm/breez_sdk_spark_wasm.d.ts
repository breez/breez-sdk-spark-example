/* tslint:disable */
/* eslint-disable */
export function initLogging(logger: Logger, filter?: string | null): Promise<void>;
export function defaultConfig(network: Network): Config;
export function parse(input: string): Promise<InputType>;
/**
 * Entry point invoked by JavaScript in a worker.
 */
export function task_worker_entry_point(ptr: number): void;
/**
 * The `ReadableStreamType` enum.
 *
 * *This API requires the following crate features to be activated: `ReadableStreamType`*
 */
type ReadableStreamType = "bytes";
export interface LogEntry {
    line: string;
    level: string;
}

export interface GetPaymentResponse {
    payment: Payment;
}

export interface GetPaymentRequest {
    paymentId: string;
}

export interface ListPaymentsResponse {
    payments: Payment[];
}

export interface ListPaymentsRequest {
    offset?: number;
    limit?: number;
}

export interface SendPaymentResponse {
    payment: Payment;
}

export interface SendPaymentRequest {
    prepareResponse: PrepareSendPaymentResponse;
    options?: SendPaymentOptions;
}

export type SendPaymentOptions = { type: "bitcoinAddress"; confirmationSpeed: OnchainConfirmationSpeed } | { type: "bolt11Invoice"; useSpark: boolean };

export type OnchainConfirmationSpeed = "fast" | "medium" | "slow";

export interface PrepareSendPaymentResponse {
    paymentMethod: SendPaymentMethod;
    amountSats: number;
}

export interface PrepareSendPaymentRequest {
    paymentRequest: string;
    amountSats?: number;
}

export interface LnurlPayResponse {
    payment: Payment;
    successAction?: SuccessActionProcessed;
}

export interface LnurlPayRequest {
    prepareResponse: PrepareLnurlPayResponse;
}

export interface PrepareLnurlPayResponse {
    amountSats: number;
    comment?: string;
    payRequest: LnurlPayRequestDetails;
    feeSats: number;
    invoiceDetails: Bolt11InvoiceDetails;
    successAction?: SuccessAction;
}

export interface PrepareLnurlPayRequest {
    amountSats: number;
    comment?: string;
    payRequest: LnurlPayRequestDetails;
    validateSuccessActionUrl?: boolean;
}

export interface ReceivePaymentResponse {
    paymentRequest: string;
}

export interface ReceivePaymentRequest {
    prepareResponse: PrepareReceivePaymentResponse;
}

export interface PrepareReceivePaymentResponse {
    paymentMethod: ReceivePaymentMethod;
    feeSats: number;
}

export interface PrepareReceivePaymentRequest {
    paymentMethod: ReceivePaymentMethod;
}

export type SendPaymentMethod = { type: "bitcoinAddress"; address: BitcoinAddressDetails; feeQuote: SendOnchainFeeQuote } | { type: "bolt11Invoice"; invoiceDetails: Bolt11InvoiceDetails; sparkTransferFeeSats?: number; lightningFeeSats: number } | { type: "sparkAddress"; address: string; feeSats: number };

export interface SendOnchainSpeedFeeQuote {
    userFeeSat: number;
    l1BroadcastFeeSat: number;
}

export interface SendOnchainFeeQuote {
    id: string;
    expiresAt: number;
    speedFast: SendOnchainSpeedFeeQuote;
    speedMedium: SendOnchainSpeedFeeQuote;
    speedSlow: SendOnchainSpeedFeeQuote;
}

export type ReceivePaymentMethod = { type: "sparkAddress" } | { type: "bitcoinAddress" } | { type: "bolt11Invoice"; description: string; amountSats?: number };

export interface SyncWalletResponse {}

export interface SyncWalletRequest {}

export interface GetInfoResponse {
    balanceSats: number;
}

export interface GetInfoRequest {}

export interface Credentials {
    username: string;
    password: string;
}

export type Fee = { type: "fixed"; amount: number } | { type: "rate"; satPerVbyte: number };

export interface Config {
    network: Network;
    syncIntervalSecs: number;
    maxDepositClaimFee?: Fee;
}

export type Network = "mainnet" | "regtest";

export interface AesSuccessActionData {
    description: string;
    ciphertext: string;
    iv: string;
}

export type SuccessAction = { type: "aes"; data: AesSuccessActionData } | { type: "message"; data: MessageSuccessActionData } | { type: "url"; data: UrlSuccessActionData };

export interface UrlSuccessActionData {
    description: string;
    url: string;
    matchesCallbackDomain: boolean;
}

export interface MessageSuccessActionData {
    message: string;
}

export interface AesSuccessActionDataDecrypted {
    description: string;
    plaintext: string;
}

export type AesSuccessActionDataResult = { type: "decrypted"; data: AesSuccessActionDataDecrypted } | { type: "errorStatus"; reason: string };

export type SuccessActionProcessed = { type: "aes"; result: AesSuccessActionDataResult } | { type: "message"; data: MessageSuccessActionData } | { type: "url"; data: UrlSuccessActionData };

export interface LnurlPayInfo {
    lnAddress?: string;
    comment?: string;
    domain?: string;
    metadata?: string;
    processedSuccessAction?: SuccessActionProcessed;
    rawSuccessAction?: SuccessAction;
}

export type PaymentMethod = "lightning" | "spark" | "deposit" | "withdraw" | "unknown";

export type PaymentDetails = { type: "spark" } | { type: "lightning"; description?: string; preimage?: string; invoice: string; paymentHash: string; destinationPubkey: string; lnurlPayInfo?: LnurlPayInfo } | { type: "withdraw"; txId: string } | { type: "deposit"; txId: string };

export interface Payment {
    id: string;
    paymentType: PaymentType;
    status: PaymentStatus;
    amount: number;
    fees: number;
    timestamp: number;
    method: PaymentMethod;
    details?: PaymentDetails;
}

export type PaymentStatus = "completed" | "pending" | "failed";

export type PaymentType = "send" | "receive";

export interface LnurlWithdrawRequestDetails {
    callback: string;
    k1: string;
    defaultDescription: string;
    minWithdrawable: number;
    maxWithdrawable: number;
}

export interface Bolt12InvoiceRequestDetails {}

export interface Bip21Extra {
    key: string;
    value: string;
}

export interface Bip21Details {
    amountSat?: number;
    assetId?: string;
    uri: string;
    extras: Bip21Extra[];
    label?: string;
    message?: string;
    paymentMethods: InputType[];
}

export interface LnurlAuthRequestDetails {
    k1: string;
    action?: string;
    domain: string;
    url: string;
}

export interface SilentPaymentAddressDetails {
    address: string;
    network: BitcoinNetwork;
    source: PaymentRequestSource;
}

export interface LnurlPayRequestDetails {
    callback: string;
    minSendable: number;
    maxSendable: number;
    metadataStr: string;
    commentAllowed: number;
    domain: string;
    url: string;
    address?: string;
    allowsNostr: boolean;
    nostrPubkey?: string;
}

export interface LightningAddressDetails {
    address: string;
    payRequest: LnurlPayRequestDetails;
}

export type Amount = { type: "bitcoin"; amountMsat: number } | { type: "currency"; iso4217Code: string; fractionalAmount: number };

export interface Bolt12OfferBlindedPath {
    blindedHops: string[];
}

export interface Bolt12OfferDetails {
    absoluteExpiry?: number;
    chains: string[];
    description?: string;
    issuer?: string;
    minAmount?: Amount;
    offer: Bolt12Offer;
    paths: Bolt12OfferBlindedPath[];
    signingPubkey?: string;
}

export interface Bolt12Offer {
    offer: string;
    source: PaymentRequestSource;
}

export interface Bolt12Invoice {
    invoice: string;
    source: PaymentRequestSource;
}

export interface Bolt12InvoiceDetails {
    amountMsat: number;
    invoice: Bolt12Invoice;
}

export interface Bolt11RouteHintHop {
    srcNodeId: string;
    shortChannelId: string;
    feesBaseMsat: number;
    feesProportionalMillionths: number;
    cltvExpiryDelta: number;
    htlcMinimumMsat?: number;
    htlcMaximumMsat?: number;
}

export interface Bolt11RouteHint {
    hops: Bolt11RouteHintHop[];
}

export interface Bolt11Invoice {
    bolt11: string;
    source: PaymentRequestSource;
}

export interface Bolt11InvoiceDetails {
    amountMsat?: number;
    description?: string;
    descriptionHash?: string;
    expiry: number;
    invoice: Bolt11Invoice;
    minFinalCltvExpiryDelta: number;
    network: BitcoinNetwork;
    payeePubkey: string;
    paymentHash: string;
    paymentSecret: string;
    routingHints: Bolt11RouteHint[];
    timestamp: number;
}

export interface PaymentRequestSource {
    bip21Uri?: string;
    bip353Address?: string;
}

export type BitcoinNetwork = "bitcoin" | "testnet3" | "testnet4" | "signet" | "regtest";

export interface BitcoinAddressDetails {
    address: string;
    network: BitcoinNetwork;
    source: PaymentRequestSource;
}

export type InputType = ({ type: "bitcoinAddress" } & BitcoinAddressDetails) | ({ type: "bolt11Invoice" } & Bolt11InvoiceDetails) | ({ type: "bolt12Invoice" } & Bolt12InvoiceDetails) | ({ type: "bolt12Offer" } & Bolt12OfferDetails) | ({ type: "lightningAddress" } & LightningAddressDetails) | ({ type: "lnurlPay" } & LnurlPayRequestDetails) | ({ type: "silentPaymentAddress" } & SilentPaymentAddressDetails) | ({ type: "lnurlAuth" } & LnurlAuthRequestDetails) | ({ type: "url" } & string) | ({ type: "bip21" } & Bip21Details) | ({ type: "bolt12InvoiceRequest" } & Bolt12InvoiceRequestDetails) | ({ type: "lnurlWithdraw" } & LnurlWithdrawRequestDetails);

export type DepositClaimError = { type: "depositClaimFeeExceeded"; tx: string; vout: number; maxFee: Fee; actualFee: number } | { type: "missingUtxo"; tx: string; vout: number } | { type: "generic"; message: string };

export interface DepositInfo {
    txid: string;
    vout: number;
    amountSats: number;
    refundTx?: string;
    refundTxId?: string;
    claimError?: DepositClaimError;
}

export type SdkEvent = { type: "synced" } | { type: "claimDepositsFailed"; unclaimedDeposits: DepositInfo[] } | { type: "claimDepositsSucceeded"; claimedDeposits: DepositInfo[] } | { type: "paymentSucceeded"; payment: Payment };

export interface Logger {
    log: (l: LogEntry) => void;
}

export interface EventListener {
    onEvent: (e: SdkEvent) => void;
}

export class BreezSdk {
  private constructor();
  free(): void;
  addEventListener(listener: EventListener): string;
  removeEventListener(id: string): boolean;
  disconnect(): void;
  getInfo(request: GetInfoRequest): GetInfoResponse;
  prepareReceivePayment(request: PrepareReceivePaymentRequest): PrepareReceivePaymentResponse;
  receivePayment(request: ReceivePaymentRequest): Promise<ReceivePaymentResponse>;
  prepareSendPayment(request: PrepareSendPaymentRequest): Promise<PrepareSendPaymentResponse>;
  prepareLnurlPay(request: PrepareLnurlPayRequest): Promise<PrepareLnurlPayResponse>;
  lnurlPay(request: LnurlPayRequest): Promise<LnurlPayResponse>;
  sendPayment(request: SendPaymentRequest): Promise<SendPaymentResponse>;
  syncWallet(request: SyncWalletRequest): SyncWalletResponse;
  listPayments(request: ListPaymentsRequest): ListPaymentsResponse;
  getPayment(request: GetPaymentRequest): GetPaymentResponse;
}
export class IntoUnderlyingByteSource {
  private constructor();
  free(): void;
  start(controller: ReadableByteStreamController): void;
  pull(controller: ReadableByteStreamController): Promise<any>;
  cancel(): void;
  readonly type: ReadableStreamType;
  readonly autoAllocateChunkSize: number;
}
export class IntoUnderlyingSink {
  private constructor();
  free(): void;
  write(chunk: any): Promise<any>;
  close(): Promise<any>;
  abort(reason: any): Promise<any>;
}
export class IntoUnderlyingSource {
  private constructor();
  free(): void;
  pull(controller: ReadableStreamDefaultController): Promise<any>;
  cancel(): void;
}
export class SdkBuilder {
  private constructor();
  free(): void;
  static new(config: Config, mnemonic: string, data_dir: string): SdkBuilder;
  withRestChainService(url: string, credentials?: Credentials | null): SdkBuilder;
  build(): Promise<BreezSdk>;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_sdkbuilder_free: (a: number, b: number) => void;
  readonly sdkbuilder_new: (a: any, b: number, c: number, d: number, e: number) => [number, number, number];
  readonly sdkbuilder_withRestChainService: (a: number, b: number, c: number, d: number) => number;
  readonly sdkbuilder_build: (a: number) => any;
  readonly __wbg_breezsdk_free: (a: number, b: number) => void;
  readonly initLogging: (a: any, b: number, c: number) => any;
  readonly defaultConfig: (a: any) => any;
  readonly parse: (a: number, b: number) => any;
  readonly breezsdk_addEventListener: (a: number, b: any) => [number, number];
  readonly breezsdk_removeEventListener: (a: number, b: number, c: number) => number;
  readonly breezsdk_disconnect: (a: number) => [number, number];
  readonly breezsdk_getInfo: (a: number, b: any) => [number, number, number];
  readonly breezsdk_prepareReceivePayment: (a: number, b: any) => [number, number, number];
  readonly breezsdk_receivePayment: (a: number, b: any) => any;
  readonly breezsdk_prepareSendPayment: (a: number, b: any) => any;
  readonly breezsdk_prepareLnurlPay: (a: number, b: any) => any;
  readonly breezsdk_lnurlPay: (a: number, b: any) => any;
  readonly breezsdk_sendPayment: (a: number, b: any) => any;
  readonly breezsdk_syncWallet: (a: number, b: any) => [number, number, number];
  readonly breezsdk_listPayments: (a: number, b: any) => [number, number, number];
  readonly breezsdk_getPayment: (a: number, b: any) => [number, number, number];
  readonly rust_sqlite_wasm_shim_localtime_js: (a: bigint, b: number) => void;
  readonly rust_sqlite_wasm_shim_tzset_js: (a: number, b: number, c: number, d: number) => void;
  readonly rust_sqlite_wasm_shim_emscripten_get_now: () => number;
  readonly rust_sqlite_wasm_shim_wasi_random_get: (a: number, b: number) => number;
  readonly rust_sqlite_wasm_shim_exit: (a: number) => void;
  readonly rust_sqlite_wasm_shim_abort_js: () => void;
  readonly rust_sqlite_wasm_shim_malloc: (a: number) => number;
  readonly rust_sqlite_wasm_shim_free: (a: number) => void;
  readonly rust_sqlite_wasm_shim_realloc: (a: number, b: number) => number;
  readonly rust_sqlite_wasm_shim_calloc: (a: number, b: number) => number;
  readonly sqlite3_os_init: () => number;
  readonly task_worker_entry_point: (a: number) => [number, number];
  readonly __wbg_intounderlyingbytesource_free: (a: number, b: number) => void;
  readonly intounderlyingbytesource_type: (a: number) => number;
  readonly intounderlyingbytesource_autoAllocateChunkSize: (a: number) => number;
  readonly intounderlyingbytesource_start: (a: number, b: any) => void;
  readonly intounderlyingbytesource_pull: (a: number, b: any) => any;
  readonly intounderlyingbytesource_cancel: (a: number) => void;
  readonly __wbg_intounderlyingsource_free: (a: number, b: number) => void;
  readonly intounderlyingsource_pull: (a: number, b: any) => any;
  readonly intounderlyingsource_cancel: (a: number) => void;
  readonly __wbg_intounderlyingsink_free: (a: number, b: number) => void;
  readonly intounderlyingsink_write: (a: number, b: any) => any;
  readonly intounderlyingsink_close: (a: number) => any;
  readonly intounderlyingsink_abort: (a: number, b: any) => any;
  readonly rustsecp256k1_v0_10_0_context_create: (a: number) => number;
  readonly rustsecp256k1_v0_10_0_context_destroy: (a: number) => void;
  readonly rustsecp256k1_v0_10_0_default_illegal_callback_fn: (a: number, b: number) => void;
  readonly rustsecp256k1_v0_10_0_default_error_callback_fn: (a: number, b: number) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_5: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly _dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hc48adf558b9dba83: (a: number, b: number) => void;
  readonly closure3748_externref_shim: (a: number, b: number, c: any) => void;
  readonly closure4030_externref_shim: (a: number, b: number, c: any, d: any) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
