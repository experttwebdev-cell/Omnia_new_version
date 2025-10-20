import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const getEnvVar = (key: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY' | 'VITE_OPENAI_API_KEY'): string => {
  // In development mode, always use Vite's import.meta.env first
  const viteValue = import.meta.env[key];

  // Check if we have a valid Vite env var (development mode)
  if (viteValue &&
      viteValue !== '' &&
      viteValue !== 'https://placeholder.supabase.co' &&
      viteValue !== 'placeholder-key') {
    console.log(`✅ Using Vite env var for ${key}`);
    return viteValue.trim();
  }

  // In production builds, try window.ENV (loaded from config.js)
  if (typeof window !== 'undefined' && (window as any).ENV) {
    const runtimeValue = (window as any).ENV[key];
    if (runtimeValue && runtimeValue !== '' && !runtimeValue.includes('__')) {
      console.log(`✅ Using runtime config for ${key}`);
      return runtimeValue.trim();
    }
  }

  console.error(`❌ Environment variable ${key} is not set or invalid`);
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

const isConfigured = supabaseUrl && supabaseAnonKey &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseAnonKey !== 'placeholder-key';

if (!isConfigured) {
  console.error('Supabase Configuration Status:', {
    url: supabaseUrl ? 'Set' : 'Missing',
    urlValue: supabaseUrl || 'Not provided',
    anonKey: supabaseAnonKey ? 'Set' : 'Missing',
    anonKeyPreview: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'Not provided',
    isPlaceholder: supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder-key'
  });
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are properly set in your .env file and restart the development server.');
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export { getEnvVar };
