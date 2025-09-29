import { NextRequest, NextResponse } from 'next/server';
import { gymnasticsAPI } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const athleteId = searchParams.get('athleteId');
    const coachId = searchParams.get('coachId');
    const athleteEmail = searchParams.get('athleteEmail');

    console.log('🔍 Sessions API called with:', { athleteId, coachId, athleteEmail });

    // Get all sessions from MongoDB backend
    const backendResponse = await gymnasticsAPI.getSessions();
    
    if (!backendResponse.success || !backendResponse.sessions) {
      return NextResponse.json({
        success: true,
        sessions: []
      });
    }

    console.log('🔍 Backend response:', {
      success: backendResponse.success,
      sessionCount: backendResponse.sessions.length
    });

    // For now, return all sessions (we'll add filtering later)
    const sessions = backendResponse.sessions.map((session: any) => ({
      // MongoDB session data
      id: session._id,
      videoName: session.processed_video_filename || session.original_filename || 'Unknown Video',
      originalVideoName: session.original_filename || 'Unknown Video',
      event: session.event || 'Unknown Event',
      sessionType: 'Analysis',
      date: session.date || new Date().toISOString().split('T')[0],
      duration: session.duration || '0:00',
      fileSize: session.video_size ? Math.round(session.video_size / (1024 * 1024)) : 0,
      analysisStatus: session.status === 'completed' ? 'completed' : 
                     session.status === 'processing' ? 'processing' : 'pending',
      perFrameStatus: session.analytics_filename ? 'completed' : 'pending',
      motionIQ: session.motion_iq || 0,
      aclRisk: session.acl_risk || 0,
      riskLevel: session.acl_risk > 70 ? 'HIGH' : 
                 session.acl_risk > 40 ? 'MODERATE' : 'LOW',
      metrics: {
        averageElevationAngle: 0,
        averageFlightTime: 0,
        averageLandingQuality: 0,
        totalFrames: session.total_frames || 0,
        framesProcessed: session.total_frames || 0
      },
      notes: session.notes || '',
      hasProcessedVideo: !!session.processed_video_filename,
      processedVideoUrl: session.processed_video_url || session.video_url,
      analyticsFile: session.analytics_filename,
      // Placeholder tracking data (will be replaced with Firestore data later)
      athleteId: athleteId || '',
      athleteEmail: athleteEmail || '',
      athleteName: 'Unknown Athlete',
      coachId: coachId || '',
      coachEmail: '',
      coachName: 'Unknown Coach',
      backendSessionId: session._id,
      createdAt: new Date().toISOString()
    }));

    console.log('🔍 Returning sessions:', sessions.length);

    return NextResponse.json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}









