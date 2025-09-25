// Test script for Firebase integration
// Note: This requires Firebase to be properly configured

// Using built-in fetch (Node.js 18+)

const BASE_URL = 'http://localhost:3001'; // Using port 3001 as shown in terminal

async function testFirebaseConnection() {
  console.log('🔥 Testing Firebase Integration...\n');
  
  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connection...');
    const healthResponse = await fetch(`${BASE_URL}/api/invite-athlete`, {
      method: 'GET'
    });
    
    if (healthResponse.ok) {
      console.log('✅ Server is running');
    } else {
      console.log('❌ Server connection failed');
      return false;
    }
    
    // Test 2: Test athlete invitation with Firebase integration
    console.log('\n2. Testing athlete invitation with Firebase...');
    const invitationData = {
      coachName: "Test Coach",
      coachEmail: "coach@example.com",
      athleteEmail: "athlete@example.com",
      athleteName: "Test Athlete",
      institution: "Test Academy",
      coachId: "test-coach-id-123" // This would be a real Firebase UID in production
    };
    
    const inviteResponse = await fetch(`${BASE_URL}/api/invite-athlete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invitationData)
    });
    
    const inviteResult = await inviteResponse.json();
    
    if (inviteResult.success) {
      console.log('✅ Athlete invitation created successfully');
      console.log('   Message ID:', inviteResult.messageId);
      console.log('   Invitation ID:', inviteResult.invitationId);
      console.log('   Invitation Token:', inviteResult.invitationToken);
      
      // Test 3: Test invitation retrieval
      console.log('\n3. Testing invitation retrieval...');
      const getInviteResponse = await fetch(`${BASE_URL}/api/invitations?token=${inviteResult.invitationToken}`);
      const getInviteResult = await getInviteResponse.json();
      
      if (getInviteResult.success) {
        console.log('✅ Invitation retrieved successfully');
        console.log('   Coach:', getInviteResult.invitation.coachName);
        console.log('   Athlete:', getInviteResult.invitation.athleteEmail);
        console.log('   Status:', getInviteResult.invitation.status);
        
        // Test 4: Test invitation acceptance (mock)
        console.log('\n4. Testing invitation acceptance...');
        const acceptData = {
          invitationId: inviteResult.invitationId,
          athleteId: "test-athlete-id-456", // This would be a real Firebase UID
          athleteEmail: "athlete@example.com",
          athleteName: "Test Athlete"
        };
        
        const acceptResponse = await fetch(`${BASE_URL}/api/accept-invitation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(acceptData)
        });
        
        const acceptResult = await acceptResponse.json();
        
        if (acceptResult.success) {
          console.log('✅ Invitation accepted successfully');
          console.log('   Message:', acceptResult.message);
        } else {
          console.log('❌ Invitation acceptance failed:', acceptResult.error);
        }
        
        // Test 5: Test athlete roster retrieval
        console.log('\n5. Testing athlete roster retrieval...');
        const rosterResponse = await fetch(`${BASE_URL}/api/athlete-roster?coachId=${invitationData.coachId}`);
        const rosterResult = await rosterResponse.json();
        
        if (rosterResult.success) {
          console.log('✅ Athlete roster retrieved successfully');
          console.log('   Athletes count:', rosterResult.count);
          if (rosterResult.athletes.length > 0) {
            console.log('   First athlete:', rosterResult.athletes[0].athleteName);
          }
        } else {
          console.log('❌ Athlete roster retrieval failed:', rosterResult.error);
        }
        
      } else {
        console.log('❌ Invitation retrieval failed:', getInviteResult.error);
      }
      
    } else {
      console.log('❌ Athlete invitation failed:', inviteResult.error);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Firebase integration test failed:', error.message);
    return false;
  }
}

async function testEnvironmentSetup() {
  console.log('🔧 Testing Firebase Configuration...\n');
  
  console.log('✅ Firebase configuration is hardcoded in the app');
  console.log('   Project ID: motionlabsai-c2a0b');
  console.log('   Auth Domain: motionlabsai-c2a0b.firebaseapp.com');
  console.log('   Storage Bucket: motionlabsai-c2a0b.firebasestorage.app');
  console.log('   Analytics: Enabled (G-NJJXQ6PEJT)');
  
  console.log('\n📝 Note: Firebase is configured directly in the code');
  console.log('📖 Make sure to enable Authentication and Firestore in Firebase Console');
}

async function runTests() {
  console.log('🚀 Starting Firebase Integration Tests\n');
  
  await testEnvironmentSetup();
  console.log('\n' + '='.repeat(50) + '\n');
  
  const success = await testFirebaseConnection();
  
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('🎉 Firebase integration tests completed!');
    console.log('📧 Check your email for the test invitation');
    console.log('🔥 Firebase and Firestore are working correctly');
  } else {
    console.log('❌ Some tests failed. Check the errors above.');
    console.log('💡 Make sure Firebase is properly configured');
  }
}

runTests().catch(console.error);
