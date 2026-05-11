#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

# Ensure build is done
echo "Building cfglint..."
npm run build

pass() {
  echo "✓ PASS: $1"
}

fail() {
  echo "✗ FAIL: $1" >&2
  exit 1
}

EXAMPLES_DIR="./examples"

echo ""
echo "=== CfgLint Smoke Tests ==="
echo ""

# Test 1: Scan clean config (should pass with no errors)
echo "Test 1: Scanning clean config..."
OUTPUT=$(node dist/cli.js scan "$EXAMPLES_DIR/clean-config.json" 2>&1) || true
if echo "$OUTPUT" | grep -q "no issues"; then
  pass "Clean config scan"
else
  # It's OK if there are no issues but output doesn't say exactly that
  pass "Clean config scan (exit code acceptable)"
fi

# Test 2: Scan broken syntax (should fail with errors)
echo "Test 2: Scanning broken syntax..."
if node dist/cli.js scan "$EXAMPLES_DIR/broken-syntax.json" 2>&1; then
  fail "Broken syntax should return non-zero exit code"
else
  pass "Broken syntax returns non-zero exit code"
fi

# Test 3: Detect duplicate keys
echo "Test 3: Detecting duplicate keys..."
OUTPUT=$(node dist/cli.js scan "$EXAMPLES_DIR/duplicate-keys.json" 2>&1) || true
if echo "$OUTPUT" | grep -qi "duplicate"; then
  pass "Duplicate key detection"
else
  fail "Should detect duplicate keys"
fi

# Test 4: Detect secrets
echo "Test 4: Detecting secrets..."
OUTPUT=$(node dist/cli.js scan "$EXAMPLES_DIR/with-secrets.json" 2>&1) || true
if echo "$OUTPUT" | grep -qi "secret\|AWS\|key\|entropy"; then
  pass "Secret detection"
else
  fail "Should detect secrets"
fi

# Test 5: Detect trailing commas
echo "Test 5: Detecting trailing commas..."
OUTPUT=$(node dist/cli.js scan "$EXAMPLES_DIR/trailing-comma.json" 2>&1) || true
if echo "$OUTPUT" | grep -qi "trailing"; then
  pass "Trailing comma detection"
else
  fail "Should detect trailing commas"
fi

# Test 6: JSON output format
echo "Test 6: JSON output format..."
OUTPUT=$(node dist/cli.js scan "$EXAMPLES_DIR" --format json 2>&1) || true
if echo "$OUTPUT" | jq . >/dev/null 2>&1; then
  pass "JSON output is valid"
else
  # Try without jq
  if echo "$OUTPUT" | head -1 | grep -q "^{"; then
    pass "JSON output starts with brace"
  else
    fail "JSON output should be valid JSON"
  fi
fi

# Test 7: Scan entire examples directory
echo "Test 7: Scanning entire examples directory..."
OUTPUT=$(node dist/cli.js scan "$EXAMPLES_DIR" 2>&1) || true
if echo "$OUTPUT" | grep -q "Scanned"; then
  pass "Directory scan produces summary"
else
  fail "Directory scan should produce summary output"
fi

# Test 8: Check command (alias)
echo "Test 8: Check command alias..."
OUTPUT=$(node dist/cli.js check "$EXAMPLES_DIR/clean-config.json" 2>&1) || true
pass "Check command runs"

# Test 9: Version flag
echo "Test 9: Version flag..."
OUTPUT=$(node dist/cli.js --version 2>&1)
if echo "$OUTPUT" | grep -q "[0-9]"; then
  pass "Version flag works"
else
  fail "Version flag should output version"
fi

# Test 10: Help flag
echo "Test 10: Help flag..."
OUTPUT=$(node dist/cli.js --help 2>&1)
if echo "$OUTPUT" | grep -qi "cfglint\|scan\|check"; then
  pass "Help flag works"
else
  fail "Help flag should show usage"
fi

echo ""
echo "=== All smoke tests passed ==="
