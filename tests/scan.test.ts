import { describe, it, expect } from 'vitest';
import { scanDirectory } from '../src/scan.js';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const examplesDir = join(__dirname, '..', 'examples');

describe('Directory Scanner', () => {
  it('scans example directory', async () => {
    const result = await scanDirectory({
      path: examplesDir,
      ignoreNodeModules: true,
    });
    expect(result.filesScanned).toBeGreaterThan(0);
  });

  it('detects issues in example fixtures', async () => {
    const result = await scanDirectory({
      path: examplesDir,
      ignoreNodeModules: true,
    });
    // broken-syntax.json should cause syntax errors
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('respects ignore-node-modules flag', async () => {
    const result = await scanDirectory({
      path: examplesDir,
      ignoreNodeModules: true,
    });
    // Should not scan any node_modules files
    const nodeModulesFiles = result.issues.filter((i) => i.file.includes('node_modules'));
    expect(nodeModulesFiles).toHaveLength(0);
  });

  it('collects warnings from example fixtures', async () => {
    const result = await scanDirectory({
      path: examplesDir,
      ignoreNodeModules: true,
    });
    // duplicate-keys.json and trailing-comma.json should cause warnings
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
