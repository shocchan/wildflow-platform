import { supabase } from './supabaseClient';

export interface LessonPackage {
  id: string;
  name: string;
  description: string | null;
  included_types: string[];
  original_price: number;
  package_price: number;
  status: string;
  paypay_id: string | null;
  created_at: string;
}

export interface PackageEntry {
  id: string;
  package_id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  payment_status: string;
  created_at: string;
}

export async function fetchPublishedPackages(): Promise<LessonPackage[]> {
  const { data, error } = await supabase
    .from('lesson_packages')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createPackageEntry(entry: {
  package_id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
}): Promise<{ package_id: string; name: string; email: string; phone: string | null; message: string | null; payment_status: string }> {
  // 匿名ユーザーには SELECT 権限を与えていないため、insert 後の読み返しはしない
  const row = { ...entry, payment_status: 'unpaid' };
  const { error } = await supabase
    .from('package_entries')
    .insert([row]);
  if (error) throw error;
  return row;
}
