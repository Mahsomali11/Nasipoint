/**
 * Shared license expiration & dynamic status evaluation utilities.
 *
 * Rules:
 * - Days Left = ceil((expiry_date - now()) in days)
 * - If days_left >= 0 and status !== 'suspended', the license status is strictly 'active'.
 * - If days_left < 0 and status !== 'suspended', the license status is 'expired'.
 */

export function parseLicenseExpiryTimestamp(expiryDate?: string | null): number | null {
  if (!expiryDate) return null;
  const trimmed = String(expiryDate).trim();
  if (!trimmed) return null;

  // Match YYYY-MM-DD at the start of any date/datetime string ("2026-11-17", "2026-11-17 00:00:00", ISO, etc.)
  // and construct local midnight so ceil((expiry - now) / 86400000) is always exact and never produces Invalid Date.
  const dateMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) {
    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]) - 1;
    const day = Number(dateMatch[3]);
    const localMidnight = new Date(year, month, day, 0, 0, 0, 0);
    const time = localMidnight.getTime();
    if (!isNaN(time)) return time;
  }

  const parsed = new Date(trimmed);
  const time = parsed.getTime();
  return isNaN(time) ? null : time;
}

export function parseLicenseDate(dateStr?: string | null): Date {
  const ts = parseLicenseExpiryTimestamp(dateStr);
  return ts !== null ? new Date(ts) : new Date();
}

export function formatLicenseDateOnly(dateStr?: string | null): string {
  if (!dateStr) return '';
  const trimmed = String(dateStr).trim();
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const d = parseLicenseDate(trimmed);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function calculateLicenseDaysLeft(expiryDate?: string | null): number {
  const expiryTime = parseLicenseExpiryTimestamp(expiryDate);
  if (expiryTime === null) return 365;

  const diffDays = Math.ceil((expiryTime - Date.now()) / (1000 * 60 * 60 * 24));
  // Normalize -0 to 0
  return diffDays === 0 ? 0 : diffDays;
}

export function isLicenseExpiryInPast(expiryDate?: string | null): boolean {
  return calculateLicenseDaysLeft(expiryDate) < 0;
}

export function getEffectiveLicenseStatus(
  license?: {
    status?: string | null;
    expiry_date?: string | null;
    expires_at?: string | null;
  } | null
): 'active' | 'expired' | 'suspended' | 'none' {
  if (!license) return 'none';
  const rawStatus = String(license.status || '').toLowerCase();
  if (rawStatus === 'none') return 'none';
  if (rawStatus === 'suspended') return 'suspended';

  const expiry = license.expiry_date ?? license.expires_at ?? null;
  if (!expiry) {
    return rawStatus === 'active' ? 'active' : 'expired';
  }

  const daysLeft = calculateLicenseDaysLeft(expiry);
  return daysLeft >= 0 ? 'active' : 'expired';
}
