/**
 * Strict email validation utility for user & staff account creation.
 * Rejects malformed strings, common misspelled/squatted domains (such as ggmail.com),
 * and verifies domain structure + server-side DNS MX deliverability.
 */
const STRICT_EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export const MISSPELLED_EMAIL_DOMAINS: Record<string, string> = {
  // Gmail typos
  'ggmail.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmaul.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmil.com': 'gmail.com',
  'gmaik.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.cmo': 'gmail.com',
  'gmail.comm': 'gmail.com',
  'gmail.om': 'gmail.com',
  'gmail.net': 'gmail.com',
  'gmail.org': 'gmail.com',
  'g-mail.com': 'gmail.com',
  'gogglemail.com': 'gmail.com',
  'googlmail.com': 'gmail.com',
  // Yahoo typos
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yhoo.com': 'yahoo.com',
  'yaoo.com': 'yahoo.com',
  'yhaoo.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'yahoo.cm': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yahoo.cmo': 'yahoo.com',
  'ymial.com': 'ymail.com',
  // Hotmail typos
  'hotmial.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'homtail.com': 'hotmail.com',
  'htomail.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'hotmail.cm': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'hotmail.cmo': 'hotmail.com',
  // Outlook typos
  'outlok.com': 'outlook.com',
  'outllook.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'oultook.com': 'outlook.com',
  'outlook.co': 'outlook.com',
  'outlook.cm': 'outlook.com',
  'outlook.con': 'outlook.com',
  'outlook.cmo': 'outlook.com',
  // iCloud typos
  'iclod.com': 'icloud.com',
  'icoud.com': 'icloud.com',
  'icloud.co': 'icloud.com',
  'icloud.cm': 'icloud.com',
  'icloud.con': 'icloud.com',
};

export function getEmailValidationError(rawEmail: string): string | null {
  const email = (rawEmail || '').trim().toLowerCase();
  if (!email) {
    return 'Email address is required.';
  }
  if (email.length > 254 || email.includes('..') || !STRICT_EMAIL_REGEX.test(email)) {
    return 'Please enter a valid email address with a working domain.';
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    return 'Please enter a valid email address with a working domain.';
  }
  const [local, domain] = parts;
  if (!local || local.length > 64 || local.startsWith('.') || local.endsWith('.')) {
    return 'Please enter a valid email address with a working domain.';
  }

  const domainParts = domain.split('.');
  if (domainParts.length < 2) {
    return 'Please enter a valid email address with a working domain.';
  }
  const tld = domainParts[domainParts.length - 1];
  if (!tld || !/^[a-zA-Z]{2,}$/.test(tld)) {
    return 'Please enter a valid email address with a working domain.';
  }

  if (MISSPELLED_EMAIL_DOMAINS[domain]) {
    return `Please enter a valid email address with a working domain (did you mean @${MISSPELLED_EMAIL_DOMAINS[domain]}?).`;
  }

  return null;
}

export function isValidEmail(rawEmail: string): boolean {
  return getEmailValidationError(rawEmail) === null;
}

/**
 * Verify email format, DNS MX deliverability, and optional uniqueness via the backend validator.
 */
export async function verifyEmailDeliverability(
  rawEmail: string,
  checkUnique = true
): Promise<string | null> {
  const localError = getEmailValidationError(rawEmail);
  if (localError) {
    return localError;
  }

  try {
    const csrfCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('XSRF-TOKEN='))
      ?.split('=')[1];

    const res = await fetch('/api/validate-email', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrfCookie ? { 'X-XSRF-TOKEN': decodeURIComponent(csrfCookie) } : {}),
      },
      body: JSON.stringify({
        email: rawEmail.trim().toLowerCase(),
        check_unique: checkUnique,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return data?.message || 'Please enter a valid email address with a working domain.';
    }
  } catch (_) {
    // If network request fails transiently, rely on local validation and final form post validation
  }

  return null;
}
