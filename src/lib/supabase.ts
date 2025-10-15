import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const getEnvVar = (key: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY' | 'VITE_OPENAI_API_KEY'): string => {
  const value = import.meta.env[key];

  if (!value) {
    console.error(`Missing environment variable: ${key}`);
    return '';
  }

  return value;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Critical: Supabase credentials are missing. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your hosting platform environment variables.');
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export { getEnvVar };
