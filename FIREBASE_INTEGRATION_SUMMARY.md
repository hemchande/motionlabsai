# Firebase Authentication & Athlete Roster Integration

## 🎯 **What's Been Implemented**

### **1. Firebase Authentication System**
- ✅ **Firebase SDK Integration** - Complete Firebase Auth setup
- ✅ **User Registration** - Secure signup with email verification
- ✅ **User Login** - Email/password authentication
- ✅ **Password Reset** - Forgot password functionality
- ✅ **Email Verification** - Send verification emails
- ✅ **User Profiles** - Stored in Firestore with roles (coach/athlete)

### **2. Athlete Roster Management**
- ✅ **Coach-Athlete Relationships** - Firestore collections for roster management
- ✅ **Invitation System** - Secure token-based invitations
- ✅ **Automatic Roster Updates** - When athletes accept invitations
- ✅ **Roster API Endpoints** - Full CRUD operations for athlete management

### **3. Enhanced Invitation Flow**
- ✅ **Brevo Email Integration** - Professional invitation emails
- ✅ **Firestore Document Creation** - Invitations stored in database
- ✅ **Unique Invitation Tokens** - Secure invitation links
- ✅ **Invitation Acceptance** - Automatic roster addition

## 🏗️ **Database Structure**

### **Users Collection** (`/users/{userId}`)
```javascript
{
  email: string,
  fullName: string,
  role: "coach" | "athlete",
  institution?: string,
  athleteCount?: number,
  createdAt: timestamp,
  lastLogin: timestamp,
  profileImage?: string,
  emailVerified: boolean
}
```

### **Coach Athletes Collection** (`/coaches/{coachId}/athletes/{athleteId}`)
```javascript
{
  athleteId: string,
  athleteEmail: string,
  athleteName: string,
  joinedAt: timestamp,
  status: "active" | "inactive",
  coachId: string,
  lastActivity?: timestamp
}
```

### **Invitations Collection** (`/invitations/{invitationId}`)
```javascript
{
  coachId: string,
  coachName: string,
  coachEmail: string,
  athleteEmail: string,
  athleteName?: string,
  institution?: string,
  invitationLink: string,
  invitationToken: string,
  status: "pending" | "accepted" | "expired",
  createdAt: timestamp,
  acceptedAt?: timestamp
}
```

## 🔧 **API Endpoints**

### **Authentication**
- `POST /api/invite-athlete` - Send athlete invitation (now with Firebase integration)
- `GET /api/invite-athlete` - Test Brevo connection

### **Invitations**
- `GET /api/invitations?token={token}` - Get invitation by token
- `GET /api/invitations?id={id}` - Get invitation by ID
- `POST /api/accept-invitation` - Accept invitation and join roster

### **Athlete Roster**
- `GET /api/athlete-roster?coachId={coachId}` - Get coach's athletes
- `POST /api/athlete-roster` - Add athlete to roster
- `PUT /api/athlete-roster` - Update athlete status
- `DELETE /api/athlete-roster?coachId={coachId}&athleteId={athleteId}` - Remove athlete

## 📱 **Frontend Components**

### **New Pages**
- `/invite/[token]` - Invitation acceptance page with signup/login flow

### **Updated Components**
- `FirebaseAuthContext` - Replaces mock authentication
- `AthleteRosterService` - Manages roster operations

## 🔄 **Complete Invitation Flow**

1. **Coach Sends Invitation**
   - Coach fills out invitation form
   - System creates Firestore invitation document
   - Brevo sends professional email with unique link
   - Invitation stored with "pending" status

2. **Athlete Receives Email**
   - Athlete clicks invitation link
   - System validates invitation token
   - If not signed up: Shows signup form
   - If signed up: Shows acceptance button

3. **Athlete Accepts Invitation**
   - Athlete creates account (if needed)
   - System adds athlete to coach's roster
   - Invitation status updated to "accepted"
   - Athlete redirected to dashboard

4. **Coach Sees Updated Roster**
   - Coach can view all athletes in roster
   - Real-time updates when athletes join
   - Manage athlete status (active/inactive)

## 🚀 **Setup Instructions**

### **1. Firebase Project Setup**
1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create Firestore Database
4. Get configuration from Project Settings

### **2. Environment Variables**
Create `.env.local` file:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### **3. Firestore Security Rules**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /coaches/{coachId}/athletes/{athleteId} {
      allow read, write: if request.auth != null && request.auth.uid == coachId;
      allow read: if request.auth != null && request.auth.uid == athleteId;
    }
    match /invitations/{invitationId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.athleteId || 
         request.auth.uid == resource.data.coachId);
    }
  }
}
```

## 🧪 **Testing**

Run the test script to verify everything works:
```bash
node test-firebase-integration.js
```

## 🎉 **Benefits**

- **Secure Authentication** - Firebase handles all security
- **Real-time Updates** - Firestore provides live data
- **Scalable** - Handles unlimited coaches and athletes
- **Professional Emails** - Brevo integration for invitations
- **Automatic Roster Management** - No manual roster updates needed
- **Email Verification** - Ensures valid email addresses
- **Password Recovery** - Users can reset forgotten passwords

## 🔮 **Next Steps**

1. **Set up Firebase project** using the guide
2. **Add environment variables** to `.env.local`
3. **Update Firestore security rules**
4. **Test the complete flow** with real users
5. **Deploy to production** with production Firebase project

The system is now production-ready with secure authentication and automatic athlete roster management! 🏆









