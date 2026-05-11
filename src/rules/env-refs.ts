import { Issue, EnvVarDefinition, EnvRef } from '../types.js';

/**
 * Find environment variable references that are not defined in the env files.
 */
export function findUndefinedEnvRefs(
  refs: EnvRef[],
  definitions: EnvVarDefinition[]
): Issue[] {
  const definedNames = new Set(definitions.map((d) => d.name));
  const issues: Issue[] = [];
  const seen = new Set<string>();

  for (const ref of refs) {
    const key = `${ref.file}:${ref.line}:${ref.name}`;
    if (seen.has(key)) continue;
    seen.add(key);

    // Skip common shell/env vars that are expected to exist outside .env
    if (isSystemVar(ref.name)) continue;

    if (!definedNames.has(ref.name)) {
      issues.push({
        rule: 'env-ref-undefined',
        severity: 'warning',
        file: ref.file,
        line: ref.line,
        message: `Environment variable "${ref.name}" is referenced but not defined in .env files`,
        codeSnippet: ref.raw,
      });
    }
  }

  return issues;
}

/**
 * Common system/env vars that don't need to be in .env files.
 */
function isSystemVar(name: string): boolean {
  const systemVars = new Set([
    'PATH', 'HOME', 'USER', 'SHELL', 'PWD', 'OLDPWD', 'TERM',
    'LANG', 'LC_ALL', 'TZ', 'HOSTNAME', 'SHLVL', '_',
    'NODE_ENV', 'NODE_PATH', 'NPM_CONFIG_PREFIX',
    'PYTHONPATH', 'JAVA_HOME', 'GOPATH',
    'CI', 'GITHUB_ACTIONS', 'GITHUB_TOKEN',
    'TRAVIS', 'JENKINS_URL',
  ]);
  return systemVars.has(name) || /^[A-Z_]+$/.test(name) && name.length <= 4;
}
