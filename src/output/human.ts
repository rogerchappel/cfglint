import { Issue, ScanResult } from '../types.js';
import pc from 'picocolors';

/**
 * Format scan results as human-readable colored terminal output.
 */
export function formatHuman(result: ScanResult): string {
  const lines: string[] = [];

  // Sort issues by file, then line
  const sorted = [...result.issues].sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    return a.line - b.line;
  });

  for (const issue of sorted) {
    const icon = getIcon(issue.severity);
    const severity = formatSeverity(issue.severity);
    const location = `${issue.file}:${issue.line}`;
    lines.push(`${icon}  ${pc.bold(location)} - ${issue.message}${severity}`);
  }

  // Summary
  lines.push('');
  const totalIssues = result.issues.length;
  if (totalIssues === 0) {
    lines.push(`${pc.green('✓')} All ${result.filesScanned} config files scanned, no issues found`);
  } else {
    const errorCount = result.errors.length;
    const warningCount = result.warnings.length;
    const parts: string[] = [];
    if (errorCount > 0) parts.push(`${pc.red(errorCount)} error${errorCount !== 1 ? 's' : ''}`);
    if (warningCount > 0) parts.push(`${pc.yellow(warningCount)} warning${warningCount !== 1 ? 's' : ''}`);
    lines.push(`${totalIssues > 0 ? pc.yellow('⚠') : pc.green('✓')} Scanned ${result.filesScanned} file${result.filesScanned !== 1 ? 's' : ''}, found ${parts.join(', ')}`);
  }

  return lines.join('\n');
}

function getIcon(severity: string): string {
  switch (severity) {
    case 'error':
    case 'fatal':
      return pc.red('✗');
    case 'warning':
      return pc.yellow('⚠');
    case 'info':
      return pc.blue('ℹ');
    default:
      return '•';
  }
}

function formatSeverity(severity: string): string {
  switch (severity) {
    case 'error':
      return ` ${pc.red('[error]')}`;
    case 'fatal':
      return ` ${pc.red('[fatal]')}`;
    case 'warning':
      return ` ${pc.yellow('[warning]')}`;
    case 'info':
      return ` ${pc.blue('[info]')}`;
    default:
      return '';
  }
}
