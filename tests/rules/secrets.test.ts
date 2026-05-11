import { describe, it, expect } from 'vitest';
import { shannonEntropy, scanValueForPatterns, loadCustomPatterns } from '../../src/rules/secrets.js';

describe('Secrets Detection', () => {
  describe('shannonEntropy', () => {
    it('returns 0 for empty string', () => {
      expect(shannonEntropy('')).toBe(0);
    });

    it('returns low entropy for repeated chars', () => {
      expect(shannonEntropy('aaaaaa')).toBeCloseTo(0, 2);
    });

    it('returns high entropy for random-looking strings', () => {
      const entropy = shannonEntropy('aB3$kL9#mP2@xR7!');
      expect(entropy).toBeGreaterThan(3.5);
    });

    it('distinguishes simple from complex strings', () => {
      const simple = shannonEntropy('password');
      const complex = shannonEntropy('xK9#mP2@vL5!');
      expect(complex).toBeGreaterThan(simple);
    });
  });

  describe('scanValueForPatterns', () => {
    it('detects AWS access keys', () => {
      const issues = scanValueForPatterns('AKIAIOSFODNN7EXAMPLE', 'test.json', 1);
      expect(issues.some((i) => i.message.includes('AWS'))).toBe(true);
    });

    it('detects private key headers', () => {
      const issues = scanValueForPatterns('-----BEGIN RSA PRIVATE KEY-----', 'test.json', 1);
      expect(issues.some((i) => i.message.includes('Private Key'))).toBe(true);
    });

    it('detects GitHub tokens', () => {
      const issues = scanValueForPatterns('ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij', 'test.json', 1);
      expect(issues.some((i) => i.message.includes('GitHub'))).toBe(true);
    });

    it('detects high-entropy strings', () => {
      const issues = scanValueForPatterns('xK9#mP2@vL5!nR8$qW4&jT7*', 'test.json', 1);
      expect(issues.some((i) => i.rule === 'secret-detected')).toBe(true);
    });

    it('ignores short strings for entropy check', () => {
      const issues = scanValueForPatterns('short', 'test.json', 1);
      expect(issues).toHaveLength(0);
    });

    it('returns correct file and line info', () => {
      const issues = scanValueForPatterns('AKIAIOSFODNN7EXAMPLE', 'config.json', 5);
      expect(issues[0].file).toBe('config.json');
      expect(issues[0].line).toBe(5);
    });
  });

  describe('loadCustomPatterns', () => {
    it('loads valid custom patterns', () => {
      const json = JSON.stringify([{ name: 'Test Pattern', regex: 'TEST_[0-9]+' }]);
      const patterns = loadCustomPatterns(json);
      expect(patterns).toHaveLength(1);
      expect(patterns[0].name).toBe('Test Pattern');
    });

    it('returns empty array for invalid JSON', () => {
      const patterns = loadCustomPatterns('not json');
      expect(patterns).toHaveLength(0);
    });
  });
});
