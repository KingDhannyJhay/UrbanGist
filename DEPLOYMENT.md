# UrbanGist — Complete Deployment Guide
## From Zero to Live on urbangist.com.ng

**Difficulty:** Beginner-friendly  
**Time:** ~2 hours for first deploy  
**What you need:** A computer, internet connection, and a Nigerian bank card (for Paystack)

---

## TABLE OF CONTENTS

1. [What You're Building](#1-what-youre-building)
2. [Accounts to Create](#2-accounts-to-create)
3. [Set Up Supabase (Your Database)](#3-set-up-supabase)
4. [Set Up Paystack (Payments)](#4-set-up-paystack)
5. [Get the Code Ready](#5-get-the-code-ready)
6. [Configure Environment Variables](#6-configure-environment-variables)
7. [Deploy to Vercel](#7-deploy-to-vercel)
8. [Connect Your Domain](#8-connect-your-domain)
9. [First Admin Setup](#9-first-admin-setup)
10. [Configure Paystack Webhook](#10-configure-paystack-webhook)
11. [Test Everything](#11-test-everything)
12. [Going Live Checklist](#12-going-live-checklist)
13. [Maintenance & Monitoring](#13-maintenance--monitoring)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. WHAT YOU'RE BUILDING

UrbanGist is a **production-grade music platform** with:

```
urbangist.com.ng/           → Discovery homepage
/trending                   → Trending tracks engine
/track/[slug]               → Individual track pages (SEO-indexed)
/artist/[slug]              → Artist profiles
/upload                     → Track upload (protected)
/boost                      → Paid boost system (Paystack)
/dashboard                  → Artist analytics studio
/admin                      → Admin approval panel
/learn                      → SEO blog + artist education
/search                     → Track & artist search
/about, /privacy, /terms    → Legal pages
/contact, /support          → Contact + donation
```

**Tech stack:**
- **Frontend:** Next.js 14 (App Router, SSR + ISR)
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **Payments:** Paystack
- **Hosting:** Vercel
- **Domain:** Your existing urbangist.com.ng

---

## 2. ACCOUNTS TO CREATE

Create these free accounts before starting:

### 2a. GitHub (Free)
→ https://github.com/signup
- Used to store your code
- Vercel deploys directly from GitHub

### 2b. Supabase (Free tier)
→ https://supabase.com
- Click **Start your project**
- Sign up with GitHub (easier)
- Free tier: 500MB database, 1GB storage, 50,000 monthly active users

### 2c. Vercel (Free tier)
→ https://vercel.com/signup
- Sign up with GitHub
- Free tier: unlimited deployments for personal projects

### 2d. Paystack (Free to sign up)
→ https://paystack.com
- Click **Create a free account**
- You'll need a Nigerian bank account and BVN to activate live payments
- For testing, you can use test mode immediately without verification

---

## 3. SET UP SUPABASE

### Step 1: Create a new project

1. Log into https://supabase.com
2. Click **New Project**
3. Fill in:
   - **Name:** urbangist
   - **Database Password:** Create a strong password (save it!)
   - **Region:** Choose **US East** or **EU West** (closest to Nigeria)
4. Click **Create new project**
5. Wait ~2 minutes for it to provision

### Step 2: Get your API keys

1. In your Supabase project, click **Project Settings** (gear icon, left sidebar)
2. Click **API**
3. Copy and save these three values:
   ```
   Project URL:        https://xxxxxxxxxxxx.supabase.co
   anon public key:    eyJhbGci... (long string)
   service_role key:   eyJhbGci... (different long string — KEEP SECRET)
   ```

⚠️ **The service_role key is like a master password. Never put it in your frontend code or commit it to GitHub.**

### Step 3: Run the main database schema

1. In Supabase, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase/schema.sql` from the UrbanGist project
4. Copy the entire contents and paste into the SQL editor
5. Click **Run** (or press Ctrl+Enter)
6. You should see: `Success. No rows returned`

### Step 4: Run the supplementary SQL

1. Click **New query** again
2. Open `supabase/supplementary.sql`
3. Copy and paste all contents
4. Click **Run**
5. You should see success messages

### Step 5: Create Storage Buckets

The supplementary SQL tries to create buckets, but you should verify them manually:

1. Click **Storage** in the left sidebar
2. You should see three buckets:
   - `track-covers` (Public: ✓)
   - `track-audio` (Public: ✓)
   - `article-images` (Public: ✓)

If any are missing, create them manually:
1. Click **New bucket**
2. Enter the name (e.g. `track-covers`)
3. Toggle **Public bucket** ON
4. Click **Save**

### Step 6: Configure Authentication

1. Click **Authentication** → **Providers**
2. Make sure **Email** is enabled (it is by default)
3. Click **Authentication** → **Settings**
4. Set **Site URL** to: `https://urbangist.com.ng`
5. Add to **Redirect URLs**:
   ```
   https://urbangist.com.ng/auth/callback
   https://urbangist.com.ng/**
   ```
6. Click **Save**

---

## 4. SET UP PAYSTACK

### Step 1: Get your API keys

1. Log into https://dashboard.paystack.com
2. Click **Settings** → **API Keys & Webhooks**
3. You'll see two sets of keys:
   - **Test keys** — use these for development (no real money)
   - **Live keys** — use these for production (real payments)
4. Copy your **Public Key** and **Secret Key** for both environments

```
Test Public Key:   pk_test_xxxxxxxxxxxxxxxxxx
Test Secret Key:   sk_test_xxxxxxxxxxxxxxxxxx
Live Public Key:   pk_live_xxxxxxxxxxxxxxxxxx
Live Secret Key:   sk_live_xxxxxxxxxxxxxxxxxx
```

⚠️ **Secret keys go only in your Vercel environment variables — never in code.**

### Step 2: Enable Paystack for Nigerian payments

1. Go to **Settings** → **Business Settings**
2. Complete your business profile
3. Upload required documents (CAC for business, or BVN for personal)
4. This enables live payments — test mode works without this

---

## 5. GET THE CODE READY

### Option A: Upload to GitHub (Recommended)

1. Create a new repository on GitHub:
   - Go to https://github.com/new
   - Name: `urbangist`
   - Set to **Private** (your code is valuable)
   - Click **Create repository**

2. On your computer, open Terminal/Command Prompt in the urbangist folder:

```bash
# Initialize git
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial UrbanGist platform"

# Connect to your GitHub repo (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/urbangist.git

# Push code to GitHub
git branch -M main
git push -u origin main
```

3. Go to https://github.com/YOUR_USERNAME/urbangist — you should see all your files

### Option B: Upload zip to Vercel directly
- Vercel also accepts zip file uploads at https://vercel.com/new

---

## 6. CONFIGURE ENVIRONMENT VARIABLES

Before deploying, understand what each variable does:

```bash
# ── SUPABASE ─────────────────────────────────────────────────────────
# Your Supabase project URL (from Step 3.2)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co

# Supabase anon key — safe to expose in frontend
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase service role key — SERVER ONLY, gives admin access
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ── PAYSTACK ─────────────────────────────────────────────────────────
# Public key — safe to expose (used in browser for checkout)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxx

# Secret key — SERVER ONLY, never expose
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxx

# ── YOUR SITE ────────────────────────────────────────────────────────
NEXT_PUBLIC_SITE_URL=https://urbangist.com.ng

# ── SECURITY SECRETS ─────────────────────────────────────────────────
# Used to verify webhook calls and secure the /api/revalidate endpoint
# Generate a random string: openssl rand -hex 32
WEBHOOK_SECRET=your-random-64-character-hex-string-here

# Used by Vercel Cron to authenticate the /api/cron/recalc endpoint
# Generate: openssl rand -hex 32
CRON_SECRET=another-random-64-character-hex-string-here
```

**How to generate secure random secrets (on Mac/Linux):**
```bash
openssl rand -hex 32
```

**On Windows (PowerShell):**
```powershell
[System.Web.Security.Membership]::GeneratePassword(64, 10)
```

**Or use an online generator:** https://randomkeygen.com (use "CodeIgniter Encryption Keys")

---

## 7. DEPLOY TO VERCEL

### Step 1: Import your project

1. Go to https://vercel.com/new
2. Click **Import Git Repository**
3. Select your `urbangist` repository
4. Vercel will detect it's a Next.js project automatically

### Step 2: Add environment variables

On the configuration screen (before clicking Deploy):

1. Scroll to **Environment Variables**
2. Add each variable from Section 6 above:
   - Click **Add** for each one
   - Type the **Name** (e.g. `NEXT_PUBLIC_SUPABASE_URL`)
   - Type the **Value** (your actual URL)
   - Set **Environments** to: **Production, Preview, Development**
3. Add all 8 variables

### Step 3: Deploy

1. Leave all other settings as default
2. Click **Deploy**
3. Wait 3–5 minutes for the first build
4. You'll get a URL like: `urbangist-xxxx.vercel.app`

### Step 4: Verify the deployment

Visit your Vercel URL. You should see the UrbanGist homepage. If you see errors, check Section 14.

---

## 8. CONNECT YOUR DOMAIN

### Step 1: Add domain to Vercel

1. In your Vercel project, click **Settings** → **Domains**
2. Type `urbangist.com.ng` and click **Add**
3. Also add `www.urbangist.com.ng`
4. Vercel will show you DNS records to add

### Step 2: Update DNS records at your registrar

Log into wherever you bought `urbangist.com.ng` (e.g. Qservers, Whogohost, GoDaddy, etc.)

Add these DNS records:

**For the root domain (urbangist.com.ng):**
```
Type:  A
Name:  @ (or leave blank)
Value: 76.76.19.61
```

**For www:**
```
Type:  CNAME
Name:  www
Value: cname.vercel-dns.com
```

### Step 3: Wait for DNS propagation

DNS changes take 5 minutes to 48 hours to propagate. You can check status at:
https://dnschecker.org/#A/urbangist.com.ng

### Step 4: Update Supabase Site URL

Once your domain is connected:
1. Go to Supabase → Authentication → Settings
2. Update **Site URL** from `urbangist-xxxx.vercel.app` to `https://urbangist.com.ng`
3. Save

### Step 5: Update NEXT_PUBLIC_SITE_URL in Vercel

1. Vercel → Settings → Environment Variables
2. Edit `NEXT_PUBLIC_SITE_URL`
3. Change to `https://urbangist.com.ng`
4. Click **Save**
5. Go to **Deployments** → click the three dots on latest deployment → **Redeploy**

---

## 9. FIRST ADMIN SETUP

### Step 1: Create your account

1. Go to `https://urbangist.com.ng/auth/signup`
2. Sign up with your email
3. Check your email for a confirmation link
4. Click the confirmation link

### Step 2: Make yourself admin

1. Go to Supabase → SQL Editor → New query
2. Run this query (replace `your-username` with the username Supabase assigned you):

```sql
-- First, find your user ID
SELECT id, username, role FROM profiles ORDER BY created_at LIMIT 10;
```

3. Copy your `id` from the results
4. Run this to make yourself admin:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'paste-your-user-id-here';
```

5. Verify it worked:
```sql
SELECT username, role FROM profiles WHERE role = 'admin';
```

### Step 3: Access the admin panel

1. Log out and log back in (to refresh your session)
2. Go to `https://urbangist.com.ng/admin`
3. You should see the Admin Panel

---

## 10. CONFIGURE PAYSTACK WEBHOOK

This is critical — without this, Boost payments won't activate.

### Step 1: Get your webhook secret

Your `WEBHOOK_SECRET` environment variable from Step 6 is what Paystack will use to sign requests.

Actually — Paystack uses **its own secret key** for webhook signing. The verification in the code uses `PAYSTACK_SECRET_KEY` (not WEBHOOK_SECRET). This is already configured.

### Step 2: Add webhook URL in Paystack

1. Go to https://dashboard.paystack.com
2. Click **Settings** → **API Keys & Webhooks**
3. Scroll to **Webhook URL**
4. Enter: `https://urbangist.com.ng/api/webhooks/paystack`
5. Click **Update**

### Step 3: Test the webhook

1. Go to **Settings** → **API Keys** → scroll to the **Test** section
2. Use test card: `4084084084084081`, any future expiry, any CVV
3. Complete a test Boost purchase
4. Check Supabase → Table Editor → `promotions` — status should change to `active`

---

## 11. TEST EVERYTHING

Work through this checklist in order:

### 11a. Homepage
- [ ] Visit `https://urbangist.com.ng` — loads without errors
- [ ] Logo appears in navigation
- [ ] Hero section renders
- [ ] Discovery feed shows (empty is fine at first)

### 11b. Authentication
- [ ] Sign up at `/auth/signup` — receive confirmation email
- [ ] Confirm email — redirected to dashboard
- [ ] Sign out, then sign in at `/auth/login`
- [ ] Try visiting `/dashboard` while logged out — should redirect to `/auth/login`
- [ ] Try visiting `/admin` as non-admin — should redirect to homepage

### 11c. Upload flow
- [ ] Go to `/upload` while logged in
- [ ] Complete Step 1 (track info)
- [ ] Upload a test cover image (any JPG, min 800×800)
- [ ] Upload a test audio file (any MP3)
- [ ] Submit — should show success screen
- [ ] Check Supabase → `tracks` table — track should be there with `status = 'pending'`

### 11d. Admin approval
- [ ] Go to `/admin` (as admin user)
- [ ] See the pending track in the queue
- [ ] Click **Approve** — track should disappear from pending
- [ ] Check Supabase → `tracks` — status should be `live`
- [ ] Visit homepage — track should appear in discovery feed

### 11e. Track page
- [ ] Visit `/track/[your-track-slug]` — should load with audio player
- [ ] Play the track — audio should stream
- [ ] Check QR code appears
- [ ] Test share buttons

### 11f. Boost system
- [ ] Go to `/boost`
- [ ] Select your track and a plan
- [ ] Click Pay
- [ ] Paystack modal should open (use test card: 4084 0840 8408 4081)
- [ ] After payment — check Supabase promotions table shows `active`
- [ ] Track card should show ⚡ Boosted badge

### 11g. Learn/Blog
- [ ] Go to `/admin` → Write Post tab
- [ ] Write an article and publish it
- [ ] Visit `/learn` — article should appear
- [ ] Visit the article URL — full content should render
- [ ] Check SEO: View source and look for `<title>` and `<meta name="description">`

### 11h. SEO check
- [ ] Visit `https://urbangist.com.ng/sitemap.xml` — should list your track and article URLs
- [ ] Visit `https://urbangist.com.ng/robots.txt` — should show Allow: /

---

## 12. GOING LIVE CHECKLIST

Before announcing UrbanGist to the world:

### Paystack
- [ ] Complete business verification (for live payments)
- [ ] Switch from test keys to live keys in Vercel environment variables
- [ ] Redeploy after changing keys

### Content
- [ ] Upload at least 10 real tracks (approve them)
- [ ] Write at least 3 articles on `/learn`
- [ ] Fill out the About page content (if customising)

### SEO
- [ ] Submit sitemap to Google Search Console:
  1. Go to https://search.google.com/search-console
  2. Add property → Domain → `urbangist.com.ng`
  3. Verify ownership via DNS TXT record
  4. Go to Sitemaps → Submit `https://urbangist.com.ng/sitemap.xml`
- [ ] Submit to Bing Webmaster Tools: https://www.bing.com/webmasters

### Analytics (optional but recommended)
- [ ] Set up Vercel Analytics (free in Vercel dashboard → Analytics tab)
- [ ] OR install Google Analytics 4 (add GA4 script to `app/layout.tsx`)

### Security final check
- [ ] Confirm no keys with `NEXT_PUBLIC_` prefix are secret (only anon key and public Paystack key should be public)
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is NOT in any frontend code
- [ ] Test that `/admin` redirects non-admins correctly

---

## 13. MAINTENANCE & MONITORING

### Daily
- Check the Admin Panel `/admin` for pending track approvals
- Approve or reject within 24 hours (as promised to artists)

### Weekly
- Review Vercel Analytics for traffic patterns
- Check Supabase database size (Storage → Usage in dashboard)
- Review any error logs in Vercel → Functions tab

### Monthly
- Check Supabase free tier limits (won't exceed for first few months)
- Review Paystack dashboard for boost revenue
- Update the /learn blog with at least 2 new articles (for SEO growth)

### Updating the codebase

When you make code changes:
```bash
# Make your changes
git add .
git commit -m "Description of what you changed"
git push origin main
```
Vercel automatically redeploys within 2 minutes.

### Monitoring score recalculation

The Vercel Cron job at `/api/cron/recalc` runs every 30 minutes. To verify it's working:
1. Go to Vercel dashboard → your project → **Functions**
2. Look for logs from `/api/cron/recalc`
3. Should show `"recalc complete: X updated"`

---

## 14. TROUBLESHOOTING

### "Build failed" on Vercel

**Check:** Vercel → Deployments → click the failed deployment → view build logs

**Common causes:**
```
TypeScript error          → Fix the type error shown in logs
Missing env variable      → Add the missing variable in Vercel settings
Module not found          → Run `npm install` locally and push again
```

### Homepage loads but shows blank discovery feed

**Cause:** No approved tracks yet.
**Fix:** Upload a track and approve it as admin.

### "Failed to upload" on the upload page

**Check 1:** Is the file under 50MB (audio) / 5MB (cover)?  
**Check 2:** Go to Supabase → Storage → check that `track-covers` and `track-audio` buckets exist  
**Check 3:** Go to Supabase → Storage → Policies — confirm the upload policies are set

### Login doesn't work / redirects loop

**Check 1:** Go to Supabase → Authentication → Settings  
- Is Site URL correct? Should be `https://urbangist.com.ng`  
- Are Redirect URLs configured?  

**Check 2:** Check your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct in Vercel

### Paystack boost payment succeeds but boost doesn't activate

**Check 1:** Is the webhook URL set in Paystack dashboard?  
**Fix:** Go to Paystack → Settings → Webhooks → set to `https://urbangist.com.ng/api/webhooks/paystack`

**Check 2:** Is `PAYSTACK_SECRET_KEY` correct in Vercel?  
The webhook signature verification uses this key.

**Check 3:** Check Vercel → Functions → `/api/webhooks/paystack` for error logs

### Admin panel shows "Forbidden" even for admin user

**Fix:** Run this in Supabase SQL Editor:
```sql
SELECT id, username, role FROM profiles WHERE id = auth.uid();
-- If role shows 'artist' instead of 'admin':
UPDATE profiles SET role = 'admin' WHERE username = 'your-username';
```
Then sign out and sign back in.

### Tracks not showing in sitemap

**Check:** Tracks must have `status = 'live'` to appear in sitemap.  
**Fix:** Approve tracks through the admin panel.

### Score not updating after plays

**Check:** Is the Vercel Cron running?  
**Manual trigger:**
```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://urbangist.com.ng/api/cron/recalc
```

### "Too many requests" errors

Your rate limiter is working correctly. If you're hitting it during development:
- The limits reset every 60 seconds
- `upload` rate limit resets every 10 minutes
- In development, you can temporarily increase limits in `lib/rate-limit.ts`

---

## ENVIRONMENT VARIABLES QUICK REFERENCE

Copy this template and fill in your values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_SERVICE_ROLE_KEY

# Paystack (use test keys during development)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY
PAYSTACK_SECRET_KEY=sk_test_YOUR_SECRET_KEY

# Site
NEXT_PUBLIC_SITE_URL=https://urbangist.com.ng

# Security (generate with: openssl rand -hex 32)
WEBHOOK_SECRET=generate_a_random_64_char_hex_string
CRON_SECRET=generate_another_random_64_char_hex_string
```

---

## SUPPORT

If you get stuck:
- UrbanGist contact: contact@urbangist.com.ng
- Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs
- Vercel docs: https://vercel.com/docs
- Paystack docs: https://paystack.com/docs

---

*UrbanGist Deployment Guide v1.0 — Built for urban.com.ng*
