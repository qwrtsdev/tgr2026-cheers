import { supabase } from './supabase';
import { getCaptchaToken } from './captcha';

// A transfer link carries the code in the #hash: never sent to any server, not in logs or Referer.
const KEY = 'transfer';

/** Ask the server for a fresh one-time code (replaces any older one). */
export async function createTransferCode() {
  const { data, error } = await supabase.functions.invoke<{ email: string; secret: string }>('transfer-code', { method: 'POST' });
  if (error || !data) throw error ?? new Error('no data');
  return data;
}

export function transferLink(code: { email: string; secret: string }) {
  const payload = btoa(`${code.email}\n${code.secret}`).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${location.origin}/me#${KEY}=${payload}`;
}

/** The code in the current URL, if any. */
export function readTransferFromUrl(): { email: string; secret: string } | null {
  const m = new RegExp(`(?:^#|&)${KEY}=([A-Za-z0-9_-]+)`).exec(location.hash);
  if (!m) return null;
  try {
    const [email, secret] = atob(m[1].replace(/-/g, '+').replace(/_/g, '/')).split('\n');
    return email && secret ? { email, secret } : null;
  } catch {
    return null;
  }
}

export function clearTransferFromUrl() {
  history.replaceState(null, '', location.pathname + location.search);
}

/** Leave the current account on this browser and sign in to the transferred one. */
export async function importTransfer(code: { email: string; secret: string }) {
  const captchaToken = await getCaptchaToken();
  // Sign in first: on success it replaces this browser's session; on failure the current account is untouched.
  // (No signOut: other devices on either account stay signed in.)
  const { error } = await supabase.auth.signInWithPassword({ email: code.email, password: code.secret, options: { captchaToken } });
  if (error) throw error;
  // Burn the code: rotate it so the same QR/link can't be used again.
  await createTransferCode().catch(() => {});
}
