import { NextRequest, NextResponse } from 'next/server';
import { AthleteRosterService } from '@/services/athleteRoster';
import { InvitationService } from '@/services/invitationService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invitationId, athleteId, athleteEmail, athleteName } = body;

    // Validate required fields
    if (!invitationId || !athleteId || !athleteEmail || !athleteName) {
      return NextResponse.json(
        { error: 'Missing required fields: invitationId, athleteId, athleteEmail, athleteName' },
        { status: 400 }
      );
    }

    // Get invitation details
    const invitation = await InvitationService.getInvitationByToken(invitationId);
    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if invitation is still valid
    if (!InvitationService.isInvitationValid(invitation)) {
      return NextResponse.json(
        { error: 'Invitation has expired or is no longer valid' },
        { status: 400 }
      );
    }

    // Accept invitation and add to roster
    const result = await AthleteRosterService.acceptInvitation(
      invitationId,
      athleteId,
      athleteEmail,
      athleteName
    );

    if (result.success) {
      // Update invitation status to accepted
      await InvitationService.updateInvitationStatus(
        invitation.id!,
        'accepted',
        athleteId
      );

      return NextResponse.json({
        success: true,
        message: 'Invitation accepted successfully. You have been added to the coach\'s roster.',
        coachName: invitation.coachName,
        institution: invitation.institution
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to accept invitation' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
