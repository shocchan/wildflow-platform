import { supabase } from './supabaseClient';

export interface ProfileSettings {
  name: string;
  tagline: string;
  photo_url: string;
  mission: string;
  story: string;
  twitter_url: string;
  xhs_url: string;
  lemon8_url: string;
}

export const defaultProfileSettings: ProfileSettings = {
  name: 'しょっちゃん',
  tagline: '野生の身体を研究する人',
  photo_url: '',
  mission:
    '「野生の身体を、すべての人へ。」\n\n現代社会では、人間本来の野性的な身体感覚が失われつつあります。わたしは自らの身体実験を通じて、誰もが自分の野生タイプを知り、それに合った生き方・動き方を選択できる世界をつくりたいと思っています。',
  story:
    '日本語教師として中国人学習者と向き合う日々の中で、「身体の使い方」が言語習得にも、人生の質にも深く影響することに気づきました。\n\n自身の身体を実験台に、食事・運動・睡眠・マインドセットを徹底的に試し、その知見をこのメディア「wildflow」で発信しています。\n\n青いタオルを首に巻いた姿がトレードマーク。野生×知性がコンセプトです。',
  twitter_url: 'https://twitter.com/',
  xhs_url: 'https://xhslink.com/m/4cEpE8uM5oz',
  lemon8_url: 'https://s.lemon8-app.com/s/GgbxwycvTj',
};

export async function fetchProfileSettings(): Promise<ProfileSettings> {
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'profile')
    .single();
  return data ? { ...defaultProfileSettings, ...(data.value as Partial<ProfileSettings>) } : defaultProfileSettings;
}

export async function saveProfileSettings(profile: ProfileSettings): Promise<void> {
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key: 'profile', value: profile, updated_at: new Date().toISOString() });
  if (error) throw error;
}
