import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/services/sessionService';
import { gymnasticsAPI } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      videoName,
      athleteEmail,
      athleteName,
      event,
      sessionType,
      coachId,
      coachEmail,
      coachName,
      notes
    } = body;

    // Validate required fields
    if (!videoName || !athleteEmail || !athleteName || !event || !coachId || !coachEmail || !coachName) {
      return NextResponse.json(
        { error: 'Missing required fields: videoName, athleteEmail, athleteName, event, coachId, coachEmail, coachName' },
        { status: 400 }
      );
    }

    // Generate a unique session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Create session data
    const sessionData = {
      sessionId,
      athleteId: '', // Will be updated when athlete signs up
      athleteEmail,
      athleteName,
      coachId,
      coachEmail,
      coachName,
      videoName,
      originalVideoName: videoName,
      event,
      sessionType: sessionType || 'Analysis',
      date: new Date().toISOString().split('T')[0],
      duration: '0:00',
      fileSize: 0,
      analysisStatus: 'pending' as const,
      perFrameStatus: 'pending' as const,
      notes
    };

    // Create session in Firestore
    const sessionDocId = await SessionService.createSession(sessionData);

    // Start analysis on backend
    try {
      const analysisResult = await gymnasticsAPI.analyzeVideo1(
        sessionDocId,
        undefined // No cloudflare stream ID for uploaded videos
      );

      if (analysisResult.success) {
        // Update session with backend session ID
        await SessionService.updateSession(sessionDocId, {
          backendSessionId: analysisResult.session_id,
          analysisStatus: 'processing'
        });

        return NextResponse.json({
          success: true,
          message: 'Session created and analysis started successfully',
          sessionId: sessionDocId,
          backendSessionId: analysisResult.session_id,
          analysisStarted: true
        });
      } else {
        return NextResponse.json({
          success: true,
          message: 'Session created but analysis failed to start',
          sessionId: sessionDocId,
          analysisStarted: false,
          analysisError: analysisResult.error
        });
      }
    } catch (analysisError) {
      console.error('Analysis failed:', analysisError);
      return NextResponse.json({
        success: true,
        message: 'Session created but analysis failed to start',
        sessionId: sessionDocId,
        analysisStarted: false,
        analysisError: analysisError instanceof Error ? analysisError.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error creating session with athlete:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}







