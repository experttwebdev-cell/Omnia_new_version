#!/bin/bash

# This script injects environment variables into config.js at build time
# For Netlify/Vercel deployments

CONFIG_FILE="dist/config.js"

echo "🔧 Injecting environment variables into config.js..."

# Check if dist directory exists
if [ ! -d "dist" ]; then
  echo "❌ Error: dist directory not found. Run 'npm run build' first."
  exit 1
fi

# Check if environment variables are set
if [ -z "$VITE_SUPABASE_URL" ]; then
  echo "⚠️  Warning: VITE_SUPABASE_URL not set, will use placeholder"
  VITE_SUPABASE_URL="__VITE_SUPABASE_URL__"
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo "⚠️  Warning: VITE_SUPABASE_ANON_KEY not set, will use placeholder"
  VITE_SUPABASE_ANON_KEY="__VITE_SUPABASE_ANON_KEY__"
fi

if [ -z "$VITE_OPENAI_API_KEY" ]; then
  VITE_OPENAI_API_KEY="__VITE_OPENAI_API_KEY__"
fi

if [ -z "$DEEPSEEK_API_KEY" ]; then
  DEEPSEEK_API_KEY="__DEEPSEEK_API_KEY__"
fi

# Create config.js with real values or placeholders
cat > "$CONFIG_FILE" << EOF
// Environment configuration injected at build time
// For production deployments on Netlify/Vercel
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
  echo "📄 Config file location: $CONFIG_FILE"
  echo "🔍 First few lines:"
  head -n 5 "$CONFIG_FILE"
  echo ""

  # Check if real values were injected
  if grep -q "__VITE_SUPABASE_URL__" "$CONFIG_FILE"; then
    echo "⚠️  Note: Some placeholders remain. Make sure to set environment variables in your hosting platform."
  else
    echo "✅ Real environment values detected!"
  fi
else
  echo "❌ Error: Failed to create config.js at $CONFIG_FILE"
  exit 1
fi
