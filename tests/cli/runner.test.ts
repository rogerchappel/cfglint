import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const cli = join(process.cwd(), 'dist/cli.js');

describe('cfglint CLI', () => {
  it('should output help when run --help', () => {
    const out = execFileSync(process.execPath, [cli, '--help'], { encoding: 'utf8' });
    expect(out).toMatch('cfglint');
  });

  it('should scan a directory with fixtures', () => {
    const out = execFileSync(process.execPath, [cli, 'scan', 'fixtures'], { encoding: 'utf8' });
    expect(out.length).toBeGreaterThan(0);
  });

  it('should produce JSON output', () => {
    const out = execFileSync(process.execPath, [cli, 'scan', 'fixtures', '--format', 'json'], { encoding: 'utf8' });
    const parsed = JSON.parse(out);
    expect(parsed).toHaveProperty('filesScanned');
    expect(Array.isArray(parsed.issues)).toBe(true);
  });
});
