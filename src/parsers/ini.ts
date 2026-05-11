import { ParseResult, Issue } from '../types.js';

interface IniParseOptions {
  file: string;
  content: string;
}

export interface IniData {
  [section: string]: {
    [key: string]: string;
  };
}

export function parseIni(options: IniParseOptions): ParseResult<IniData> {
  const { file, content } = options;
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const result: IniData = {};
  let currentSection = '';

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    // Skip empty lines and comments
    if (!line || line.startsWith('#') || line.startsWith(';')) {
      continue;
    }

    // Section header
    const sectionMatch = line.match(/^\[(.+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      if (!result[currentSection]) {
        result[currentSection] = {};
      }
      continue;
    }

    // Key=value pair
    const kvMatch = line.match(/^([^=]+?)\s*=\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim();
      const value = kvMatch[2].trim();
      const section = currentSection || '__root__';
      if (!result[section]) {
        result[section] = {};
      }
      result[section][key] = value;
    } else {
      warnings.push({
        rule: 'parse-error',
        severity: 'warning',
        file,
        line: lineNum,
        message: `Invalid INI line: ${line}`,
      });
    }
  }

  return { ok: true, data: result, errors, warnings };
}
