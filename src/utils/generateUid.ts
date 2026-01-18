/**
 * Generate a simple random UID (8 chars)
 * Uses crypto.randomUUID for better randomness
 */
export function generateUid(): string {
  return crypto.randomUUID().slice(0, 8);
}
