/** Normalize email the same way as auth routes (lowercase, trim). */
export function normalizeUserEmail(email: string): string {
  return String(email).toLowerCase().trim();
}

/** True if storage object key is exactly the user prefix or a file under `email/...`. */
export function isStoragePathOwnedByUser(objectPath: string, userEmail: string): boolean {
  const prefix = normalizeUserEmail(userEmail);
  const p = objectPath.trim();
  if (!p || p.includes('..')) return false;
  return p === prefix || p.startsWith(`${prefix}/`);
}

/**
 * Vercel Blob uses `{userId}/{file}` (no `@` in path). Legacy blob paths may still use `email/...`.
 */
export function isVercelBlobPathOwnedByUser(objectPath: string, userId: string, userEmail: string): boolean {
  const p = objectPath.trim();
  if (!p || p.includes('..')) return false;
  if (p === userId || p.startsWith(`${userId}/`)) return true;
  return isStoragePathOwnedByUser(objectPath, userEmail);
}
