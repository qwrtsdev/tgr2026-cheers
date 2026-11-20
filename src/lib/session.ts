import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { getCaptchaToken } from './captcha';

// Reuse the stored session, or create an anonymous account (behind hCaptcha).
// Concurrent callers (page load + an early cheer tap) share one sign-in instead of racing.
let pending: Promise<Session> | null = null;

export function ensureSession(): Promise<Session> {
  pending ??= (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // The stored session is only trusted locally; ask the server once whether the account still exists
      // (e.g. after an admin wiped users). Gone -> drop it quietly and make a fresh account below.
      const { error } = await supabase.auth.getUser();
      if (!error) return session;
      if (error.status && [401, 403, 404].includes(error.status)) await supabase.auth.signOut({ scope: 'local' });
      else return session; // network hiccup: keep using what we have
    }
    const captchaToken = await getCaptchaToken();
    const { data, error } = await supabase.auth.signInAnonymously({ options: { captchaToken } });
    if (error) throw error;
    return data.session!;
  })().catch((e) => {
    pending = null; // let the next call retry
    throw e;
  });
  return pending;
}
