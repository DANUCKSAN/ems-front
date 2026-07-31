export const MFA_CODE_LENGTH = 6;

export const normalizeMfaCode = (value) =>
  String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, MFA_CODE_LENGTH);

export const assertMfaChallenge = (payload) => {
  if (!payload || typeof payload !== 'object' || typeof payload.challengeId !== 'string' || !payload.challengeId.trim()) {
    throw new Error('The sign-in service returned an incomplete MFA challenge. Please try again.');
  }

  return payload;
};

export const parseMfaExpiry = (expiresAt) => {
  if (!expiresAt) {
    return null;
  }

  const rawValue = String(expiresAt).trim();
  if (!rawValue) {
    return null;
  }

  // The API stores MFA timestamps in UTC but serializes LocalDateTime without a
  // zone suffix. Treat an absent suffix as UTC so browsers outside UTC do not
  // display a misleading expiry time.
  const normalizedValue = /(?:z|[+-]\d{2}:?\d{2})$/i.test(rawValue)
    ? rawValue
    : `${rawValue}Z`;
  const parsed = new Date(normalizedValue);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatMfaExpiry = (expiresAt) => {
  const expiry = parseMfaExpiry(expiresAt);
  if (!expiry) {
    return null;
  }

  return expiry.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};
