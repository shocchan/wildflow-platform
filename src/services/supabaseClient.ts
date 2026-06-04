import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] 環境変数が未設定です。.env ファイルを確認してください。');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
