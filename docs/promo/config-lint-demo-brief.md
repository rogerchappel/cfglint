# CfgLint config lint demo brief

## Demo angle

Show how CfgLint catches broken config and secret-looking values across local config fixtures before they become review or release risk.

## 60 second flow

1. Run `bash demo/run-config-lint-demo.sh`.
2. Open `tmp/config-lint-demo/clean.txt` to show a clean config scan.
3. Open `tmp/config-lint-demo/secrets.json` to show structured findings for the secret fixture.
4. Point to `examples/` for JSON, YAML, TOML, env, and ignore-file examples.
5. Close with the safety model: scans are local, output is inspectable, and fixes require explicit flags.

## Useful hooks

- "Config review should catch secrets and syntax drift before CI gets noisy."
- "CfgLint gives config fixtures the same review shape as code."
- "Local config linting is a small guardrail with a big blast-radius payoff."

## Verification for the demo

Run:

```bash
bash demo/run-config-lint-demo.sh
```

The script builds the CLI, writes clean and secret-fixture reports under `tmp/config-lint-demo/`, and checks the expected text markers.
