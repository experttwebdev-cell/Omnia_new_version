// Environment configuration for HTML test files
// This file is used by standalone HTML files that don't go through the Vite build process
// For production deployments, inject-env.sh will replace these placeholder values
window.ENV = {
  VITE_SUPABASE_URL: '__VITE_SUPABASE_URL__',
  VITE_SUPABASE_ANON_KEY: '__VITE_SUPABASE_ANON_KEY__',
  VITE_OPENAI_API_KEY: '__VITE_OPENAI_API_KEY__',
  DEEPSEEK_API_KEY: '__DEEPSEEK_API_KEY__'
};
