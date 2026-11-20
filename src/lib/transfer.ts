import { supabase } from './supabase';

// A transfer link carries a one-time token in the #hash: never sent to any server, not in logs or Referer.
const KEY = 'transfer';
export type TransferCode = { token_hash: string };

/** Ask the server for a fresh one-time token (invalidates the previous one). */
export async function createTransferCode(): Promise<TransferCode> {
  const { data, error } = await supabase.functions.invoke<TransferCode>('transfer-code', { method: 'POST' });
  if (error) {
    // Surface the function's own message instead of "non-2xx status code".
    const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new Error(body?.error ?? error.message);
  }
  if (!data?.token_hash) throw new Error('no token');
  return data;
}

export function transferLink(code: TransferCode) {
  return `${location.origin}/me#${KEY}=${encodeURIComponent(code.token_hash)}`;
}

/** The code in the current URL, if any. */
export function readTransferFromUrl(): TransferCode | null {
  const m = new RegExp(`(?:^#|&)${KEY}=([^&]+)`).exec(location.hash);
  return m ? { token_hash: decodeURIComponent(m[1]) } : null;
}

export function clearTransferFromUrl() {
  history.replaceState(null, '', location.pathname + location.search);
}

/** Switch this browser to the transferred account. On failure the current account is untouched. */
export async function importTransfer(code: TransferCode) {
  const { error } = await supabase.auth.verifyOtp({ token_hash: code.token_hash, type: 'magiclink' });
  if (error) throw error;
}
