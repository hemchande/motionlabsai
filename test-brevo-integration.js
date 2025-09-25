// Test script for Brevo integration
// Using built-in fetch (Node.js 18+)

const BREVO_API_KEY = process.env.BREVO_API_KEY || 'your_brevo_api_key_here';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

async function testBrevoConnection() {
  console.log('Testing Brevo connection...');
  
  try {
    const emailData = {
      sender: {
        name: "motionlabsai",
        email: "noreply@motionlabsai.com"
      },
      to: [
        {
          email: "hemchandeisha@gmail.com",
          name: "Eisha Hemchand"
        }
      ],
      subject: "Test Brevo Integration - Gymnastics Analytics",
      htmlContent: `
        <html>
        <head></head>
        <body>
          <h1>Test Email from Brevo Integration</h1>
          <p>This is a test email to verify that the Brevo integration is working correctly.</p>
          <p>If you receive this email, the integration is successful!</p>
        </body>
        </html>
      `
    };

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Brevo API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log('✅ Brevo test email sent successfully!');
    console.log('Message ID:', result.messageId);
    return true;
  } catch (error) {
    console.error('❌ Brevo test failed:', error.message);
    return false;
  }
}

async function testAthleteInvitation() {
  console.log('\nTesting athlete invitation...');
  
  try {
    const invitationData = {
      coachName: "Test Coach",
      coachEmail: "coach@example.com",
      athleteEmail: "hemchandeisha@gmail.com",
      athleteName: "Eisha Hemchand",
      institution: "Test Gymnastics Academy",
      invitationLink: "https://gymnastics-analytics.vercel.app/signup?invited=true&coach=coach@example.com&athlete=hemchandeisha@gmail.com"
    };

    const response = await fetch('http://localhost:3000/api/invite-athlete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invitationData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log('✅ Athlete invitation sent successfully!');
    console.log('Response:', result);
    return true;
  } catch (error) {
    console.error('❌ Athlete invitation test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Brevo Integration Tests\n');
  
  const brevoTest = await testBrevoConnection();
  
  if (brevoTest) {
    console.log('\n📧 Direct Brevo test passed! Now testing the API endpoint...');
    await testAthleteInvitation();
  }
  
  console.log('\n✨ Tests completed!');
}

runTests().catch(console.error);
