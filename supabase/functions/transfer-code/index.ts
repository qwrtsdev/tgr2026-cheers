// Issues a one-time "transfer code" so the same account can sign in on another device.
//
// Why not just share the current session? Supabase rotates refresh tokens: two devices sharing one
// session trip reuse detection and BOTH get signed out. Instead we give the account a random password
// (behind a synthetic, never-emailed address) and the new device signs in with it -> its own session.
// Calling this again replaces the password, so any older QR stops working; the importing device calls
// it right after signing in, which makes every QR single-use. Existing sessions are not affected.
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

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  // Who is calling? Verified from their own access token.
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return json({ error: 'unauthorized' }, 401);

  const secret = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); // 192-bit, URL-safe
  const email = `${user.id}@transfer.tgr-cheers.invalid`; // .invalid never resolves; no mail is ever sent

  const { error } = await admin.auth.admin.updateUserById(user.id, { email, password: secret, email_confirm: true });
  if (error) return json({ error: error.message }, 500);

  return json({ email, secret });
});
