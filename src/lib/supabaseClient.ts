import { createClient } from '@supabase/supabase-js';

export function getSupabaseConfig() {
  const url = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
  const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;
  const bucket =
    ((import.meta as any).env?.VITE_SUPABASE_STORAGE_BUCKET as string | undefined) ||
    'product-images';

  return {
    url: (url && url.trim()) || '',
    anonKey: (anonKey && anonKey.trim()) || '',
    bucket: bucket.trim() || 'product-images',
  };
}

export function getSupabaseClient() {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    throw new Error('supabase_not_configured');
  }
  return createClient(url, anonKey);
}

