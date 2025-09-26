import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Session {
  id?: string;
  sessionId: string; // UUID from backend
  athleteId: string; // Firebase user ID
  athleteEmail: string;
  athleteName: string;
  coachId: string; // Firebase user ID of the coach
  coachEmail: string;
  coachName: string;
  videoName: string;
  originalVideoName: string;
  event: string;
  sessionType: 'Training' | 'Competition' | 'Evaluation' | 'Analysis';
  date: string;
  duration: string;
  fileSize: number;
  analysisStatus: 'pending' | 'processing' | 'completed' | 'failed';
  perFrameStatus: 'pending' | 'processing' | 'completed' | 'failed';
  motionIQ?: number;
  aclRisk?: number;
  riskLevel?: 'LOW' | 'MODERATE' | 'HIGH';
  metrics?: {
    averageElevationAngle: number;
    averageFlightTime: number;
    averageLandingQuality: number;
    totalFrames: number;
    framesProcessed: number;
  };
  notes?: string;
  hasProcessedVideo?: boolean;
  processedVideoUrl?: string;
  analyticsFile?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  // Backend integration fields
  backendSessionId?: string; // MongoDB session ID
  videoUrl?: string;
  processedVideoFilename?: string;
  analyticsFilename?: string;
}

export interface SessionStats {
  totalSessions: number;
  completedAnalyses: number;
  averageMotionIQ: number;
  averageACLRisk: number;
  riskDistribution: {
    low: number;
    moderate: number;
    high: number;
  };
  eventBreakdown: Record<string, number>;
  recentSessions: Session[];
}

