import { ScanResult, Issue } from '../types.js';

/**
 * Format scan results as SARIF 2.1.0 format.
 * See: https://docs.oasis-open.org/sarif/sarif/v2.1.0/
 */
export function formatSarif(result: ScanResult, toolVersion: string = '0.1.0'): string {
  const rules = extractUniqueRules(result.issues);
  const artifacts = extractUniqueFiles(result.issues);

  const sarif = {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'CfgLint',
            version: toolVersion,
            informationUri: 'https://github.com/rogerchappel/cfglint',
            rules: rules.map((rule) => ({
              id: rule,
              shortDescription: {
                text: getRuleDescription(rule),
              },
              defaultConfiguration: {
                level: getRuleLevel(rule),
              },
            })),
          },
        },
        results: result.issues.map((issue) => ({
          ruleId: issue.rule,
          level: getSarifLevel(issue.severity),
          message: {
            text: issue.message,
          },
          locations: [
            {
              physicalLocation: {
                artifactLocation: {
                  uri: issue.file,
                },
                region: {
                  startLine: issue.line,
                  startColumn: issue.column || 1,
                },
              },
            },
          ],
        })),
        artifacts: artifacts.map((file) => ({
          location: {
            uri: file,
          },
        })),
      },
    ],
  };

  return JSON.stringify(sarif, null, 2);
}

function extractUniqueRules(issues: Issue[]): string[] {
  return [...new Set(issues.map((i) => i.rule))].sort();
}

function extractUniqueFiles(issues: Issue[]): string[] {
  return [...new Set(issues.map((i) => i.file))].sort();
}

function getRuleDescription(rule: string): string {
  const descriptions: Record<string, string> = {
    'secret-detected': 'A potential secret or sensitive value was detected',
    'json-duplicate-key': 'A JSON object contains duplicate keys',
    'json-syntax-error': 'JSON file contains syntax errors',
    'json-trailing-comma': 'JSON file contains trailing commas (non-standard)',
    'json-comment': 'JSON file contains comments (non-standard)',
    'env-ref-undefined': 'An environment variable is referenced but not defined',
    'parse-error': 'Failed to parse configuration file',
  };
  return descriptions[rule] || rule;
}

function getRuleLevel(rule: string): 'error' | 'warning' | 'note' {
  if (rule.includes('error') || rule.includes('secret')) return 'error';
  if (rule.includes('duplicate') || rule.includes('undefined')) return 'warning';
  return 'note';
}

function getSarifLevel(severity: string): 'error' | 'warning' | 'note' {
  switch (severity) {
    case 'fatal':
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    default:
      return 'note';
  }
}
