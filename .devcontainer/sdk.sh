#!/usr/bin/env bash
# Glow's exit screens call SDK methods no published version has: checkUnilateralExit
# and the verdict types it returns. So the package npm installs is replaced with one
# built from the branch the feature lives on, leaving package.json alone. Pinned to a
# revision rather than tracking the branch, since an SDK that moves under a fixed app
# is how you get a failure nobody else can reproduce.
set -euo pipefail
cd "$(dirname "$0")/.."

REPO=breez/spark-sdk
REV=5f8dbf170568222beda763dfd631ade50b80dc4b

installed=node_modules/@breeztech/breez-sdk-spark
if [ "$(cat "$installed/.built-rev" 2>/dev/null)" = "$REV" ]; then
  exit 0
fi

# wasm32 C dependencies (secp256k1) are compiled by clang; gcc cannot target it.
if ! command -v clang >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y --no-install-recommends clang llvm
fi

src="$HOME/.cache/spark-sdk"
if [ ! -e "$src/.git" ]; then
  rm -rf "$src"
  mkdir -p "$src"
  git -C "$src" init -q
  git -C "$src" remote add origin "https://x-access-token:${GITHUB_TOKEN}@github.com/${REPO}.git"
fi
git -C "$src" fetch -q --depth 1 origin "$REV"
git -C "$src" checkout -q FETCH_HEAD

rustup target add wasm32-unknown-unknown

echo "Building the SDK wasm package at ${REV:0:7} (once, and it takes minutes)."
CC_wasm32_unknown_unknown=clang AR_wasm32_unknown_unknown=llvm-ar \
  bash -c "cd '$src' && cargo xtask package wasm::all"

# wasm-pack drops a `.gitignore` of `*` in each output directory, and npm honours
# it when packing, so the tarball comes out empty unless they go first.
find "$src/packages/wasm" -name .gitignore -delete

# Packed rather than installed from the directory: a path dependency is linked, and
# the link would dangle the moment this cache is cleared.
tarball="$(cd "$src/packages/wasm" && npm pack --silent)"
npm install --no-save "$src/packages/wasm/$tarball"
echo "$REV" > "$installed/.built-rev"
