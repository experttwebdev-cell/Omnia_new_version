#!/bin/bash

# This script injects environment variables into config.js at build time
# For Netlify/Vercel deployments

CONFIG_FILE="dist/config.js"

if [ -f "$CONFIG_FILE" ]; then
  echo "Injecting environment variables into config.js..."

  # Replace the entire window.ENV object with real values
  cat > "$CONFIG_FILE" << EOF
// Environment configuration injected at build time
window.ENV = {
  VITE_SUPABASE_URL: '${VITE_SUPABASE_URL}',
  VITE_SUPABASE_ANON_KEY: '${VITE_SUPABASE_ANON_KEY}',
  VITE_OPENAI_API_KEY: '${VITE_OPENAI_API_KEY}'
};
EOF

  echo "Environment variables injected successfully!"
else
  echo "Warning: config.js not found at $CONFIG_FILE"
fi
