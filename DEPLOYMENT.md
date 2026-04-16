# 🚀 Deployment Guide - Hostinger

## Checklist Before Deploy

### 1. **GitHub Setup** ✅
- [ ] Deploy branch created and pushed to GitHub
- [ ] Branch protection rules added to `deploy` branch
- [ ] GitHub repository connected to Hostinger

### 2. **Database** ✅
- [ ] PostgreSQL database created on Hostinger
- [ ] Database username and password secured
- [ ] Database URL in format: `postgresql://user:pass@host:port/db`
- [ ] Test connection locally with DATABASE_URL

### 3. **Environment Variables** ✅
Set these in **Hostinger Control Panel → Environment Variables**:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
GEMINI_API_KEY=your_key
VITE_GEMINI_API_KEY=your_key
ALLOWED_ORIGINS=https://yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=CreditGenAI
SMTP_FROM_EMAIL=your-email@gmail.com
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+...
```

### 4. **Build Configuration** ✅
Set in **Hostinger Git/Deploy Settings**:
- **Deploy Branch:** `deploy`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Node Version:** 18+ (verify Hostinger supports)

### 5. **External Services** ✅
- [ ] Google Gemini API key created and tested
- [ ] Firebase project configured
- [ ] Twilio account set up with WhatsApp number
- [ ] Email/SMTP credentials verified (use app password for Gmail)

### 6. **Domain & SSL** ✅
- [ ] Domain DNS configured to point to Hostinger
- [ ] SSL certificate enabled (Hostinger free SSL recommended)
- [ ] HTTPS working: `https://yourdomain.com`

### 7. **Pre-Deployment Testing** ✅
Test locally before pushing to deploy:
```bash
# Set NODE_ENV and test build
NODE_ENV=production npm run build
NODE_ENV=production npm start

# Visit: http://localhost:3000
# Check health: http://localhost:3000/api/health
```

## Deployment Steps

### Step 1: Prepare Local Code
```bash
# On dev branch, ensure all changes are committed
git checkout dev
git status  # Should be clean

# Switch to deploy branch
git checkout deploy
git pull origin deploy

# Merge latest from dev
git merge dev

# Verify changes
git log --oneline -5
```

### Step 2: Push to GitHub
```bash
# Push deploy branch to GitHub (company remote)
git push company deploy
```

### Step 3: Hostinger Auto-Deploy
1. Go to **Hostinger Control Panel**
2. Navigate to **Git Deployments** or **Repository**
3. Should see deployment in progress
4. Wait for build to complete (~5-10 minutes)
5. Check deployment status and logs

### Step 4: Verify Deployment
```bash
# Check if site is live
curl https://yourdomain.com

# Check health endpoint
curl https://yourdomain.com/api/health

# Expected response:
# {"status":"ok","database":"connected",...}
```

## Post-Deployment Checklist

- [ ] Site loads at `https://yourdomain.com`
- [ ] No console errors in browser DevTools
- [ ] Health check endpoint returns: `/api/health`
- [ ] Database queries working
- [ ] Email notifications sending
- [ ] WhatsApp integration working
- [ ] Authentication/Login functional
- [ ] Admin panel accessible

## Troubleshooting

### Build Fails
- Check **Deployment Logs** in Hostinger
- Verify `npm run build` works locally
- Check Node.js version: must be >=18.0.0

### Database Connection Error
- Verify `DATABASE_URL` is set correctly
- Check PostgreSQL is accessible from Hostinger
- Test locally: `psql $DATABASE_URL`

### Port Already in Use
- Hostinger uses specific ports; let Hostinger assign PORT
- Don't hardcode port in code

### CORS Errors
- Check `ALLOWED_ORIGINS` includes your domain
- Remove `http://` or `https://` if they're already in the domain

### Logs Not Visible
- Check Hostinger **Application Logs**
- Look for `/api/health` endpoint logs

## Rollback Procedure

If deployment breaks production:

```bash
# Switch to deploy branch
git checkout deploy

# Reset to previous working version
git log --oneline  # Find commit hash

# Revert to previous commit
git revert <commit-hash>

# Push revert
git push company deploy

# Hostinger will auto-deploy reverted version
```

## Performance Notes

- Production mode disables debug logging
- Static files cached for 1 day
- CORS properly configured for security
- Error handling hides sensitive details in production

## Need Help?

- Check Hostinger Documentation: https://support.hostinger.com/
- Check application logs: Hostinger Control Panel → Logs
- Verify environment variables are set: `/api/health` endpoint

---

**Last Updated:** April 2026
**Status:** Production-Ready ✅
