# 📧 Email System Usage Guide - KPI Trigger Integration

## 🎯 Overview

This email system automatically sends personalized emails to users based on KPI triggers. It's fully integrated with the KPI Dashboard and uses dynamic templates with variables.

---

## 📋 How It Works

### **Step-by-Step Flow:**

```
1. Admin uploads Excel with KPI data
   ↓
2. System calculates KPI scores
   ↓
3. System determines triggers based on score
   ↓
4. System selects appropriate email template
   ↓
5. System fills template variables with real data
   ↓
6. System sends email & creates notification
```

---

## 🔧 Required Fields in Excel

### **Mandatory Columns:**

| Column | Description | Example |
|--------|-------------|---------|
| **FE** | User Name | John Doe |
| **Email** | User Email (Primary Identifier) | john.doe@company.com |
| **Employee ID** | Unique Employee ID | EMP001 |
| **Month** | Period (Auto-detected) | Oct-2025 |
| **TAT %** | Turn Around Time Percentage | 92.5 |
| **Major Negative %** | Major Negativity Percentage | 2.3 |
| **Quality Concern % Age** | Quality Concern Percentage | 0.45 |
| **Neighbor Check % Age** | Neighbor Check Percentage | 88.0 |
| **Negative %** | General Negativity Percentage | 18.0 |
| **Online % Age** | App Usage Percentage | 85.0 |
| **Insuff %** | Insufficiency Percentage | 1.2 |

### **User Matching Priority:**
1. **Email** (Highest Priority) - Matches against `User.email`
2. **Employee ID** - Matches against `User.employeeId`
3. **Name (FE)** - Matches against `User.name` (case-insensitive)

---

## 📧 Email Templates & Variables

### **Available Templates:**

#### 1. **KPI Outstanding Performance** (Score: 85-100%)
**Recipients:** FE, Manager, HOD  
**Subject:** `🎉 Outstanding Performance - {{period}}`

**Variables Used:**
- `{{userName}}` - User's full name
- `{{email}}` - User's email
- `{{employeeId}}` - Employee ID
- `{{period}}` - Evaluation period
- `{{kpiScore}}` - Overall KPI score
- `{{rating}}` - Performance rating
- `{{tatPercentage}}` - TAT percentage
- `{{qualityPercentage}}` - Quality percentage
- `{{neighborCheckPercentage}}` - Neighbor check percentage

**When Triggered:** KPI Score ≥ 85%

---

#### 2. **KPI Excellent Performance** (Score: 70-84%)
**Recipients:** FE, Coordinator  
**Subject:** `👏 Excellent Performance - {{period}}`

**Variables Used:**
- `{{userName}}`
- `{{employeeId}}`
- `{{period}}`
- `{{kpiScore}}`
- `{{rating}}`
- `{{tatPercentage}}`
- `{{qualityPercentage}}`
- `{{onlinePercentage}}`

**When Triggered:** KPI Score 70-84%

---

#### 3. **Training Assignment Notification**
**Recipients:** FE, Coordinator, Manager, HOD  
**Subject:** `📚 New Training Assignment - Action Required`

**Variables Used:**
- `{{userName}}`
- `{{email}}`
- `{{trainingType}}` - Type of training assigned
- `{{period}}`
- `{{dueDate}}` - Training completion deadline
- `{{priority}}` - Priority level (High/Normal)
- `{{kpiScore}}`
- `{{rating}}`
- `{{trainingReason}}` - Why training was assigned

**When Triggered:** 
- KPI Score 40-49% (Need Improvement)
- KPI Score < 40% (Unsatisfactory)
- Specific condition triggers (e.g., Major Negativity > 0%)

---

#### 4. **Performance Warning Letter**
**Recipients:** FE, Coordinator, Manager, Compliance Team, HOD  
**Subject:** `⚠️ Performance Warning - Immediate Action Required`

**Variables Used:**
- `{{userName}}`
- `{{email}}`
- `{{employeeId}}`
- `{{period}}`
- `{{kpiScore}}`
- `{{rating}}`
- `{{performanceConcerns}}` - Specific areas of concern
- `{{trainingDueDate}}`
- `{{auditDate}}`
- `{{tatPercentage}}`
- `{{qualityPercentage}}`
- `{{generalNegPercentage}}`
- `{{improvementAreas}}` - Areas needing improvement

**When Triggered:** KPI Score < 40%

---

#### 5. **Audit Schedule Notification**
**Recipients:** Compliance Team, HOD, FE  
**Subject:** `📅 Audit Scheduled - {{auditType}}`

