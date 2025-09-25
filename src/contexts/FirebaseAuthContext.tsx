'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: "coach" | "athlete";
  institution?: string;
  athleteCount?: number;
  createdAt: string;
  lastLogin: string;
  profileImage?: string;
  emailVerified: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  firebaseUser: FirebaseUser | null;
  userRole: "coach" | "athlete";
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  deleteAccount: (password: string) => Promise<{ success: boolean; error?: string }>;
  sendEmailVerification: () => Promise<{ success: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
}

interface SignupData {
  email: string;
  password: string;
  fullName: string;
  role: "coach" | "athlete";
  institution?: string;
  athleteCount?: number;
}

interface InvitationData {
  coachId: string;
  coachEmail: string;
  coachName: string;
  athleteEmail: string;
  athleteName?: string;
  institution?: string;
  invitationLink: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<"coach" | "athlete">("coach");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
      
      if (firebaseUser) {
        try {
          console.log('Fetching user profile for:', firebaseUser.uid);
          // Get user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('User document found:', userData);
            
            const userProfile: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              fullName: userData.fullName,
              role: userData.role,
              institution: userData.institution,
              athleteCount: userData.athleteCount,
              createdAt: userData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              profileImage: userData.profileImage,
              emailVerified: firebaseUser.emailVerified
            };
            
            console.log('Setting user profile and authenticating:', userProfile);
            console.log('🔍 DEBUG: Setting userRole to:', userProfile.role);
            setUser(userProfile);
            setUserRole(userProfile.role);
            setIsAuthenticated(true);
            setFirebaseUser(firebaseUser);
            
            // Update last login
            await updateDoc(doc(db, 'users', firebaseUser.uid), {
              lastLogin: serverTimestamp()
            });
          } else {
            console.log('User document not found, signing out');
            // User document doesn't exist, sign out
            await signOut(auth);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          await signOut(auth);
        }
      } else {
        console.log('No user, setting unauthenticated state');
        setUser(null);
        setFirebaseUser(null);
        setUserRole("coach");
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Don't set loading to false here - let the auth state change handler manage it
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = "Login failed. Please try again.";
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "No account found with this email address.";
          break;
        case 'auth/wrong-password':
          errorMessage = "Incorrect password.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email address.";
          break;
        case 'auth/user-disabled':
          errorMessage = "This account has been disabled.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
      }
      
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const signup = async (userData: SignupData): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const firebaseUser = userCredential.user;
      
      // Update Firebase profile
      await updateProfile(firebaseUser, {
        displayName: userData.fullName
      });
      
      // Create user document in Firestore
      console.log('🔍 DEBUG: Signup userData.role:', userData.role);
      const userDoc = {
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        profileImage: null,
        emailVerified: false,
        ...(userData.institution && { institution: userData.institution }),
        ...(userData.athleteCount && { athleteCount: userData.athleteCount })
      };
      console.log('🔍 DEBUG: Creating userDoc with role:', userDoc.role);
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userDoc);
      
      // Check for pending invitations and auto-accept them
      if (userData.role === 'athlete') {
        try {
          const { InvitationService } = await import('@/services/invitationService');
          const pendingInvitations = await InvitationService.getAthletePendingInvitations(userData.email);
          
          for (const invitation of pendingInvitations) {
            // Auto-accept the invitation
            await InvitationService.updateInvitationStatus(
              invitation.id!,
              'accepted',
              firebaseUser.uid
            );
            
            // Add to coach's roster
            const { AthleteRosterService } = await import('@/services/athleteRoster');
            await AthleteRosterService.acceptInvitation(
              invitation.invitationToken,
              firebaseUser.uid,
              userData.email,
              userData.fullName
            );
          }
        } catch (invitationError) {
          console.error('Error processing pending invitations:', invitationError);
          // Don't fail signup if invitation processing fails
        }
      }
      
      // Send email verification
      await sendEmailVerification(firebaseUser);
      
      setLoading(false);
      return { success: true };
    } catch (error: any) {
      console.error('Signup error:', error);
      let errorMessage = "Signup failed. Please try again.";
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "An account with this email already exists.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email address.";
          break;
        case 'auth/weak-password':
          errorMessage = "Password should be at least 6 characters.";
          break;
      }
      
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const deleteAccount = async (password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      if (!firebaseUser) {
        setLoading(false);
        return { success: false, error: "No user logged in" };
      }
      
      // Re-authenticate user before deletion
      const credential = await signInWithEmailAndPassword(auth, firebaseUser.email!, password);
      
      // Delete user document from Firestore
      await deleteDoc(doc(db, 'users', firebaseUser.uid));
      
      // Delete Firebase user
      await firebaseUser.delete();
      
      setLoading(false);
      return { success: true };
    } catch (error: any) {
      console.error('Delete account error:', error);
      let errorMessage = "Failed to delete account. Please try again.";
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password.";
      }
      
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const sendEmailVerification = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!firebaseUser) {
        return { success: false, error: "No user logged in" };
      }
      
      await sendEmailVerification(firebaseUser);
      return { success: true };
    } catch (error: any) {
      console.error('Email verification error:', error);
      return { success: false, error: "Failed to send verification email." };
    }
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      console.error('Password reset error:', error);
      let errorMessage = "Failed to send password reset email.";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email address.";
      }
      
      return { success: false, error: errorMessage };
    }
  };

  // Function to create invitation in Firestore
  const createInvitation = async (invitationData: InvitationData): Promise<{ success: boolean; invitationId?: string; error?: string }> => {
    try {
      const docRef = await addDoc(collection(db, 'invitations'), {
        ...invitationData,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      return { success: true, invitationId: docRef.id };
    } catch (error) {
      console.error('Create invitation error:', error);
      return { success: false, error: "Failed to create invitation." };
    }
  };

  // Function to accept invitation and add to coach's roster
  const acceptInvitation = async (invitationId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user || !firebaseUser) {
        return { success: false, error: "User not authenticated" };
      }
      
      // Get invitation document
      const invitationDoc = await getDoc(doc(db, 'invitations', invitationId));
      
      if (!invitationDoc.exists()) {
        return { success: false, error: "Invitation not found" };
      }
      
      const invitationData = invitationDoc.data();
      
      // Check if invitation is for this user
      if (invitationData.athleteEmail !== user.email) {
        return { success: false, error: "This invitation is not for you" };
      }
      
      // Check if invitation is still pending
      if (invitationData.status !== 'pending') {
        return { success: false, error: "This invitation has already been used" };
      }
      
      // Add athlete to coach's roster
      await setDoc(doc(db, 'coaches', invitationData.coachId, 'athletes', firebaseUser.uid), {
        athleteId: firebaseUser.uid,
        athleteEmail: user.email,
        athleteName: user.fullName,
        joinedAt: serverTimestamp(),
        status: 'active',
        coachId: invitationData.coachId
      });
      
      // Update invitation status
      await updateDoc(doc(db, 'invitations', invitationId), {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Accept invitation error:', error);
      return { success: false, error: "Failed to accept invitation." };
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading MotionLabs AI...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      firebaseUser,
      userRole, 
      login, 
      signup, 
      logout, 
      deleteAccount,
      sendEmailVerification,
      sendPasswordReset,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}
