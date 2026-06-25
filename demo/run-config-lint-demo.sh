#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out_dir="$repo_root/tmp/config-lint-demo"

cd "$repo_root"
rm -rf "$out_dir"
mkdir -p "$out_dir"

npm run build

node dist/cli.js scan examples/clean-config.json --out "$out_dir/clean.txt"

set +e
node dist/cli.js scan examples/with-secrets.json --format json --out "$out_dir/secrets.json"
secret_status=$?
set -e

if [ "$secret_status" -eq 0 ]; then
  echo "Expected secret fixture to return a non-zero status" >&2
  exit 1
fi

grep -qi 'no issues' "$out_dir/clean.txt"
grep -qi 'secret' "$out_dir/secrets.json"

printf 'Clean config report: %s\n' "$out_dir/clean.txt"
printf 'Secret fixture JSON: %s\n' "$out_dir/secrets.json"
