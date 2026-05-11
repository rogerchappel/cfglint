import yaml from 'js-yaml';
import { ParseResult, Issue } from '../types.js';

interface YamlParseOptions {
  file: string;
  content: string;
}

export function parseYaml(options: YamlParseOptions): ParseResult<unknown> {
  const { file, content } = options;
  const errors: Issue[] = [];
  const warnings: Issue[] = [];

  try {
    const data = yaml.load(content, {
      filename: file,
      onWarning: (warning) => {
        warnings.push({
          rule: 'parse-error',
          severity: 'warning',
          file,
          line: warning.mark?.line ? warning.mark.line + 1 : 1,
          message: warning.message,
        });
      },
    }) as unknown;
    return { ok: true, data, errors, warnings };
  } catch (e) {
    const err = e as yaml.YAMLException;
    const mark = err.mark;
    errors.push({
      rule: 'parse-error',
      severity: 'error',
      file,
      line: mark?.line ? mark.line + 1 : 1,
      column: mark?.column,
      message: err.reason || err.message,
    });
    return { ok: false, errors, warnings };
  }
}
