import { describe, it, expect } from 'vitest';
import { formatSarif } from '../../src/output/sarif.js';
import { ScanResult } from '../../src/types.js';

describe('SARIF Output Formatter', () => {
  it('produces valid SARIF JSON', () => {
    const result: ScanResult = {
      filesScanned: 1,
      issues: [],
      warnings: [],
      errors: [],
    };
    const output = formatSarif(result);
    const parsed = JSON.parse(output);
    expect(parsed.version).toBe('2.1.0');
    expect(parsed.runs).toBeDefined();
    expect(parsed.runs.length).toBe(1);
  });

  it('includes tool information', () => {
    const result: ScanResult = {
      filesScanned: 1,
      issues: [],
      warnings: [],
      errors: [],
    };
    const output = formatSarif(result, '1.0.0');
    const parsed = JSON.parse(output);
    expect(parsed.runs[0].tool.driver.name).toBe('CfgLint');
    expect(parsed.runs[0].tool.driver.version).toBe('1.0.0');
  });

  it('includes results for issues', () => {
    const result: ScanResult = {
      filesScanned: 2,
      issues: [
        { rule: 'json-syntax-error', severity: 'error', file: 'broken.json', line: 3, message: 'Syntax error' },
      ],
      warnings: [],
      errors: [],
    };
    const output = formatSarif(result);
    const parsed = JSON.parse(output);
    expect(parsed.runs[0].results).toHaveLength(1);
    expect(parsed.runs[0].results[0].ruleId).toBe('json-syntax-error');
  });

  it('includes file locations in results', () => {
    const result: ScanResult = {
      filesScanned: 2,
      issues: [
        { rule: 'json-syntax-error', severity: 'error', file: 'test.json', line: 5, column: 10, message: 'Error' },
      ],
      warnings: [],
      errors: [],
    };
    const output = formatSarif(result);
    const parsed = JSON.parse(output);
    expect(parsed.runs[0].results[0].locations[0].physicalLocation.region.startLine).toBe(5);
    expect(parsed.runs[0].results[0].locations[0].physicalLocation.region.startColumn).toBe(10);
  });

  it('maps severity levels correctly', () => {
    const result: ScanResult = {
      filesScanned: 1,
      issues: [
        { rule: 'secret-detected', severity: 'error', file: 'a.json', line: 1, message: 'Secret' },
        { rule: 'json-duplicate-key', severity: 'warning', file: 'b.json', line: 2, message: 'Duplicate' },
        { rule: 'json-comment', severity: 'info', file: 'c.json', line: 3, message: 'Comment' },
      ],
      warnings: [],
      errors: [],
    };
    const output = formatSarif(result);
    const parsed = JSON.parse(output);
    const levels = parsed.runs[0].results.map((r: any) => r.level);
    expect(levels).toContain('error');
    expect(levels).toContain('warning');
    expect(levels).toContain('note');
  });
});
