import { Issue } from '../types.js';

export interface SecretPattern {
  name: string;
  regex: RegExp;
  severity?: 'warning' | 'error';
}

/**
 * Built-in secret detection patterns.
 */
const BUILTIN_PATTERNS: SecretPattern[] = [
  {
    name: 'AWS Access Key',
    regex: /AKIA[0-9A-Z]{16}/,
    severity: 'error',
  },
  {
    name: 'AWS Secret Key',
    regex: /aws[_\-]?secret[_\-]?access[_\-]?key\s*[=:]\s*["']?[A-Za-z0-9/+=]{40}/i,
    severity: 'error',
  },
  {
    name: 'GitHub Token',
    regex: /gh[pousr]_[A-Za-z0-9_]{36,}/,
    severity: 'error',
  },
  {
    name: 'Private Key Header',
    regex: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/,
    severity: 'error',
  },
  {
    name: 'Generic API Key',
    regex: /api[_\-]?key|apikey/i,
    severity: 'warning',
  },
  {
    name: 'Generic Secret',
    regex: /(secret|token|auth)\s*[=:]\s*["']?[A-Za-z0-9]{20,}/i,
    severity: 'warning',
  },
  {
    name: 'Password Assignment',
    regex: /(password|passwd|pwd)\s*[=:]\s*["'][^"']{8,}["']/i,
    severity: 'warning',
  },
];

/**
 * Shannon entropy of a string. Higher entropy suggests randomness (potential secret).
 */
export function shannonEntropy(str: string): number {
  if (!str) return 0;
  const freq: Record<string, number> = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }
  const len = str.length;
  let entropy = 0;
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Load custom secret patterns from a JSON file content.
 * Expected format: [{ "name": "...", "regex": "..." }]
 */
export function loadCustomPatterns(jsonContent: string): SecretPattern[] {
  try {
    const patterns = JSON.parse(jsonContent) as Array<{ name: string; regex: string }>;
    return patterns.map((p) => ({
      name: p.name,
      regex: new RegExp(p.regex),
      severity: 'warning' as const,
    }));
  } catch {
    return [];
  }
}

/**
 * Scan a value for known secret patterns.
 */
export function scanValueForPatterns(
  value: string,
  file: string,
  line: number,
  customPatterns: SecretPattern[] = []
): Issue[] {
  const issues: Issue[] = [];
  const allPatterns = [...BUILTIN_PATTERNS, ...customPatterns];

  for (const pattern of allPatterns) {
    if (pattern.regex.test(value)) {
      // For key-based patterns (api_key=, secret=, etc.), skip common non-secret cases
      if (pattern.name === 'Generic API Key' || pattern.name === 'Generic Secret' || pattern.name === 'Password Assignment') {
        // Only flag if the actual value after the key looks like a real value
        const assignmentMatch = value.match(/(?:secret|token|auth|password|passwd|pwd|api[_\-]?key|apikey)\s*[=:]\s*["']?([^\s"']{20,})/i);
        if (assignmentMatch) {
          issues.push({
            rule: 'secret-detected',
            severity: pattern.severity || 'warning',
            file,
            line,
            message: `Possible ${pattern.name} detected`,
            codeSnippet: value.length > 50 ? value.substring(0, 50) + '...' : value,
          });
        }
      } else {
        issues.push({
          rule: 'secret-detected',
          severity: pattern.severity || 'warning',
          file,
          line,
          message: `Possible ${pattern.name} detected`,
          codeSnippet: value.length > 50 ? value.substring(0, 50) + '...' : value,
        });
      }
    }
  }

  // High entropy check - only for longer strings
  if (value.length >= 20 && shannonEntropy(value) > 4.5) {
    // Avoid flagging base64-encoded common strings, URLs, etc.
    if (!isLikelyFalsePositive(value)) {
      issues.push({
        rule: 'secret-detected',
        severity: 'warning',
        file,
        line,
        message: `High-entropy string detected (possible secret)`,
        codeSnippet: value.length > 50 ? value.substring(0, 50) + '...' : value,
      });
    }
  }

  return issues;
}

/**
 * Reduce false positives for high-entropy detection.
 */
function isLikelyFalsePositive(value: string): boolean {
  // Common non-secret patterns
  const falsePositivePatterns = [
    /^https?:\/\//,
    /^[a-z]+:\/\/\//,
    /^\$\{?/, // env var reference
    /^%[A-Z_]+%/, // Windows env var
  ];
  return falsePositivePatterns.some((p) => p.test(value));
}
