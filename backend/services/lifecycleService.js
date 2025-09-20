const LifecycleEvent = require('../models/LifecycleEvent');
const emailService = require('./emailService');
const fs = require('fs').promises;
const path = require('path');
const PDFDocument = require('pdfkit');

class LifecycleService {
  // Generate warning letter PDF
  static async generateWarningLetter(userData, kpiData) {
    const doc = new PDFDocument();
    const fileName = `warning_letter_${userData._id}_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, '../uploads/warnings', fileName);

    // Ensure directory exists
    await fs.mkdir(path.join(__dirname, '../uploads/warnings'), { recursive: true });

    return new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Add company letterhead
      doc.fontSize(20).text('Performance Warning Letter', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`);
      doc.moveDown();

      // Add recipient details
      doc.text(`To: ${userData.name}`);
      doc.text(`Employee ID: ${userData.employeeId}`);
      doc.text(`Department: ${userData.department}`);
      doc.moveDown();

      // Warning content
      doc.text('Subject: Performance Improvement Required', { underline: true });
      doc.moveDown();

      doc.text('Dear ' + userData.name + ',');
      doc.moveDown();

      doc.text('This letter serves as a formal warning regarding your recent performance evaluation. Your current performance metrics have fallen below the expected standards:', { align: 'justify' });
      doc.moveDown();

      // KPI details
      doc.text('Performance Details:');
      doc.text(`Evaluation Period: ${kpiData.period}`);
      doc.text(`Overall KPI Score: ${kpiData.overallScore}%`);
      doc.text(`Rating: ${kpiData.rating}`);
      doc.moveDown();

      // Areas needing improvement
      doc.text('Areas Requiring Immediate Improvement:');
      if (kpiData.tat.score < 10) doc.text('• TAT (Turn Around Time)');
      if (kpiData.majorNegativity.score < 10) doc.text('• Major Negativity Management');
      if (kpiData.quality.score < 10) doc.text('• Quality of Work');
      if (kpiData.neighborCheck.score < 5) doc.text('• Neighbor Checks');
      if (kpiData.negativity.score < 5) doc.text('• General Negativity Management');
      if (kpiData.appUsage.score < 5) doc.text('• Application Usage');
      if (kpiData.insufficiency.score < 5) doc.text('• Insufficiency Rate');
      doc.moveDown();

      // Action plan
      doc.text('Required Actions:');
      doc.text('1. Complete assigned training modules');
      doc.text('2. Participate in performance review meetings');
      doc.text('3. Submit weekly progress reports');
      doc.text('4. Maintain detailed activity logs');
      doc.moveDown();

      // Timeline
      doc.text('Timeline for Improvement:');
      doc.text('You are expected to show significant improvement in these areas within the next 30 days. Your performance will be closely monitored during this period.');
      doc.moveDown();

      // Support
      doc.text('Support Available:');
      doc.text('• Training modules will be assigned');
      doc.text('• Regular guidance from your coordinator');
      doc.text('• Weekly review meetings with your manager');
      doc.moveDown();

      // Consequences
      doc.text('Please note that failure to improve performance may result in further disciplinary action.');
      doc.moveDown();

      // Closing
      doc.text('We trust that you will take this feedback constructively and work towards improving your performance.');
      doc.moveDown();
      doc.text('Best regards,');
      doc.text('Management Team');

      // Signature spaces
      doc.moveDown(2);
      doc.text('_____________________', { align: 'left' });
      doc.text('Employee Signature', { align: 'left' });
      
      doc.text('_____________________', { align: 'right' });
      doc.text('Manager Signature', { align: 'right' });

      // Finalize PDF
      doc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });

      stream.on('error', reject);
    });
  }

  // Create warning record
  static async createWarningRecord(userId, kpiData) {
    try {
      const User = require('../models/User');
      const user = await User.findById(userId);
      
      if (!user) throw new Error('User not found');

      // Generate warning letter
      const warningLetterPath = await this.generateWarningLetter(user, kpiData);

      // Create lifecycle event
      const warningEvent = await LifecycleEvent.create({
        userId,
        type: 'warning',
        title: 'Performance Warning Issued',
        description: `Warning letter issued due to KPI score of ${kpiData.overallScore}%`,
        category: 'negative',
        attachments: [{
          type: 'warning_letter',
          path: warningLetterPath,
          name: path.basename(warningLetterPath)
        }],
        metadata: {
          kpiScore: kpiData.overallScore,
          rating: kpiData.rating,
          period: kpiData.period
        }
      });

      // Send warning notification
      await emailService.sendWarningNotification(userId, {
        userName: user.name,
        kpiScore: kpiData.overallScore,
        rating: kpiData.rating,
        period: kpiData.period,
        improvementAreas: this.getImprovementAreas(kpiData)
      });

      return warningEvent;
    } catch (error) {
      console.error('Error creating warning record:', error);
      throw error;
    }
  }

  // Get areas needing improvement based on KPI scores
  static getImprovementAreas(kpiData) {
    const areas = [];
    if (kpiData.tat.score < 10) areas.push('Turn Around Time (TAT) below target');
    if (kpiData.majorNegativity.score < 10) areas.push('High Major Negativity rate');
    if (kpiData.quality.score < 10) areas.push('Quality concerns');
    if (kpiData.neighborCheck.score < 5) areas.push('Insufficient neighbor checks');
    if (kpiData.negativity.score < 5) areas.push('High general negativity rate');
    if (kpiData.appUsage.score < 5) areas.push('Low application usage');
    if (kpiData.insufficiency.score < 5) areas.push('High insufficiency rate');
    return areas;
  }

  // Track FE lifecycle events
  static async trackLifecycleEvent(userId, eventData) {
    try {
      const event = await LifecycleEvent.create({
        userId,
        type: eventData.type,
        title: eventData.title,
        description: eventData.description,
        category: eventData.category,
        attachments: eventData.attachments || [],
        metadata: eventData.metadata || {}
      });

      // If it's a milestone event, send notification
      if (eventData.category === 'milestone') {
        const User = require('../models/User');
        const user = await User.findById(userId);
        
        if (user) {
          await emailService.sendTrainingNotification(userId, {
            userName: user.name,
            trainingType: eventData.title,
            reason: eventData.description,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString() // 7 days from now
          });
        }
      }

      return event;
    } catch (error) {
      console.error('Error tracking lifecycle event:', error);
      throw error;
    }
  }

  // Get FE lifecycle summary
  static async getLifecycleSummary(userId) {
    try {
      const events = await LifecycleEvent.find({ userId })
        .sort({ createdAt: -1 })
        .populate('userId', 'name email employeeId');

      const summary = {
        milestones: events.filter(e => e.category === 'milestone'),
        warnings: events.filter(e => e.category === 'negative'),
        achievements: events.filter(e => e.category === 'positive'),
        trainings: events.filter(e => e.type === 'training'),
        audits: events.filter(e => e.type === 'audit')
      };

      // Calculate statistics
      const stats = {
        totalEvents: events.length,
        warningCount: summary.warnings.length,
        achievementCount: summary.achievements.length,
        trainingCount: summary.trainings.length,
        auditCount: summary.audits.length,
        firstEvent: events[events.length - 1]?.createdAt,
        lastEvent: events[0]?.createdAt
      };

      return { summary, stats };
    } catch (error) {
      console.error('Error getting lifecycle summary:', error);
      throw error;
    }
  }
}

module.exports = LifecycleService;
