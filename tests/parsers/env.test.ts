import { describe, it, expect } from 'vitest';
import { parseEnv, extractEnvRefs } from '../../src/parsers/env.js';

describe('ENV Parser', () => {
  it('parses valid env file', () => {
    const content = 'KEY1=value1\nKEY2=value2';
    const result = parseEnv({ file: '.env', content });
    expect(result.ok).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data?.[0].name).toBe('KEY1');
    expect(result.data?.[0].value).toBe('value1');
  });

  it('skips comments', () => {
    const content = '# This is a comment\nKEY=value';
    const result = parseEnv({ file: '.env', content });
    expect(result.data).toHaveLength(1);
  });

  it('skips empty lines', () => {
    const content = '\n\nKEY=value\n\n';
    const result = parseEnv({ file: '.env', content });
    expect(result.data).toHaveLength(1);
  });

  it('handles quoted values', () => {
    const content = 'KEY="quoted value"';
    const result = parseEnv({ file: '.env', content });
    expect(result.data?.[0].value).toBe('quoted value');
  });

  it('reports correct line numbers', () => {
    const content = '# comment\n\nKEY=value';
    const result = parseEnv({ file: '.env', content });
    expect(result.data?.[0].line).toBe(3);
  });
});

describe('extractEnvRefs', () => {
  it('extracts $VAR references', () => {
    const refs = extractEnvRefs('port=$PORT', 'test.json', 1);
    expect(refs).toHaveLength(1);
    expect(refs[0].name).toBe('PORT');
  });

  it('extracts ${VAR} references', () => {
    const refs = extractEnvRefs('url=${DATABASE_URL}', 'test.json', 1);
    expect(refs).toHaveLength(1);
    expect(refs[0].name).toBe('DATABASE_URL');
  });

  it('extracts multiple references', () => {
    const refs = extractEnvRefs('$HOST:$PORT', 'test.json', 1);
    expect(refs).toHaveLength(2);
  });

  it('handles multi-line content', () => {
    const refs = extractEnvRefs('line1=$VAR1\nline2=$VAR2', 'test.json', 0);
    expect(refs).toHaveLength(2);
    expect(refs[0].line).toBe(1);
    expect(refs[1].line).toBe(2);
  });
});
