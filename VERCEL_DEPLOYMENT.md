# 🚀 Vercel Deployment Guide

Quick guide to deploy your Trainform project to Vercel and get a live URL.

---

## 🌐 Method 1: Vercel Dashboard (Recommended - Easiest!)

### Step 1: Sign Up / Log In
1. Go to **https://vercel.com**
2. Click **"Sign Up"** or **"Log In"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account

### Step 2: Import Your Project
1. Click **"Add New..."** → **"Project"**
2. Find your repository: **`priyampathak/training`**
3. Click **"Import"**

### Step 3: Configure Settings
Vercel will auto-detect Next.js. Settings should be:
- **Framework Preset:** Next.js ✅
- **Root Directory:** `./`
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

### Step 4: Add Environment Variables ⚠️ CRITICAL!

Click **"Environment Variables"** and add these **5 variables**:

| Name | Value |
|------|-------|
| `MONGODB_URI` | `mongodb+srv://hexerve_db_user:4KNdphmDjw2oUO8a@cluster0.hrty8cl.mongodb.net/trainform?retryWrites=true&w=majority&appName=Cluster0` |
| `JWT_SECRET` | Generate using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_APP_URL` | Leave empty for now (update after deployment) |

### Step 5: Deploy! 🚀
1. Click **"Deploy"**
2. Wait 2-3 minutes while Vercel builds
3. You'll get a live URL like: **`https://training-xyz.vercel.app`**

### Step 6: Update NEXT_PUBLIC_APP_URL
1. Copy your Vercel URL
2. Go to **Settings** → **Environment Variables**
3. Edit `NEXT_PUBLIC_APP_URL`
4. Paste your Vercel URL
5. Click **"Save"**
6. Go to **Deployments** → **"..."** → **"Redeploy"**

---

## 💻 Method 2: Vercel CLI (Command Line)

### Install Vercel CLI
```bash
npm install -g vercel
```

### Login to Vercel
```bash
vercel login
```

This will open your browser to verify your email.

### Deploy
```bash
cd /Users/priyampathak/Training
vercel
```

You'll be prompted:
- **Set up and deploy?** → `Y`
- **Which scope?** → Choose your account
- **Link to existing project?** → `N`
- **Project name?** → `training` (or press Enter)
- **Code directory?** → `./` (press Enter)
- **Override settings?** → `N`

### Add Environment Variables
```bash
vercel env add MONGODB_URI production
# Paste your MongoDB URI

vercel env add JWT_SECRET production
# Paste your JWT secret

vercel env add JWT_EXPIRES_IN production
# Type: 7d

vercel env add NODE_ENV production
# Type: production
```

### Deploy to Production
```bash
vercel --prod
```

---

## 🔑 Environment Variables

### 1. MONGODB_URI
```
mongodb+srv://hexerve_db_user:4KNdphmDjw2oUO8a@cluster0.hrty8cl.mongodb.net/trainform?retryWrites=true&w=majority&appName=Cluster0
```

### 2. JWT_SECRET (Generate Secure One)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and use it as your JWT_SECRET.

### 3. JWT_EXPIRES_IN
```
7d
```

### 4. NODE_ENV
```
production
```

### 5. NEXT_PUBLIC_APP_URL
```
https://your-app.vercel.app
```
(Update after first deployment)

---

## ⚠️ Important: MongoDB Atlas Configuration

Before deploying, ensure MongoDB Atlas allows connections from Vercel:

1. Go to **https://cloud.mongodb.com**
2. Click **"Network Access"** in the left sidebar
3. Click **"Add IP Address"**
4. Choose **"Allow Access from Anywhere"**
5. Enter `0.0.0.0/0`
6. Click **"Confirm"**

This allows Vercel's servers to connect to your database.

---

## ✨ What You'll Get

After deployment:

✅ **Live URL:** `https://training-[random].vercel.app`  
✅ **HTTPS/SSL:** Automatic SSL certificate  
✅ **Auto-Deploy:** Every GitHub push triggers deployment  
✅ **Preview URLs:** Every branch gets a preview URL  
✅ **CDN:** Fast worldwide with edge network  
✅ **Serverless:** Automatic scaling  

---

## 🔄 Future Deployments

After initial setup:

### Automatic Deployment
Just push to GitHub:
```bash
git add .
git commit -m "Update feature"
git push
```
Vercel will automatically detect and deploy!

### Manual Deployment via CLI
```bash
vercel --prod
```

---

## 🐛 Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`

### Database Connection Fails
- Verify MongoDB Atlas Network Access allows `0.0.0.0/0`
- Check `MONGODB_URI` is correct
- Ensure database user has read/write permissions

### Environment Variables Not Working
- Make sure to redeploy after adding/changing env vars
- Check variable names are EXACTLY as shown (case-sensitive)
- For `NEXT_PUBLIC_*` vars, redeploy is required

---

## 🎯 Quick Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Your GitHub Repo:** https://github.com/priyampathak/training
- **Vercel Docs:** https://vercel.com/docs
- **MongoDB Atlas:** https://cloud.mongodb.com

---

## 📞 Support

If you encounter issues:
1. Check Vercel build logs
2. Review environment variables
3. Check MongoDB Network Access
4. Review [Vercel Documentation](https://vercel.com/docs)

---

**Happy Deploying! 🚀**

