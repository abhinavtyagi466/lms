const UserProgress = require('../models/UserProgress');
const UserModule = require('../models/UserModule');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');
const KPIScore = require('../models/KPIScore');

class RealActivityKPIService {
  /**
   * Calculate KPI based on real user activity data
   * @param {String} userId - User ID
   * @param {String} period - Period (YYYY-MM)
   * @returns {Object} - Calculated KPI data
   */
  static async calculateRealActivityKPI(userId, period) {
    try {
      console.log(`Calculating real activity KPI for user ${userId}, period ${period}`);
      
      // Get user activity data
      const activityData = await this.getUserActivityData(userId, period);
      
      // Calculate KPI metrics based on real activity
      const kpiMetrics = await this.calculateKPIMetrics(activityData);
      
      // Calculate overall score
      const overallScore = this.calculateOverallScore(kpiMetrics);
      
      // Determine rating
      const rating = this.determineRating(overallScore);
      
      return {
        userId,
        period,
        ...kpiMetrics,
        overallScore,
        rating,
        activityData,
        calculatedAt: new Date()
      };
      
    } catch (error) {
      console.error('Error calculating real activity KPI:', error);
      throw error;
    }
  }

  /**
   * Get user activity data for the period
   */
  static async getUserActivityData(userId, period) {
    const startDate = new Date(period + '-01');
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    
    const [userProgress, userModules, quizAttempts] = await Promise.all([
      UserProgress.find({
        userId,
        lastAccessedAt: { $gte: startDate, $lte: endDate }
      }).populate('moduleId'),
      
      UserModule.find({
        userId,
        updatedAt: { $gte: startDate, $lte: endDate }
      }).populate('moduleId'),
      
      QuizAttempt.find({
        userId,
        startTime: { $gte: startDate, $lte: endDate }
      })
    ]);
    
    return {
      userProgress,
      userModules,
      quizAttempts,
      period: { startDate, endDate }
    };
  }

  /**
   * Calculate KPI metrics based on activity data
   */
  static async calculateKPIMetrics(activityData) {
    const { userProgress, userModules, quizAttempts } = activityData;
    
    // 1. TAT (Turn Around Time) - Based on quiz completion time
    const tat = this.calculateTAT(quizAttempts);
    
    // 2. Major Negativity - Based on failed attempts and violations
    const majorNegativity = this.calculateMajorNegativity(quizAttempts);
    
    // 3. Quality - Based on quiz scores and completion rates
    const quality = this.calculateQuality(userProgress, quizAttempts);
    
    // 4. Neighbor Check - Based on module completion consistency
    const neighborCheck = this.calculateNeighborCheck(userModules);
    
    // 5. General Negativity - Based on overall performance issues
    const generalNegativity = this.calculateGeneralNegativity(userProgress);
    
    // 6. App Usage - Based on video watching and engagement
    const appUsage = this.calculateAppUsage(userProgress);
    
    // 7. Insufficiency - Based on incomplete modules and low engagement
    const insufficiency = this.calculateInsufficiency(userModules);
    
    return {
      tat,
      majorNegativity,
      quality,
      neighborCheck,
      generalNegativity,
      appUsage,
      insufficiency
    };
  }

  /**
   * Calculate TAT based on quiz completion time
   */
  static calculateTAT(quizAttempts) {
    if (quizAttempts.length === 0) {
      return { percentage: 0, score: 0 };
    }
    
    const avgTimeSpent = quizAttempts.reduce((sum, attempt) => sum + attempt.timeSpent, 0) / quizAttempts.length;
    const avgTimeInMinutes = avgTimeSpent / 60;
    
    // TAT scoring: Lower time is better
    let percentage;
    if (avgTimeInMinutes <= 10) percentage = 95; // Excellent
    else if (avgTimeInMinutes <= 15) percentage = 85; // Good
    else if (avgTimeInMinutes <= 20) percentage = 70; // Average
    else if (avgTimeInMinutes <= 30) percentage = 50; // Below average
    else percentage = 25; // Poor
    
    return { percentage, score: this.calculateScore(percentage, 20) };
  }

