// Syntax errors are detected during parsing in each parser module.
// This module provides utilities for working with syntax error issues.

import { Issue } from '../types.js';

export { };

/**
 * Filter issues to only syntax/parse errors.
 */
export function filterSyntaxErrors(issues: Issue[]): Issue[] {
  return issues.filter((i) => i.rule === 'json-syntax-error' || i.rule === 'parse-error');
}
