import { describe, expect, it } from 'vitest';
import { calculateAts, keywords } from '../services/resume.service.js';

describe('ATS service', () => {
  it('finds relevant keywords and missing target terms', () => {
    const result = calculateAts(
      'Summary React Node.js MongoDB Experience Education Skills',
      'React Node.js Kubernetes AWS'
    );
    expect(result.matchedKeywords).toContain('react');
    expect(result.missingKeywords).toContain('kubernetes');
    expect(result.score).toBeGreaterThan(30);
  });
  it('removes common stop words', () =>
    expect(keywords('with with React React MongoDB')).not.toContain('with'));
});