**Variables Used:**
- `{{userName}}`
- `{{auditType}}` - Type of audit
- `{{scheduledDate}}` - Audit date
- `{{period}}`
- `{{priority}}`
- `{{auditScope}}` - What will be audited
- `{{preAuditDate}}` - Document submission date

**When Triggered:**
- KPI Score 70-84% (Excellent)
- KPI Score 50-69% (Satisfactory)
- KPI Score < 50% (Need Improvement/Unsatisfactory)

---

#### 6. **KPI Need Improvement**
**Recipients:** FE, Coordinator, Manager, HOD  
**Subject:** `📊 Performance Review - Improvement Needed`

**Variables Used:**
- `{{userName}}`
- `{{period}}`
- `{{kpiScore}}`
- `{{rating}}`
- `{{trainingType}}`
- `{{auditDate}}`
- `{{improvementAreas}}`

**When Triggered:** KPI Score 40-49%

---

## 🎯 KPI Score-Based Triggers

| Score Range | Rating | Email Templates Sent | Additional Actions |
|-------------|--------|---------------------|-------------------|
| **85-100%** | Outstanding | KPI Outstanding | Reward eligibility |
| **70-84%** | Excellent | KPI Excellent | Audit Call scheduled |
| **50-69%** | Satisfactory | (None) | Audit + 3-month review |
| **40-49%** | Need Improvement | Training Assignment + KPI Need Improvement | Audit + Dummy case |
| **< 40%** | Unsatisfactory | Training Assignment + Performance Warning | Audit + Warning letter |

---

## 🔔 Condition-Based Triggers

### **1. Overall KPI Score < 55%**
- **Emails:** Training Assignment, Audit Schedule
- **Recipients:** FE, Coordinator, Manager, Compliance Team, HOD
- **Actions:** Training module assigned, audit scheduled

### **2. Overall KPI Score < 40%**
- **Emails:** Training Assignment, Performance Warning, Audit Schedule
- **Recipients:** All stakeholders
- **Actions:** Training, audit, warning letter

### **3. Major Negativity > 0% AND General Negativity < 25%**
- **Emails:** Training Assignment (Negativity Handling)
- **Recipients:** FE, Coordinator, Manager, Compliance Team, HOD
- **Actions:** Specialized training module

### **4. Quality Concern > 1%**
- **Emails:** Training Assignment (Do's & Don'ts)
- **Recipients:** FE, Coordinator, Manager, Compliance Team, HOD
- **Actions:** Quality training + RCA of complaints

### **5. Cases Done on App < 80%**
- **Emails:** Training Assignment (Application Usage)
- **Recipients:** FE, Coordinator, Manager, Compliance Team, HOD
- **Actions:** App usage training

### **6. Insufficiency > 2%**
- **Emails:** Audit Schedule (Cross-verification)
- **Recipients:** Compliance Team, HOD
- **Actions:** Case review by another FE

---

## 📊 How to Use the System

### **For Admins:**

#### **1. Upload KPI Data**
```
1. Go to Admin Dashboard
2. Click "KPI Triggers" in sidebar
3. Download template Excel
4. Fill in all mandatory fields:
   - FE (Name)
   - Email (Critical!)
   - Employee ID
   - All KPI metrics
5. Upload filled Excel
6. Click "Preview Triggers"
```

#### **2. Review Preview**
```
1. System shows matched users
2. Shows calculated KPI scores
3. Shows which emails will be sent
4. Shows which triggers are activated
5. Review carefully!
```

#### **3. Send Emails**
```
Options:
- "Send Email" for individual user
- "Send Emails to All" for bulk sending

What happens:
- Emails logged to console (formatted)
- EmailLog records created in DB
- Notifications created for users
- Training assignments created
- Audit schedules created
```

#### **4. View Email Templates**
```
1. Go to Admin Dashboard
2. Click "Emails" in sidebar
3. View all templates by category
4. Click "Preview" on any template
5. See email with sample data
6. Click "Send Test Email" (coming soon)
```

---

### **For Users:**

#### **1. Receive Email Notifications**
```
When KPI triggered:
- Email sent to user's registered email
- In-app notification created
- Notification bell shows count
```

#### **2. View Notifications**
```
1. Login to dashboard
2. Click notification bell (top-right)
3. See recent notifications
4. Click to read details
5. Acknowledge if action required
```

#### **3. Check Training Assignments**
```
1. Go to Notifications page
2. Filter by "Training" type
3. See assigned training modules
4. View due dates
5. Complete training
```

