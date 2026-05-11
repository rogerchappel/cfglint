import { describe, it, expect } from 'vitest';
import { parseJson } from '../../src/parsers/json.js';

describe('JSON Parser', () => {
  it('parses valid JSON', () => {
    const result = parseJson({
      file: 'test.json',
      content: '{"name": "test", "version": "1.0.0"}',
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ name: 'test', version: '1.0.0' });
    expect(result.errors).toHaveLength(0);
  });

  it('detects syntax errors', () => {
    const result = parseJson({
      file: 'test.json',
      content: '{"name": "test",}',
    });
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].rule).toBe('json-syntax-error');
  });

  it('detects duplicate keys', () => {
    const content = `{"key": "first", "key": "second"}`;
    const result = parseJson({ file: 'test.json', content });
    expect(result.warnings.some((w) => w.rule === 'json-duplicate-key')).toBe(true);
  });

  it('detects trailing commas', () => {
    const content = `{"key": "value",}`;
    const result = parseJson({ file: 'test.json', content });
    expect(result.warnings.some((w) => w.rule === 'json-trailing-comma')).toBe(true);
  });

  it('detects comments', () => {
    const content = `{
  "key": "value" // this is a comment
}`;
    const result = parseJson({ file: 'test.json', content });
    expect(result.warnings.some((w) => w.rule === 'json-comment')).toBe(true);
  });

  it('handles nested objects', () => {
    const result = parseJson({
      file: 'test.json',
      content: '{"outer": {"inner": {"deep": "value"}}}',
    });
    expect(result.ok).toBe(true);
    expect((result.data as any).outer.inner.deep).toBe('value');
  });

  it('handles arrays', () => {
    const result = parseJson({
      file: 'test.json',
      content: '[1, 2, 3, "four"]',
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([1, 2, 3, 'four']);
  });

  it('reports line numbers for errors', () => {
    const content = `{
  "name": "test",
  "broken":
}`;
    const result = parseJson({ file: 'test.json', content });
    expect(result.ok).toBe(false);
    expect(result.errors[0].line).toBeGreaterThanOrEqual(1);
    expect(result.errors[0].file).toBe('test.json');
  });
});
