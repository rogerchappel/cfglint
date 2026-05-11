// Duplicates are detected during JSON parsing in src/parsers/json.ts
// This module exports utilities for working with duplicate key issues.

import { Issue } from '../types.js';

export { };

/**
 * Filter issues to only duplicate key warnings.
 */
export function filterDuplicateKeyIssues(issues: Issue[]): Issue[] {
  return issues.filter((i) => i.rule === 'json-duplicate-key');
}
