# CfgLint Build Tasks

## Phase 1: Core Infrastructure

### 1.1 Package Setup
- [x] Scaffold directory exists
- [ ] Update `package.json` with proper metadata (name: `@rogerchappel/cfglint`, cli bin, scripts)
- [ ] Add dependencies: `@types/node`, `typescript`, `vitest`, `picocolors`, `commander`, `glob`, `js-yaml`, `toml`, `ini`
- [ ] Add `tsconfig.json` for ESM build
- [ ] Add `.cfglintignore` support parser

### 1.2 CLI Entry Point
- [ ] `src/cli.ts` — commander-based CLI with commands: `scan`, `check` (alias)
- [ ] Arguments: `<path>`, `--format` (human|json|sarif), `--fix`, `--fix --dry-run`, `--severity`, `--ignore-node-modules`, `--secret-patterns <file>`, `--out <file>`
- [ ] Exit codes: 0 (clean), 1 (warnings/errors found), 2 (fatal/usage error)

## Phase 2: Parsers

### 2.1 JSON Parser (`src/parsers/json.ts`)
- [ ] Parse JSON with duplicate key detection
- [ ] Syntax error detection with line/column info
- [ ] Trailing comma detection (non-standard)
- [ ] Comment detection (/\/\*/ and //)
- [ ] Return AST with key positions for fixes

### 2.2 YAML Parser (`src/parsers/yaml.ts`)
- [ ] Basic YAML parse using `js-yaml`
- [ ] Syntax error reporting
- [ ] Secret scanning in values

### 2.3 TOML Parser (`src/parsers/toml.ts`)
- [ ] Basic TOML parse using `toml` package
- [ ] Syntax error reporting
- [ ] Secret scanning in values

### 2.4 INI Parser (`src/parsers/ini.ts`)
- [ ] Parse INI format with sections
- [ ] Secret scanning in values

### 2.5 ENV Parser (`src/parsers/env.ts`)
- [ ] Parse `.env` and `.env.*` files
- [ ] Extract `KEY=VALUE` pairs
- [ ] Track defined env var names for reference integrity

## Phase 3: Detection Rules

### 3.1 Secrets Detection (`src/rules/secrets.ts`)
- [ ] High-entropy string detection (Shannon entropy threshold > 4.5)
- [ ] Known patterns: AWS keys (`AKIA[0-9A-Z]{16}`), GitHub tokens, private key headers (`-----BEGIN`)
- [ ] Configurable via `--secret-patterns <file>`
- [ ] False positive reduction: skip short strings, common words

### 3.2 Duplicate Keys (`src/rules/duplicates.ts`)
- [ ] Detect duplicate keys in JSON objects
- [ ] Report all duplicates with line numbers
- [ ] Mark as auto-fixable (remove duplicates, keep first)

### 3.3 Syntax Errors (`src/rules/syntax.ts`)
- [ ] JSON parse errors with position
- [ ] YAML/TOML/INI parse errors

### 3.4 ENV Reference Integrity (`src/rules/env-refs.ts`)
- [ ] Extract `$VAR` and `${VAR}` references from all config files
- [ ] Cross-reference against `.env` and `.env.*` definitions
- [ ] Report undefined references

### 3.5 Type Mismatches (`src/rules/types.ts`)
- [ ] Basic type checking when schema hints provided (optional v1)

## Phase 4: Output & Fixing

### 4.1 Output Formatters (`src/output/`)
- [ ] `human.ts` — colored terminal output with icons (⚠️ ✓ ✗)
- [ ] `json.ts` — structured JSON array of issues
- [ ] `sarif.ts` — SARIF 2.1.0 format for CI integration

### 4.2 Auto-Fix Engine (`src/fix.ts`)
- [ ] JSON duplicate key removal
- [ ] Trailing comma removal in JSON
- [ ] `--fix --dry-run` mode (report without writing)
- [ ] File write with backup safety

## Phase 5: File Scanning

### 5.1 Directory Walker (`src/scan.ts`)
- [ ] Recursive directory traversal
- [ ] Filter by extension: `.json`, `.yml`, `.yaml`, `.toml`, `.ini`, `.env`, `.env.*`
- [ ] Respect `--ignore-node-modules` flag
- [ ] Parse `.cfglintignore` file for gitignore-like patterns
- [ ] Configurable max depth

### 5.2 `.cfglintignore` Parser (`src/ignore.ts`)
- [ ] Parse gitignore-style patterns
- [ ] Support `*`, `**`, `?`, `!` globs
- [ ] Match against file paths relative to scan root

## Phase 6: Testing & Examples

### 6.1 Unit Tests (`tests/`)
- [ ] `tests/parsers/json.test.ts` — parse, duplicate keys, syntax errors
- [ ] `tests/parsers/yaml.test.ts` — basic parse, errors
- [ ] `tests/parsers/toml.test.ts` — basic parse, errors
- [ ] `tests/parsers/ini.test.ts` — basic parse
- [ ] `tests/parsers/env.test.ts` — extract vars
- [ ] `tests/rules/secrets.test.ts` — entropy, patterns
- [ ] `tests/rules/duplicates.test.ts` — detection
- [ ] `tests/output/human.test.ts` — format output
- [ ] `tests/output/json.test.ts` — format output
- [ ] `tests/scan.test.ts` — directory walk, ignore patterns
- [ ] `tests/ignore.test.ts` — pattern matching
- [ ] `tests/fix.test.ts` — auto-fix operations

### 6.2 Example Fixtures (`examples/`)
- [ ] `examples/clean-config.json` — valid JSON, no issues
- [ ] `examples/duplicate-keys.json` — JSON with duplicate keys
- [ ] `examples/with-secrets.json` — config with embedded secret patterns
- [ ] `examples/broken-syntax.json` — invalid JSON
- [ ] `examples/trailing-comma.json` — JSON with trailing commas
- [ ] `examples/sample.env` — env file with vars
- [ ] `examples/ref-env.json` — config referencing undefined env vars
- [ ] `examples/config.yml` — sample YAML config
- [ ] `examples/config.toml` — sample TOML config
- [ ] `examples/.cfglintignore` — example ignore file

## Phase 7: Documentation

### 7.1 README Rewrite
- [ ] Clear value proposition (config linter for monorepos)
- [ ] Install instructions
- [ ] Quick start with examples
- [ ] Rules documentation
- [ ] CLI reference
- [ ] Safety model (offline, no telemetry)
- [ ] CI integration examples

### 7.2 Additional Docs
- [x] `docs/PRD.md` — exists
- [ ] `docs/TASKS.md` — this file
- [ ] `docs/ORCHESTRATION.md` — build orchestration notes
- [ ] `docs/orchestration.json` — machine-readable orchestration

## Phase 8: Verification

### 8.1 Scripts
- [ ] `scripts/smoke.sh` — end-to-end CLI smoke tests
- [ ] Update `scripts/validate.sh` — cfglint-specific checks

### 8.2 Package Scripts
- [ ] `npm test` — run vitest
- [ ] `npm run check` — typecheck + lint
- [ ] `npm run build` — compile TypeScript to dist/
- [ ] `npm run smoke` — run smoke tests
- [ ] `npm run lint` — ESLint/prettier

## Acceptance Criteria

All of the following must pass before push:

```bash
npm install
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```

- At least 30 meaningful atomic commits
- ~50 tests passing
- All example fixtures demonstrate real issues
- README explains why CfgLint exists
