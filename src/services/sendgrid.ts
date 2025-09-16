import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || 'YOUR_SENDGRID_API_KEY_HERE';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface AthleteInvitation {
  coachName: string;
  coachEmail: string;
  athleteEmail: string;
  athleteName?: string;
  institution?: string;
  invitationLink: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class SendGridService {
  /**
   * Send athlete invitation email
   */
  static async sendAthleteInvitation(invitation: AthleteInvitation): Promise<EmailResponse> {
    try {
      if (!SENDGRID_API_KEY) {
        throw new Error('SendGrid API key not configured');
      }

      const msg = {
        to: invitation.athleteEmail,
        from: {
          email: 'connectarts00@gmail.com', // Use verified sender email
          name: invitation.coachName
        },
        replyTo: invitation.coachEmail, // Set coach email as reply-to
        subject: `You're invited to join ${invitation.institution || 'Gymnastics Analytics'}!`,
        html: this.generateInvitationEmailHTML(invitation),
        text: this.generateInvitationEmailText(invitation)
      };

      const response = await sgMail.send(msg);
      
      return {
        success: true,
        messageId: response[0]?.headers['x-message-id'] || 'unknown'
      };
    } catch (error) {
      console.error('SendGrid error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate HTML version of invitation email
   */
  private static generateInvitationEmailHTML(invitation: AthleteInvitation): string {
    return `
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
            <h2>Hello${invitation.athleteName ? ` ${invitation.athleteName}` : ''}!</h2>
            
            <p><strong>${invitation.coachName}</strong> has invited you to join <strong>${invitation.institution || 'Gymnastics Analytics'}</strong> as an athlete.</p>
            
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
              <a href="${invitation.invitationLink}" class="button">Accept Invitation</a>
            </div>
            
            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${invitation.invitationLink}" style="color: #667eea;">${invitation.invitationLink}</a>
            </p>
            
            <p style="margin-top: 20px;">
              <strong>Questions?</strong> Reply to this email or contact ${invitation.coachName} at ${invitation.coachEmail}
            </p>
          </div>
          
          <div class="footer">
            <p>This invitation was sent by ${invitation.coachName} via Gymnastics Analytics</p>
            <p>© 2024 Gymnastics Analytics. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate text version of invitation email
   */
  private static generateInvitationEmailText(invitation: AthleteInvitation): string {
    return `
Gymnastics Analytics Invitation

Hello${invitation.athleteName ? ` ${invitation.athleteName}` : ''}!

${invitation.coachName} has invited you to join ${invitation.institution || 'Gymnastics Analytics'} as an athlete.

What you'll get:
- AI-powered motion analysis
- ACL risk assessment  
- Performance tracking
- Video analysis tools
- Personalized dashboard

To accept your invitation, visit this link:
${invitation.invitationLink}

Questions? Reply to this email or contact ${invitation.coachName} at ${invitation.coachEmail}

This invitation was sent by ${invitation.coachName} via Gymnastics Analytics
© 2024 Gymnastics Analytics. All rights reserved.
    `;
  }

  /**
   * Send welcome email to newly registered athlete
   */
  static async sendWelcomeEmail(athleteEmail: string, athleteName: string, coachName: string): Promise<EmailResponse> {
    try {
      if (!SENDGRID_API_KEY) {
        throw new Error('SendGrid API key not configured');
      }

      const msg = {
        to: athleteEmail,
        from: {
          email: 'connectarts00@gmail.com', // Use verified sender email
          name: 'Gymnastics Analytics'
        },
        subject: `Welcome to Gymnastics Analytics, ${athleteName}!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Welcome to Gymnastics Analytics</title>
          </head>
          <body>
            <h1>Welcome to Gymnastics Analytics, ${athleteName}!</h1>
            <p>Your account has been successfully created and you're now part of ${coachName}'s team.</p>
            <p>You can now:</p>
            <ul>
              <li>Upload training videos</li>
              <li>View AI-powered analysis</li>
              <li>Track your performance</li>
              <li>Access your personalized dashboard</li>
            </ul>
            <p>Happy training!</p>
          </body>
          </html>
        `
      };

      const response = await sgMail.send(msg);
      
      return {
        success: true,
        messageId: response[0]?.headers['x-message-id'] || 'unknown'
      };
    } catch (error) {
      console.error('SendGrid welcome email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Test SendGrid connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      if (!SENDGRID_API_KEY) {
        return false;
      }
      
      // Try to send a test email to verify API key works
      const msg = {
        to: 'test@example.com',
        from: 'connectarts00@gmail.com', // Use verified sender email
        subject: 'Test Email',
        text: 'This is a test email to verify SendGrid connection.'
      };
      
      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error('SendGrid connection test failed:', error);
      return false;
    }
  }
}