  /**
   * Calculate Major Negativity based on violations and failed attempts
   */
  static calculateMajorNegativity(quizAttempts) {
    if (quizAttempts.length === 0) {
      return { percentage: 0, score: 20 }; // No attempts = no negativity
    }
    
    let totalViolations = 0;
    let criticalViolations = 0;
    
    quizAttempts.forEach(attempt => {
      totalViolations += attempt.violations.length;
      criticalViolations += attempt.violations.filter(v => v.severity === 'critical' || v.severity === 'high').length;
    });
    
    const violationRate = (totalViolations / quizAttempts.length) * 100;
    const criticalRate = (criticalViolations / quizAttempts.length) * 100;
    
    // Major negativity scoring: Lower is better
    let percentage;
    if (criticalRate === 0 && violationRate <= 5) percentage = 0; // Excellent
    else if (criticalRate <= 1 && violationRate <= 10) percentage = 1; // Good
    else if (criticalRate <= 2 && violationRate <= 20) percentage = 2; // Average
    else if (criticalRate <= 3 && violationRate <= 30) percentage = 3; // Below average
    else percentage = 5; // Poor
    
    return { percentage, score: this.calculateScore(percentage, 20, true) }; // true = reverse scoring
  }

  /**
   * Calculate Quality based on quiz scores and completion rates
   */
  static calculateQuality(userProgress, quizAttempts) {
    if (quizAttempts.length === 0) {
      return { percentage: 0, score: 20 }; // No attempts = perfect quality
    }
    
    const passedAttempts = quizAttempts.filter(attempt => attempt.passed).length;
    const passRate = (passedAttempts / quizAttempts.length) * 100;
    
    const avgScore = quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / quizAttempts.length;
    
    // Quality scoring: Higher is better
    let percentage;
    if (passRate >= 90 && avgScore >= 80) percentage = 0; // Excellent
    else if (passRate >= 80 && avgScore >= 70) percentage = 0.5; // Good
    else if (passRate >= 70 && avgScore >= 60) percentage = 1; // Average
    else if (passRate >= 60 && avgScore >= 50) percentage = 1.5; // Below average
    else percentage = 2; // Poor
    
    return { percentage, score: this.calculateScore(percentage, 20, true) }; // true = reverse scoring
  }

  /**
   * Calculate Neighbor Check based on module completion consistency
   */
  static calculateNeighborCheck(userModules) {
    if (userModules.length === 0) {
      return { percentage: 0, score: 0 };
    }
    
    const completedModules = userModules.filter(module => module.status === 'completed').length;
    const completionRate = (completedModules / userModules.length) * 100;
    
    // Neighbor check scoring: Higher is better
    let percentage;
    if (completionRate >= 90) percentage = 95; // Excellent
    else if (completionRate >= 80) percentage = 85; // Good
    else if (completionRate >= 70) percentage = 70; // Average
    else if (completionRate >= 60) percentage = 50; // Below average
    else percentage = 25; // Poor
    
    return { percentage, score: this.calculateScore(percentage, 10) };
  }

  /**
   * Calculate General Negativity based on overall performance issues
   */
  static calculateGeneralNegativity(userProgress) {
    if (userProgress.length === 0) {
      return { percentage: 0, score: 10 }; // No activity = no negativity
    }
    
    const lowScores = userProgress.filter(progress => progress.bestPercentage < 60).length;
    const negativityRate = (lowScores / userProgress.length) * 100;
    
    // General negativity scoring: Lower is better
    let percentage;
    if (negativityRate <= 5) percentage = 5; // Excellent
    else if (negativityRate <= 10) percentage = 15; // Good
    else if (negativityRate <= 20) percentage = 25; // Average
    else if (negativityRate <= 30) percentage = 35; // Below average
    else percentage = 50; // Poor
    
    return { percentage, score: this.calculateScore(percentage, 10, true) }; // true = reverse scoring
  }

