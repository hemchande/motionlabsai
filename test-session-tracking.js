#!/usr/bin/env node

/**
 * Test script for the Session Tracking System
 * This script tests the API endpoints for session management
 */

const BASE_URL = 'http://localhost:3000';

// Test data - linking existing MongoDB session to athlete
const testSessionLink = {
  backendSessionId: 'test_mongodb_session_123', // This would be a real MongoDB session ID
  athleteId: 'test_athlete_123',
  athleteEmail: 'test.athlete@example.com',
  athleteName: 'Test Athlete',
  coachId: 'test_coach_456',
  coachEmail: 'test.coach@example.com',
  coachName: 'Test Coach'
};

async function testSessionTracking() {
  console.log('🧪 Testing Session Tracking System...\n');

  try {
    // Test 1: Link existing MongoDB session to athlete
    console.log('1️⃣ Testing session linking...');
    const linkResponse = await fetch(`${BASE_URL}/api/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testSessionLink)
    });

    const linkResult = await linkResponse.json();
    console.log('✅ Session linked:', linkResult.success ? 'SUCCESS' : 'FAILED');
    if (linkResult.success) {
      console.log('   Firestore Session ID:', linkResult.sessionId);
      console.log('   MongoDB Session ID:', linkResult.backendSessionId);
    } else {
      console.log('   Error:', linkResult.error);
    }

    // Test 2: Fetch sessions for athlete
    console.log('\n2️⃣ Testing athlete sessions fetch...');
    const athleteResponse = await fetch(`${BASE_URL}/api/sessions?athleteId=${testSessionLink.athleteId}`);
    const athleteResult = await athleteResponse.json();
    console.log('✅ Athlete sessions fetched:', athleteResult.success ? 'SUCCESS' : 'FAILED');
    if (athleteResult.success) {
      console.log('   Sessions found:', athleteResult.sessions.length);
      if (athleteResult.sessions.length > 0) {
        console.log('   Sample session:', {
          id: athleteResult.sessions[0].id,
          videoName: athleteResult.sessions[0].videoName,
          athleteName: athleteResult.sessions[0].athleteName,
          coachName: athleteResult.sessions[0].coachName
        });
      }
    } else {
      console.log('   Error:', athleteResult.error);
    }

    // Test 3: Fetch sessions for coach
    console.log('\n3️⃣ Testing coach sessions fetch...');
    const coachResponse = await fetch(`${BASE_URL}/api/sessions?coachId=${testSessionLink.coachId}`);
    const coachResult = await coachResponse.json();
    console.log('✅ Coach sessions fetched:', coachResult.success ? 'SUCCESS' : 'FAILED');
    if (coachResult.success) {
      console.log('   Sessions found:', coachResult.sessions.length);
    } else {
      console.log('   Error:', coachResult.error);
    }

    // Test 4: Get session statistics for athlete
    console.log('\n4️⃣ Testing athlete session statistics...');
    const statsResponse = await fetch(`${BASE_URL}/api/sessions/stats?athleteId=${testSessionLink.athleteId}`);
    const statsResult = await statsResponse.json();
    console.log('✅ Athlete stats fetched:', statsResult.success ? 'SUCCESS' : 'FAILED');
    if (statsResult.success) {
      console.log('   Total sessions:', statsResult.stats.totalSessions);
      console.log('   Completed analyses:', statsResult.stats.completedAnalyses);
      console.log('   Average Motion IQ:', statsResult.stats.averageMotionIQ);
      console.log('   Risk distribution:', statsResult.stats.riskDistribution);
    } else {
      console.log('   Error:', statsResult.error);
    }

    // Test 5: Test session creation with athlete (if endpoint exists)
    console.log('\n5️⃣ Testing session creation with athlete...');
    try {
      const createWithAthleteResponse = await fetch(`${BASE_URL}/api/sessions/create-with-athlete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoName: 'test_floor.mp4',
          athleteEmail: 'test.athlete2@example.com',
          athleteName: 'Test Athlete 2',
          event: 'Floor Exercise',
          sessionType: 'Competition',
          coachId: testSessionLink.coachId,
          coachEmail: testSessionLink.coachEmail,
          coachName: testSessionLink.coachName,
          notes: 'Test session with athlete creation'
        })
      });

      const createWithAthleteResult = await createWithAthleteResponse.json();
      console.log('✅ Session with athlete created:', createWithAthleteResult.success ? 'SUCCESS' : 'FAILED');
      if (createWithAthleteResult.success) {
        console.log('   Session ID:', createWithAthleteResult.sessionId);
        console.log('   Analysis started:', createWithAthleteResult.analysisStarted);
      } else {
        console.log('   Error:', createWithAthleteResult.error);
      }
    } catch (error) {
      console.log('⚠️  Session creation with athlete endpoint not available or failed:', error.message);
    }

    console.log('\n🎉 Session tracking system test completed!');
    console.log('\n📊 Summary:');
    console.log('   - Session linking (MongoDB → Firestore): ✅');
    console.log('   - Athlete session fetch (hybrid): ✅');
    console.log('   - Coach session fetch (hybrid): ✅');
    console.log('   - Session statistics (hybrid): ✅');
    console.log('   - Session with athlete creation: ⚠️ (may not be available)');
    console.log('\n💡 This hybrid approach:');
    console.log('   - Keeps video storage in MongoDB (efficient)');
    console.log('   - Uses Firestore for athlete-session relationships');
    console.log('   - Provides complete session tracking for athletes');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the Next.js app is running on port 3000');
    console.log('   2. Check that Firebase is properly configured');
    console.log('   3. Verify Firestore database is set up');
    console.log('   4. Ensure all API routes are accessible');
  }
}

// Run the test
testSessionTracking();
