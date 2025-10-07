# 📧 Email Templates Management Guide

## ✨ New Features Added

### 1. **Professional Redesign** ✅
- Modern gradient UI with card-based layout
- Better visual hierarchy
- Enhanced statistics dashboard
- Responsive design

### 2. **Full Edit Functionality** ✅
- Edit template name, category, subject
- Edit email content with live preview
- Modify template variables
- Toggle active/inactive status
- Real-time HTML preview

### 3. **Advanced Filtering** ✅
- Filter by category (KPI, Training, Audit, Warning, etc.)
- Search by template name or subject
- View all or filtered templates

### 4. **Enhanced Preview** ✅
- Professional email mockup
- Subject line preview
- Full HTML rendering
- Template variables display

### 5. **Template Actions** ✅
- **Preview**: See how email will look
- **Edit**: Modify template details
- **Duplicate**: Create a copy
- **Delete**: Remove template
- **Send Test**: Test email sending

---

## 🎨 UI Improvements

### Stats Cards
- **Total Templates**: Count of all email templates
- **Active Templates**: Currently active templates
- **Total Sent**: Number of emails sent using templates
- **Categories**: Number of template categories

### Template Cards
- **Status Badge**: Active/Inactive indicator
- **Usage Stats**: How many times template was used
- **Variables Preview**: Shows template variables
- **Last Used**: When template was last used

### Color Coding
- 🔵 **KPI**: Blue
- 🟢 **Training**: Green  
- 🟠 **Audit**: Orange
- 🔴 **Warning**: Red
- ⚫ **General**: Gray
- 🟣 **Achievement**: Purple

---

## 🛠️ How to Use

### Edit a Template
1. Click the **"Edit"** button on any template card
2. Modify:
   - Template Name
   - Category
   - Subject Line
   - Template Variables
   - Email Content (HTML supported)
   - Active Status
3. See **Live Preview** at the bottom
4. Click **"Update Template"**

### Preview a Template
1. Click **"Preview"** button
2. See full email mockup with:
   - Subject line
   - Email body with sample data
   - Template variables used
3. Click **"Send Test Email"** to test (requires SMTP setup)

### Duplicate a Template
1. Click **"Duplicate"** button
2. A copy will be created with "(Copy)" suffix
3. Edit the copy as needed

### Filter Templates
1. Use category buttons at top: All, KPI, Training, etc.
2. Or use search box to find by name/subject
3. Templates update instantly

---

## 📝 Template Variables

### Available Variables
Use these in your templates with `{{variableName}}` syntax:

**User Variables:**
- `{{userName}}` - User's full name
- `{{userEmail}}` - User's email
- `{{employeeId}}` - Employee ID

**KPI Variables:**
- `{{kpiScore}}` - Overall KPI score
- `{{rating}}` - Performance rating
- `{{period}}` - KPI period

**Training Variables:**
- `{{trainingType}}` - Type of training
- `{{dueDate}}` - Training due date
- `{{trainingLink}}` - Link to training

**Audit Variables:**
- `{{auditType}}` - Type of audit
- `{{scheduledDate}}` - Audit scheduled date

### Example Usage
```html
<p>Dear {{userName}},</p>
<p>Your KPI score for {{period}} is {{kpiScore}} ({{rating}}).</p>
<p>Please complete your assigned training: {{trainingType}}</p>
<p>Due Date: {{dueDate}}</p>
```

---

## 🔧 SMTP Configuration Required

### Quick Setup (Gmail)
1. **Enable 2FA**: https://myaccount.google.com/security
2. **Get App Password**: https://myaccount.google.com/apppasswords
3. **Update `backend/.env`**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
FROM_NAME=E-Learning Platform
FROM_EMAIL=your-email@gmail.com
```
4. **Restart Backend Server**

### Full SMTP Guide
See `SMTP_CONFIGURATION_GUIDE.md` for complete setup instructions including:
- Gmail, Outlook, Yahoo setup
- Custom SMTP servers
- Production SMTP services (SendGrid, Mailgun, SES)
- Testing & troubleshooting

---

## 🎯 Best Practices

### Template Design
1. **Keep it simple**: Clean, professional design
2. **Use variables**: Make templates dynamic
3. **Test before use**: Always preview and test
4. **Mobile-friendly**: Use responsive HTML
5. **Clear subject lines**: Descriptive and concise

### Content Guidelines
1. **Personalize**: Use `{{userName}}` in greeting
2. **Clear action**: What should user do?
3. **Important info**: Due dates, scores, requirements
4. **Professional tone**: Formal but friendly
5. **Contact info**: Support email or link

### HTML Tips
```html
<!-- Good structure -->
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <h2 style="color: #2c3e50;">Heading</h2>
  <p>Content with {{variables}}</p>
  <div style="text-align: center; margin: 20px 0;">
    <a href="{{link}}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
      Click Here
    </a>
  </div>
</div>
```

---

## 🚀 Integration with KPI System

### Automatic Email Sending
Emails are automatically sent when:
1. **KPI Triggers**: After KPI entry, based on score
2. **Training Assignments**: When training is assigned
3. **Audit Scheduling**: When audit is scheduled
4. **Warnings**: When performance is poor

### Email Recipients
Emails are sent to:
- **Field Executive** (FE)
- **Coordinator**
- **Manager**
- **HOD** (Head of Department)
- **Compliance Team**

### Email Logs
All sent emails are logged with:
- Recipient
- Template used
- Send status (sent/failed)
- Timestamp
- Error messages (if failed)

---

## 📊 Email Analytics

### View Statistics
- **Total emails sent** per template
- **Last used** date for each template
- **Active vs Inactive** template count
- **Category distribution**

### Monitor Performance
- Check email logs in database
- View failed emails
- Retry failed sends
- Track delivery rates

---

## 🔐 Security Notes

1. **Never expose SMTP credentials** in frontend
2. **Use App Passwords** not regular passwords
3. **Validate email addresses** before sending
4. **Rate limit** email sending
5. **Log all email activity** for audit

---

## 🐛 Troubleshooting

### Emails not sending?
1. Check SMTP configuration in `.env`
2. Verify SMTP credentials are correct
3. Check backend console for errors
4. Test with `backend/test-email.js` script
5. See `SMTP_CONFIGURATION_GUIDE.md`

### Template not updating?
1. Check browser console for errors
2. Verify backend is running
3. Refresh templates list
4. Check network tab for API errors

### Preview not showing?
1. Check template has content
2. Verify variables are valid
3. Check HTML syntax
4. Reload the page

---

## 📞 Support

For issues or questions:
1. Check `SMTP_CONFIGURATION_GUIDE.md`
2. Review backend logs
3. Test email functionality
4. Verify template syntax

---

**Last Updated**: October 2025  
**Version**: 2.0 (Enhanced)

