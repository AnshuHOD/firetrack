import crypto from 'crypto';

export function generateDedupHash(title: string): string {
  // Normalize: lowercase, remove special chars, keep first 80 chars
  const normalized = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .slice(0, 80);

  return crypto.createHash('sha256').update(normalized).digest('hex');
}
