# CfgLint Orchestration

## Build Orchestration Notes

This document describes the build phases, dependencies, and verification steps for CfgLint v1.

## Project Structure

```
cfglint/
├── docs/                  # Documentation
│   ├── PRD.md            # Product requirements (authoritative)
│   ├── TASKS.md          # Task breakdown
│   ├── ORCHESTRATION.md  # This file
│   └── orchestration.json # Machine-readable orchestration
├── src/                   # TypeScript source
│   ├── cli.ts            # CLI entry point
│   ├── scan.ts           # Directory scanner
│   ├── ignore.ts         # .cfglintignore parser
│   ├── fix.ts            # Auto-fix engine
│   ├── parsers/          # File parsers
│   │   ├── json.ts
│   │   ├── yaml.ts
│   │   ├── toml.ts
│   │   ├── ini.ts
│   │   └── env.ts
│   ├── rules/            # Detection rules
│   │   ├── secrets.ts
│   │   ├── duplicates.ts
│   │   ├── syntax.ts
│   │   ├── env-refs.ts
│   │   └── types.ts
│   └── output/           # Output formatters
│       ├── human.ts
│       ├── json.ts
│       └── sarif.ts
├── dist/                 # Compiled JS (gitignored)
├── tests/                # Vitest unit tests
│   ├── parsers/
│   ├── rules/
│   ├── output/
│   └── ...
├── examples/             # Test fixtures
│   ├── clean-config.json
│   ├── duplicate-keys.json
│   ├── with-secrets.json
│   ├── broken-syntax.json
│   ├── trailing-comma.json
│   ├── sample.env
│   ├── ref-env.json
│   ├── config.yml
│   ├── config.toml
│   └── .cfglintignore
├── scripts/
│   ├── validate.sh       # Pre-commit / CI validation
│   └── smoke.sh          # CLI smoke tests
├── package.json
├── tsconfig.json
└── README.md
```

## Build Phases

### Phase 1: Scaffolding (done first)
1. Update `package.json` with CLI bin entry, scripts, dependencies
2. Add `tsconfig.json` for ESM compilation
3. Create directory structure: `src/`, `tests/`, `examples/`

### Phase 2: Type Definitions
4. Add TypeScript types for core data structures:
   - `Issue` — detected problem with file, line, rule, severity
   - `ParseResult` — parser output (AST, errors, warnings)
   - `ScanConfig` — scan options (path, ignores, depth)
   - `FixResult` — auto-fix outcome

### Phase 3: Parser Implementation (bottom-up)
5. `src/parsers/json.ts` — with duplicate key detection, syntax errors
6. `src/parsers/env.ts` — KEY=VALUE extraction
7. `src/parsers/yaml.ts` — js-yaml wrapper
8. `src/parsers/toml.ts` — toml wrapper
9. `src/parsers/ini.ts` — INI parser

### Phase 4: Detection Rules (depend on parsers)
10. `src/rules/secrets.ts` — entropy calculator, pattern matcher
11. `src/rules/duplicates.ts` — JSON duplicate key detector
12. `src/rules/syntax.ts` — syntax error collector
13. `src/rules/env-refs.ts` — cross-file env reference checker

### Phase 5: Infrastructure
14. `src/scan.ts` — recursive directory walker with ignore support
15. `src/ignore.ts` — gitignore-style pattern matcher
16. `src/fix.ts` — auto-fix engine for JSON issues

### Phase 6: Output Formatters
17. `src/output/human.ts` — colored terminal output
18. `src/output/json.ts` — JSON array output
19. `src/output/sarif.ts` — SARIF 2.1.0 format

### Phase 7: CLI Entry Point
20. `src/cli.ts` — commander-based CLI with `scan` and `check` commands

### Phase 8: Tests and Examples
21. Create example fixtures in `examples/`
22. Write unit tests in `tests/`
23. Create `scripts/smoke.sh`

### Phase 9: Documentation
24. Rewrite `README.md`
25. Create `docs/TASKS.md` (this file's companion)

### Phase 10: Verification
26. Run `npm install`, `npm test`, `npm run check`, `npm run build`, `npm run smoke`
27. Run `bash scripts/validate.sh`
28. Commit all changes with ~30 meaningful commit messages

## Dependencies

### Runtime Dependencies
- `picocolors` — terminal colors (tiny, zero-dependency)
- `commander` — CLI argument parsing
- `js-yaml` — YAML parsing
- `toml` — TOML parsing
- `glob` — file pattern matching
- `minimatch` — gitignore pattern matching

### Dev Dependencies
- `typescript` — type checker
- `vitest` — test runner
- `@types/node` — Node.js types

## Test Strategy

- **Unit tests** for each parser (valid input, invalid input, edge cases)
- **Unit tests** for each rule (secrets, duplicates, syntax, env-refs)
- **Unit tests** for output formatters (spot-check format correctness)
- **Integration tests** via `scripts/smoke.sh` running against `examples/`
- **Fixture-driven**: all tests use files in `examples/` as inputs

## Commit Strategy

Target ~30-50 meaningful atomic commits:
- 1 per major module (parsers, rules, output, CLI, scan, ignore, fix)
- 1 per test file addition
- 1 per example fixture
- 1 for package.json/tsconfig setup
- 1 for README rewrite
- 1 for scripts (smoke.sh, validate.sh)

Each commit should:
- Have a clear, descriptive message
- Pass `npm test` and `npm run build`
- Not break existing functionality

## Verification Pipeline

```bash
# Developer workflow
npm install          # Install deps
npm run build        # Compile TypeScript → dist/
npm test             # Run unit tests (vitest)
npm run check        # Typecheck without emit
npm run smoke        # Run CLI smoke tests
npm run lint         # ESLint + prettier

# CI / pre-commit
bash scripts/validate.sh
```

## Release Criteria

Before tagging v1.0.0:
- All acceptance criteria from PRD met
- `bash scripts/validate.sh` passes
- README is human-readable and complete
- At least one real CLI smoke uses checked-in fixtures
- No TODOs blocking core functionality
- License file present (MIT)
