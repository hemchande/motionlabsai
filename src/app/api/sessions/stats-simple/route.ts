import { NextRequest, NextResponse } from 'next/server';
import { gymnasticsAPI } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const athleteId = searchParams.get('athleteId');
    const coachId = searchParams.get('coachId');

    console.log('🔍 Stats API called with:', { athleteId, coachId });

    // Get all sessions from MongoDB backend
    const backendResponse = await gymnasticsAPI.getSessions();
    
    if (!backendResponse.success || !backendResponse.sessions) {
      return NextResponse.json({
        success: true,
        stats: {
          totalSessions: 0,
          completedAnalyses: 0,
          averageMotionIQ: 0,
          averageACLRisk: 0,
          riskDistribution: { low: 0, moderate: 0, high: 0 },
          eventBreakdown: {},
          recentSessions: []
        }
      });
    }

    console.log('🔍 Backend response for stats:', {
      success: backendResponse.success,
      sessionCount: backendResponse.sessions.length
    });

    // For now, calculate stats for all sessions (we'll add filtering later)
    const sessions = backendResponse.sessions;

    // Calculate statistics from MongoDB data
    const totalSessions = sessions.length;
    const completedAnalyses = sessions.filter((s: any) => s.status === 'completed').length;
    const avgMotionIQ = totalSessions > 0 ? 
      sessions.reduce((sum: number, s: any) => sum + (s.motion_iq || 0), 0) / totalSessions : 0;
    const avgACLRisk = totalSessions > 0 ? 
      sessions.reduce((sum: number, s: any) => sum + (s.acl_risk || 0), 0) / totalSessions : 0;
    
    const riskDistribution = {
      low: sessions.filter((s: any) => (s.acl_risk || 0) <= 40).length,
      moderate: sessions.filter((s: any) => (s.acl_risk || 0) > 40 && (s.acl_risk || 0) <= 70).length,
      high: sessions.filter((s: any) => (s.acl_risk || 0) > 70).length
    };
    
    const eventBreakdown: Record<string, number> = {};
    sessions.forEach((session: any) => {
      const event = session.event || 'Unknown Event';
      eventBreakdown[event] = (eventBreakdown[event] || 0) + 1;
    });

    // Get recent sessions (last 5)
    const recentSessions = sessions
      .sort((a: any, b: any) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
      .slice(0, 5)
      .map((session: any) => ({
        id: session._id,
        videoName: session.processed_video_filename || session.original_filename || 'Unknown Video',
        event: session.event || 'Unknown Event',
        date: session.date || new Date().toISOString().split('T')[0],
        analysisStatus: session.status === 'completed' ? 'completed' : 
                       session.status === 'processing' ? 'processing' : 'pending',
        motionIQ: session.motion_iq || 0,
        aclRisk: session.acl_risk || 0,
        riskLevel: session.acl_risk > 70 ? 'HIGH' : 
                   session.acl_risk > 40 ? 'MODERATE' : 'LOW'
      }));

    const stats = {
      totalSessions,
      completedAnalyses,
      averageMotionIQ: Math.round(avgMotionIQ),
      averageACLRisk: Math.round(avgACLRisk),
      riskDistribution,
      eventBreakdown,
      recentSessions
    };

    console.log('🔍 Returning stats:', stats);

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching session stats:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}









