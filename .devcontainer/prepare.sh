#!/usr/bin/env bash
# Everything slow, run once when the Codespace is created. A prebuild runs this
# too, which is what keeps a colleague's first start to seconds rather than the
# minutes the Rust build costs.
set -euo pipefail
cd "$(dirname "$0")/.."

npm ci

# The cluster binary stands the operators up from the SDK's own test fixtures.
# Building it here means `regtest:up` has nothing left to compile.
cargo build --release --manifest-path local-regtest/cluster/Cargo.toml
