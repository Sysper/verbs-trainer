/**
 * ⚠️ PLACEHOLDER AUTH — there is no backend yet.
 *
 * This validates the form and remembers a "session" in localStorage so the
 * UI can already react to a signed-in user. It authenticates nobody: any
 * well-formed email plus a 6-character password is accepted, and anyone can
 * forge the session by editing localStorage from the console.
 *
 * Do not gate anything that actually matters on this. When the real backend
 * exists, `login()` becomes a POST that returns a token and only the wiring
 * inside this file changes.
 */
import { readJSON, removeKey, SESSION_KEY, writeJSON } from './storage';

export interface Session {
  email: string;
  /** Epoch ms of when the session was created. */
  since: number;
}

export type LoginResult = { ok: true; session: Session } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MIN_PASSWORD = 6;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Escribe tu correo.';
  if (!EMAIL_RE.test(email.trim())) return 'Ese correo no tiene un formato válido.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Escribe tu contraseña.';
  if (password.length < MIN_PASSWORD) return `Mínimo ${MIN_PASSWORD} caracteres.`;
  return null;
}

/** Async on purpose: the real version will call the API and this signature stays. */
export async function login(email: string, password: string): Promise<LoginResult> {
  const emailErr = validateEmail(email);
  if (emailErr) return { ok: false, error: emailErr };
  const passErr = validatePassword(password);
  if (passErr) return { ok: false, error: passErr };

  const session: Session = { email: email.trim().toLowerCase(), since: Date.now() };
  writeJSON(SESSION_KEY, session);
  return { ok: true, session };
}

export function getSession(): Session | null {
  const s = readJSON<Session>(SESSION_KEY);
  return s && typeof s.email === 'string' ? s : null;
}

export const logout = (): void => removeKey(SESSION_KEY);
