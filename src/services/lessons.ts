import { supabase } from './supabaseClient';
import type { Lesson, LessonEntry } from '../types/lesson';

export async function fetchPublishedLessons(): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('status', 'published')
    .gte('date', new Date().toISOString().slice(0, 10))
    .order('date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllLessonsAdmin(): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchLessonById(id: string): Promise<Lesson | null> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function createLesson(lesson: Omit<Lesson, 'id' | 'created_at'>): Promise<void> {
  const { error } = await supabase.from('lessons').insert(lesson);
  if (error) throw error;
}

export async function updateLesson(id: string, lesson: Partial<Omit<Lesson, 'id' | 'created_at'>>): Promise<void> {
  const { error } = await supabase.from('lessons').update(lesson).eq('id', id);
  if (error) throw error;
}

export async function deleteLesson(id: string): Promise<void> {
  const { error } = await supabase.from('lessons').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchEntriesForLesson(lessonId: string): Promise<LessonEntry[]> {
  const { data, error } = await supabase
    .from('lesson_entries')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchEntryCounts(lessonIds: string[]): Promise<Record<string, number>> {
  if (lessonIds.length === 0) return {};
  const { data, error } = await supabase
    .from('lesson_entries')
    .select('lesson_id')
    .in('lesson_id', lessonIds)
    .neq('payment_status', 'cancelled');
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.lesson_id] = (counts[row.lesson_id] ?? 0) + 1;
  }
  return counts;
}

export async function createEntry(entry: Omit<LessonEntry, 'id' | 'created_at'>): Promise<LessonEntry> {
  const { data, error } = await supabase
    .from('lesson_entries')
    .insert(entry)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEntryPaymentStatus(id: string, payment_status: LessonEntry['payment_status']): Promise<void> {
  const { error } = await supabase
    .from('lesson_entries')
    .update({ payment_status })
    .eq('id', id);
  if (error) throw error;
}
