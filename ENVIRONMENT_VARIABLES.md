# 🔐 Environment Variables Configuration Guide

This document details all environment variables used in the SmartEcommerce.ai platform.

## 📋 Environment Variables Overview

### Frontend Variables (Safe for Public Exposure)

These variables are embedded in your frontend build and are protected by Supabase Row Level Security (RLS):

| Variable | Purpose | Where to Set | Required |
|----------|---------|--------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Netlify/Vercel Dashboard | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | Public anonymous key | Netlify/Vercel Dashboard | ✅ Yes |

### Backend Variables (Must Stay Private)

These variables are stored **ONLY** in Supabase Edge Functions secrets and should **NEVER** be added to your hosting platform:

| Variable | Purpose | Where to Set | Required |
|----------|---------|--------------|----------|
| `SUPABASE_SERVICE_ROLE_KEY` | Full database access | Supabase Secrets (auto-configured) | ✅ Yes |
| `OPENAI_API_KEY` | OpenAI API access | Supabase Secrets | ⚠️ Optional |
| `DEEPSEEK_API_KEY` | DeepSeek API access | Supabase Secrets | ⚠️ Optional |

---

## 🎯 Configuration by Platform

### Netlify Configuration

**Location**: Site settings → Environment variables → Add variable

```env
# Add these variables:
VITE_SUPABASE_URL=https://ufdhzgqrubbnornjdvgv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZGh6Z3FydWJibm9ybmpkdmd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MjAwMzksImV4cCI6MjA3NTk5NjAzOX0.Xqfe56k9FU-85RBv9h1cxq1UvLU1tUsg24MAdzCqZms
```

**Important**:
- Select "Same value for all deploy contexts" for both variables
- Do NOT add any other API keys to Netlify

### Vercel Configuration

**Location**: Project Settings → Environment Variables → Add new

```env
# Add these variables:
VITE_SUPABASE_URL=https://ufdhzgqrubbnornjdvgv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZGh6Z3FydWJibm9ybmpkdmd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MjAwMzksImV4cCI6MjA3NTk5NjAzOX0.Xqfe56k9FU-85RBv9h1cxq1UvLU1tUsg24MAdzCqZms
```

**Important**:
- Check "Production", "Preview", and "Development" for both
- Do NOT add any other API keys to Vercel

### Supabase Edge Functions Configuration

**Location**: Supabase Dashboard → Project Settings → Edge Functions → Secrets

Your backend API keys should **already be configured** in Supabase. To verify:

1. Visit: https://app.supabase.com/project/ufdhzgqrubbnornjdvgv/settings/functions
2. Check that these secrets exist:
   - `OPENAI_API_KEY`
   - `DEEPSEEK_API_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY` is automatically available to all Edge Functions

**To add or update secrets via Supabase CLI (if needed):**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref ufdhzgqrubbnornjdvgv

# Set secrets
supabase secrets set OPENAI_API_KEY=sk-your-key-here
supabase secrets set DEEPSEEK_API_KEY=sk-your-key-here

# List secrets (values are hidden)
supabase secrets list
```

---

## 🔍 Variable Details

### VITE_SUPABASE_URL

**Value**: `https://ufdhzgqrubbnornjdvgv.supabase.co`

**Purpose**: Your Supabase project URL for database and auth connections

**Where it's used**:
- Frontend: `src/lib/supabase.ts` - Creates Supabase client
- All frontend API calls to database
- Authentication flows

**Security**: Safe to expose publicly. Access is controlled by RLS policies.

---

### VITE_SUPABASE_ANON_KEY

**Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your anonymous key)

**Purpose**: Public API key for anonymous and authenticated client requests

**Where it's used**:
- Frontend: `src/lib/supabase.ts` - Initializes client
- All database queries from frontend
- User authentication

**Security**:
- Safe to expose in frontend code
- Protected by Row Level Security (RLS) policies
- Cannot access data without proper policies
- Automatically includes user context for auth

**RLS Protection Example**:
```sql
-- Even with anon key, users can only see their own data
CREATE POLICY "Users see own products"
  ON shopify_products FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());
```

---

### SUPABASE_SERVICE_ROLE_KEY

**Value**: Stored securely in Supabase (never expose)

