import { minimatch } from 'minimatch';
import { readFile } from 'node:fs/promises';
import { relative } from 'node:path';

/**
 * Load and parse a .cfglintignore file.
 * Returns an array of glob patterns.
 */
export async function loadIgnorePatterns(ignorePath: string): Promise<string[]> {
  try {
    const content = await readFile(ignorePath, 'utf-8');
    return content
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));
  } catch {
    return [];
  }
}

/**
 * Check if a file path matches any of the ignore patterns.
 */
export function isIgnored(filePath: string, patterns: string[], baseDir: string): boolean {
  const relPath = relative(baseDir, filePath);
  const fileName = filePath.split('/').pop() || '';

  for (const pattern of patterns) {
    // Direct filename match
    if (fileName === pattern) return true;

    // Glob match against relative path
    if (minimatch(relPath, pattern, { dot: true })) return true;
    if (minimatch(relPath, `**/${pattern}`, { dot: true })) return true;

    // Directory pattern
    if (pattern.endsWith('/')) {
      const dirPattern = pattern.slice(0, -1);
      if (relPath.startsWith(dirPattern)) return true;
    }
  }

  return false;
}
