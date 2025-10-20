# ⚡ Quick Deploy Guide - SmartEcommerce.ai

Get your app live in **under 10 minutes**. Follow these simple steps.

---

## 🎯 What You'll Do

1. Push code to GitHub (2 minutes)
2. Connect to Netlify (3 minutes)
3. Add environment variables (2 minutes)
4. Deploy and verify (3 minutes)

**Total Time: ~10 minutes**

---

## 📋 Before You Start

Make sure you have:
- ✅ A GitHub account
- ✅ Your Supabase credentials (see below)
- ✅ This code ready to deploy

**Your Supabase Credentials:**
```
URL: https://ufdhzgqrubbnornjdvgv.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZGh6Z3FydWJibm9ybmpkdmd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MjAwMzksImV4cCI6MjA3NTk5NjAzOX0.Xqfe56k9FU-85RBv9h1cxq1UvLU1tUsg24MAdzCqZms
```

---

## Step 1: Push to GitHub (2 minutes)

### If You Don't Have a GitHub Repo Yet:

1. **Create a new repository** on GitHub:
   - Go to https://github.com/new
   - Name it: `smartecommerce-ai` (or your choice)
   - Keep it **private** (recommended)
   - Don't initialize with README (you already have one)
   - Click "Create repository"

2. **Push your code**:
   ```bash
   # In your project directory
   git init
   git add .
   git commit -m "Initial commit - ready for deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/smartecommerce-ai.git
   git push -u origin main
   ```

### If You Already Have a Repo:

```bash
git add .
git commit -m "Ready for deployment"
git push
```

✅ **Checkpoint**: Your code should now be on GitHub

---

## Step 2: Connect to Netlify (3 minutes)

1. **Go to Netlify**:
   - Visit: https://app.netlify.com/signup
   - Sign up or log in (use GitHub account for easy connection)

2. **Import your project**:
   - Click "Add new site" → "Import an existing project"
   - Choose "Deploy with GitHub"
   - Authorize Netlify to access your GitHub
   - Select your repository: `smartecommerce-ai`

3. **Configure build settings**:
   - Netlify will auto-detect settings from `netlify.toml`
   - You should see:
     ```
     Build command: npm run build && chmod +x inject-env.sh && ./inject-env.sh
     Publish directory: dist
     ```
   - If not auto-detected, enter these manually

4. **DON'T click Deploy yet** - we need to add environment variables first!

✅ **Checkpoint**: You should be on the "Site settings" page

---

## Step 3: Add Environment Variables (2 minutes)

**Still on Netlify:**

1. **Before deploying**, click "Add environment variables"

2. **Add these two variables**:

   **Variable 1:**
   ```
   Key: VITE_SUPABASE_URL
   Value: https://ufdhzgqrubbnornjdvgv.supabase.co
   ```

   **Variable 2:**
   ```
   Key: VITE_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZGh6Z3FydWJibm9ybmpkdmd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MjAwMzksImV4cCI6MjA3NTk5NjAzOX0.Xqfe56k9FU-85RBv9h1cxq1UvLU1tUsg24MAdzCqZms
   ```

3. **Scope**: Select "Same value for all deploy contexts"

4. **Save** each variable

⚠️ **Important**: Only add these two variables. Do NOT add:
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `DEEPSEEK_API_KEY`

These are already secured in your Supabase Edge Functions.

✅ **Checkpoint**: You should have exactly 2 environment variables set

---

## Step 4: Deploy! (3 minutes)

1. **Start the deployment**:
   - Click "Deploy site" button
   - Netlify will start building your site

2. **Watch the build**:
   - Click on the "Building" status to see logs
   - Should take 2-3 minutes
   - Watch for the green "Published" status

3. **Your site is live!**
   - You'll see a URL like: `https://clever-unicorn-123456.netlify.app`
   - Click it to visit your site

✅ **Checkpoint**: You should see your landing page with pricing tiers

---

## Step 5: Verify Everything Works (2 minutes)

### Test 1: Landing Page
- ✅ Visit your Netlify URL
- ✅ See the pricing page with 3 plans
- ✅ Buttons work and look correct

### Test 2: Sign Up
- ✅ Click "Get Started" on any plan
- ✅ Fill out the sign-up form
- ✅ Submit (check your email for confirmation)

### Test 3: Dashboard
- ✅ Log in with your test account
- ✅ Dashboard loads and shows statistics
- ✅ Product count shows 877 products

### Test 4: Products
- ✅ Click "Products" in the sidebar
- ✅ Products load and display correctly
- ✅ Search and filters work

### Quick Debug Test:
```javascript
// Open browser console (F12) and run:
console.log(window.ENV);

// Should output:
// {
//   VITE_SUPABASE_URL: "https://ufdhzgqrubbnornjdvgv.supabase.co",
//   VITE_SUPABASE_ANON_KEY: "eyJhbGci..."
// }
```

✅ **All tests pass?** You're live!

---

## 🎉 Success! What's Next?

