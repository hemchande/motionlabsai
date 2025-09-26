import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/services/sessionService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      backendSessionId,
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

    const sessionDocId = await SessionService.linkBackendSessionToAthlete(
      backendSessionId,
      athleteId,
      athleteEmail,
      athleteName,
      coachId,
      coachEmail,
      coachName
    );

    return NextResponse.json({
      success: true,
      message: 'Session linked to athlete successfully',
      sessionId: sessionDocId
    });
  } catch (error) {
    console.error('Error linking session to athlete:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}







