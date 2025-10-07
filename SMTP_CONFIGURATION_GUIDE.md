# 📧 SMTP Email Configuration Guide

## Overview
This guide will help you configure SMTP (email sending) for the E-Learning Platform.

---

## ✅ **Option 1: Gmail (Recommended for Testing)**

### Step-by-Step Setup:

1. **Enable 2-Factor Authentication**
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Create App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other (Custom name)" → Type "E-Learning Platform"
   - Click "Generate"
   - **Copy the 16-character password** (spaces don't matter)

3. **Update `.env` File** (in `backend` folder)
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=abcd efgh ijkl mnop  # App password from step 2
   
   FROM_NAME=E-Learning Platform
   FROM_EMAIL=your-email@gmail.com
   ```

### ⚠️ **Important Notes:**
- Use the **App Password**, NOT your regular Gmail password
- Don't share this password - keep it secure
- Gmail limit: ~500 emails/day for free accounts

---

## ✅ **Option 2: Outlook/Hotmail**

### Step-by-Step Setup:

1. **Enable 2-Step Verification** (if not already enabled)
   - Go to: https://account.microsoft.com/security
   - Enable "Two-step verification"

2. **Create App Password** (if available)
   - Or use your regular password if app passwords aren't available

3. **Update `.env` File**
   ```env
   SMTP_HOST=smtp-mail.outlook.com
   SMTP_PORT=587
   SMTP_USER=your-email@outlook.com
   SMTP_PASS=your-password-or-app-password
   
   FROM_NAME=E-Learning Platform
   FROM_EMAIL=your-email@outlook.com
   ```

---

## ✅ **Option 3: Yahoo Mail**

### Step-by-Step Setup:

1. **Generate App Password**
   - Go to: https://login.yahoo.com/account/security
   - Click "Generate app password"
   - Select "Other App" → Name it "E-Learning"
   - Click "Generate"
   - Copy the password

2. **Update `.env` File**
   ```env
   SMTP_HOST=smtp.mail.yahoo.com
   SMTP_PORT=587
   SMTP_USER=your-email@yahoo.com
   SMTP_PASS=your-app-password
   
   FROM_NAME=E-Learning Platform
   FROM_EMAIL=your-email@yahoo.com
   ```

---

## ✅ **Option 4: Custom SMTP (Production)**

For production environments with your own domain:

```env
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-smtp-password

FROM_NAME=E-Learning Platform
FROM_EMAIL=noreply@yourdomain.com
```

**Popular SMTP Providers for Production:**
- **SendGrid**: Up to 100 emails/day free
- **Mailgun**: Up to 5,000 emails/month free
- **Amazon SES**: Very cheap ($0.10 per 1,000 emails)
- **Brevo** (Sendinblue): Up to 300 emails/day free

---

## 🧪 **Testing Email Configuration**

### Method 1: Using Backend Test Script

1. Create `backend/test-email.js`:
```javascript
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function testEmail() {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: 'your-test-email@example.com',  // Change this!
      subject: 'Test Email from E-Learning Platform',
      html: '<h1>Success!</h1><p>SMTP is configured correctly.</p>'
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Email failed:', error.message);
  }
}

testEmail();
```

2. Run the test:
```bash
cd backend
node test-email.js
```

### Method 2: Via Application

1. Start your backend server
2. Go to Admin Dashboard → Email Templates
3. Click "Preview" on any template
4. Click "Send Test Email"
5. Check your inbox

---

## 🔧 **Common Issues & Solutions**

### Issue 1: "Invalid login: 535 Authentication failed"
**Solution:** 
- For Gmail: Use App Password, not regular password
- Ensure 2FA is enabled
- Double-check username and password

### Issue 2: "Connection timeout"
**Solution:**
- Check if port 587 or 465 is blocked by firewall
- Try port 25 (less secure)
- Check internet connection

### Issue 3: "Self-signed certificate"
**Solution:** Add to `.env`:
```env
NODE_TLS_REJECT_UNAUTHORIZED=0
```
⚠️ Only use for development!

### Issue 4: Gmail blocks emails
**Solution:**
- Use App Password (not regular password)
- Allow "Less secure app access" (not recommended)
- Or switch to SendGrid/Mailgun

---

## 📊 **Current Configuration**

Check your current SMTP settings:

```javascript
// In backend console
console.log('SMTP Host:', process.env.SMTP_HOST);
console.log('SMTP Port:', process.env.SMTP_PORT);
console.log('SMTP User:', process.env.SMTP_USER);
console.log('SMTP Pass:', process.env.SMTP_PASS ? '✓ Set' : '✗ Not set');
```

---

## 🚀 **Quick Start (Gmail)**

1. **Get App Password:**
   ```
   https://myaccount.google.com/apppasswords
   ```

2. **Create/Edit `backend/.env`:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   FROM_NAME=E-Learning Platform
   FROM_EMAIL=your-email@gmail.com
   ```

3. **Restart Backend:**
   ```bash
   cd backend
   npm run dev
   ```

4. **Test it!**
   - Admin Dashboard → Email Templates → Preview → Send Test

---

## 📝 **Environment Variables Reference**

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SMTP_HOST` | ✅ Yes | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | ✅ Yes | SMTP server port | `587` or `465` |
| `SMTP_USER` | ✅ Yes | Email account username | `your-email@gmail.com` |
| `SMTP_PASS` | ✅ Yes | Email account password/app password | `abcd efgh ijkl mnop` |
| `FROM_NAME` | ⚠️ Optional | Sender display name | `E-Learning Platform` |
| `FROM_EMAIL` | ⚠️ Optional | Sender email address | `noreply@company.com` |

---

## 💡 **Best Practices**

1. **Never commit `.env` file** to Git
2. **Use App Passwords** instead of regular passwords
3. **Different emails for different environments:**
   - Development: Personal Gmail
   - Production: Professional SMTP service
4. **Monitor email delivery** through email logs
5. **Implement rate limiting** to avoid spam filters
6. **Use email templates** for consistency

---

## 🆘 **Need Help?**

If you're still having issues:

1. Check the backend console for error messages
2. Verify `.env` file is in the `backend` folder
3. Restart the backend server after changing `.env`
4. Test with the `test-email.js` script
5. Check spam/junk folder for test emails

---

**Last Updated:** October 2025
**Documentation Version:** 1.0

