import { NextRequest, NextResponse } from 'next/server';
import { AthleteRosterService } from '@/services/athleteRoster';

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

    // Get coach's athletes
    const athletes = await AthleteRosterService.getCoachAthletes(coachId);

    return NextResponse.json({
      success: true,
      athletes,
      count: athletes.length
    });
  } catch (error) {
    console.error('Error fetching athlete roster:', error);
    return NextResponse.json(
      { error: 'Failed to fetch athlete roster' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coachId, athleteId, athleteEmail, athleteName } = body;

    // Validate required fields
    if (!coachId || !athleteId || !athleteEmail || !athleteName) {
      return NextResponse.json(
        { error: 'Missing required fields: coachId, athleteId, athleteEmail, athleteName' },
        { status: 400 }
      );
    }

    // Add athlete to roster
    const result = await AthleteRosterService.addAthleteToRoster(
      coachId,
      athleteId,
      athleteEmail,
      athleteName
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Athlete added to roster successfully'
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to add athlete to roster' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error adding athlete to roster:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { coachId, athleteId, status } = body;

    // Validate required fields
    if (!coachId || !athleteId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: coachId, athleteId, status' },
        { status: 400 }
      );
    }

    // Update athlete status
    const result = await AthleteRosterService.updateAthleteStatus(
      coachId,
      athleteId,
      status
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Athlete status updated successfully'
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to update athlete status' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating athlete status:', error);
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

    if (!coachId || !athleteId) {
      return NextResponse.json(
        { error: 'Missing required parameters: coachId, athleteId' },
        { status: 400 }
      );
    }

    // Remove athlete from roster
    const result = await AthleteRosterService.removeAthleteFromRoster(
      coachId,
      athleteId
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Athlete removed from roster successfully'
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to remove athlete from roster' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error removing athlete from roster:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}





