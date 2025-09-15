'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Invitation {
  id: string;
  coachId: string;
  coachName: string;
  coachEmail: string;
  studentEmail: string;
  studentName?: string;
  teamName: string;
  institution: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
  token: string;
}

interface InvitationContextType {
  invitations: Invitation[];
  sendInvitation: (invitationData: SendInvitationData) => Promise<{ success: boolean; error?: string }>;
  acceptInvitation: (token: string, userData: AcceptInvitationData) => Promise<{ success: boolean; error?: string }>;
  declineInvitation: (token: string) => Promise<{ success: boolean; error?: string }>;
  getInvitationByToken: (token: string) => Invitation | null;
  getInvitationsByCoach: (coachId: string) => Invitation[];
  getInvitationsByStudent: (studentEmail: string) => Invitation[];
  loading: boolean;
}

interface SendInvitationData {
  coachId: string;
  coachName: string;
  coachEmail: string;
  studentEmail: string;
  studentName?: string;
  teamName: string;
  institution: string;
}

interface AcceptInvitationData {
  fullName: string;
  password: string;
  dateOfBirth?: string;
  emergencyContact?: string;
}

const InvitationContext = createContext<InvitationContextType | undefined>(undefined);

// Mock invitations database
const mockInvitations: Invitation[] = [
  {
    id: "1",
    coachId: "1",
    coachName: "Sarah Johnson",
    coachEmail: "coach@example.com",
    studentEmail: "alex.chen@example.com",
    studentName: "Alex Chen",
    teamName: "Elite Gymnastics Team",
    institution: "Elite Gymnastics Academy",
    status: "pending",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    token: "inv_abc123"
  }
];

// Mock email service
const sendEmailInvitation = async (invitation: Invitation): Promise<boolean> => {
  // Simulate email sending
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In a real app, this would send an actual email
  console.log('📧 Email invitation sent:', {
    to: invitation.studentEmail,
    subject: `You're invited to join ${invitation.teamName}!`,
    body: `Hi ${invitation.studentName || invitation.studentEmail},

You've been invited by ${invitation.coachName} to join ${invitation.teamName} at ${invitation.institution}.

Click the link below to accept the invitation and create your account:
${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${invitation.token}

This invitation expires on ${new Date(invitation.expiresAt).toLocaleDateString()}.

Best regards,
MotionLabs AI Team`
  });
  
  return true;
};

export function InvitationProvider({ children }: { children: ReactNode }) {
  const [invitations, setInvitations] = useState<Invitation[]>(mockInvitations);
  const [loading, setLoading] = useState(false);

  const generateInvitationToken = (): string => {
    return 'inv_' + Math.random().toString(36).substr(2, 9);
  };

  const sendInvitation = async (invitationData: SendInvitationData): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      // Check if invitation already exists
      const existingInvitation = invitations.find(
        inv => inv.coachId === invitationData.coachId && 
               inv.studentEmail === invitationData.studentEmail &&
               inv.status === 'pending'
      );
      
      if (existingInvitation) {
        setLoading(false);
        return { success: false, error: "An invitation has already been sent to this student" };
      }

      // Create new invitation
      const newInvitation: Invitation = {
        id: (invitations.length + 1).toString(),
        ...invitationData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        token: generateInvitationToken()
      };

      // Send email invitation
      const emailSent = await sendEmailInvitation(newInvitation);
      
      if (!emailSent) {
        setLoading(false);
        return { success: false, error: "Failed to send email invitation" };
      }

      // Add to invitations list
      setInvitations(prev => [...prev, newInvitation]);
      
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      return { success: false, error: "Failed to send invitation" };
    }
  };

  const acceptInvitation = async (token: string, userData: AcceptInvitationData): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      const invitation = invitations.find(inv => inv.token === token);
      
      if (!invitation) {
        setLoading(false);
        return { success: false, error: "Invalid invitation token" };
      }

      if (invitation.status !== 'pending') {
        setLoading(false);
        return { success: false, error: "Invitation has already been processed" };
      }

      if (new Date() > new Date(invitation.expiresAt)) {
        setLoading(false);
        return { success: false, error: "Invitation has expired" };
      }

      // Update invitation status
      setInvitations(prev => 
        prev.map(inv => 
          inv.token === token 
            ? { ...inv, status: 'accepted' as const }
            : inv
        )
      );

      // In a real app, this would create the user account
      console.log('✅ Invitation accepted:', { invitation, userData });
      
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      return { success: false, error: "Failed to accept invitation" };
    }
  };

  const declineInvitation = async (token: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      const invitation = invitations.find(inv => inv.token === token);
      
      if (!invitation) {
        setLoading(false);
        return { success: false, error: "Invalid invitation token" };
      }

      if (invitation.status !== 'pending') {
        setLoading(false);
        return { success: false, error: "Invitation has already been processed" };
      }

      // Update invitation status
      setInvitations(prev => 
        prev.map(inv => 
          inv.token === token 
            ? { ...inv, status: 'declined' as const }
            : inv
        )
      );

      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      return { success: false, error: "Failed to decline invitation" };
    }
  };

  const getInvitationByToken = (token: string): Invitation | null => {
    return invitations.find(inv => inv.token === token) || null;
  };

  const getInvitationsByCoach = (coachId: string): Invitation[] => {
    return invitations.filter(inv => inv.coachId === coachId);
  };

  const getInvitationsByStudent = (studentEmail: string): Invitation[] => {
    return invitations.filter(inv => inv.studentEmail === studentEmail);
  };

  // Clean up expired invitations
  useEffect(() => {
    const now = new Date();
    setInvitations(prev => 
      prev.map(inv => 
        inv.status === 'pending' && new Date(inv.expiresAt) < now
          ? { ...inv, status: 'expired' as const }
          : inv
      )
    );
  }, []);

  return (
    <InvitationContext.Provider value={{
      invitations,
      sendInvitation,
      acceptInvitation,
      declineInvitation,
      getInvitationByToken,
      getInvitationsByCoach,
      getInvitationsByStudent,
      loading
    }}>
      {children}
    </InvitationContext.Provider>
  );
}

export function useInvitations() {
  const context = useContext(InvitationContext);
  if (context === undefined) {
    throw new Error('useInvitations must be used within an InvitationProvider');
  }
  return context;
}













