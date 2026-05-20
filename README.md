# cfglint

Configuration file linter that audits JSON, YAML, TOML, INI, and `.env` files for structural issues, potential secrets, duplicate values, and cross-file environment drift.

```
cfglint scan .
```

## Why it exists

Configuration files accumulate problems silently: API keys accidentally committed, undefined environment variables referenced in docker-compose, duplicate keys, malformed sections, and values that look suspiciously like secrets. cfglint catches these before they reach runtime or get committed.

## Install

```sh
npm install @rogerchappel/cfglint
```

## Quick start

Scan a project for config issues:

```sh
npx cfglint scan .
```

Check specific directories:

```sh
npx cfglint scan ./config --format json --out report.json
npx cfglint scan ./docker-compose.yml --severity warning
npx cfglint scan . --fix --dry-run
```

## What it checks

| Rule | Description | Severity |
|------|-------------|----------|
| `parse-error` | File cannot be parsed | error |
| `secret-pattern` | Value matches known secret patterns | error |
| `duplicate-key` | Duplicate keys in JSON/YAML/TOML/INI | warning |
| `env-undefined` | Env variable referenced but not defined | warning |
| `bad-value-type` | Value type doesn't match expected shape | info |

## Output formats

```sh
# Human-readable (default)
cfglint scan .

# JSON for CI pipelines
cfglint scan . --format json --out cfglint-report.json

# SARIF for GitHub code scanning
cfglint scan . --format sarif
```

## Auto-fix

Some issues (like duplicate keys in INI files) can be automatically repaired:

```sh
# Show what would be fixed
cfglint scan ./config --fix --dry-run

# Actually fix repairable issues
cfglint scan ./config --fix
```

## Ignore patterns

Create a `.cfglintignore` file in any directory to skip files or paths:

```
# .cfglintignore
**/test/fixtures/**
**/*.generated.json
```

## Programmatic API

Import into a Node project for custom tooling:

```ts
import { scanDirectory, fixFile } from '@rogerchappel/cfglint';

const result = await scanDirectory({
  path: './config',
  severity: 'warning',
  ignoreNodeModules: true,
});

console.log(`Scanned ${result.filesScanned} files, found ${result.issues.length} issues`);
```

## Library

This is a local-first library and CLI. No telemetry, no hosted service, no network calls during scans.