  /**
   * Calculate App Usage based on video watching and engagement
   */
  static calculateAppUsage(userProgress) {
    if (userProgress.length === 0) {
      return { percentage: 0, score: 0 };
    }
    
    const totalWatchTime = userProgress.reduce((sum, progress) => sum + progress.totalWatchTime, 0);
    const avgWatchTime = totalWatchTime / userProgress.length;
    
    const videosWatched = userProgress.filter(progress => progress.videoWatched).length;
    const watchRate = (videosWatched / userProgress.length) * 100;
    
    // App usage scoring: Higher is better
    let percentage;
    if (watchRate >= 90 && avgWatchTime >= 300) percentage = 95; // Excellent (5+ min avg)
    else if (watchRate >= 80 && avgWatchTime >= 240) percentage = 85; // Good (4+ min avg)
    else if (watchRate >= 70 && avgWatchTime >= 180) percentage = 70; // Average (3+ min avg)
    else if (watchRate >= 60 && avgWatchTime >= 120) percentage = 50; // Below average (2+ min avg)
    else percentage = 25; // Poor
    
    return { percentage, score: this.calculateScore(percentage, 10) };
  }

  /**
   * Calculate Insufficiency based on incomplete modules and low engagement
   */
  static calculateInsufficiency(userModules) {
    if (userModules.length === 0) {
      return { percentage: 0, score: 10 }; // No modules = no insufficiency
    }
    
    const incompleteModules = userModules.filter(module => 
      module.status === 'not_started' || module.status === 'failed'
    ).length;
    
    const insufficiencyRate = (incompleteModules / userModules.length) * 100;
    
    // Insufficiency scoring: Lower is better
    let percentage;
    if (insufficiencyRate <= 5) percentage = 0; // Excellent
    else if (insufficiencyRate <= 10) percentage = 1; // Good
    else if (insufficiencyRate <= 20) percentage = 2; // Average
    else if (insufficiencyRate <= 30) percentage = 3; // Below average
    else percentage = 5; // Poor
    
    return { percentage, score: this.calculateScore(percentage, 10, true) }; // true = reverse scoring
  }

  /**
   * Calculate score based on percentage and weight
   */
  static calculateScore(percentage, weight, reverse = false) {
    if (reverse) {
      // For reverse scoring (lower percentage = higher score)
      if (percentage === 0) return weight;
      else if (percentage <= 1) return weight * 0.8;
      else if (percentage <= 2) return weight * 0.6;
      else if (percentage <= 3) return weight * 0.4;
      else if (percentage <= 5) return weight * 0.2;
      else return 0;
    } else {
      // For normal scoring (higher percentage = higher score)
      if (percentage >= 90) return weight;
      else if (percentage >= 80) return weight * 0.8;
      else if (percentage >= 70) return weight * 0.6;
      else if (percentage >= 60) return weight * 0.4;
      else if (percentage >= 50) return weight * 0.2;
      else return 0;
    }
  }

  /**
   * Calculate overall score
   */
  static calculateOverallScore(kpiMetrics) {
    const totalScore = kpiMetrics.tat.score +
                      kpiMetrics.majorNegativity.score +
                      kpiMetrics.quality.score +
                      kpiMetrics.neighborCheck.score +
                      kpiMetrics.generalNegativity.score +
                      kpiMetrics.appUsage.score +
                      kpiMetrics.insufficiency.score;
    
    return Math.round(totalScore);
  }

  /**
   * Determine rating based on overall score
   */
  static determineRating(overallScore) {
    if (overallScore >= 85) return 'Outstanding';
    else if (overallScore >= 70) return 'Excellent';
    else if (overallScore >= 50) return 'Satisfactory';
    else if (overallScore >= 40) return 'Need Improvement';
    else return 'Unsatisfactory';
  }

