# Production Deployment Guide

## Environment Variables for Production

When deploying to production (Vercel, Netlify, etc.), make sure to set these environment variables:

### Required Environment Variables

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Email Service (Brevo)
BREVO_API_KEY=your_brevo_api_key

# Backend API
NEXT_PUBLIC_API_BASE_URL=https://your-backend-api.com
```

### Vercel Deployment

1. **Set Environment Variables in Vercel Dashboard:**
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add all the variables above

2. **Important:** Make sure `NEXT_PUBLIC_APP_URL` is set to your production domain (e.g., `https://gymnastics-analytics.vercel.app`)

### Firebase Configuration

1. **Add Production Domain to Firebase:**
   - Go to Firebase Console > Authentication > Settings
   - Add your production domain to "Authorized domains"
   - Remove `localhost:3000` from production

2. **Update Firestore Security Rules:**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow read/write access to authenticated users
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

### Backend API Configuration

Make sure your backend API server is also deployed and accessible via HTTPS:

```bash
# Backend environment variables
NODE_ENV=production
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
MONGODB_URI=your_mongodb_connection_string
```

### Testing Production Deployment

1. **Test Invitation Flow:**
   - Send an invitation from the production app
   - Check that the invitation email contains the correct production URL
   - Verify that clicking the invitation link works

2. **Test Video Upload and Analysis:**
   - Upload a video through the production app
   - Verify that the backend API is accessible
   - Check that Cloudflare Stream integration works

### Common Issues and Solutions

1. **"Invitation not found" Error:**
   - Check that `NEXT_PUBLIC_APP_URL` is set correctly
   - Verify Firebase Firestore rules allow read access
   - Check browser console for detailed error logs

2. **CORS Issues:**
   - Ensure backend API allows requests from your production domain
   - Check that all API endpoints are accessible via HTTPS

3. **Firebase Authentication Issues:**
   - Verify production domain is added to Firebase authorized domains
   - Check that Firebase configuration is correct

### Monitoring

- Check Vercel function logs for API errors
- Monitor Firebase usage and quotas
- Set up error tracking (Sentry, etc.) for production issues




