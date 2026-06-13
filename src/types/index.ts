export interface Post {
  id: string;
  title: string;
  body: string;
  thumbnail_url: string | null;
  youtube_url: string | null;
  external_url: string | null;
  tags: string[];
  status: 'published' | 'draft';
  content_type?: 'html' | 'markdown';
  created_at: string;
}

export interface QuizResult {
  id: string;
  animal_type: AnimalType;
  created_at: string;
}

export type AnimalType = 'lion' | 'cheetah' | 'monkey' | 'sloth';

export interface AnimalProfile {
  type: AnimalType;
  name: string;
  emoji: string;
  title: string;
  description: string;
  traits: string[];
  advice: string;
  color: string;
}

export interface RecoveryPartner {
  id: string;
  name: string;
  category: string;
  ability_tag: string | null;
  image_url: string;
  station_info: string;
  address: string;
  description: string;
  booking_url: string;
  display_order: number;
  is_published: boolean;
}
