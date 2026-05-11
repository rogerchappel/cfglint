import { describe, it, expect } from 'vitest';
import { findUndefinedEnvRefs } from '../../src/rules/env-refs.js';

describe('ENV Reference Integrity', () => {
  it('finds undefined env references', () => {
    const refs = [
      { name: 'UNDEFINED_VAR', file: 'config.json', line: 1, raw: '$UNDEFINED_VAR' },
    ];
    const definitions = [
      { name: 'DEFINED_VAR', value: 'value', file: '.env', line: 1 },
    ];
    const issues = findUndefinedEnvRefs(refs, definitions);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].rule).toBe('env-ref-undefined');
  });

  it('does not flag defined references', () => {
    const refs = [
      { name: 'DEFINED_VAR', file: 'config.json', line: 1, raw: '$DEFINED_VAR' },
    ];
    const definitions = [
      { name: 'DEFINED_VAR', value: 'value', file: '.env', line: 1 },
    ];
    const issues = findUndefinedEnvRefs(refs, definitions);
    expect(issues).toHaveLength(0);
  });

  it('skips system variables', () => {
    const refs = [
      { name: 'PATH', file: 'config.json', line: 1, raw: '$PATH' },
      { name: 'HOME', file: 'config.json', line: 1, raw: '$HOME' },
    ];
    const definitions: any[] = [];
    const issues = findUndefinedEnvRefs(refs, definitions);
    expect(issues).toHaveLength(0);
  });

  it('handles multiple undefined refs', () => {
    const refs = [
      { name: 'UNDEF1', file: 'a.json', line: 1, raw: '$UNDEF1' },
      { name: 'UNDEF2', file: 'b.json', line: 2, raw: '$UNDEF2' },
    ];
    const definitions: any[] = [];
    const issues = findUndefinedEnvRefs(refs, definitions);
    expect(issues.length).toBeGreaterThanOrEqual(2);
  });

  it('deduplicates repeated references', () => {
    const refs = [
      { name: 'UNDEF', file: 'config.json', line: 1, raw: '$UNDEF' },
      { name: 'UNDEF', file: 'config.json', line: 1, raw: '$UNDEF' },
    ];
    const definitions: any[] = [];
    const issues = findUndefinedEnvRefs(refs, definitions);
    expect(issues).toHaveLength(1);
  });
});
