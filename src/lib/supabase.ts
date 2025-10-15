import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

declare global {
  interface Window {
    ENV_CONFIG?: {
      VITE_SUPABASE_URL: string;
      VITE_SUPABASE_ANON_KEY: string;
      VITE_OPENAI_API_KEY: string;
    };
  }
}

// Try runtime config first, then fall back to build-time env vars
const getEnvVar = (key: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY' | 'VITE_OPENAI_API_KEY'): string | undefined => {
  if (typeof window !== 'undefined' && window.ENV_CONFIG) {
    const value = window.ENV_CONFIG[key];
    if (value && !value.startsWith('__')) {
      return value;
    }
  }
  return import.meta.env[key];
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your hosting platform.');
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export { getEnvVar };
