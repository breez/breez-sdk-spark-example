#!/usr/bin/env bash
# The operators run from images the SDK's test fixtures expect to find locally:
# neither spark-so nor spark-migrations is published to a registry, so anywhere
# the SDK's integration tests have never run has to build them. The dockerfiles
# ship with the spark-itest checkout cargo fetches for local-regtest/cluster.
set -euo pipefail
cd "$(dirname "$0")/.."

have() { docker image inspect "$1" >/dev/null 2>&1; }
if have spark-so:latest && have spark-migrations:latest; then
  exit 0
fi

# dockerd starts alongside the container and onCreateCommand can win the race.
for _ in $(seq 1 60); do
  docker info >/dev/null 2>&1 && break
  sleep 2
done
docker info >/dev/null 2>&1 || { echo "Docker is not responding." >&2; exit 1; }

rev="$(sed -n 's/.*rev = "\([0-9a-f]\{7,\}\)".*/\1/p' local-regtest/cluster/Cargo.toml | head -1)"
checkouts="${CARGO_HOME:-$HOME/.cargo}/git/checkouts"
docker_dir="$(find "$checkouts" -maxdepth 5 -type d -path "*/${rev:0:7}/crates/spark-itest/docker" 2>/dev/null | head -1)"
[ -n "$docker_dir" ] || docker_dir="$(find "$checkouts" -maxdepth 5 -type d -path '*/crates/spark-itest/docker' 2>/dev/null | head -1)"
if [ -z "$docker_dir" ]; then
  echo "No spark-itest checkout under $checkouts. Build the cluster first:" >&2
  echo "  cargo build --release --manifest-path local-regtest/cluster/Cargo.toml" >&2
  exit 1
fi

echo "Building the operator images from $docker_dir (once, and it takes minutes)."
docker build -t spark-migrations -f "$docker_dir/migrations.dockerfile" "$docker_dir"
docker build -t spark-so -f "$docker_dir/spark-so.dockerfile" "$docker_dir"
