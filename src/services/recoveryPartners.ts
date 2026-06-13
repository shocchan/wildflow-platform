import { supabase } from './supabaseClient';
import type { RecoveryPartner } from '../types';

export async function fetchPublishedRecoveryPartners(): Promise<RecoveryPartner[]> {
  const { data, error } = await supabase
    .from('recovery_partners')
    .select('*')
    .eq('is_published', true)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return (data as RecoveryPartner[]) ?? [];
}

export async function fetchAllRecoveryPartnersAdmin(): Promise<RecoveryPartner[]> {
  const { data, error } = await supabase
    .from('recovery_partners')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw error;
  return (data as RecoveryPartner[]) ?? [];
}

export async function createRecoveryPartner(
  partner: Omit<RecoveryPartner, 'id'>
): Promise<void> {
  const { error } = await supabase.from('recovery_partners').insert(partner);
  if (error) throw error;
}

export async function updateRecoveryPartner(
  id: string,
  partner: Partial<Omit<RecoveryPartner, 'id'>>
): Promise<void> {
  const { error } = await supabase
    .from('recovery_partners')
    .update(partner)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteRecoveryPartner(id: string): Promise<void> {
  const { error } = await supabase
    .from('recovery_partners')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
