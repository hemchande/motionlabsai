import { NextRequest, NextResponse } from 'next/server';
import { BrevoService, AthleteInvitation } from '@/services/brevo';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coachName, coachEmail, athleteEmail, athleteName, institution, coachId } = body;

    // Validate required fields
    if (!coachName || !coachEmail || !athleteEmail || !coachId) {
      return NextResponse.json(
        { error: 'Missing required fields: coachName, coachEmail, athleteEmail, coachId' },
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

    // Generate invitation link with unique token
    const invitationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Use production URL in production, localhost in development
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? (process.env.NEXT_PUBLIC_APP_URL || 'https://gymnastics-analytics.vercel.app')
      : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    
    const invitationLink = `${baseUrl}/invite/${invitationToken}`;

    // Create invitation object
    const invitation: AthleteInvitation = {
      coachName,
      coachEmail,
      athleteEmail,
      athleteName,
      institution,
      invitationLink
    };

    // For now, skip Firestore and just send email
    // TODO: Add Firestore integration once database is enabled
    console.log('📝 Invitation data (Firestore disabled):', {
      coachId,
      coachName,
      coachEmail,
      athleteEmail,
      athleteName,
      institution,
      invitationToken,
      status: 'pending'
    });

    // Send invitation email
    const result = await BrevoService.sendAthleteInvitation(invitation);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Athlete invitation sent successfully (Firestore disabled)',
        messageId: result.messageId,
        invitationToken,
        note: 'Enable Firestore in Firebase Console to store invitation data'
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
  // Test Brevo connection
  try {
    const isConnected = await BrevoService.testConnection();
    
    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'Brevo connection successful (Firestore disabled)'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Brevo connection failed'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error testing Brevo connection:', error);
    return NextResponse.json(
      { error: 'Failed to test Brevo connection' },
      { status: 500 }
    );
  }
}

