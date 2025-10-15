#!/bin/bash

# This script injects environment variables into config.js at build time
# For Netlify/Vercel deployments

CONFIG_FILE="dist/config.js"

if [ -f "$CONFIG_FILE" ]; then
  echo "Injecting environment variables into config.js..."

  sed -i "s|__VITE_SUPABASE_URL__|${VITE_SUPABASE_URL}|g" "$CONFIG_FILE"
  sed -i "s|__VITE_SUPABASE_ANON_KEY__|${VITE_SUPABASE_ANON_KEY}|g" "$CONFIG_FILE"
  sed -i "s|__VITE_OPENAI_API_KEY__|${VITE_OPENAI_API_KEY}|g" "$CONFIG_FILE"

  echo "Environment variables injected successfully!"
else
  echo "Warning: config.js not found at $CONFIG_FILE"
fi
