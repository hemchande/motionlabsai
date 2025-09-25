import { NextRequest, NextResponse } from 'next/server';
import { gymnasticsAPI } from '@/lib/api';

// Helper function to get the correct API URL for server-side requests
function getServerSideAPIUrl() {
  // For server-side requests, use 127.0.0.1 instead of localhost
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5004';
  return apiUrl.replace('localhost', '127.0.0.1');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const athleteId = searchParams.get('athleteId');
    const coachId = searchParams.get('coachId');
    const athleteEmail = searchParams.get('athleteEmail');

    console.log('🔍 Sessions API called with:', { athleteId, coachId, athleteEmail });

    // Get all sessions from MongoDB backend using server-side URL
    const serverAPIUrl = getServerSideAPIUrl();
    const backendResponse = await fetch(`${serverAPIUrl}/getSessions`);
    
    if (!backendResponse.ok) {
      throw new Error(`Backend request failed: ${backendResponse.status}`);
    }
    
    const backendData = await backendResponse.json();
    
    if (!backendData.sessions) {
      return NextResponse.json({
        success: true,
        sessions: []
      });
    }

    console.log('🔍 Backend response:', {
      count: backendData.count,
      sessionCount: backendData.sessions.length
    });

    // For now, return all sessions (we'll add filtering later)
    const sessions = backendData.sessions.map((session: any) => ({
      // MongoDB session data
      id: session._id,
      sessionId: session._id, // Add sessionId field for analysis calls
      videoName: session.processed_video_filename || session.original_filename || 'Unknown Video',
      originalVideoName: session.original_filename || 'Unknown Video',
      event: (() => {
        const backendEvent = session.event || 'Unknown Event';
        // Map backend event names to frontend filter values
        if (backendEvent.toLowerCase().includes('floor')) return 'floor';
        if (backendEvent.toLowerCase().includes('vault')) return 'vault';
        if (backendEvent.toLowerCase().includes('bar')) return 'bars';
        if (backendEvent.toLowerCase().includes('beam')) return 'beam';
        return backendEvent;
      })(),
      sessionType: 'Analysis',
      date: session.date || new Date().toISOString().split('T')[0],
      duration: session.duration || '0:00',
      fileSize: session.video_size ? Math.round(session.video_size / (1024 * 1024)) : 0,
      status: (() => {
        const backendStatus = session.status;
        const processingStatus = session.processing_status;
        
        // Map backend statuses to frontend statuses
        if (backendStatus === 'completed' && processingStatus === 'completed') {
          return 'completed';
        } else if (backendStatus === 'processing' || processingStatus === 'analyzing') {
          return 'processing';
        } else if (backendStatus === 'uploaded' && (processingStatus === 'analysis_failed' || processingStatus === 'uploaded')) {
          return 'pending'; // Ready for analysis
        } else if (backendStatus === 'failed' || processingStatus === 'failed') {
          return 'failed';
        } else {
          return 'pending';
        }
      })(),
      analysisStatus: (() => {
        const backendStatus = session.status;
        const processingStatus = session.processing_status;
        
        // Map backend statuses to frontend statuses
        if (backendStatus === 'completed' && processingStatus === 'completed') {
          return 'completed';
        } else if (backendStatus === 'processing' || processingStatus === 'analyzing') {
          return 'processing';
        } else if (backendStatus === 'uploaded' && (processingStatus === 'analysis_failed' || processingStatus === 'uploaded')) {
          return 'pending'; // Ready for analysis
        } else if (backendStatus === 'failed' || processingStatus === 'failed') {
          return 'failed';
        } else {
          return 'pending';
        }
      })(),
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
      processedVideoUrl: (() => {
        // Priority 1: Use Cloudflare Stream URL if available
        if (session.meta && session.meta.analyzed_stream_url) {
          return session.meta.analyzed_stream_url;
        }
        // Priority 2: Use Cloudflare Stream URL for original video
        if (session.meta && session.meta.stream_url) {
          return session.meta.stream_url;
        }
        // Priority 3: Use processed video URL (GridFS fallback)
        if (session.processed_video_url) {
          return session.processed_video_url.replace('http://localhost:5004/getVideo?video_filename=', '/api/video/');
        }
        // Priority 4: Use video URL
        return session.video_url || '';
      })(),
      analyticsFile: session.analytics_filename,
      analyticsId: session.gridfs_analytics_id,
      analyticsUrl: session.analytics_url,
      // Cloudflare Stream metadata
      cloudflareStream: session.meta ? {
        originalStreamId: session.meta.cloudflare_stream_id,
        originalStreamUrl: session.meta.stream_url,
        analyzedStreamId: session.meta.analyzed_cloudflare_stream_id,
        analyzedStreamUrl: session.meta.analyzed_stream_url,
        uploadSource: session.meta.upload_source,
        readyToStream: session.meta.ready_to_stream,
        thumbnail: session.meta.thumbnail
      } : null,
      // Placeholder tracking data (will be replaced with Firestore data later)
      athleteId: athleteId || '',
      athleteEmail: athleteEmail || '',
      athleteName: session.athlete_name || 'Unknown Athlete',
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      backendSessionId, // MongoDB session ID
      athleteId,
      athleteEmail,
      athleteName,
      coachId,
      coachEmail,
      coachName
    } = body;

    // Validate required fields
    if (!backendSessionId || !athleteId || !athleteEmail || !athleteName || !coachId || !coachEmail || !coachName) {
      return NextResponse.json(
        { error: 'Missing required fields: backendSessionId, athleteId, athleteEmail, athleteName, coachId, coachEmail, coachName' },
        { status: 400 }
      );
    }

    // For now, just return success (we'll implement Firestore linking later)
    // Link the existing MongoDB session to the athlete in Firestore
    const sessionDocId = `firestore_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    return NextResponse.json({
      success: true,
      message: 'Session linked to athlete successfully (simplified)',
      sessionId: sessionDocId,
      backendSessionId
    });
  } catch (error) {
    console.error('Error linking session to athlete:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
