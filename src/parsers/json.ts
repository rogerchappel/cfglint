import { ParseResult, Issue } from '../types.js';

interface JsonParseOptions {
  file: string;
  content: string;
}

/**
 * Parse JSON with duplicate key detection.
 */
export function parseJson(options: JsonParseOptions): ParseResult<unknown> {
  const { file, content } = options;
  const errors: Issue[] = [];
  const warnings: Issue[] = [];

  // Check for comments (non-standard in JSON)
  const commentRegex = /\/\/[^\n]*|\/\*[\s\S]*?\*\//g;
  let match;
  while ((match = commentRegex.exec(content)) !== null) {
    const lines = content.substring(0, match.index).split('\n');
    const line = lines.length;
    warnings.push({
      rule: 'json-comment',
      severity: 'info',
      file,
      line,
      message: 'JSON does not support comments (non-standard)',
    });
  }

  // Check for trailing commas before closing braces/brackets
  const trailingCommaRegex = /,\s*[}\]]/g;
  while ((match = trailingCommaRegex.exec(content)) !== null) {
    const lines = content.substring(0, match.index).split('\n');
    const line = lines.length;
    warnings.push({
      rule: 'json-trailing-comma',
      severity: 'warning',
      file,
      line,
      message: 'Trailing comma in JSON (non-standard)',
      fixable: true,
    });
  }

  // Detect duplicate keys
  const duplicates = detectDuplicateKeys(content, file);
  warnings.push(...duplicates);

  // Try to parse the JSON
  try {
    const data = JSON.parse(content);
    return { ok: true, data, errors, warnings };
  } catch (e) {
    const err = e as SyntaxError;
    // Try to extract line number from error message
    const lineMatch = err.message.match(/position\s+(\d+)/i);
    let line = 1;
    if (lineMatch) {
      const pos = parseInt(lineMatch[1], 10);
      line = content.substring(0, pos).split('\n').length;
    }
    errors.push({
      rule: 'json-syntax-error',
      severity: 'error',
      file,
      line,
      message: err.message,
    });
    return { ok: false, errors, warnings };
  }
}

interface KeyInfo {
  line: number;
  count: number;
}

function detectDuplicateKeys(content: string, file: string): Issue[] {
  const issues: Issue[] = [];
  // Track key occurrences: map from key name to first occurrence info
  const seenKeys = new Map<string, KeyInfo>();

  const lines = content.split('\n');

  // Simple state machine to find keys
  const keyRegex = /"([^"\\]*(?:\\.[^"\\]*)*)"\s*:/g;

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    let m;
    // Reset regex for each line
    const lineRegex = new RegExp(keyRegex.source, keyRegex.flags);
    while ((m = lineRegex.exec(line)) !== null) {
      const key = m[1];

      if (seenKeys.has(key)) {
        // Duplicate found
        const existing = seenKeys.get(key)!;
        existing.count++;
        issues.push({
          rule: 'json-duplicate-key',
          severity: 'warning',
          file,
          line: lineNum + 1,
          column: m.index + 1,
          message: `Duplicate key "${key}"`,
          fixable: true,
        });
      } else {
        seenKeys.set(key, { line: lineNum + 1, count: 1 });
      }
    }
  }

  return issues;
}
