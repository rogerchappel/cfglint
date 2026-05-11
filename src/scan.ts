import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';
import { ScanConfig, ScanResult, Issue, EnvVarDefinition, EnvRef } from './types.js';
import { loadIgnorePatterns, isIgnored } from './ignore.js';
import { parseJson } from './parsers/json.js';
import { parseYaml } from './parsers/yaml.js';
import { parseToml } from './parsers/toml.js';
import { parseIni } from './parsers/ini.js';
import { parseEnv, extractEnvRefs } from './parsers/env.js';
import { scanValueForPatterns, SecretPattern, loadCustomPatterns } from './rules/secrets.js';
import { findUndefinedEnvRefs } from './rules/env-refs.js';

const CONFIG_EXTENSIONS = new Set(['.json', '.yml', '.yaml', '.toml', '.ini']);
const ENV_FILE_PATTERN = /^\.env(\..*)?$/;

export async function scanDirectory(config: ScanConfig): Promise<ScanResult> {
  const allIssues: Issue[] = [];
  let filesScanned = 0;

  // Check if config.path is a single file
  let isSingleFile = false;
  try {
    const stats = await stat(config.path);
    isSingleFile = stats.isFile();
  } catch {
    // path doesn't exist or isn't accessible
  }

  // Load ignore patterns
  const ignorePath = isSingleFile ? join(config.path, '..', '.cfglintignore') : (config.ignoreFile || join(config.path, '.cfglintignore'));
  const ignorePatterns = await loadIgnorePatterns(ignorePath);

  // Load custom secret patterns
  let customPatterns: SecretPattern[] = [];
  if (config.secretPatternsFile) {
    try {
      const content = await readFile(config.secretPatternsFile, 'utf-8');
      customPatterns = loadCustomPatterns(content);
    } catch {
      // Ignore missing pattern files
    }
  }

  // Collect all files
  let files: string[];
  if (isSingleFile) {
    const ext = extname(config.path);
    const fileName = config.path.split('/').pop() || '';
    const isEnv = ENV_FILE_PATTERN.test(fileName);
    if (CONFIG_EXTENSIONS.has(ext) || isEnv) {
      files = [config.path];
    } else {
      files = [];
    }
  } else {
    files = await collectFiles(config.path, ignorePatterns, config.path, config.ignoreNodeModules, config.maxDepth);
  }

  // Collect env definitions first (for cross-file reference checking)
  const allEnvDefinitions: EnvVarDefinition[] = [];
  const allEnvRefs: EnvRef[] = [];

  for (const file of files) {
    const fileName = file.split('/').pop() || '';
    const isEnvFile = ENV_FILE_PATTERN.test(fileName);
    const ext = extname(file);

    try {
      const content = await readFile(file, 'utf-8');
      filesScanned++;

      if (isEnvFile) {
        const result = parseEnv({ file, content });
        if (result.data) {
          allEnvDefinitions.push(...result.data);
        }
        allIssues.push(...result.errors, ...result.warnings);
      } else if (ext === '.json') {
        const result = parseJson({ file, content });
        allIssues.push(...result.errors, ...result.warnings);

        // Scan values for secrets
        if (result.data) {
          const secrets = scanObjectForSecrets(result.data, file, content, customPatterns);
          allIssues.push(...secrets);
        }
      } else if (ext === '.yml' || ext === '.yaml') {
        const result = parseYaml({ file, content });
        allIssues.push(...result.errors, ...result.warnings);

        // Scan values for secrets
        if (result.data) {
          const secrets = scanObjectForSecrets(result.data, file, content, customPatterns);
          allIssues.push(...secrets);
        }

        // Extract env refs
        const refs = extractEnvRefs(content, file);
        allEnvRefs.push(...refs);
      } else if (ext === '.toml') {
        const result = parseToml({ file, content });
        allIssues.push(...result.errors, ...result.warnings);

        if (result.data) {
          const secrets = scanObjectForSecrets(result.data, file, content, customPatterns);
          allIssues.push(...secrets);
        }

        const refs = extractEnvRefs(content, file);
        allEnvRefs.push(...refs);
      } else if (ext === '.ini') {
        const result = parseIni({ file, content });
        allIssues.push(...result.errors, ...result.warnings);

        if (result.data) {
          const secrets = scanObjectForSecrets(result.data, file, content, customPatterns);
          allIssues.push(...secrets);
        }
      }
    } catch (e) {
      const err = e as Error;
      allIssues.push({
        rule: 'parse-error',
        severity: 'error',
        file,
        line: 1,
        message: `Cannot read file: ${err.message}`,
      });
    }
  }

  // Check for undefined env references
  const undefinedRefs = findUndefinedEnvRefs(allEnvRefs, allEnvDefinitions);
  allIssues.push(...undefinedRefs);

  // Filter by severity threshold
  const severityLevels: Record<string, number> = { info: 0, warning: 1, error: 2, fatal: 3 };
  const threshold = config.severity ? severityLevels[config.severity] : 0;
  const filteredIssues = allIssues.filter((i) => severityLevels[i.severity] >= threshold);

  const errors = filteredIssues.filter((i) => i.severity === 'error' || i.severity === 'fatal');
  const warnings = filteredIssues.filter((i) => i.severity === 'warning');
  const infos = filteredIssues.filter((i) => i.severity === 'info');

  return {
    filesScanned,
    issues: filteredIssues,
    warnings,
    errors,
  };
}

async function collectFiles(
  dir: string,
  ignorePatterns: string[],
  baseDir: string,
  ignoreNodeModules: boolean,
  maxDepth?: number,
  currentDepth: number = 0
): Promise<string[]> {
  const files: string[] = [];

  if (maxDepth !== undefined && currentDepth > maxDepth) {
    return files;
  }

  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relPath = relative(baseDir, fullPath);

    // Skip ignored paths
    if (isIgnored(fullPath, ignorePatterns, baseDir)) {
      continue;
    }

    // Skip node_modules if configured
    if (ignoreNodeModules && entry.name === 'node_modules') {
      continue;
    }

    // Skip hidden directories (except .env files)
    if (entry.isDirectory() && entry.name.startsWith('.') && entry.name !== '.env') {
      continue;
    }

    if (entry.isDirectory()) {
      const subFiles = await collectFiles(fullPath, ignorePatterns, baseDir, ignoreNodeModules, maxDepth, currentDepth + 1);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      const ext = extname(entry.name);
      const isEnv = ENV_FILE_PATTERN.test(entry.name);
      if (CONFIG_EXTENSIONS.has(ext) || isEnv) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Recursively scan an object/array for string values that might contain secrets.
 */
function scanObjectForSecrets(
  data: unknown,
  file: string,
  content: string,
  customPatterns: SecretPattern[]
): Issue[] {
  const issues: Issue[] = [];
  const lines = content.split('\n');

  function scan(value: unknown, path: string = ''): void {
    if (typeof value === 'string') {
      // Find the line this value might be on
      let lineNum = 1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(value.substring(0, Math.min(20, value.length)))) {
          lineNum = i + 1;
          break;
        }
      }
      const found = scanValueForPatterns(value, file, lineNum, customPatterns);
      issues.push(...found);
    } else if (Array.isArray(value)) {
      value.forEach((item, idx) => scan(item, `${path}[${idx}]`));
    } else if (value !== null && typeof value === 'object') {
      for (const [key, val] of Object.entries(value)) {
        scan(val, `${path}.${key}`);
      }
    }
  }

  scan(data);
  return issues;
}
