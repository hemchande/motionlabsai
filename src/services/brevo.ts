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

export class BrevoService {
  private static readonly BREVO_API_KEY = process.env.BREVO_API_KEY || 'your_brevo_api_key_here';
  private static readonly BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

  /**
   * Send athlete invitation email using Brevo
   */
  static async sendAthleteInvitation(invitation: AthleteInvitation): Promise<EmailResponse> {
    try {
      if (!this.BREVO_API_KEY) {
        throw new Error('Brevo API key not configured');
      }

      const emailData = {
        sender: {
          name: "motionlabsai",
          email: "noreply@motionlabsai.com"
        },
        to: [
          {
            email: invitation.athleteEmail,
            name: invitation.athleteName || invitation.athleteEmail
          }
        ],
        subject: `${invitation.coachName} has invited you to unlock your Performance Insights with MotionLabs AI`,
        htmlContent: this.generateInvitationEmailHTML(invitation)
      };

      const response = await fetch(this.BREVO_API_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': this.BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Brevo API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('Brevo error:', error);
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
        <title>MotionLabs AI Invitation</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #00bcd4 0%, #0097a7 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #00bcd4 0%, #0097a7 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 30px 0; font-size: 16px; box-shadow: 0 4px 15px rgba(0, 188, 212, 0.3); transition: transform 0.2s; }
          .button:hover { transform: translateY(-2px); }
          .footer { text-align: center; margin-top: 40px; color: #666; font-size: 14px; padding: 20px; background: #f8f9fa; }
          .feature-list { background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #00bcd4; }
          .feature-list ul { margin: 0; padding-left: 20px; }
          .feature-list li { margin: 10px 0; font-size: 16px; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .highlight { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #bbdefb; }
          .cta-section { text-align: center; margin: 30px 0; }
          .signature { margin-top: 30px; font-style: italic; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏆 MotionLabs AI</div>
            <h1 style="margin: 0; font-size: 28px;">Unlock Your Performance Potential</h1>
          </div>
          
          <div class="content">
            <h2>Welcome ${invitation.athleteName || 'Athlete'}!</h2>
            
            <p>Your coach, <strong>${invitation.coachName}</strong>, has invited you to join <strong>${invitation.institution || 'the team'}</strong> on MotionLabs AI - a platform built to enhance your form and prevent injuries so you can unlock your full potential.</p>
            
            <div class="feature-list">
              <strong>With MotionLabs AI, you'll receive:</strong>
              <ul>
                <li>📊 <strong>Personalized performance insights</strong> powered by AI pose estimation analysis</li>
                <li>🎯 <strong>Form feedback</strong> to improve technique and get granular data analytics so you know where to improve</li>
                <li>🛡️ <strong>Injury prevention tools</strong> to protect your body and train smarter</li>
                <li>🔥 <strong>Progress tracking</strong> to keep you motivated and accountable and see your potential soar</li>
              </ul>
            </div>
            
            <div class="cta-section">
              <p><strong>Join with 1-click:</strong></p>
              <p>👉 Click the button below to accept your invitation and create your athlete profile</p>
              
              <a href="${invitation.invitationLink}" class="button">Accept Invitation</a>
            </div>
            
            <div class="highlight">
              <p>Once you register, your coach will be able to share feedback, track your progress, and optimize their guidance with data-driven precision.</p>
            </div>
            
            <p>You are taking your training to the next level with the future of sports training, <strong>MotionLabs AI</strong>.</p>
            
            <div class="signature">
              <p>See you on the mat,<br>
              <strong>MotionLabs AI Team</strong></p>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${invitation.invitationLink}" style="color: #00bcd4; word-break: break-all;">${invitation.invitationLink}</a>
            </p>
          </div>
          
          <div class="footer">
            <p>This invitation was sent by ${invitation.coachName} via MotionLabs AI</p>
            <p>© 2024 MotionLabs AI. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send welcome email to newly registered athlete
   */
  static async sendWelcomeEmail(athleteEmail: string, athleteName: string, coachName: string): Promise<EmailResponse> {
    try {
      if (!this.BREVO_API_KEY) {
        throw new Error('Brevo API key not configured');
      }

      const emailData = {
        sender: {
          name: "motionlabsai",
          email: "noreply@motionlabsai.com"
        },
        to: [
          {
            email: athleteEmail,
            name: athleteName
          }
        ],
        subject: `Welcome to Gymnastics Analytics, ${athleteName}!`,
        htmlContent: `
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

      const response = await fetch(this.BREVO_API_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': this.BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Brevo API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('Brevo welcome email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Test Brevo connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      if (!this.BREVO_API_KEY) {
        return false;
      }
      
      // Try to send a test email to verify API key works
      const emailData = {
        sender: {
          name: "motionlabsai",
          email: "noreply@motionlabsai.com"
        },
        to: [
          {
            email: "test@example.com",
            name: "Test User"
          }
        ],
        subject: "Test Email",
        htmlContent: "<html><head></head><body><p>This is a test email to verify Brevo connection.</p></body></html>"
      };
      
      const response = await fetch(this.BREVO_API_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': this.BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      return response.ok;
    } catch (error) {
      console.error('Brevo connection test failed:', error);
      return false;
    }
  }
}
