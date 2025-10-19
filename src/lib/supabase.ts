import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const getEnvVar = (key: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY' | 'VITE_OPENAI_API_KEY'): string => {
  // Try runtime config first (from window.ENV loaded by config-local.js)
  if (typeof window !== 'undefined' && (window as any).ENV) {
    const runtimeValue = (window as any).ENV[key];
    if (runtimeValue && runtimeValue !== '' && !runtimeValue.includes('__')) {
      console.log(`✅ Using runtime config for ${key}`);
      return runtimeValue.trim();
    }
  }

  // Fall back to build-time env vars
  const value = import.meta.env[key];

  if (!value || value === '') {
    console.error(`Environment variable ${key} is not set`);
    return '';
  }

  if (key === 'VITE_SUPABASE_URL' && value === 'https://placeholder.supabase.co') {
    console.error(`${key} is still set to placeholder value`);
    return '';
  }

  if (key === 'VITE_SUPABASE_ANON_KEY' && value === 'placeholder-key') {
    console.error(`${key} is still set to placeholder value`);
    return '';
  }

  return value.trim();
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
