import { describe, it, expect } from 'vitest';
import { parseYaml } from '../../src/parsers/yaml.js';

describe('YAML Parser', () => {
  it('parses valid YAML', () => {
    const result = parseYaml({
      file: 'test.yml',
      content: 'name: test\nversion: 1.0.0',
    });
    expect(result.ok).toBe(true);
    expect((result.data as any).name).toBe('test');
  });

  it('parses nested YAML', () => {
    const content = `
app:
  name: MyApp
  config:
    port: 3000
`;
    const result = parseYaml({ file: 'test.yml', content });
    expect(result.ok).toBe(true);
    expect((result.data as any).app.config.port).toBe(3000);
  });

  it('detects syntax errors', () => {
    const content = `
name: test
  bad indent: value
`;
    const result = parseYaml({ file: 'test.yml', content });
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('parses arrays', () => {
    const content = `
items:
  - one
  - two
  - three
`;
    const result = parseYaml({ file: 'test.yml', content });
    expect(result.ok).toBe(true);
    expect((result.data as any).items).toEqual(['one', 'two', 'three']);
  });
});
