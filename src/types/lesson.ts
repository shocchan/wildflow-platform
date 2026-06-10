export type LessonType = 'strength' | 'endurance' | 'speed' | 'flexibility' | 'coordination';
export type LessonStatus = 'draft' | 'published' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'cancelled';

export interface Lesson {
  id: string;
  title: string;
  lesson_type: LessonType;
  description: string | null;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  capacity: number;
  price: number;
  instructor: string;
  status: LessonStatus;
  payment_deadline: string | null;
  paypay_id: string | null;
  created_at: string;
}

export interface LessonEntry {
  id: string;
  lesson_id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  payment_status: PaymentStatus;
  created_at: string;
}

export const LESSON_TYPE_MAP: Record<LessonType, {
  label: string;
  emoji: string;
  ability: string;
  color: string;
  move: string;
}> = {
  strength:     { label: '筋力レッスン',   emoji: '💪', ability: '筋力',   color: '#ffd54f', move: 'BEAST' },
  endurance:    { label: '持久力レッスン',  emoji: '💜', ability: '持久力',  color: '#ce93d8', move: 'CRAB FLOW' },
  speed:        { label: '速度レッスン',   emoji: '💚', ability: 'スピード', color: '#69f0ae', move: 'KICKTHROUGH' },
  flexibility:  { label: '柔軟性レッスン',  emoji: '🌸', ability: '柔軟性',  color: '#ff6b9d', move: 'SCORPION' },
  coordination: { label: '調整力レッスン',  emoji: '💙', ability: '調整力',  color: '#4fc3f7', move: 'APE' },
};
