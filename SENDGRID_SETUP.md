# SendGrid Integration Setup Guide

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install @sendgrid/mail
```

### 2. Environment Variables
Create a `.env.local` file in your project root:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY_HERE

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Verify SendGrid Connection
Test your SendGrid connection by visiting:
```
GET /api/invite-athlete
```

## 📧 Features Implemented

### ✅ Athlete Invitation System
- **Email invitations** sent via SendGrid
- **Professional email templates** with HTML and text versions
- **Customizable messages** from coaches
- **Invitation tracking** with message IDs
- **Error handling** and validation

### ✅ Coach Dashboard Integration
- **Invite Athlete button** replaces "Add Athlete"
- **Modal interface** for invitation details
- **Real-time status updates** (success/error)
- **Form validation** and user feedback

### ✅ Email Templates
- **Beautiful HTML emails** with responsive design
- **Text fallback** for email clients
- **Branded styling** with Gymnastics Analytics theme
- **Clear call-to-action** buttons

## 🔧 API Endpoints

### POST /api/invite-athlete
Send athlete invitation email

**Request Body:**
```json
{
  "coachName": "Coach Name",
  "coachEmail": "coach@example.com",
  "athleteEmail": "athlete@example.com",
  "athleteName": "Athlete Name",
  "institution": "Gym Name",
  "customMessage": "Personal message"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Athlete invitation sent successfully",
  "messageId": "message_id_from_sendgrid"
}
```

### GET /api/invite-athlete
Test SendGrid connection

**Response:**
```json
{
  "success": true,
  "message": "SendGrid connection successful"
}
```

## 🎨 Email Template Features

### Visual Design
- **Gradient header** with gymnastics theme
- **Professional layout** with clear sections
- **Responsive design** for mobile devices
- **Brand colors** and typography

### Content Sections
- **Personalized greeting** with athlete name
- **Coach information** and institution
- **Feature highlights** (AI analysis, ACL risk, etc.)
- **Clear call-to-action** button
- **Fallback link** for button issues
- **Contact information** for questions

## 🚀 Usage

### For Coaches
1. **Click "Invite Athlete"** button in dashboard
2. **Enter athlete email** (required)
3. **Add athlete name** (optional)
4. **Customize message** (optional)
5. **Send invitation** - email sent automatically

### For Athletes
1. **Receive invitation email** from coach
2. **Click "Accept Invitation"** button
3. **Create account** on signup page
4. **Access personalized dashboard**

## 🔒 Security Features

### Email Validation
- **Format validation** for email addresses
- **Required field checking** for essential data
- **Input sanitization** to prevent injection

### Rate Limiting
- **API endpoint protection** (can be added)
- **Email sending limits** (SendGrid managed)
- **Error handling** for failed requests

## 📱 Mobile Responsiveness

### Email Templates
- **Mobile-first design** for all devices
- **Responsive layouts** that adapt to screen size
- **Touch-friendly buttons** and links
- **Optimized typography** for small screens

### Web Interface
- **Responsive modal** design
- **Mobile-friendly forms** and inputs
- **Touch-optimized buttons** and interactions

## 🧪 Testing

### Local Development
1. **Set environment variables** in `.env.local`
2. **Start development server** with `npm run dev`
3. **Test invitation modal** in coach dashboard
4. **Verify email sending** via SendGrid dashboard

### Production Deployment
1. **Set production environment variables**
2. **Verify SendGrid API key** permissions
3. **Test email delivery** to real addresses
4. **Monitor email metrics** in SendGrid

## 🔧 Troubleshooting

### Common Issues

#### SendGrid API Key Error
```
Error: SendGrid API key not configured
```
**Solution:** Verify `.env.local` file and API key

#### Email Not Sending
```
Error: Failed to send invitation
```
**Solution:** Check SendGrid account status and API limits

#### Connection Test Fails
```
Error: SendGrid connection failed
```
**Solution:** Verify API key and network connectivity

### Debug Steps
1. **Check environment variables** are loaded
2. **Verify SendGrid API key** is valid
3. **Test API endpoint** directly
4. **Check browser console** for errors
5. **Monitor network requests** in dev tools

## 📈 Future Enhancements

### Planned Features
- **Bulk invitations** for multiple athletes
- **Invitation templates** customization
- **Email tracking** and analytics
- **Reminder emails** for pending invitations
- **Integration** with user management system

### API Improvements
- **Rate limiting** implementation
- **Webhook support** for email events
- **Template management** system
- **A/B testing** for email effectiveness

## 📚 Resources

### SendGrid Documentation
- [SendGrid API Reference](https://sendgrid.com/docs/api-reference/)
- [Email Templates](https://sendgrid.com/docs/ui/sending-email/email-templates/)
- [Best Practices](https://sendgrid.com/docs/ui/sending-email/best-practices/)

### Next.js Integration
- [API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [TypeScript Support](https://nextjs.org/docs/basic-features/typescript)

---

**Need Help?** Check the troubleshooting section or create an issue in the repository.