**Purpose**: Backend-only key with full database access, bypassing RLS

**Where it's used**:
- Supabase Edge Functions only
- Administrative operations
- Automated tasks like cron jobs

**Security**:
- ⚠️ **NEVER add to Netlify/Vercel**
- ⚠️ **NEVER commit to git**
- ⚠️ **NEVER expose in frontend**
- Automatically available in Edge Functions as `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`

---

### OPENAI_API_KEY

**Value**: `sk-proj-...` (stored in Supabase secrets)

**Purpose**: Access OpenAI GPT models for AI-powered features

**Where it's used**:
- Edge Function: `enrich-product-with-ai` - Product enrichment
- Edge Function: `generate-blog-article` - Blog content creation
- Edge Function: `generate-seo-opportunities` - SEO suggestions
- Edge Function: `generate-alt-texts` - Image alt text generation
- Edge Function: `ai-chat` - AI chat functionality

**Features powered by this**:
- Product description optimization
- SEO metadata generation
- Blog article creation
- Image alt text generation
- AI chat responses

**Cost**: Based on OpenAI usage (tokens consumed)

**Optional**: System works without this, but AI features won't function

**Security**:
- Stored only in Supabase Edge Functions secrets
- Never exposed to frontend
- Accessed server-side only

---

### DEEPSEEK_API_KEY

**Value**: `sk-...` (stored in Supabase secrets)

**Purpose**: Alternative AI provider for cost-effective processing

**Where it's used**:
- Edge Function: `deepseek-proxy` - Proxy for DeepSeek API
- Edge Function: `enrich-product-with-ai` - Alternative to OpenAI
- Edge Function: `ai-chat` - Cost-effective chat responses

**Features**:
- Lower-cost alternative to OpenAI
- Similar capabilities for text generation
- Good for high-volume operations

**Cost**: Generally cheaper than OpenAI

**Optional**: System works without this, falls back to OpenAI

**Security**:
- Stored only in Supabase Edge Functions secrets
- Never exposed to frontend
- Accessed server-side only

---

## 🛡️ Security Best Practices

### ✅ DO:

1. **Store frontend vars in hosting platform**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. **Store backend vars in Supabase secrets**
   - `OPENAI_API_KEY`
   - `DEEPSEEK_API_KEY`

3. **Use environment-specific values**
   - Development: Use test keys if available
   - Production: Use production keys

4. **Rotate keys periodically**
   - OpenAI keys: Every 90 days
   - DeepSeek keys: Every 90 days
   - Supabase keys: When team member leaves

### ❌ DON'T:

1. **Never commit .env to git**
   ```bash
   # .env is already in .gitignore
   # Double-check:
   git status
   # Should NOT show .env
   ```

2. **Never expose service role key**
   - Not in frontend code
   - Not in Netlify/Vercel
   - Not in git
   - Not in logs or console

3. **Never hardcode API keys**
   ```javascript
   // ❌ WRONG
   const apiKey = 'sk-abc123...';

   // ✅ CORRECT (Edge Function)
   const apiKey = Deno.env.get('OPENAI_API_KEY');

   // ✅ CORRECT (Frontend)
   const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
   ```

4. **Never share keys in public channels**
   - Not in GitHub issues
   - Not in Discord/Slack
   - Not in support tickets
   - Use Supabase support for sensitive issues

---

## 🔄 How Environment Variables Flow

### Development Mode

```
.env file
    ↓
Vite reads and injects (VITE_* prefix)
    ↓
Available as import.meta.env.VITE_*
    ↓
src/lib/supabase.ts wraps in getEnvVar()
    ↓
Used in application
```

### Production Mode

```
Netlify/Vercel Dashboard
    ↓
Set as build environment variables
    ↓
inject-env.sh creates dist/config.js
    ↓
window.ENV object created
    ↓
getEnvVar() reads from window.ENV
    ↓
Used in application
```

### Edge Functions

```
Supabase Dashboard → Secrets
    ↓
Stored encrypted
    ↓
Available via Deno.env.get()
    ↓
Used in Edge Function
    ↓
Never exposed to frontend
```

---

## 🧪 Testing Configuration

### Verify Frontend Variables

