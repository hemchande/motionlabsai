// Test Athlete Invitation Email System
// Run with: node test-athlete-invitation.js

const sgMail = require('@sendgrid/mail');

// Your SendGrid API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || 'YOUR_SENDGRID_API_KEY_HERE';

console.log('🏆 Testing Athlete Invitation System...\n');

// Set API key
sgMail.setApiKey(SENDGRID_API_KEY);

// Test athlete invitation email
const invitationEmail = {
  to: 'eh52@rice.edu', // Your email for testing
  from: {
    email: 'connectarts00@gmail.com',
    name: 'Coach Sarah Johnson'
  },
  subject: 'You\'re invited to join Gymnastics Analytics!',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Athlete Invitation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .highlight { background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏆 Gymnastics Analytics Invitation</h1>
          <p>You've been invited to join the team!</p>
        </div>
        
        <div class="content">
          <h2>Hello Athlete!</h2>
          
          <p><strong>Coach Sarah Johnson</strong> has invited you to join <strong>Elite Gymnastics Academy</strong> as an athlete.</p>
          
          <div class="highlight">
            <strong>What you'll get:</strong>
            <ul>
              <li>📊 AI-powered motion analysis</li>
              <li>🛡️ ACL risk assessment</li>
              <li>📈 Performance tracking</li>
              <li>🎥 Video analysis tools</li>
              <li>📱 Personalized dashboard</li>
            </ul>
          </div>
          
          <p>Click the button below to accept your invitation and create your account:</p>
          
          <div style="text-align: center;">
            <a href="http://localhost:3000/signup?invited=true&coach=coach@example.com&athlete=eh52@rice.edu" class="button">Accept Invitation</a>
          </div>
          
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="http://localhost:3000/signup?invited=true&coach=coach@example.com&athlete=eh52@rice.edu" style="color: #667eea;">http://localhost:3000/signup?invited=true&coach=coach@example.com&athlete=eh52@rice.edu</a>
          </p>
          
          <p style="margin-top: 20px;">
            <strong>Questions?</strong> Reply to this email or contact Coach Sarah Johnson at coach@example.com
          </p>
        </div>
        
        <div class="footer">
          <p>This invitation was sent by Coach Sarah Johnson via Gymnastics Analytics</p>
          <p>© 2024 Gymnastics Analytics. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Gymnastics Analytics Invitation

Hello Athlete!

Coach Sarah Johnson has invited you to join Elite Gymnastics Academy as an athlete.

What you'll get:
- AI-powered motion analysis
- ACL risk assessment  
- Performance tracking
- Video analysis tools
- Personalized dashboard

To accept your invitation, visit this link:
http://localhost:3000/signup?invited=true&coach=coach@example.com&athlete=eh52@rice.edu

Questions? Reply to this email or contact Coach Sarah Johnson at coach@example.com

This invitation was sent by Coach Sarah Johnson via Gymnastics Analytics
© 2024 Gymnastics Analytics. All rights reserved.
  `
};

async function testAthleteInvitation() {
  try {
    console.log('📧 Sending athlete invitation email...');
    console.log('📨 To:', invitationEmail.to);
    console.log('📤 From:', invitationEmail.from.name + ' <' + invitationEmail.from.email + '>');
    console.log('📝 Subject:', invitationEmail.subject);
    
    const response = await sgMail.send(invitationEmail);
    
    console.log('\n✅ Athlete invitation sent successfully!');
    console.log('📨 Message ID:', response[0]?.headers['x-message-id'] || 'unknown');
    console.log('📤 Response Status:', response[0]?.statusCode || 'unknown');
    
    console.log('\n🎯 This tests the actual invitation system that coaches will use!');
    console.log('📧 Check your email for the invitation (including spam folder)');
    console.log('🔗 The invitation link will take you to the signup page');
    
  } catch (error) {
    console.error('\n❌ Error sending athlete invitation:', error.message);
    
    if (error.response) {
      console.error('📋 Error Details:', error.response.body);
    }
  }
}

// Run the test
testAthleteInvitation();










