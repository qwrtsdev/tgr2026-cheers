import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { getCaptchaToken } from './captcha';

// Reuse the stored session, or create an anonymous account (behind hCaptcha).
// Concurrent callers (page load + an early cheer tap) share one sign-in instead of racing.
let pending: Promise<Session> | null = null;

export function ensureSession(): Promise<Session> {
  pending ??= (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return session;
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