```javascript
// Open browser console (F12) and run:
console.log('Supabase URL:', window.ENV?.VITE_SUPABASE_URL);
console.log('Has Anon Key:', !!window.ENV?.VITE_SUPABASE_ANON_KEY);

// Should output:
// Supabase URL: https://ufdhzgqrubbnornjdvgv.supabase.co
// Has Anon Key: true
```

### Verify Supabase Connection

```javascript
// Test database connection
const { data, error } = await supabase
  .from('shopify_products')
  .select('count', { count: 'exact', head: true });

console.log('Product count:', data, 'Error:', error);
// Should show: Product count: 877 Error: null
```

### Verify Edge Functions Secrets

```bash
# List secrets (via Supabase CLI)
supabase secrets list

# Should show:
# OPENAI_API_KEY (value hidden)
# DEEPSEEK_API_KEY (value hidden)
```

### Test Edge Function

```bash
# Test that Edge Function can access secrets
curl https://ufdhzgqrubbnornjdvgv.supabase.co/functions/v1/test-products \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Should return success response
```

---

## 🚨 Troubleshooting

### "Cannot connect to Supabase"

**Symptoms**: Blank page, no data loads

**Check**:
1. Open DevTools → Console
2. Look for error: `supabaseUrl is required` or similar
3. Run: `console.log(window.ENV)`

**Solution**:
- Verify environment variables are set in Netlify/Vercel
- Redeploy after adding variables
- Clear browser cache and refresh

### "Unauthorized" or "Row Level Security" Errors

**Symptoms**: Data doesn't load even with correct connection

**Check**:
1. Verify RLS policies in Supabase Dashboard → Table Editor
2. Check if policy allows anonymous or authenticated access
3. Test direct query in Supabase Dashboard

**Solution**:
- Review RLS policies in migrations
- Ensure anon key has necessary permissions
- Check if user is authenticated when required

### Edge Functions Return 500 Error

**Symptoms**: AI features don't work, errors in console

**Check**:
1. Supabase Dashboard → Edge Functions → Logs
2. Look for "OPENAI_API_KEY is not defined" or similar

**Solution**:
- Add missing secrets to Supabase
- Verify secret names match code expectations
- Redeploy Edge Function after adding secrets

### Build Fails with "Environment variable not found"

**Symptoms**: Build fails in Netlify/Vercel

**Check**:
- Build logs show which variable is missing
- Verify variable name matches exactly (case-sensitive)

**Solution**:
- Add missing variable to platform dashboard
- Use exact name: `VITE_SUPABASE_URL` not `SUPABASE_URL`
- Trigger new build

---

## 📚 Additional Resources

### Official Documentation

- [Supabase Environment Variables](https://supabase.com/docs/guides/functions/secrets)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

### Security Resources

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [OpenAI API Best Practices](https://platform.openai.com/docs/guides/production-best-practices)
- [OWASP API Security](https://owasp.org/www-project-api-security/)

---

## ✅ Configuration Checklist

Use this checklist to verify your environment is properly configured:

**Hosting Platform (Netlify/Vercel):**
- [ ] `VITE_SUPABASE_URL` is set
- [ ] `VITE_SUPABASE_ANON_KEY` is set
- [ ] No other sensitive keys are set
- [ ] Variables apply to all environments

**Supabase Edge Functions:**
- [ ] `OPENAI_API_KEY` secret exists (optional)
- [ ] `DEEPSEEK_API_KEY` secret exists (optional)
- [ ] Can list secrets via CLI or dashboard
- [ ] Edge Functions deploy successfully

**Frontend Verification:**
- [ ] `window.ENV` object exists in browser console
- [ ] Contains correct Supabase URL
- [ ] Contains anon key (partially visible)
- [ ] Supabase client initializes successfully

**Backend Verification:**
- [ ] Edge Functions can read secrets
- [ ] AI features work (if keys provided)
- [ ] No secrets logged or exposed
- [ ] Function logs show no missing variable errors

**Security Verification:**
- [ ] `.env` file is in `.gitignore`
- [ ] No secrets committed to git
- [ ] Service role key never exposed to frontend
- [ ] API keys only in Supabase secrets

---

*Last Updated: October 20, 2025*
*Version: 1.0.0*
