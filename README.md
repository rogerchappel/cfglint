# cfglint

`cfglint` is a local-first configuration linter for projects with JSON, YAML,
TOML, INI, and `.env` files. It scans config files for syntax errors, duplicate
JSON keys, trailing commas, stale environment references, and secret-shaped
values before those issues reach CI or a reviewer.

It is built for maintainers and agentic workflows that need deterministic,
offline config checks without uploading project contents.

## Install

```sh
npm install -D @rogerchappel/cfglint
```

From a checkout:

```sh
npm install
npm run build
node dist/cli.js --help
```

## Quickstart

Scan the current repository and print a human-readable report:

```sh
npx cfglint scan .
```

Fail CI on warning-or-higher findings:

```sh
npx cfglint check . --severity warning
```

Write a JSON or SARIF report for another tool:

```sh
npx cfglint scan . --format json --out cfglint-report.json
npx cfglint scan . --format sarif --out cfglint.sarif
```

Preview automatic fixes for repairable JSON issues:

```sh
npx cfglint scan examples --fix --dry-run
```

## What It Checks

- JSON syntax errors, duplicate keys, comments, and trailing commas
- Secret-like values such as token assignments, AWS access key IDs, and private
  key material
- Environment variable references that are not defined in nearby `.env` files
- Common parser errors across YAML, TOML, INI, and env files
- `.cfglintignore` patterns for generated or intentionally ignored config

## Examples

The repository includes fixture configs that exercise the main rules:

```sh
npm run build
node dist/cli.js scan examples/clean-config.json
node dist/cli.js scan examples/duplicate-keys.json
node dist/cli.js scan examples/with-secrets.json --format json
```

## Safety Model

- Local-first: no telemetry, no hosted API calls, and no credential lookup.
- Read-only by default: files are only changed when `--fix` is passed.
- `--dry-run` shows repairable changes without writing them.
- Secret detection is pattern-based and conservative; review findings before
  treating them as policy.
- `cfglint` is a linter, not a replacement for dedicated secret scanning or
  runtime access controls.

## Development

```sh
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```

For release readiness:

```sh
npm run release:check
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Keep changes small, fixture-backed, and
offline by default.

## Security

See [SECURITY.md](SECURITY.md). Please do not paste real secrets into public
issues or fixtures.

## License

MIT
