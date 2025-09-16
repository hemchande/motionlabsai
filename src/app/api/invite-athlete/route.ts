import { NextRequest, NextResponse } from 'next/server';
import { SendGridService, AthleteInvitation } from '@/services/sendgrid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coachName, coachEmail, athleteEmail, athleteName, institution } = body;

    // Validate required fields
    if (!coachName || !coachEmail || !athleteEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: coachName, coachEmail, athleteEmail' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(coachEmail) || !emailRegex.test(athleteEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Generate invitation link (in production, this would be a secure token)
    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signup?invited=true&coach=${encodeURIComponent(coachEmail)}&athlete=${encodeURIComponent(athleteEmail)}`;

    // Create invitation object
    const invitation: AthleteInvitation = {
      coachName,
      coachEmail,
      athleteEmail,
      athleteName,
      institution,
      invitationLink
    };

    // Send invitation email
    const result = await SendGridService.sendAthleteInvitation(invitation);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Athlete invitation sent successfully',
        messageId: result.messageId
      });
    } else {
      return NextResponse.json(
        { error: `Failed to send invitation: ${result.error}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending athlete invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Test SendGrid connection
  try {
    const isConnected = await SendGridService.testConnection();
    
    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'SendGrid connection successful'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'SendGrid connection failed'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error testing SendGrid connection:', error);
    return NextResponse.json(
      { error: 'Failed to test SendGrid connection' },
      { status: 500 }
    );
  }
}












