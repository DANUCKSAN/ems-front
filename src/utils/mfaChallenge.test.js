import {
  assertMfaChallenge,
  formatMfaExpiry,
  normalizeMfaCode,
  parseMfaExpiry,
} from './mfaChallenge';

describe('MFA challenge helpers', () => {
  it('accepts a challenge with a non-empty identifier', () => {
    const challenge = { challengeId: 'challenge-1', maskedEmail: 't***r@example.com' };

    expect(assertMfaChallenge(challenge)).toBe(challenge);
  });

  it('rejects incomplete challenge responses before showing the verification step', () => {
    expect(() => assertMfaChallenge({ message: 'sent' })).toThrow('incomplete MFA challenge');
  });

  it('normalizes pasted codes to six digits', () => {
    expect(normalizeMfaCode(' 12a3-4567 ')).toBe('123456');
  });

  it('treats API timestamps without a zone as UTC', () => {
    expect(parseMfaExpiry('2026-07-31T03:04:05').toISOString())
      .toBe('2026-07-31T03:04:05.000Z');
    expect(formatMfaExpiry('not-a-date')).toBeNull();
  });
});
