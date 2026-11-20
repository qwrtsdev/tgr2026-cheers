// Issues a one-time sign-in token so the same account can be opened on another device.
//
// - Not the current session: Supabase rotates refresh tokens, so two devices sharing one session
//   trip reuse detection and BOTH get signed out.
// - Not a password: changing a password signs out EVERY session of the account.
// Instead: an admin-generated magic-link token (never emailed). The new device redeems it with
// verifyOtp -> its own independent session. Tokens are single-use, expire (Auth > OTP expiry,
// default 1h), and generating a new one invalidates the previous one. No existing session is touched.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*', // auth is the caller's JWT, not cookies, so * is safe here
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  // Projects on the new API keys get SUPABASE_SECRET_KEYS (JSON); older ones SUPABASE_SERVICE_ROLE_KEY.
  let serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  try {
    const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}');
    serviceKey = keys.default ?? Object.values(keys)[0] ?? serviceKey;
  } catch { /* keep legacy key */ }
  if (!serviceKey) return json({ error: 'server misconfigured: no service key' }, 500);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey, { auth: { persistSession: false } });

  // Who is calling? Verified from their own access token.
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return json({ error: `unauthorized: ${authError?.message ?? 'no user'}` }, 401);

  // Magic links need an email on the account. Give anonymous accounts a synthetic, confirmed one
  // (no mail is ever sent). Setting an email does not sign anyone out.
  let email = user.email;
  if (!email) {
    email = `${user.id}@users.tgr-cheers.qwrts.dev`;
    const { error } = await admin.auth.admin.updateUserById(user.id, { email, email_confirm: true });
    if (error) return json({ error: `set email: ${error.message}` }, 500);
  }

  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (error || !data?.properties?.hashed_token) return json({ error: `generate link: ${error?.message ?? 'no token'}` }, 500);

  return json({ token_hash: data.properties.hashed_token });
});
