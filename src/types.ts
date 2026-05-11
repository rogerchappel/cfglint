export type SeverityLevel = 'info' | 'warning' | 'error' | 'fatal';

export type RuleId =
  | 'secret-detected'
  | 'json-duplicate-key'
  | 'json-syntax-error'
  | 'json-trailing-comma'
  | 'json-comment'
  | 'env-ref-undefined'
  | 'parse-error';

export interface Issue {
  rule: RuleId;
  severity: SeverityLevel;
  file: string;
  line: number;
  column?: number;
  message: string;
  fixable?: boolean;
  codeSnippet?: string;
}

export interface ParseResult<T = unknown> {
  ok: boolean;
  data?: T;
  errors: Issue[];
  warnings: Issue[];
}

export interface EnvVarDefinition {
  name: string;
  value: string;
  file: string;
  line: number;
}

export interface EnvRef {
  name: string;
  file: string;
  line: number;
  raw: string; // the original $VAR or ${VAR} text
}

export interface ScanConfig {
  path: string;
  ignoreNodeModules: boolean;
  ignoreFile?: string;
  secretPatternsFile?: string;
  maxDepth?: number;
  severity?: SeverityLevel;
}

export interface FixResult {
  fixed: boolean;
  originalContent: string;
  fixedContent: string;
  issuesFixed: Issue[];
}

export interface ScanResult {
  filesScanned: number;
  issues: Issue[];
  warnings: Issue[];
  errors: Issue[];
}
