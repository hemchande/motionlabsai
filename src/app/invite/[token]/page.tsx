'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { AthleteRosterService } from '@/services/athleteRoster';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, UserPlus } from 'lucide-react';

interface InvitationPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default function InvitationPage({ params }: InvitationPageProps) {
  const { token } = use(params);
  const router = useRouter();
  const { isAuthenticated, user, signup, loading: authLoading } = useAuth();
  
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!authLoading) {
      loadInvitation();
    }
  }, [authLoading, token]);

  const loadInvitation = async (retryCount = 0) => {
    try {
      setLoading(true);
      console.log(`🔍 Loading invitation with token: ${token} (attempt ${retryCount + 1})`);
      
      // Find invitation by token
      const response = await fetch(`/api/invitations?token=${token}`);
      const data = await response.json();
      
      console.log('📡 Invitation API response:', data);
      
      if (data.success && data.invitation) {
        console.log('✅ Invitation found:', data.invitation);
        setInvitation(data.invitation);
        
        // If user is already authenticated and this is their invitation
        if (isAuthenticated && user && user.email === data.invitation.athleteEmail) {
          // Auto-accept the invitation
          await acceptInvitation();
        } else if (isAuthenticated && user && user.email !== data.invitation.athleteEmail) {
          setError('This invitation is not for your account. Please log out and use the correct account.');
        } else {
          // Pre-fill signup form with invitation data
          setSignupData(prev => ({
            ...prev,
            email: data.invitation.athleteEmail,
            fullName: data.invitation.athleteName || ''
          }));
          setShowSignup(true);
        }
      } else {
        // If invitation not found and we haven't retried yet, try again after a short delay
        if (retryCount < 2 && data.error === 'Invitation not found or expired') {
          console.log(`⏳ Invitation not found, retrying in 2 seconds... (attempt ${retryCount + 1})`);
          setTimeout(() => {
            loadInvitation(retryCount + 1);
          }, 2000);
          return;
        }
        
        console.error('❌ Invitation not found:', data.error);
        setError(data.error || 'Invitation not found or expired');
      }
    } catch (error) {
      console.error('❌ Error loading invitation:', error);
      
      // Retry on network errors
      if (retryCount < 2) {
        console.log(`⏳ Network error, retrying in 2 seconds... (attempt ${retryCount + 1})`);
        setTimeout(() => {
          loadInvitation(retryCount + 1);
        }, 2000);
        return;
      }
      
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!user || !invitation) return;
    
    try {
      setAccepting(true);
      setError(null);
      
      const response = await fetch('/api/accept-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invitationId: invitation.id,
          athleteId: user.id,
          athleteEmail: user.email,
          athleteName: user.fullName
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setError(data.error || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setError('Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setAccepting(true);
      setError(null);
      
      const result = await signup({
        email: signupData.email,
        password: signupData.password,
        fullName: signupData.fullName,
        role: 'athlete'
      });
      
      if (result.success) {
        // After successful signup, accept the invitation
        await acceptInvitation();
      } else {
        setError(result.error || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError('Signup failed');
    } finally {
      setAccepting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/')} 
              className="w-full"
              variant="outline"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-600">Welcome to the Team!</CardTitle>
            <CardDescription>
              You have successfully joined {invitation?.institution || 'the team'}!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center mb-4">
              Redirecting to your dashboard...
            </p>
            <Button 
              onClick={() => router.push('/dashboard')} 
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <UserPlus className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <CardTitle>You're Invited!</CardTitle>
          <CardDescription>
            {invitation?.coachName} has invited you to join {invitation?.institution || 'their team'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {showSignup && !isAuthenticated ? (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={signupData.email}
                  onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={signupData.fullName}
                  onChange={(e) => setSignupData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={signupData.password}
                  onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={accepting}
              >
                {accepting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account & Join Team'
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  You're already signed in as <strong>{user?.email}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Click below to accept the invitation and join the team.
                </p>
              </div>
              
              <Button 
                onClick={acceptInvitation}
                className="w-full" 
                disabled={accepting}
              >
                {accepting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Accepting Invitation...
                  </>
                ) : (
                  'Accept Invitation'
                )}
              </Button>
            </div>
          )}
          
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}