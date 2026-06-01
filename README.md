# Ignite Legacy Quiz

Creator archetype quiz with analytics dashboard and GHL integration.

## Deploy

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "ignite legacy quiz v1"
# create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/ignite-legacy-quiz.git
git push -u origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) → Add New Project → Import your GitHub repo
2. No build settings needed — hit Deploy
3. Optionally add a custom domain (e.g. `quiz.laurenmadden.com`) in Vercel's Domains tab

### 3. Add Vercel KV (analytics storage)
1. In your Vercel project → Storage tab → Create KV Database
2. Vercel automatically adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` to your env vars

### 4. Set Environment Variables
In Vercel → Project Settings → Environment Variables, add:

| Variable | Value |
|----------|-------|
| `GHL_WEBHOOK_URL` | Your GHL private integration webhook URL |
| `ADMIN_PASSWORD` | A password for your /admin dashboard |

### 5. Find your GHL Webhook URL
1. In GHL → Settings → Integrations → Private Integrations
2. Create a new integration (or use existing)
3. Add a Webhook trigger — copy the URL
4. Paste it as `GHL_WEBHOOK_URL` in Vercel

## URLs
- Quiz: `https://your-domain.vercel.app/`
- Admin: `https://your-domain.vercel.app/admin`

## What gets tracked
- Quiz starts
- Every question answer (with archetype vote)
- Email captures (also sent to GHL)
- Archetype result views
- CTA button clicks
- Drop-off by question step
