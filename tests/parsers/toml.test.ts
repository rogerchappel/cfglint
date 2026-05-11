import { describe, it, expect } from 'vitest';
import { parseToml } from '../../src/parsers/toml.js';

describe('TOML Parser', () => {
  it('parses valid TOML', () => {
    const content = `
[package]
name = "my-app"
version = "0.1.0"
`;
    const result = parseToml({ file: 'test.toml', content });
    expect(result.ok).toBe(true);
    expect((result.data as any).package.name).toBe('my-app');
  });

  it('parses nested tables', () => {
    const content = `
[server]
host = "localhost"

[server.tls]
enabled = true
`;
    const result = parseToml({ file: 'test.toml', content });
    expect(result.ok).toBe(true);
    expect((result.data as any).server.tls.enabled).toBe(true);
  });

  it('detects syntax errors', () => {
    const content = `[invalid\nbroken = `;
    const result = parseToml({ file: 'test.toml', content });
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
