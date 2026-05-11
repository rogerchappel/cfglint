import { describe, it, expect } from 'vitest';
import { parseIni } from '../../src/parsers/ini.js';

describe('INI Parser', () => {
  it('parses valid INI', () => {
    const content = `[section1]\nkey1 = value1\nkey2 = value2`;
    const result = parseIni({ file: 'test.ini', content });
    expect(result.ok).toBe(true);
    expect(result.data?.section1.key1).toBe('value1');
  });

  it('parses multiple sections', () => {
    const content = `[database]\nhost = localhost\n\n[server]\nport = 8080`;
    const result = parseIni({ file: 'test.ini', content });
    expect(result.ok).toBe(true);
    expect(result.data?.database.host).toBe('localhost');
    expect(result.data?.server.port).toBe('8080');
  });

  it('handles comments', () => {
    const content = `# comment\n[section]\nkey = value\n; another comment`;
    const result = parseIni({ file: 'test.ini', content });
    expect(result.ok).toBe(true);
    expect(result.data?.section.key).toBe('value');
  });

  it('handles root-level keys', () => {
    const content = `global_key = global_value\n[section]\nkey = value`;
    const result = parseIni({ file: 'test.ini', content });
    expect(result.ok).toBe(true);
    expect(result.data?.__root__.global_key).toBe('global_value');
  });
});
