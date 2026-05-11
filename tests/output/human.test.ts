import { describe, it, expect, vi } from 'vitest';
import { formatHuman } from '../../src/output/human.js';
import { ScanResult } from '../../src/types.js';

describe('Human Output Formatter', () => {
  it('formats empty result', () => {
    const result: ScanResult = {
      filesScanned: 5,
      issues: [],
      warnings: [],
      errors: [],
    };
    const output = formatHuman(result);
    expect(output).toContain('5');
    expect(output).toContain('no issues');
  });

  it('formats warnings', () => {
    const result: ScanResult = {
      filesScanned: 3,
      issues: [
        { rule: 'json-duplicate-key', severity: 'warning', file: 'config.json', line: 5, message: 'Duplicate key "port"' },
      ],
      warnings: [
        { rule: 'json-duplicate-key', severity: 'warning', file: 'config.json', line: 5, message: 'Duplicate key "port"' },
      ],
      errors: [],
    };
    const output = formatHuman(result);
    expect(output).toContain('config.json:5');
    expect(output).toContain('Duplicate key');
  });

  it('formats errors', () => {
    const result: ScanResult = {
      filesScanned: 3,
      issues: [
        { rule: 'json-syntax-error', severity: 'error', file: 'broken.json', line: 3, message: 'Unexpected token' },
      ],
      warnings: [],
      errors: [
        { rule: 'json-syntax-error', severity: 'error', file: 'broken.json', line: 3, message: 'Unexpected token' },
      ],
    };
    const output = formatHuman(result);
    expect(output).toContain('broken.json:3');
    expect(output).toContain('error');
  });

  it('sorts issues by file and line', () => {
    const result: ScanResult = {
      filesScanned: 2,
      issues: [
        { rule: 'secret-detected', severity: 'error', file: 'b.json', line: 10, message: 'Secret' },
        { rule: 'json-duplicate-key', severity: 'warning', file: 'a.json', line: 5, message: 'Duplicate' },
      ],
      warnings: [],
      errors: [],
    };
    const output = formatHuman(result);
    const aIndex = output.indexOf('a.json');
    const bIndex = output.indexOf('b.json');
    expect(aIndex).toBeLessThan(bIndex);
  });
});
