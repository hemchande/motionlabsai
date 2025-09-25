import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Athlete {
  athleteId: string;
  athleteEmail: string;
  athleteName: string;
  joinedAt: string;
  status: 'active' | 'inactive';
  coachId: string;
  profileImage?: string;
  lastActivity?: string;
}

export interface Invitation {
  id: string;
  coachId: string;
  coachEmail: string;
  coachName: string;
  athleteEmail: string;
  athleteName?: string;
  institution?: string;
  invitationLink: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: string;
  acceptedAt?: string;
}

export class AthleteRosterService {
  /**
   * Get all athletes for a coach
   */
  static async getCoachAthletes(coachId: string): Promise<Athlete[]> {
    try {
      const athletesRef = collection(db, 'coaches', coachId, 'athletes');
      const q = query(athletesRef, orderBy('joinedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        athleteId: doc.id,
        ...doc.data(),
        joinedAt: doc.data().joinedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastActivity: doc.data().lastActivity?.toDate?.()?.toISOString()
      })) as Athlete[];
    } catch (error) {
      console.error('Error fetching coach athletes:', error);
      throw new Error('Failed to fetch athletes');
    }
  }

  /**
   * Add athlete to coach's roster
   */
  static async addAthleteToRoster(
    coachId: string, 
    athleteId: string, 
    athleteEmail: string, 
    athleteName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await addDoc(collection(db, 'coaches', coachId, 'athletes'), {
        athleteId,
        athleteEmail,
        athleteName,
        joinedAt: serverTimestamp(),
        status: 'active',
        coachId
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error adding athlete to roster:', error);
      return { success: false, error: 'Failed to add athlete to roster' };
    }
  }

  /**
   * Update athlete status in roster
   */
  static async updateAthleteStatus(
    coachId: string, 
    athleteId: string, 
    status: 'active' | 'inactive'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const athleteRef = doc(db, 'coaches', coachId, 'athletes', athleteId);
      await updateDoc(athleteRef, {
        status,
        lastActivity: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating athlete status:', error);
      return { success: false, error: 'Failed to update athlete status' };
    }
  }

  /**
   * Remove athlete from coach's roster
   */
  static async removeAthleteFromRoster(
    coachId: string, 
    athleteId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await deleteDoc(doc(db, 'coaches', coachId, 'athletes', athleteId));
      return { success: true };
    } catch (error) {
      console.error('Error removing athlete from roster:', error);
      return { success: false, error: 'Failed to remove athlete from roster' };
    }
  }

  /**
   * Get pending invitations for a coach
   */
  static async getCoachInvitations(coachId: string): Promise<Invitation[]> {
    try {
      const invitationsRef = collection(db, 'invitations');
      const q = query(
        invitationsRef, 
        where('coachId', '==', coachId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        acceptedAt: doc.data().acceptedAt?.toDate?.()?.toISOString()
      })) as Invitation[];
    } catch (error) {
      console.error('Error fetching coach invitations:', error);
      throw new Error('Failed to fetch invitations');
    }
  }

  /**
   * Get invitation by ID
   */
  static async getInvitation(invitationId: string): Promise<Invitation | null> {
    try {
      const invitationRef = doc(db, 'invitations', invitationId);
      const invitationDoc = await getDoc(invitationRef);
      
      if (!invitationDoc.exists()) {
        return null;
      }
      
      const data = invitationDoc.data();
      return {
        id: invitationDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        acceptedAt: data.acceptedAt?.toDate?.()?.toISOString()
      } as Invitation;
    } catch (error) {
      console.error('Error fetching invitation:', error);
      throw new Error('Failed to fetch invitation');
    }
  }

  /**
   * Accept invitation and add to roster
   */
  static async acceptInvitation(
    invitationId: string, 
    athleteId: string, 
    athleteEmail: string, 
    athleteName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get invitation
      const invitation = await this.getInvitation(invitationId);
      
      if (!invitation) {
        return { success: false, error: 'Invitation not found' };
      }
      
      if (invitation.status !== 'pending') {
        return { success: false, error: 'Invitation has already been used' };
      }
      
      if (invitation.athleteEmail !== athleteEmail) {
        return { success: false, error: 'This invitation is not for you' };
      }
      
      // Add athlete to coach's roster
      await this.addAthleteToRoster(
        invitation.coachId,
        athleteId,
        athleteEmail,
        athleteName
      );
      
      // Update invitation status
      const invitationRef = doc(db, 'invitations', invitationId);
      await updateDoc(invitationRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return { success: false, error: 'Failed to accept invitation' };
    }
  }

  /**
   * Get athlete's coaches (for athlete view)
   */
  static async getAthleteCoaches(athleteId: string): Promise<Athlete[]> {
    try {
      const coachesRef = collection(db, 'coaches');
      const querySnapshot = await getDocs(coachesRef);
      
      const coaches: Athlete[] = [];
      
      for (const coachDoc of querySnapshot.docs) {
        const athleteRef = doc(db, 'coaches', coachDoc.id, 'athletes', athleteId);
        const athleteDoc = await getDoc(athleteRef);
        
        if (athleteDoc.exists()) {
          const data = athleteDoc.data();
          coaches.push({
            athleteId: athleteDoc.id,
            ...data,
            joinedAt: data.joinedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            lastActivity: data.lastActivity?.toDate?.()?.toISOString()
          } as Athlete);
        }
      }
      
      return coaches;
    } catch (error) {
      console.error('Error fetching athlete coaches:', error);
      throw new Error('Failed to fetch coaches');
    }
  }
}




