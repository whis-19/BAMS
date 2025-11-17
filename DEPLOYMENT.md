# BAMS Deployment Guide for Vercel

This guide will walk you through deploying the BAMS (Blockchain Attendance Management System) on Vercel.

## Prerequisites

1. Vercel account (sign up at [vercel.com](https://vercel.com))
2. Node.js (v14 or later) and npm installed locally
3. Git installed locally
4. GitHub/GitLab/Bitbucket account (recommended for easier deployment)

## Deployment Steps

### 1. Prepare Your Repository

1. Make sure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket)
2. Ensure all dependencies are listed in your `package.json`
3. Verify that `vercel.json` is properly configured in your project root

### 2. Install Vercel CLI (Optional but Recommended)

```bash
npm install -g vercel
```

### 3. Deploy Using Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your Git repository
4. Configure project settings:
   - Framework Preset: `Other`
   - Build Command: `npm install && npm run build` (or leave empty if no build step)
   - Output Directory: `frontend` (for the static files)
   - Install Command: `npm install`
5. Add Environment Variables (if any) in the Environment Variables section
6. Click "Deploy"

### 4. Configure Environment Variables

If your application uses environment variables, add them in the Vercel project settings:

1. Go to your project in Vercel Dashboard
2. Navigate to Settings → Environment Variables
3. Add any required environment variables (e.g., database URLs, API keys)

### 5. Handling JSON Data

Since your application uses `bams_structure.json` for data storage, you have two options:

#### Option 1: Include in Deployment (Simple but not recommended for production)
- The file is already included in the repository
- Vercel will deploy it with the rest of your application

#### Option 2: Use Vercel Environment Variables (Recommended for production)
1. Convert your JSON data to a string
2. Add it as an environment variable in Vercel
3. Modify your backend to read from `process.env.BAMS_STRUCTURE` instead of the file

### 6. Deploying Updates

Vercel automatically deploys updates when you push to your connected Git repository. For manual deployments:

```bash
# If you have Vercel CLI installed
vercel --prod
```

## Troubleshooting

1. **API Routes Not Working**
   - Ensure your `vercel.json` routes are correctly configured
   - Check Vercel function logs for errors

2. **Static Files Not Loading**
   - Verify the build output directory in Vercel settings
   - Check if files exist in the correct location after build

3. **Environment Variables**
   - Ensure all required environment variables are set in Vercel
   - Remember to redeploy after adding new environment variables

## Post-Deployment

1. Test all API endpoints
2. Verify the frontend loads correctly
3. Check the console for any errors
4. Set up a custom domain if needed (in Vercel project settings)

## Monitoring

Vercel provides built-in monitoring:
- Check the "Logs" section in your Vercel dashboard
- Set up alerts for errors or performance issues
- Monitor function execution times and cold starts

## Need Help?

If you encounter any issues during deployment, please check:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Status Page](https://www.vercel-status.com/)
- Or contact Vercel support
