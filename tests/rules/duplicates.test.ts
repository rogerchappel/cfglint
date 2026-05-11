import { describe, it, expect } from 'vitest';
import { parseJson } from '../../src/parsers/json.js';

describe('Duplicate Key Detection', () => {
  it('detects duplicate keys in flat object', () => {
    const content = `{"key": "first", "key": "second"}`;
    const result = parseJson({ file: 'test.json', content });
    const dupes = result.warnings.filter((w) => w.rule === 'json-duplicate-key');
    expect(dupes.length).toBeGreaterThan(0);
  });

  it('detects multiple duplicate keys', () => {
    const content = `{"a": 1, "b": 2, "a": 3, "b": 4}`;
    const result = parseJson({ file: 'test.json', content });
    const dupes = result.warnings.filter((w) => w.rule === 'json-duplicate-key');
    expect(dupes.length).toBeGreaterThanOrEqual(2);
  });

  it('detects duplicate keys in nested objects', () => {
    const content = `{"outer": {"inner": "a", "inner": "b"}}`;
    const result = parseJson({ file: 'test.json', content });
    const dupes = result.warnings.filter((w) => w.rule === 'json-duplicate-key');
    expect(dupes.length).toBeGreaterThan(0);
  });

  it('does not flag unique keys', () => {
    const content = `{"a": 1, "b": 2, "c": 3}`;
    const result = parseJson({ file: 'test.json', content });
    const dupes = result.warnings.filter((w) => w.rule === 'json-duplicate-key');
    expect(dupes).toHaveLength(0);
  });

  it('reports correct line numbers', () => {
    const content = `{\n  "key": "first",\n  "key": "second"\n}`;
    const result = parseJson({ file: 'test.json', content });
    const dupes = result.warnings.filter((w) => w.rule === 'json-duplicate-key');
    expect(dupes[0].line).toBe(3);
  });
});
