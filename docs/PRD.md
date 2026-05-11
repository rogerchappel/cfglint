# CfgLint PRD

Status: in-progress

## Summary

CfgLint is a local-first TypeScript CLI that lints configuration files across a project. It scans JSON, YAML, TOML, INI, and env files for secrets, stale references, duplicate keys, type mismatches, and consistency issues. Built for developer and agentic workflows that manage config sprawl in modern monorepos.

## Motivation

Modern projects accumulate configuration files everywhere: `.env`, `package.json`, `tsconfig.json`, Docker configs, CI workflow files, and tool-specific configs. Common problems include:
- Accidentally committed secrets or API keys in config files
- Duplicate keys in JSON (which parsers silently overwrite)
- Stale environment variable references (referencing vars that don't exist elsewhere in the project)
- Inconsistent config values across environments
- Invalid types (string where number expected)

CfgLint catches these locally, offline, without sending config content to any server.

## Target users

- Monorepo maintainers managing dozens of config files
- DevOps engineers auditing config before deploy
- Agentic workflows that generate config programmatically
- OSS projects that want clean, consistent config files

## Goals

- Recursively scan a directory tree for recognized config file types
- Detect hardcoded secrets with high-entropy/known-pattern checks
- Find duplicate keys in JSON
- Validate JSON syntax and schema basics
- Detect references to environment variables that appear unused elsewhere
- Report issues as human-readable output and machine-readable JSON
- Support `--fix` for automatically repairable issues (duplicate keys, trailing commas in JSON)
- Exit non-zero when issues are found (CI integration)
- Work completely offline by default

## Non-goals

- No schema registry or central config server
- No LLM calls in the V1 path
- No enforcement of specific config conventions (only correctness and security)
- No validation against remote APIs or schemas in V1

## V1 CLI

```bash
cfglint scan /path/to/project
cfglint scan /path/to/project --secret-patterns .secrets-patterns.json
cfglint scan /path/to/project --fix
cfglint scan /path/to/project --fix --dry-run
cfglint scan /path/to/project --format json --out report.json
cfglint scan /path/to/project --ignore-node-modules --ignore ".cfglintignore"
cfglint check /path/to/project    # alias for scan --exit-on-error
```

## Detection rules

1. **Secrets detection**: High-entropy strings, known patterns (AWS keys, token prefixes, private key headers)
2. **JSON duplicate keys**: Keys that appear more than once in the same object
3. **JSON syntax errors**: Invalid JSON files
4. **JSON comments**: Warn about non-standard comments in strict JSON
5. **ENV reference integrity**: `$VAR` references in one config that aren't defined in `.env` or `.env.*`
6. **Type mismatches**: Where schema hints are provided
7. **Trailing commas**: In JSON (strict mode warning)

## Output format

```
⚠️  secrets/config.json:4 - Possible AWS secret key detected (AKIA...)
⚠️  json/tsconfig.extras.json:12 - Duplicate key "compilerOptions"
✓ All 23 config files scanned, 2 warnings found
```

## Functional requirements

1. Recursive directory scanning with configurable depth
2. Support for JSON, YAML (basic), TOML (basic), INI, `.env` files
3. Secret detection with configurable pattern file
4. JSON duplicate key detection
5. `.cfglintignore` support (gitignore-like patterns)
6. Output formats: human (colored), JSON, SARIF
7. `--fix` for auto-fixable issues
8. `--severity` threshold (warn/error/fatal) to control exit codes
9. Include fixtures under `examples/` and tests under `tests/`
10. No telemetry, no network calls

## Acceptance criteria

- `npm test`, `npm run check`, `npm run build`, and `npm run smoke` pass
- `bash scripts/validate.sh` passes
- At least one real CLI smoke uses checked-in fixtures with known issues
- README explains why CfgLint exists, quick start, rules, examples, safety model
- GitHub repository is public under `rogerchappel/cfglint` with useful description and topics

## Source attribution

Created during the twice-daily OSS factory run on 2026-05-12. Inspired by the broader config validation secret scanning ecosystem (gitleaks, yamllint, jsonlint) but reimagined as a unified config-centric linter. No code copied from existing projects.
