import { NextRequest, NextResponse } from 'next/server';
import { InvitationService } from '@/services/invitationService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get('coachId');

    if (!coachId) {
      return NextResponse.json(
        { error: 'Missing required parameter: coachId' },
        { status: 400 }
      );
    }

    // Get invitation statistics
    const stats = await InvitationService.getCoachInvitationStats(coachId);
    
    // Get recent invitations
    const invitations = await InvitationService.getCoachInvitations(coachId);
    const recentInvitations = invitations.slice(0, 10); // Last 10 invitations

    return NextResponse.json({
      success: true,
      stats,
      recentInvitations
    });
  } catch (error) {
    console.error('Error fetching invitation stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}