#### **4. Check Audit Schedules**
```
1. Go to Notifications page
2. Filter by "Audit" type
3. See scheduled audits
4. View audit details
5. Prepare documents
```

---

## 🔍 Variable Replacement Logic

### **How Variables Work:**

1. **Template contains:** `Dear {{userName}},`
2. **System gets user data:** `John Doe`
3. **Result:** `Dear John Doe,`

### **All Available Variables:**

#### **User Variables:**
- `{{userName}}` - Full name from User collection
- `{{email}}` - Email from User/Excel
- `{{employeeId}}` - Employee ID from User/Excel
- `{{department}}` - Department (if available)

#### **KPI Variables:**
- `{{kpiScore}}` - Overall calculated score (e.g., "75.50")
- `{{rating}}` - Rating based on score (e.g., "Excellent")
- `{{period}}` - Evaluation period from Excel "Month" column
- `{{tatPercentage}}` - TAT % from Excel
- `{{majorNegPercentage}}` - Major Negativity % from Excel
- `{{qualityPercentage}}` - Quality Concern % from Excel
- `{{neighborCheckPercentage}}` - Neighbor Check % from Excel
- `{{generalNegPercentage}}` - General Negativity % from Excel
- `{{onlinePercentage}}` - Online/App Usage % from Excel
- `{{insuffPercentage}}` - Insufficiency % from Excel

#### **Training Variables:**
- `{{trainingType}}` - Type of training (e.g., "Basic Training Module")
- `{{trainingReason}}` - Why assigned (e.g., "KPI Score < 55%")
- `{{dueDate}}` - Training completion date (auto: +30 days)
- `{{trainingDueDate}}` - Same as dueDate
- `{{priority}}` - Priority level (High/Normal)

#### **Audit Variables:**
- `{{auditType}}` - Type of audit (e.g., "Audit Call + Cross-check")
- `{{auditScope}}` - What will be audited
- `{{scheduledDate}}` - Audit date (auto: +7 days)
- `{{preAuditDate}}` - Document submission (auto: +5 days)
- `{{auditDate}}` - Same as scheduledDate

#### **Warning Variables:**
- `{{performanceConcerns}}` - Specific concerns
- `{{improvementAreas}}` - Areas to improve

---

## 📈 Email Sending Flow

### **Current Implementation (Console Logging):**

```javascript
1. Template selected: "training_assignment"
2. Variables prepared: {
     userName: "John Doe",
     email: "john@example.com",
     kpiScore: "35.50",
     ...
   }
3. Template rendered with variables
4. Email logged to console:
   ================================================================================
   📧 EMAIL TO: john@example.com (FE)
   📋 SUBJECT: 📚 New Training Assignment - Action Required
   --------------------------------------------------------------------------------
   Dear John Doe,
   
   You have been assigned a new training module...
   ================================================================================

5. EmailLog record created in DB
6. Notification created for user
7. Training assignment created
```

### **Future Implementation (Actual Sending):**

```javascript
// When ready, just configure:
1. Install: npm install nodemailer
2. Set environment variables:
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password

3. EmailTemplateService.sendEmail() 
   will use nodemailer instead of console.log
```

---

## ✅ Best Practices

### **For Accurate Email Sending:**

1. **Always use correct email in Excel**
   - Emails must match User collection
   - Case-insensitive matching

2. **Fill all KPI metrics**
   - Missing metrics = 0%
   - Affects score calculation

3. **Review preview before sending**
   - Check matched users
   - Verify email addresses
   - Confirm trigger logic

4. **Monitor console for email logs**
   - Verify content before production
   - Check variable replacement

5. **Check database records**
   - EmailLog collection
   - Notification collection
   - TrainingAssignment collection

---

## 🐛 Troubleshooting

### **User not receiving emails:**
- ✅ Check if email matches in database
- ✅ Check if user is matched in preview
- ✅ Verify EmailLog record created
- ✅ Check console for email output

### **Wrong data in email:**
- ✅ Check Excel data accuracy
- ✅ Verify variable names in template
- ✅ Check KPI calculation logic

### **Template not showing:**
- ✅ Check if template is active
- ✅ Verify template seeded in DB
- ✅ Check template type matches trigger

---

## 📞 Support

For issues or questions:
1. Check console logs
2. Check MongoDB collections
3. Review this guide
4. Contact system admin

---

**System Status:** ✅ Fully Functional  
**Last Updated:** October 2025  
**Version:** 1.0

