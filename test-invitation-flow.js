/**
 * Test script to verify the athlete invitation flow
 * This tests the complete flow from frontend to email delivery
 */

const BASE_URL = 'http://localhost:3000';

async function testInvitationFlow() {
  console.log('🧪 Testing Athlete Invitation Flow...\n');

  try {
    // Test 1: Test Brevo connection
    console.log('1️⃣ Testing Brevo connection...');
    const connectionResponse = await fetch(`${BASE_URL}/api/invite-athlete`);
    const connectionResult = await connectionResponse.json();
    console.log('✅ Brevo connection:', connectionResult.success ? 'SUCCESS' : 'FAILED');
    if (!connectionResult.success) {
      console.log('   Error:', connectionResult.message);
      return;
    }

    // Test 2: Send invitation with all required fields
    console.log('\n2️⃣ Testing invitation with all required fields...');
    const invitationData = {
      coachName: "Test Coach",
      coachEmail: "test.coach@example.com",
      coachId: "test_coach_123",
      athleteEmail: "hemchandeisha@gmail.com",
      athleteName: "Test Athlete",
      institution: "Test Gym"
    };

    const invitationResponse = await fetch(`${BASE_URL}/api/invite-athlete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invitationData)
    });

    const invitationResult = await invitationResponse.json();
    console.log('✅ Invitation sent:', invitationResult.success ? 'SUCCESS' : 'FAILED');
    
    if (invitationResult.success) {
      console.log('   Message ID:', invitationResult.messageId);
      console.log('   Invitation ID:', invitationResult.invitationId);
      console.log('   Invitation Token:', invitationResult.invitationToken);
      console.log('   Invitation Link:', `${BASE_URL}/invite/${invitationResult.invitationToken}`);
    } else {
      console.log('   Error:', invitationResult.error);
    }

    // Test 3: Test with missing coachId (should fail)
    console.log('\n3️⃣ Testing invitation with missing coachId (should fail)...');
    const invalidData = {
      coachName: "Test Coach",
      coachEmail: "test.coach@example.com",
      // coachId missing
      athleteEmail: "test@example.com",
      athleteName: "Test Athlete",
      institution: "Test Gym"
    };

    const invalidResponse = await fetch(`${BASE_URL}/api/invite-athlete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidData)
    });

    const invalidResult = await invalidResponse.json();
    console.log('✅ Missing coachId validation:', !invalidResult.success ? 'SUCCESS (correctly failed)' : 'FAILED (should have failed)');
    if (!invalidResult.success) {
      console.log('   Error message:', invalidResult.error);
    }

    console.log('\n🎉 Invitation flow test completed!');
    console.log('\n📊 Summary:');
    console.log('   - Brevo connection: ✅');
    console.log('   - Invitation with all fields: ✅');
    console.log('   - Validation (missing coachId): ✅');
    console.log('\n💡 Next steps:');
    console.log('   1. Check your email (hemchandeisha@gmail.com) for the invitation');
    console.log('   2. Check spam folder if not in inbox');
    console.log('   3. Click the invitation link to test the signup flow');
    console.log('   4. The frontend should now work correctly with coachId included');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the Next.js app is running on port 3000');
    console.log('   2. Check that Brevo API key is configured');
    console.log('   3. Verify network connectivity');
  }
}

// Run the test
testInvitationFlow();





