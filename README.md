# cfglint

Configuration file linter for local-first repos. Point `cfglint` at a directory and it scans JSON, YAML, INI, TOML, and `.env` files for syntax errors, trailing commas, duplicate keys, hardcoded secrets, and suspicious environment variable references.

It can auto-fix repairable issues, output structured reports (JSON/SARIF), and is designed for CI pre-flight checks and developer tooling audits.

- **Local-first** — no network calls, no telemetry
- **Multi-format** — JSON, YAML, INI, TOML, `.env`
- **Auto-fix** — `--fix` repairs syntax-level issues in place
- **CI-ready** — `check` command exits non-zero on any finding; SARIF output for GitHub

## Install

```sh
npm install -g cfglint
# or from a checkout:
npm install
npm run build
npm link
```

## Quick start

```sh
# Scan a directory and print findings
cfglint scan ./config

# Same scan, but exit non-zero on any issue (CI gate)
cfglint check ./config

# Auto-fix repairable issues (dry run first)
cfglint scan ./config --fix --dry-run
cfglint scan ./config --fix

# JSON output for downstream tooling
cfglint scan ./config --format json --out report.json

# SARIF output for GitHub code scanning
cfglint scan ./config --format sarif --out results.sarif
```

## What cfglint checks

### Syntax rules
- JSON syntax errors and **trailing commas** (common in hand-edited config)
- YAML parse failures
- TOML and INI syntax validation

### Structural rules
- **Duplicate keys** within the same config scope
- Missing or malformed nested objects

### Security rules
- **Hardcoded secrets**: AWS keys, API tokens, private key fragments
- High-entropy string detection (possible leaked credentials)
- Suspicious `.env` reference patterns (`process.env.X` where `X` looks sensitive)

## Severity levels

| Level    | Meaning                                     |
|:---------|:--------------------------------------------|
| `fatal`  | Unparseable file; no further analysis       |
| `error`  | Definite issue (syntax, duplicate, secret)  |
| `warning`| Suspicious pattern, needs human review      |
| `info`   | Low-signal observation                      |

Filter with `--severity warning` to suppress info-level noise.

## Output formats

- **human** (default): readable terminal output with per-file summaries
- **json**: machine-readable array of issue objects
- **sarif**: SARIF 2.1.0 for GitHub Advanced Security integration

```sh
cfglint scan . --format json | jq '.[] | select(.severity == "error")'
```

## Auto-fix

`cfglint scan --fix` applies in-place repairs for fixable issues:
- Remove trailing commas in JSON
- Fix malformed JSON syntax where recoverable
- Other structural corrections flagged as `fixable: true`

Always run `--dry-run` first to preview changes.

## Verification

```sh
npm test          # 76 tests across 14 test files
npm run check     # TypeScript type check
npm run build     # Compile TypeScript
npm run smoke     # 10 fixture-backed smoke tests
npm run release:check  # Full pre-release gate
```

## Safety

cfglint reads files and writes reports. `--fix` modifies files in place (always use `--dry-run` first). It does not make network calls, execute config values, install dependencies, or collect telemetry.

## License

MIT
