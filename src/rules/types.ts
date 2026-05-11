// Type mismatch detection - placeholder for future schema support.

import { Issue, RuleId } from '../types.js';

// Type mismatches aren't a v1 rule; this is a placeholder for future schema-based type checking.

/**
 * Filter issues to only type-mismatch warnings (no-op in v1).
 */
export function filterTypeMismatches(issues: Issue[]): Issue[] {
  return issues.filter((i) => {
    // In v1, there are no type-mismatch rules. Reserved for v2.
    return false;
  });
}
