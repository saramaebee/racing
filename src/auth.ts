// Lean shared-password gate. Viewing is always public; creating championships
// and entering/editing scores requires the EDIT_PASSWORD. On success we set an
// HMAC-signed cookie so the password isn't stored or re-sent.
import { createHmac, timingSafeEqual } from 'node:crypto';

const SECRET = process.env.SESSION_SECRET ?? 'dev-insecure-secret-change-me';
const EDIT_PASSWORD = process.env.EDIT_PASSWORD ?? '';

export const EDIT_COOKIE = 'racing_edit';
const PAYLOAD = 'editor';

function sign(value: string): string {
  return createHmac('sha256', SECRET).update(value).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function makeToken(): string {
  return `${PAYLOAD}.${sign(PAYLOAD)}`;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const dot = token.indexOf('.');
  if (dot < 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  return payload === PAYLOAD && safeEqual(sig, sign(PAYLOAD));
}

// Returns true only if a password is configured and matches.
export function checkPassword(input: string): boolean {
  if (EDIT_PASSWORD === '') return false;
  return safeEqual(input, EDIT_PASSWORD);
}