  /**
   * Generate KPI for all users based on real activity
   */
  static async generateAllUsersKPI(period) {
    try {
      console.log(`Generating KPI for all users for period ${period}`);
      
      const users = await User.find({ userType: 'user', isActive: true });
      const results = [];
      
      for (const user of users) {
        try {
          const kpiData = await this.calculateRealActivityKPI(user._id, period);
          
          // Check if KPI already exists for this period
          const existingKPI = await KPIScore.findOne({ 
            userId: user._id, 
            period, 
            isActive: true 
          });
          
          if (existingKPI) {
            // Update existing KPI
            existingKPI.tat = kpiData.tat;
            existingKPI.majorNegativity = kpiData.majorNegativity;
            existingKPI.quality = kpiData.quality;
            existingKPI.neighborCheck = kpiData.neighborCheck;
            existingKPI.negativity = kpiData.generalNegativity;
            existingKPI.appUsage = kpiData.appUsage;
            existingKPI.insufficiency = kpiData.insufficiency;
            existingKPI.overallScore = kpiData.overallScore;
            existingKPI.rating = kpiData.rating;
            existingKPI.comments = 'Auto-updated based on real user activity';
            existingKPI.automationStatus = 'pending'; // Reset for reprocessing
            
            await existingKPI.save();
            results.push({ userId: user._id, success: true, kpiData, action: 'updated' });
          } else {
            // Create new KPI score
            const kpiScore = new KPIScore({
              userId: user._id,
              period,
              tat: kpiData.tat,
              majorNegativity: kpiData.majorNegativity,
              quality: kpiData.quality,
              neighborCheck: kpiData.neighborCheck,
              negativity: kpiData.generalNegativity,
              appUsage: kpiData.appUsage,
              insufficiency: kpiData.insufficiency,
              overallScore: kpiData.overallScore,
              rating: kpiData.rating,
              submittedBy: user._id, // System generated
              comments: 'Auto-generated based on real user activity',
              automationStatus: 'pending'
            });
            
            await kpiScore.save();
            results.push({ userId: user._id, success: true, kpiData, action: 'created' });
          }
          
          console.log(`Generated KPI for user ${user.name}: ${kpiData.overallScore}%`);
          
        } catch (error) {
          console.error(`Error generating KPI for user ${user._id}:`, error);
          results.push({ userId: user._id, success: false, error: error.message });
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('Error generating all users KPI:', error);
      throw error;
    }
  }

  /**
   * Auto-generate KPI for a specific user when they complete activities
   */
  static async autoGenerateUserKPI(userId, activityType, activityData) {
    try {
      console.log(`Auto-generating KPI for user ${userId} after ${activityType}`);
      
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      // Calculate real activity KPI
      const kpiData = await this.calculateRealActivityKPI(userId, currentPeriod);
      
      // Check if KPI already exists for this period
      const existingKPI = await KPIScore.findOne({ 
        userId, 
        period: currentPeriod, 
        isActive: true 
      });
      
      if (existingKPI) {
        // Update existing KPI
        existingKPI.tat = kpiData.tat;
        existingKPI.majorNegativity = kpiData.majorNegativity;
        existingKPI.quality = kpiData.quality;
        existingKPI.neighborCheck = kpiData.neighborCheck;
        existingKPI.negativity = kpiData.generalNegativity;
        existingKPI.appUsage = kpiData.appUsage;
        existingKPI.insufficiency = kpiData.insufficiency;
        existingKPI.overallScore = kpiData.overallScore;
        existingKPI.rating = kpiData.rating;
        existingKPI.comments = `Auto-updated after ${activityType}`;
        existingKPI.automationStatus = 'pending'; // Reset for reprocessing
        
        await existingKPI.save();
        return { action: 'updated', kpiData };
      } else {
        // Create new KPI score
        const kpiScore = new KPIScore({
          userId,
          period: currentPeriod,
          tat: kpiData.tat,
          majorNegativity: kpiData.majorNegativity,
          quality: kpiData.quality,
          neighborCheck: kpiData.neighborCheck,
          negativity: kpiData.generalNegativity,
          appUsage: kpiData.appUsage,
          insufficiency: kpiData.insufficiency,
          overallScore: kpiData.overallScore,
          rating: kpiData.rating,
          submittedBy: userId, // System generated
          comments: `Auto-generated after ${activityType}`,
          automationStatus: 'pending'
        });
        
        await kpiScore.save();
        return { action: 'created', kpiData };
      }
      
    } catch (error) {
      console.error('Error auto-generating user KPI:', error);
      throw error;
    }
  }
}

module.exports = RealActivityKPIService;
