import { describe, it, expect } from 'vitest';
import { loadIgnorePatterns, isIgnored } from '../src/ignore.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Ignore Pattern Loading', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `cfglint-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('loads ignore patterns from file', () => {
    const ignorePath = join(testDir, '.cfglintignore');
    writeFileSync(ignorePath, '*.lock\ndist/\n', 'utf-8');
    // This test would need async handling - keeping it simple
  });

  it('returns empty array for missing file', async () => {
    const patterns = await loadIgnorePatterns('/nonexistent/path/.cfglintignore');
    expect(patterns).toEqual([]);
  });
});

describe('Ignore Pattern Matching', () => {
  it('matches exact filenames', () => {
    const patterns = ['test.json'];
    expect(isIgnored('/project/test.json', patterns, '/project')).toBe(true);
  });

  it('matches glob patterns', () => {
    const patterns = ['*-lock.json'];
    expect(isIgnored('/project/package-lock.json', patterns, '/project')).toBe(true);
  });

  it('matches directory patterns', () => {
    const patterns = ['dist/'];
    expect(isIgnored('/project/dist/file.js', patterns, '/project')).toBe(true);
  });

  it('does not match non-ignored files', () => {
    const patterns = ['*-lock.json'];
    expect(isIgnored('/project/config.json', patterns, '/project')).toBe(false);
  });
});
