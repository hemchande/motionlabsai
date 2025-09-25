# Firebase Setup Guide

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `gymnastics-analytics`
4. Enable Google Analytics (optional)
5. Create project

## 2. Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider
5. Enable "Email link (passwordless sign-in)" if desired

## 3. Create Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location (choose closest to your users)

## 4. Get Configuration

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" and select Web (</>) icon
4. Register app with nickname: `gymnastics-analytics-web`
5. Copy the configuration object

## 5. Environment Variables

Create a `.env.local` file in your project root with:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Brevo Email Service
BREVO_API_KEY=your_brevo_api_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 6. Firestore Security Rules

Update your Firestore rules to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Coaches can read/write their athlete rosters
    match /coaches/{coachId}/athletes/{athleteId} {
      allow read, write: if request.auth != null && request.auth.uid == coachId;
    }
    
    // Athletes can read their own roster entry
    match /coaches/{coachId}/athletes/{athleteId} {
      allow read: if request.auth != null && request.auth.uid == athleteId;
    }
    
    // Invitations are readable by the invited user
    match /invitations/{invitationId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.athleteId || 
         request.auth.uid == resource.data.coachId);
    }
  }
}
```

## 7. Database Structure

The app will create the following collections:

### Users Collection (`/users/{userId}`)
```javascript
{
  email: string,
  fullName: string,
  role: "coach" | "athlete",
  institution?: string,
  createdAt: timestamp,
  lastLogin: timestamp,
  profileImage?: string
}
```

### Coach Athletes Collection (`/coaches/{coachId}/athletes/{athleteId}`)
```javascript
{
  athleteId: string,
  athleteEmail: string,
  athleteName: string,
  joinedAt: timestamp,
  status: "active" | "inactive",
  coachId: string
}
```

### Invitations Collection (`/invitations/{invitationId}`)
```javascript
{
  coachId: string,
  coachEmail: string,
  coachName: string,
  athleteEmail: string,
  athleteName?: string,
  institution?: string,
  invitationLink: string,
  status: "pending" | "accepted" | "expired",
  createdAt: timestamp,
  acceptedAt?: timestamp
}
```





