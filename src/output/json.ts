import { ScanResult } from '../types.js';

/**
 * Format scan results as JSON.
 */
export function formatJson(result: ScanResult): string {
  return JSON.stringify(
    {
      filesScanned: result.filesScanned,
      issues: result.issues,
      summary: {
        total: result.issues.length,
        errors: result.errors.length,
        warnings: result.warnings.length,
      },
    },
    null,
    2
  );
}
