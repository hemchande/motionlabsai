import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Invitation {
  id?: string;
  coachId: string;
  coachName: string;
  coachEmail: string;
  athleteEmail: string;
  athleteName?: string;
  institution?: string;
  invitationLink: string;
  invitationToken: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Timestamp;
  acceptedAt?: Timestamp;
  declinedAt?: Timestamp;
  expiresAt?: Timestamp;
  athleteUserId?: string; // Set when athlete creates account
  notes?: string;
}

export interface InvitationStats {
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  expired: number;
}

export class InvitationService {
  /**
   * Create a new invitation
   */
  static async createInvitation(invitationData: Omit<Invitation, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const invitationDoc = await addDoc(collection(db, 'invitations'), {
      ...invitationData,
      status: 'pending',
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });
    
    return invitationDoc.id;
  }

  /**
   * Get invitation by token
   */
  static async getInvitationByToken(token: string): Promise<Invitation | null> {
    const q = query(
      collection(db, 'invitations'),
      where('invitationToken', '==', token)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as Invitation;
  }

  /**
   * Update invitation status
   */
  static async updateInvitationStatus(
    invitationId: string, 
    status: Invitation['status'],
    athleteUserId?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      [status === 'accepted' ? 'acceptedAt' : 'declinedAt']: serverTimestamp()
    };
    
    if (athleteUserId) {
      updateData.athleteUserId = athleteUserId;
    }
    
    await updateDoc(doc(db, 'invitations', invitationId), updateData);
  }

  /**
   * Get all invitations for a coach
   */
  static async getCoachInvitations(coachId: string): Promise<Invitation[]> {
    const q = query(
      collection(db, 'invitations'),
      where('coachId', '==', coachId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Invitation[];
  }

  /**
   * Get invitation statistics for a coach
   */
  static async getCoachInvitationStats(coachId: string): Promise<InvitationStats> {
    const invitations = await this.getCoachInvitations(coachId);
    
    return {
      total: invitations.length,
      pending: invitations.filter(inv => inv.status === 'pending').length,
      accepted: invitations.filter(inv => inv.status === 'accepted').length,
      declined: invitations.filter(inv => inv.status === 'declined').length,
      expired: invitations.filter(inv => inv.status === 'expired').length
    };
  }

  /**
   * Check if invitation is valid (not expired)
   */
  static isInvitationValid(invitation: Invitation): boolean {
    if (invitation.status !== 'pending') {
      return false;
    }
    
    if (invitation.expiresAt) {
      const now = new Date();
      const expiresAt = invitation.expiresAt.toDate();
      return now < expiresAt;
    }
    
    return true;
  }

  /**
   * Mark expired invitations
   */
  static async markExpiredInvitations(): Promise<number> {
    const q = query(
      collection(db, 'invitations'),
      where('status', '==', 'pending')
    );
    
    const querySnapshot = await getDocs(q);
    const now = new Date();
    let expiredCount = 0;
    
    for (const doc of querySnapshot.docs) {
      const invitation = doc.data() as Invitation;
      
      if (invitation.expiresAt && now > invitation.expiresAt.toDate()) {
        await updateDoc(doc.ref, {
          status: 'expired',
          expiredAt: serverTimestamp()
        });
        expiredCount++;
      }
    }
    
    return expiredCount;
  }

  /**
   * Get athlete's pending invitations
   */
  static async getAthletePendingInvitations(athleteEmail: string): Promise<Invitation[]> {
    const q = query(
      collection(db, 'invitations'),
      where('athleteEmail', '==', athleteEmail),
      where('status', '==', 'pending')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Invitation[];
  }

  /**
   * Delete an invitation
   */
  static async deleteInvitation(invitationId: string): Promise<void> {
    await deleteDoc(doc(db, 'invitations', invitationId));
  }
}




