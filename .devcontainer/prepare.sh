#!/usr/bin/env bash
# Everything slow, run once when the Codespace is created. A prebuild runs this
# too, which is what keeps a colleague's first start to seconds rather than the
# minutes the Rust build costs.
set -euo pipefail
cd "$(dirname "$0")/.."

# The SDK's proto crates run `protoc` from their build scripts, and the base
# image has no compiler. libprotobuf-dev carries the well-known types the SDK's
# protos import (timestamp, duration, empty, descriptor); protoc finds them at
# /usr/include on its own, so it is required even though only protoc is called.
if [ ! -f /usr/include/google/protobuf/timestamp.proto ]; then
  sudo apt-get update
  sudo apt-get install -y --no-install-recommends protobuf-compiler libprotobuf-dev
fi

npm ci

# The cluster binary stands the operators up from the SDK's own test fixtures.
# Building it here means `regtest:up` has nothing left to compile.
cargo build --release --manifest-path local-regtest/cluster/Cargo.toml
