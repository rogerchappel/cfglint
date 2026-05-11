import toml from 'toml';
import { ParseResult, Issue } from '../types.js';

interface TomlParseOptions {
  file: string;
  content: string;
}

export function parseToml(options: TomlParseOptions): ParseResult<unknown> {
  const { file, content } = options;
  const errors: Issue[] = [];
  const warnings: Issue[] = [];

  try {
    const data = toml.parse(content);
    return { ok: true, data, errors, warnings };
  } catch (e) {
    const err = e as Error;
    // TOML parser errors often include position info
    const lineMatch = err.message.match(/line\s+(\d+)/i);
    const line = lineMatch ? parseInt(lineMatch[1], 10) : 1;
    errors.push({
      rule: 'parse-error',
      severity: 'error',
      file,
      line,
      message: err.message,
    });
    return { ok: false, errors, warnings };
  }
}