export class SessionService {
  /**
   * Create a new session record
   */
  static async createSession(sessionData: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const sessionDoc = await addDoc(collection(db, 'sessions'), {
      ...sessionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return sessionDoc.id;
  }

  /**
   * Update session data
   */
  static async updateSession(
    sessionId: string, 
    updates: Partial<Session>
  ): Promise<void> {
    await updateDoc(doc(db, 'sessions', sessionId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Get session by ID
   */
  static async getSession(sessionId: string): Promise<Session | null> {
    const sessionDoc = await getDoc(doc(db, 'sessions', sessionId));
    
    if (!sessionDoc.exists()) {
      return null;
    }
    
    return {
      id: sessionDoc.id,
      ...sessionDoc.data()
    } as Session;
  }

  /**
   * Get session by backend session ID
   */
  static async getSessionByBackendId(backendSessionId: string): Promise<Session | null> {
    const q = query(
      collection(db, 'sessions'),
      where('backendSessionId', '==', backendSessionId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as Session;
  }

  /**
   * Get all sessions for an athlete
   */
  static async getAthleteSessions(athleteId: string): Promise<Session[]> {
    const q = query(
      collection(db, 'sessions'),
      where('athleteId', '==', athleteId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Session[];
  }

  /**
   * Get all sessions for a coach
   */
  static async getCoachSessions(coachId: string): Promise<Session[]> {
    const q = query(
      collection(db, 'sessions'),
      where('coachId', '==', coachId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Session[];
  }

  /**
   * Get sessions by athlete email (for invitation flow)
   */
  static async getSessionsByAthleteEmail(athleteEmail: string): Promise<Session[]> {
    const q = query(
      collection(db, 'sessions'),
      where('athleteEmail', '==', athleteEmail),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Session[];
  }

  /**
   * Get recent sessions for an athlete (last 10)
   */
  static async getRecentAthleteSessions(athleteId: string, limitCount: number = 10): Promise<Session[]> {
    const q = query(
      collection(db, 'sessions'),
      where('athleteId', '==', athleteId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Session[];
  }

  /**
   * Get session statistics for an athlete
   */
  static async getAthleteSessionStats(athleteId: string): Promise<SessionStats> {
    const sessions = await this.getAthleteSessions(athleteId);
    
    const totalSessions = sessions.length;
    const completedAnalyses = sessions.filter(s => s.analysisStatus === 'completed').length;
    const avgMotionIQ = totalSessions > 0 ? 
      sessions.reduce((sum, s) => sum + (s.motionIQ || 0), 0) / totalSessions : 0;
    const avgACLRisk = totalSessions > 0 ? 
      sessions.reduce((sum, s) => sum + (s.aclRisk || 0), 0) / totalSessions : 0;
    
    const riskDistribution = {
      low: sessions.filter(s => s.riskLevel === 'LOW').length,
      moderate: sessions.filter(s => s.riskLevel === 'MODERATE').length,
      high: sessions.filter(s => s.riskLevel === 'HIGH').length
    };
    
    const eventBreakdown: Record<string, number> = {};
    sessions.forEach(session => {
      eventBreakdown[session.event] = (eventBreakdown[session.event] || 0) + 1;
    });
    
    return {
      totalSessions,
      completedAnalyses,
      averageMotionIQ: Math.round(avgMotionIQ),
      averageACLRisk: Math.round(avgACLRisk),
      riskDistribution,
      eventBreakdown,
      recentSessions: sessions.slice(0, 5)
    };
  }

  /**
   * Get session statistics for a coach
   */
  static async getCoachSessionStats(coachId: string): Promise<SessionStats> {
    const sessions = await this.getCoachSessions(coachId);
    
    const totalSessions = sessions.length;
    const completedAnalyses = sessions.filter(s => s.analysisStatus === 'completed').length;
    const avgMotionIQ = totalSessions > 0 ? 
      sessions.reduce((sum, s) => sum + (s.motionIQ || 0), 0) / totalSessions : 0;
    const avgACLRisk = totalSessions > 0 ? 
      sessions.reduce((sum, s) => sum + (s.aclRisk || 0), 0) / totalSessions : 0;
    
    const riskDistribution = {
      low: sessions.filter(s => s.riskLevel === 'LOW').length,
      moderate: sessions.filter(s => s.riskLevel === 'MODERATE').length,
      high: sessions.filter(s => s.riskLevel === 'HIGH').length
    };
    
    const eventBreakdown: Record<string, number> = {};
    sessions.forEach(session => {
      eventBreakdown[session.event] = (eventBreakdown[session.event] || 0) + 1;
    });
    
    return {
      totalSessions,
      completedAnalyses,
      averageMotionIQ: Math.round(avgMotionIQ),
      averageACLRisk: Math.round(avgACLRisk),
      riskDistribution,
      eventBreakdown,
      recentSessions: sessions.slice(0, 5)
    };
  }

  /**
   * Link existing backend session to athlete
   */
  static async linkBackendSessionToAthlete(
    backendSessionId: string,
    athleteId: string,
    athleteEmail: string,
    athleteName: string,
    coachId: string,
    coachEmail: string,
    coachName: string
  ): Promise<string> {
    // Check if session already exists
    const existingSession = await this.getSessionByBackendId(backendSessionId);
    if (existingSession) {
      // Update existing session with athlete info
      await this.updateSession(existingSession.id!, {
        athleteId,
        athleteEmail,
        athleteName,
        coachId,
        coachEmail,
        coachName
      });
      return existingSession.id!;
    }

    // Create new session record
    const sessionData: Omit<Session, 'id' | 'createdAt' | 'updatedAt'> = {
      sessionId: backendSessionId, // Use backend ID as session ID
      backendSessionId,
      athleteId,
      athleteEmail,
      athleteName,
      coachId,
      coachEmail,
      coachName,
      videoName: 'Unknown Video', // Will be updated when backend data is available
      originalVideoName: 'Unknown Video',
      event: 'Unknown Event',
      sessionType: 'Analysis',
      date: new Date().toISOString().split('T')[0],
      duration: '0:00',
      fileSize: 0,
      analysisStatus: 'pending',
      perFrameStatus: 'pending'
    };

    return await this.createSession(sessionData);
  }

  /**
   * Update session with backend analysis results
   */
  static async updateSessionWithBackendData(
    backendSessionId: string,
    backendData: any
  ): Promise<void> {
    const session = await this.getSessionByBackendId(backendSessionId);
    if (!session) {
      console.warn(`Session not found for backend ID: ${backendSessionId}`);
      return;
    }

    const updates: Partial<Session> = {
      videoName: backendData.processed_video_filename || backendData.original_filename || session.videoName,
      originalVideoName: backendData.original_filename || session.originalVideoName,
      event: backendData.event || session.event,
      sessionType: backendData.session_type || session.sessionType,
      date: backendData.date || session.date,
      duration: backendData.duration || session.duration,
      fileSize: backendData.video_size ? Math.round(backendData.video_size / (1024 * 1024)) : session.fileSize,
      analysisStatus: backendData.status === 'completed' ? 'completed' : 
                     backendData.status === 'processing' ? 'processing' : 'pending',
      perFrameStatus: backendData.analytics_filename ? 'completed' : 'pending',
      motionIQ: backendData.motion_iq || session.motionIQ,
      aclRisk: backendData.acl_risk || session.aclRisk,
      riskLevel: backendData.acl_risk > 70 ? 'HIGH' : 
                 backendData.acl_risk > 40 ? 'MODERATE' : 'LOW',
      processedVideoUrl: backendData.processed_video_url || backendData.video_url,
      processedVideoFilename: backendData.processed_video_filename,
      analyticsFile: backendData.analytics_filename,
      analyticsFilename: backendData.analytics_filename,
      videoUrl: backendData.video_url,
      notes: backendData.notes || session.notes
    };

    await this.updateSession(session.id!, updates);
  }
}







