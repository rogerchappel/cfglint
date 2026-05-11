import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fixFile, dryRunFix } from '../src/fix.js';
import { writeFileSync, readFileSync, unlinkSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Issue } from '../src/types.js';

describe('Fix Engine', () => {
  let testDir: string;
  let testFile: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `cfglint-fix-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    testFile = join(testDir, 'test.json');
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('removes trailing commas', async () => {
    const content = '{"key": "value",}';
    writeFileSync(testFile, content, 'utf-8');

    const issues: Issue[] = [
      { rule: 'json-trailing-comma', severity: 'warning', file: testFile, line: 1, message: 'Trailing comma', fixable: true },
    ];

    const result = await fixFile(testFile, issues);
    expect(result.fixed).toBe(true);
    expect(result.fixedContent).toBe('{"key": "value"}');
  });

  it('does not modify files with no fixable issues', async () => {
    const content = '{"key": "value"}';
    writeFileSync(testFile, content, 'utf-8');

    const issues: Issue[] = [
      { rule: 'secret-detected', severity: 'warning', file: testFile, line: 1, message: 'Secret', fixable: false },
    ];

    const result = await fixFile(testFile, issues);
    expect(result.fixed).toBe(false);
    expect(result.fixedContent).toBe(content);
  });

  it('dry-run does not modify file', async () => {
    const content = '{"key": "value",}';
    writeFileSync(testFile, content, 'utf-8');

    const issues: Issue[] = [
      { rule: 'json-trailing-comma', severity: 'warning', file: testFile, line: 1, message: 'Trailing comma', fixable: true },
    ];

    const originalContent = readFileSync(testFile, 'utf-8');
    const result = await dryRunFix(testFile, issues);

    expect(result.fixed).toBe(true);
    expect(readFileSync(testFile, 'utf-8')).toBe(originalContent);
  });

  it('returns original content unchanged when no fixes', async () => {
    const content = '{"key": "value"}';
    writeFileSync(testFile, content, 'utf-8');

    const result = await fixFile(testFile, []);
    expect(result.fixed).toBe(false);
    expect(result.originalContent).toBe(content);
    expect(result.fixedContent).toBe(content);
  });
});
