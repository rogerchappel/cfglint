#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanDirectory } from './scan.js';
import { fixFile, dryRunFix } from './fix.js';
import { formatHuman } from './output/human.js';
import { formatJson } from './output/json.js';
import { formatSarif } from './output/sarif.js';
import { writeFile } from 'node:fs/promises';
import { ScanConfig } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '..', 'package.json');

let version: string;
try {
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  version = pkg.version;
} catch {
  version = '0.1.0';
}

const program = new Command();

program
  .name('cfglint')
  .description('Configuration file linter for monorepos')
  .version(version);

program
  .command('scan')
  .description('Scan a directory for configuration issues')
  .argument('<path>', 'Directory to scan')
  .option('--format <format>', 'Output format (human, json, sarif)', 'human')
  .option('--out <file>', 'Write output to file')
  .option('--fix', 'Auto-fix repairable issues')
  .option('--dry-run', 'Show what would be fixed without applying (requires --fix)')
  .option('--severity <level>', 'Minimum severity to report (info, warning, error, fatal)', 'info')
  .option('--ignore-node-modules', 'Skip node_modules directories', true)
  .option('--secret-patterns <file>', 'Path to custom secret patterns JSON file')
  .option('--ignore <file>', 'Path to .cfglintignore file')
  .action(async (path: string, options: any) => {
    try {
      const config: ScanConfig = {
        path,
        ignoreNodeModules: options.ignoreNodeModules !== false,
        ignoreFile: options.ignore,
        secretPatternsFile: options.secretPatterns,
        severity: options.severity,
      };

      const result = await scanDirectory(config);

      // Apply fixes if requested
      if (options.fix && result.issues.some((i) => i.fixable)) {
        const fixableIssues = result.issues.filter((i) => i.fixable);
        const uniqueFiles = [...new Set(fixableIssues.map((i) => i.file))];

        for (const file of uniqueFiles) {
          const fileIssues = fixableIssues.filter((i) => i.file === file);

          if (options.dryRun) {
            const fixResult = await dryRunFix(file, fileIssues);
            if (fixResult.fixed) {
              process.stdout.write(`Would fix ${fixResult.issuesFixed.length} issue(s) in ${file}\n`);
            }
          } else {
            const fixResult = await fixFile(file, fileIssues);
            if (fixResult.fixed) {
              process.stdout.write(`Fixed ${fixResult.issuesFixed.length} issue(s) in ${file}\n`);
            }
          }
        }
      }

      // Format output
      let output: string;
      switch (options.format) {
        case 'json':
          output = formatJson(result);
          break;
        case 'sarif':
          output = formatSarif(result, version);
          break;
        default:
          output = formatHuman(result);
      }

      // Write to file or stdout
      if (options.out) {
        await writeFile(options.out, output, 'utf-8');
        process.stdout.write(`Report written to ${options.out}\n`);
      } else {
        process.stdout.write(output + '\n');
      }

      // Exit with non-zero if errors found
      if (result.errors.length > 0) {
        process.exit(1);
      }
    } catch (error) {
      const err = error as Error;
      process.stderr.write(`Error: ${err.message}\n`);
      process.exit(2);
    }
  });

// Alias: check is the same as scan but always exits non-zero on issues
program
  .command('check')
  .description('Alias for scan -- exits non-zero if any issues found')
  .argument('<path>', 'Directory to scan')
  .option('--format <format>', 'Output format (human, json, sarif)', 'human')
  .option('--out <file>', 'Write output to file')
  .option('--severity <level>', 'Minimum severity to report (info, warning, error, fatal)', 'warning')
  .option('--ignore-node-modules', 'Skip node_modules directories', true)
  .option('--secret-patterns <file>', 'Path to custom secret patterns JSON file')
  .action(async (path: string, options: any) => {
    // Delegate to scan with --severity warning by default
    const scanOptions = {
      format: options.format,
      out: options.out,
      severity: options.severity || 'warning',
      ignoreNodeModules: options.ignoreNodeModules !== false,
      secretPatterns: options.secretPatterns,
    };
    // Call the scan action via program
    const scanCommand = program.commands.find((c) => c.name() === 'scan');
    if (scanCommand) {
      await scanCommand.parseAsync(['', '', path, ...Object.entries(scanOptions).flatMap(([k, v]) => [`--${k}`, String(v)])]);
    }
  });

program.parse();
