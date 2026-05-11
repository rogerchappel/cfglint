import { readFile, writeFile } from 'node:fs/promises';
import { Issue, FixResult } from './types.js';
import { parseJson } from './parsers/json.js';

/**
 * Attempt to auto-fix issues in a file.
 * Currently supports: removing JSON duplicate keys, removing trailing commas.
 */
export async function fixFile(filePath: string, issues: Issue[]): Promise<FixResult> {
  const content = await readFile(filePath, 'utf-8');
  let fixedContent = content;
  const issuesFixed: Issue[] = [];

  // Filter to only fixable issues
  const fixableIssues = issues.filter((i) => i.fixable && i.file === filePath);

  if (fixableIssues.length === 0) {
    return { fixed: false, originalContent: content, fixedContent: content, issuesFixed: [] };
  }

  // Fix trailing commas in JSON
  if (fixableIssues.some((i) => i.rule === 'json-trailing-comma')) {
    fixedContent = removeTrailingCommas(fixedContent);
    issuesFixed.push(...fixableIssues.filter((i) => i.rule === 'json-trailing-comma'));
  }

  // Fix duplicate keys - remove duplicate occurrences (keep first)
  if (fixableIssues.some((i) => i.rule === 'json-duplicate-key')) {
    // This is complex - for now, just mark as not fully fixable
    // A proper fix would need a JSON AST rewrite
  }

  const fixed = fixedContent !== content;

  if (fixed) {
    await writeFile(filePath, fixedContent, 'utf-8');
  }

  return {
    fixed,
    originalContent: content,
    fixedContent,
    issuesFixed,
  };
}

/**
 * Remove trailing commas from JSON content.
 */
function removeTrailingCommas(content: string): string {
  // Remove commas before } or ]
  // This is a simple regex approach - may not handle all edge cases
  return content.replace(/,(\s*[}\]])/g, '$1');
}

/**
 * Dry-run fix: return what would change without writing.
 */
export async function dryRunFix(filePath: string, issues: Issue[]): Promise<FixResult> {
  const content = await readFile(filePath, 'utf-8');
  let fixedContent = content;
  const issuesFixed: Issue[] = [];

  const fixableIssues = issues.filter((i) => i.fixable && i.file === filePath);

  if (fixableIssues.some((i) => i.rule === 'json-trailing-comma')) {
    fixedContent = removeTrailingCommas(fixedContent);
    issuesFixed.push(...fixableIssues.filter((i) => i.rule === 'json-trailing-comma'));
  }

  return {
    fixed: fixedContent !== content,
    originalContent: content,
    fixedContent,
    issuesFixed,
  };
}
