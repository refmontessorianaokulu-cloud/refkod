import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'teacher' | 'parent';
  created_at: string;
  approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
};

export type Child = {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  class_name: string;
  created_at: string;
};

export type MealLog = {
  id: string;
  child_id: string;
  teacher_id: string;
  meal_type: 'breakfast' | 'lunch' | 'snack';
  amount_eaten: 'all' | 'most' | 'some' | 'none';
  notes: string;
  log_date: string;
  created_at: string;
};

export type SleepLog = {
  id: string;
  child_id: string;
  teacher_id: string;
  start_time: string;
  end_time: string;
  notes: string;
  log_date: string;
  created_at: string;
};

export type ParentChild = {
  id: string;
  parent_id: string;
  child_id: string;
  created_at: string;
};

export type TeacherChild = {
  id: string;
  teacher_id: string;
  child_id: string;
  created_at: string;
};

export type DailyReport = {
  id: string;
  teacher_id: string;
  child_id: string;
  report_date: string;
  practical_life: string;
  sensorial: string;
  mathematics: string;
  language: string;
  culture: string;
  general_notes: string;
  mood: string;
  social_interaction: string;
  created_at: string;
};
