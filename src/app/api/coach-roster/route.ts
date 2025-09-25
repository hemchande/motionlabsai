import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Helper function to fetch session data for an athlete from Flask API
async function getAthleteSessionData(athleteEmail: string): Promise<{count: number, avgMotionIQ: number, completedAnalyses: number}> {
  try {
    const response = await fetch(`http://127.0.0.1:5004/getSessionsByUser/${encodeURIComponent(athleteEmail)}`);
    if (response.ok) {
      const data = await response.json();
      if (data.sessions && data.sessions.length > 0) {
        const sessions = data.sessions;
        const count = sessions.length;
        
        // Calculate average Motion IQ from completed sessions
        const completedSessions = sessions.filter(s => s.status === 'completed' && s.motion_iq !== null && s.motion_iq !== undefined);
        const avgMotionIQ = completedSessions.length > 0 
          ? Math.round(completedSessions.reduce((sum, s) => sum + (s.motion_iq || 0), 0) / completedSessions.length)
          : 0;
        
        const completedAnalyses = completedSessions.length;
        
        console.log(`Athlete ${athleteEmail}: ${count} sessions, ${completedAnalyses} completed, avg Motion IQ: ${avgMotionIQ}`);
        
        return { count, avgMotionIQ, completedAnalyses };
      }
    }
    console.log(`No sessions found for athlete: ${athleteEmail}`);
    return { count: 0, avgMotionIQ: 0, completedAnalyses: 0 };
  } catch (error) {
    console.error(`Error fetching sessions for athlete ${athleteEmail}:`, error);
    return { count: 0, avgMotionIQ: 0, completedAnalyses: 0 };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get('coachId');
    const athleteEmail = searchParams.get('athleteEmail');

    if (!coachId) {
      return NextResponse.json(
        { error: 'Missing required parameter: coachId' },
        { status: 400 }
      );
    }

    // If athleteEmail is provided, return stats for that specific athlete
    if (athleteEmail) {
      const sessionData = await getAthleteSessionData(athleteEmail);
      const stats = {
        totalSessions: sessionData.count,
        avgMotionIQ: sessionData.avgMotionIQ,
        completedAnalyses: sessionData.completedAnalyses,
        totalEvents: sessionData.count, // Using session count as proxy for events
        improvement: 0 // Could be calculated from session progression
      };
      
      return NextResponse.json({
        success: true,
        stats
      });
    }

    // Get accepted athletes from roster
    let acceptedAthletes = [];
    try {
      const rosterQuery = query(
        collection(db, 'athlete_rosters', coachId, 'athletes'),
        orderBy('joinedAt', 'desc')
      );
      const rosterSnapshot = await getDocs(rosterQuery);
      const athleteDocs = rosterSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: 'accepted',
        type: 'athlete'
      }));

      // Fetch actual session data for each athlete
      console.log(`Fetching session data for ${athleteDocs.length} athletes...`);
      acceptedAthletes = await Promise.all(
        athleteDocs.map(async (athlete) => {
          const sessionData = await getAthleteSessionData(athlete.email);
          console.log(`Athlete ${athlete.email}: ${sessionData.count} sessions, ${sessionData.avgMotionIQ} avg Motion IQ`);
          return {
            ...athlete,
            sessions: sessionData.count,
            motionIQ: sessionData.avgMotionIQ,
            completedAnalyses: sessionData.completedAnalyses
          };
        })
      );
    } catch (error) {
      console.log('No athlete roster found or error fetching:', error);
      acceptedAthletes = [];
    }

    // Fallback: If no athletes in roster, show athletes who have sessions (for demo purposes)
    if (acceptedAthletes.length === 0) {
      console.log('No athletes in roster, checking for athletes with sessions...');
      try {
        // Get all sessions from Flask API to find athletes with activity
        console.log('Fetching sessions from Flask API (updated)...');
        const response = await fetch('http://127.0.0.1:5004/getSessions');
        console.log('Flask API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Flask API response data:', JSON.stringify(data, null, 2));
          
          if (data.sessions && data.sessions.length > 0) {
            console.log(`Found ${data.sessions.length} sessions in Flask API`);
            
            // Group sessions by user_id to find athletes with sessions
            const athleteSessionCounts = new Map();
            data.sessions.forEach(session => {
              const userId = session.user_id;
              console.log(`Processing session for user: ${userId}`);
              if (userId) {
                athleteSessionCounts.set(userId, (athleteSessionCounts.get(userId) || 0) + 1);
              }
            });

            console.log('Athlete session counts:', Object.fromEntries(athleteSessionCounts));

            // Create athlete entries for those with sessions using real data
            for (const [userId, sessionCount] of athleteSessionCounts) {
              if (sessionCount > 0) {
                console.log(`Creating athlete entry for ${userId} with ${sessionCount} sessions`);
                const sessionData = await getAthleteSessionData(userId);
                acceptedAthletes.push({
                  id: userId,
                  email: userId,
                  name: `Athlete (${userId})`,
                  status: 'active',
                  type: 'athlete',
                  sessions: sessionData.count,
                  motionIQ: sessionData.avgMotionIQ,
                  completedAnalyses: sessionData.completedAnalyses,
                  level: 'Intermediate',
                  age: 18,
                  lastSession: 'Recent',
                  improvement: '+5%'
                });
              }
            }
            console.log(`Found ${acceptedAthletes.length} athletes with sessions for demo purposes`);
          } else {
            console.log('No sessions found in Flask API response');
          }
        } else {
          console.log('Flask API request failed with status:', response.status);
        }
      } catch (error) {
        console.log('Error fetching fallback athlete data:', error);
      }
    }

    // Get pending invitations
    let pendingInvitations = [];
    try {
      // Get all invitations and filter in memory (more reliable)
      const invitationsSnapshot = await getDocs(collection(db, 'invitations'));
      const allInvitations = invitationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter for this coach and pending status
      const coachPendingInvitations = allInvitations.filter(inv => 
        inv.coachId === coachId && inv.status === 'pending'
      );
      
      pendingInvitations = coachPendingInvitations.map(inv => ({
        id: inv.id,
        ...inv,
        status: 'pending',
        type: 'invitation',
        // Map invitation fields to match athlete structure
        name: inv.athleteName || 'Unknown',
        email: inv.athleteEmail,
        joinedAt: inv.createdAt,
        // Default values for pending invitations
        age: null,
        level: 'Pending',
        events: [],
        motionIQ: 0,
        sessions: 0,
        lastSession: null,
        improvement: '0%'
      }));
    } catch (error) {
      console.log('No invitations found or error fetching:', error);
      pendingInvitations = [];
    }

    // Combine and sort by date (most recent first)
    const combinedRoster = [...acceptedAthletes, ...pendingInvitations].sort((a, b) => {
      const dateA = a.joinedAt?.toDate?.() || new Date(a.joinedAt);
      const dateB = b.joinedAt?.toDate?.() || new Date(b.joinedAt);
      return dateB.getTime() - dateA.getTime();
    });

    // Calculate statistics using actual session data
    const totalSessions = acceptedAthletes.reduce((sum, athlete) => sum + (athlete.sessions || 0), 0);
    const totalCompletedAnalyses = acceptedAthletes.reduce((sum, athlete) => sum + (athlete.completedAnalyses || 0), 0);
    const stats = {
      totalAthletes: acceptedAthletes.length,
      pendingInvitations: pendingInvitations.length,
      totalSessions: totalSessions,
      avgMotionIQ: acceptedAthletes.length > 0 
        ? Math.round(acceptedAthletes.reduce((sum, athlete) => sum + (athlete.motionIQ || 0), 0) / acceptedAthletes.length)
        : 0,
      avgACLRisk: 18, // Mock value
      completedAnalyses: totalCompletedAnalyses
    };

    console.log(`Coach roster stats: ${acceptedAthletes.length} athletes, ${totalSessions} total sessions`);

    return NextResponse.json({
      success: true,
      roster: combinedRoster,
      stats
    });
  } catch (error) {
    console.error('Error fetching coach roster:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get('coachId');
    const athleteId = searchParams.get('athleteId');
    const type = searchParams.get('type'); // 'athlete' or 'invitation'

    if (!coachId || !athleteId || !type) {
      return NextResponse.json(
        { error: 'Missing required parameters: coachId, athleteId, type' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting from coach roster:', { coachId, athleteId, type });

    if (type === 'athlete') {
      // Delete athlete from roster
      const athleteRef = doc(db, 'athlete_rosters', coachId, 'athletes', athleteId);
      await deleteDoc(athleteRef);
      console.log('✅ Athlete deleted from roster:', athleteId);
    } else if (type === 'invitation') {
      // Delete invitation
      const invitationRef = doc(db, 'invitations', athleteId);
      await deleteDoc(invitationRef);
      console.log('✅ Invitation deleted:', athleteId);
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "athlete" or "invitation"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${type === 'athlete' ? 'Athlete' : 'Invitation'} deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting from coach roster:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
