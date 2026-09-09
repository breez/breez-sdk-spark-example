#!/usr/bin/env node
/**
 * Wires this app to a local Spark cluster: writes the Envoy gRPC-web config the
 * browser needs to reach the operators, and the .env.local entries pointing at
 * them and at the cluster's bitcoind. A step of `up.mjs`, which runs it after
 * every cluster start since the ports change each time.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

// Anchored to this file, not the shell's cwd, so it runs from anywhere.
const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..');
const inRepo = (...p) => resolve(repo, ...p);

const source = process.argv[2] ?? '/tmp/spark-regtest.json';
if (!existsSync(source)) {
  console.error(`No cluster config at ${source}. Start the cluster first: npm run regtest:up`);
  process.exit(1);
}

const cluster = JSON.parse(readFileSync(source, 'utf8'));
const operators = cluster.signingOperators;
const listenPort = index => 8080 + index;

const listener = (op, i) => `
  - name: l${i}
    address: { socket_address: { address: 0.0.0.0, port_value: ${listenPort(i)} } }
    filter_chains:
    - filters:
      - name: envoy.filters.network.http_connection_manager
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
          stat_prefix: ingress${i}
          codec_type: AUTO
          stream_idle_timeout: 0s
          route_config:
            name: r${i}
            virtual_hosts:
            - name: v${i}
              domains: ["*"]
              typed_per_filter_config:
                envoy.filters.http.cors:
                  "@type": type.googleapis.com/envoy.extensions.filters.http.cors.v3.CorsPolicy
                  allow_origin_string_match:
                  - safe_regex: { regex: ".*" }
                  allow_methods: "GET, PUT, DELETE, POST, OPTIONS"
                  allow_headers: "keep-alive,user-agent,cache-control,content-type,content-transfer-encoding,x-accept-content-transfer-encoding,x-accept-response-streaming,x-user-agent,x-grpc-web,grpc-timeout,authorization"
                  max_age: "1728000"
                  expose_headers: "grpc-status,grpc-message,grpc-status-details-bin"
              routes:
              - match: { prefix: "/" }
                route: { cluster: op${i}, timeout: 0s, max_stream_duration: { grpc_timeout_header_max: 0s } }
          http_filters:
          - name: envoy.filters.http.grpc_web
            typed_config: { "@type": type.googleapis.com/envoy.extensions.filters.http.grpc_web.v3.GrpcWeb }
          - name: envoy.filters.http.cors
            typed_config: { "@type": type.googleapis.com/envoy.extensions.filters.http.cors.v3.Cors }
          - name: envoy.filters.http.router
            typed_config: { "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router }`;

const upstream = (op, i) => `
  - name: op${i}
    connect_timeout: 10s
    type: LOGICAL_DNS
    dns_lookup_family: V4_ONLY
    typed_extension_protocol_options:
      envoy.extensions.upstreams.http.v3.HttpProtocolOptions:
        "@type": type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions
        explicit_http_config:
          http2_protocol_options: {}
    load_assignment:
      cluster_name: op${i}
      endpoints:
      - lb_endpoints:
        - endpoint: { address: { socket_address: { address: host.docker.internal, port_value: ${op.address.split(':').pop()} } } }
    transport_socket:
      name: envoy.transport_sockets.tls
      typed_config:
        "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext
        common_tls_context: {}`;

const envoyPath = inRepo('local-regtest/envoy.yaml');
writeFileSync(
  envoyPath,
  'admin:\n  address: { socket_address: { address: 0.0.0.0, port_value: 9901 } }\n' +
    'static_resources:\n  listeners:' +
    operators.map(listener).join('') +
    '\n  clusters:' +
    operators.map(upstream).join('') +
    '\n',
);

// The browser reaches operators through the proxies, never the TLS ports, so
// the cluster's own CA is irrelevant to it and is left out.
const sparkConfig = {
  coordinatorIdentifier: cluster.coordinatorIdentifier,
  threshold: cluster.threshold,
  signingOperators: operators.map((op, i) => ({
    id: op.id,
    identifier: op.identifier,
    identityPublicKey: op.identityPublicKey,
    address: `http://localhost:${listenPort(i)}`,
  })),
  sspConfig: cluster.sspConfig,
  expectedWithdrawBondSats: cluster.expectedWithdrawBondSats,
  expectedWithdrawRelativeBlockLocktime: cluster.expectedWithdrawRelativeBlockLocktime,
};

const MEMPOOL_API_PORT = process.env.MEMPOOL_API_PORT ?? '8998';
const ELECTRS_HTTP_PORT = process.env.ELECTRS_HTTP_PORT ?? '3002';

const managed = {
  VITE_SPARK_LOCAL_CONFIG: JSON.stringify(sparkConfig),
  BITCOIND_RPC_URL: cluster.bitcoind.rpcUrl.replace(/\/$/, ''),
  BITCOIND_RPC_USER: cluster.bitcoind.rpcUser,
  BITCOIND_RPC_PASSWORD: cluster.bitcoind.rpcPassword,
  VITE_MEMPOOL_BASE_URL: `http://localhost:${process.env.MEMPOOL_API_PORT ?? 8998}/api`,
  VITE_ESPLORA_BASE_URL: `http://localhost:${ELECTRS_HTTP_PORT}`,
};

const envPath = inRepo('.env.local');
const kept = (existsSync(envPath) ? readFileSync(envPath, 'utf8').split('\n') : []).filter(
  line => !Object.keys(managed).some(key => line.startsWith(`${key}=`)),
);
writeFileSync(
  envPath,
  [...kept, ...Object.entries(managed).map(([k, v]) => `${k}=${v}`), ''].join('\n').replace(/\n{3,}/g, '\n\n'),
);

// The mempool stack reaches bitcoind over the host, so it needs the mapped
// port rather than the cluster's internal one.
// electrs indexes from the node's own block files, so it needs the volume the
// cluster gave bitcoind. The name is regenerated per run, hence the lookup.
const bitcoindDataVolume = () =>
  execSync(
    `docker ps --format '{{.Names}}' | grep -m1 '^bitcoind-' | ` +
      `xargs -I{} docker inspect {} --format '{{range .Mounts}}{{.Name}}{{end}}'`,
    { shell: '/bin/bash' },
  )
    .toString()
    .trim();

// Docker gives host-gateway both an A and an AAAA record, and electrs picks the
// AAAA, which bitcoind's IPv4-only forwarder never answers. Falls back to the
// name where the lookup cannot run: hosts without the AAAA resolve it fine.
const bitcoindHost = () => {
  try {
    return execSync(
      `docker run --rm --add-host=h:host-gateway alpine getent ahostsv4 h | head -1 | cut -d' ' -f1`,
      { shell: '/bin/bash', stdio: ['ignore', 'pipe', 'ignore'] },
    )
      .toString()
      .trim();
  } catch {
    return 'host.docker.internal';
  }
};

const rpc = new URL(cluster.bitcoind.rpcUrl);
const composeEnvPath = inRepo('local-regtest/.env');
writeFileSync(
  composeEnvPath,
  [
    `BITCOIND_HOST=${bitcoindHost()}`,
    `BITCOIND_RPC_PORT=${rpc.port}`,
    `BITCOIND_RPC_USER=${cluster.bitcoind.rpcUser}`,
    `BITCOIND_RPC_PASSWORD=${cluster.bitcoind.rpcPassword}`,
    `MEMPOOL_API_PORT=${MEMPOOL_API_PORT}`,
    `ELECTRS_HTTP_PORT=${ELECTRS_HTTP_PORT}`,
    `BITCOIND_DATA_VOLUME=${bitcoindDataVolume()}`,
    '',
  ].join('\n'),
);

console.log(`Wrote ${envoyPath}`);
console.log(`Wrote ${composeEnvPath}`);
console.log(`Updated ${envPath} (${Object.keys(managed).length} entries)`);
