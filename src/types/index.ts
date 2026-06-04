export interface Post {
  id: string;
  title: string;
  body: string;
  thumbnail_url: string | null;
  youtube_url: string | null;
  external_url: string | null;
  tags: string[];
  status: 'published' | 'draft';
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