### Immediate Next Steps:

1. **Save your production URL**:
   ```
   Production URL: https://YOUR-SITE.netlify.app
   ```

2. **Update your README** with the production URL

3. **Share with team** (if applicable)

### Optional Improvements:

1. **Custom Domain** (5 minutes):
   - Netlify Dashboard → Domain settings → Add custom domain
   - Update DNS records as instructed
   - Get free SSL automatically

2. **Enable Analytics**:
   - Netlify Dashboard → Analytics → Enable
   - Track visitors, page views, etc.

3. **Set Up Monitoring**:
   - Netlify Dashboard → Notifications
   - Get alerts for deploy failures

---

## 🚨 Troubleshooting

### Build Failed?

**Check the build log for errors:**

1. Click on the failed deploy
2. Look for the red error message
3. Common issues:

**"Module not found"**:
```bash
# Solution: Clear cache and retry
Netlify Dashboard → Deploys → Options → Clear cache and retry
```

**"Command not found: inject-env.sh"**:
```bash
# Solution: The script should be in your repo
# Verify it exists:
ls inject-env.sh
# If missing, it's in your project root
```

### Blank Page After Deploy?

**Check environment variables:**

1. Open your site
2. Press F12 (open console)
3. Run: `console.log(window.ENV)`
4. If undefined or wrong values:
   - Go to Netlify → Site settings → Environment variables
   - Verify both variables are set correctly
   - Trigger new deploy

### Products Not Loading?

**Test Supabase connection:**

```javascript
// In browser console (F12):
const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
const supabase = createClient(
  window.ENV.VITE_SUPABASE_URL,
  window.ENV.VITE_SUPABASE_ANON_KEY
);
const { data, error } = await supabase
  .from('shopify_products')
  .select('count', { count: 'exact', head: true });
console.log('Product count:', data, 'Error:', error);
```

Expected output: `Product count: 877 Error: null`

If error is not null:
- Check your Supabase project is active
- Verify RLS policies allow anonymous reads

---

## 📞 Need Help?

### Quick Checks:

1. ✅ Environment variables set correctly in Netlify?
2. ✅ Build completed successfully (green checkmark)?
3. ✅ Can access the site URL?
4. ✅ Browser console shows no errors (F12)?

### Resources:

- **Full Documentation**: See `DEPLOYMENT_GUIDE.md`
- **Environment Variables**: See `ENVIRONMENT_VARIABLES.md`
- **Netlify Support**: https://answers.netlify.com
- **Supabase Dashboard**: https://app.supabase.com/project/ufdhzgqrubbnornjdvgv

### Common Issues Checklist:

- [ ] Both environment variables added to Netlify
- [ ] Values copied correctly (no extra spaces)
- [ ] Build completed successfully
- [ ] Can access Netlify URL
- [ ] Landing page loads
- [ ] `window.ENV` defined in console
- [ ] Supabase connection works

---

## 🔄 Redeploying (After Code Changes)

### Automatic Deploys:

Once set up, Netlify automatically redeploys when you push to GitHub:

```bash
# Make your changes
git add .
git commit -m "Your changes"
git push

# Netlify automatically starts building
# Check status at: https://app.netlify.com
```

### Manual Redeploy:

1. Go to Netlify Dashboard
2. Click "Trigger deploy" → "Deploy site"

---

## ✅ Deployment Checklist

Quick checklist for your deployment:

**Pre-Deploy:**
- [x] Code is ready and tested locally
- [x] Production build tested (`npm run build`)
- [ ] Code pushed to GitHub
- [ ] GitHub repo is accessible

**Netlify Setup:**
- [ ] Netlify account created
- [ ] Repository connected
- [ ] Build settings verified
- [ ] Environment variables added (2 variables)

**Post-Deploy:**
- [ ] Build succeeded (green checkmark)
- [ ] Site URL accessible
- [ ] Landing page loads correctly
- [ ] Can create account and sign up
- [ ] Dashboard displays after login
- [ ] Products load (877 products)
- [ ] No console errors

**Optional:**
- [ ] Custom domain added
- [ ] DNS configured
- [ ] SSL verified (auto)
- [ ] Analytics enabled
- [ ] Monitoring set up

---

## 🎊 You're Live!

Congratulations! Your SmartEcommerce.ai platform is now live and ready to serve Shopify merchants.

**Share Your Success:**

```
🚀 Just deployed SmartEcommerce.ai!

✨ Features:
- AI-powered SEO optimization
- 877 products ready
- Google Shopping integration
- Blog content generation
- Smart product enrichment

🔗 Live at: https://YOUR-SITE.netlify.app

Built with: React, Supabase, OpenAI
Deployed in: < 10 minutes
```

**Next Steps:**
1. Test all features thoroughly
2. Invite beta users
3. Monitor usage and performance
4. Plan feature improvements
5. Scale as you grow!

---

*Deployment completed in under 10 minutes!*
*Platform: Netlify*
*Status: Production Ready ✅*
*Date: October 20, 2025*
