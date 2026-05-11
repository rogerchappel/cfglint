import { describe, it, expect } from 'vitest';
import { formatJson } from '../../src/output/json.js';
import { ScanResult } from '../../src/types.js';

describe('JSON Output Formatter', () => {
  it('formats result as valid JSON', () => {
    const result: ScanResult = {
      filesScanned: 3,
      issues: [],
      warnings: [],
      errors: [],
    };
    const output = formatJson(result);
    const parsed = JSON.parse(output);
    expect(parsed.filesScanned).toBe(3);
    expect(parsed.summary.total).toBe(0);
  });

  it('includes issues in output', () => {
    const result: ScanResult = {
      filesScanned: 2,
      issues: [
        { rule: 'secret-detected', severity: 'error', file: 'config.json', line: 1, message: 'Secret found' },
      ],
      warnings: [],
      errors: [],
    };
    const output = formatJson(result);
    const parsed = JSON.parse(output);
    expect(parsed.issues).toHaveLength(1);
    expect(parsed.issues[0].rule).toBe('secret-detected');
  });

  it('includes summary counts', () => {
    const result: ScanResult = {
      filesScanned: 5,
      issues: [
        { rule: 'json-syntax-error', severity: 'error', file: 'a.json', line: 1, message: 'Error' },
        { rule: 'json-duplicate-key', severity: 'warning', file: 'b.json', line: 2, message: 'Duplicate' },
      ],
      warnings: [{ rule: 'json-duplicate-key', severity: 'warning', file: 'b.json', line: 2, message: 'Duplicate' }],
      errors: [{ rule: 'json-syntax-error', severity: 'error', file: 'a.json', line: 1, message: 'Error' }],
    };
    const output = formatJson(result);
    const parsed = JSON.parse(output);
    expect(parsed.summary.errors).toBe(1);
    expect(parsed.summary.warnings).toBe(1);
    expect(parsed.summary.total).toBe(2);
  });
});
