#!/bin/bash

# This script injects environment variables into config.js at build time
# For Netlify/Vercel deployments

CONFIG_FILE="dist/config.js"

echo "🔧 Injecting environment variables into config.js..."

# Check if environment variables are set
if [ -z "$VITE_SUPABASE_URL" ]; then
  echo "⚠️  Warning: VITE_SUPABASE_URL not set"
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo "⚠️  Warning: VITE_SUPABASE_ANON_KEY not set"
fi

# Create config.js with real values
cat > "$CONFIG_FILE" << EOF
// Environment configuration injected at build time
window.ENV = {
  VITE_SUPABASE_URL: '${VITE_SUPABASE_URL}',
  VITE_SUPABASE_ANON_KEY: '${VITE_SUPABASE_ANON_KEY}',
  VITE_OPENAI_API_KEY: '${VITE_OPENAI_API_KEY}',
  DEEPSEEK_API_KEY: '${DEEPSEEK_API_KEY}'
};
EOF

if [ -f "$CONFIG_FILE" ]; then
  echo "✅ Environment variables injected successfully!"
  echo ""
  echo "📄 Config file content:"
  cat "$CONFIG_FILE"
  echo ""
else
  echo "❌ Error: Failed to create config.js at $CONFIG_FILE"
  exit 1
fi
