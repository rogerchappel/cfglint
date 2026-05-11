import { ParseResult, Issue, EnvVarDefinition } from '../types.js';

interface EnvParseOptions {
  file: string;
  content: string;
}

export function parseEnv(options: EnvParseOptions): ParseResult<EnvVarDefinition[]> {
  const { file, content } = options;
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const definitions: EnvVarDefinition[] = [];

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
      continue;
    }

    // KEY=VALUE or KEY="VALUE" or KEY='VALUE'
    const kvMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*["']?(.*?)["']?\s*$/);
    if (kvMatch) {
      definitions.push({
        name: kvMatch[1],
        value: kvMatch[2],
        file,
        line: lineNum,
      });
    } else {
      // Only warn if it looks like it's trying to be a variable definition
      if (line.includes('=')) {
        warnings.push({
          rule: 'parse-error',
          severity: 'warning',
          file,
          line: lineNum,
          message: `Invalid env line: ${line}`,
        });
      }
    }
  }

  return { ok: true, data: definitions, errors, warnings };
}

/**
 * Extract all env var references ($VAR or ${VAR}) from a text string.
 */
export function extractEnvRefs(text: string, file: string, startLine: number = 0): Array<{ name: string; file: string; line: number; raw: string }> {
  const refs: Array<{ name: string; file: string; line: number; raw: string }> = [];
  const refRegex = /\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?/g;
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m;
    while ((m = refRegex.exec(line)) !== null) {
      // Skip if it looks like a shell escape or other non-env pattern
      refs.push({
        name: m[1],
        file,
        line: startLine + i + 1,
        raw: m[0],
      });
    }
  }

  return refs;
}
