import React, { useState, useEffect } from 'react';
import { ArrowLeft, BarChart3, TrendingUp, Target, Award, AlertTriangle, CheckCircle, Clock, User, Trophy, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { toast } from 'sonner';

// Enhanced KPI Score interface matching backend structure
interface KPIScore {
  _id: string;
  userId: string;
  period: string;
  // Raw operational data
  rawData: {
    totalCases: number;
    tatPercentage: number;
    majorNegPercentage: number;
    generalNegPercentage: number;
    qualityPercentage: number;
    insuffPercentage: number;
    neighborCheckPercentage: number;
    onlinePercentage: number;
  };
  // Calculated scores
  calculatedScores: {
    operationalScore: number;
    qualityScore: number;
    efficiencyScore: number;
    overallScore: number;
  };
  // Final results
  overallScore: number;
  rating: 'Outstanding' | 'Excellent' | 'Satisfactory' | 'Need Improvement' | 'Unsatisfactory';
  triggeredActions: string[];
  automationStatus: 'pending' | 'completed' | 'failed';
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

// Training Assignment interface
interface TrainingAssignment {
  _id: string;
  userId: string;
  moduleId: string;
  moduleTitle: string;
  assignedBy: string;
  assignedAt: string;
  dueDate: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'overdue';
  reason: string;
  priority: 'low' | 'medium' | 'high';
}

// Audit Schedule interface
interface AuditSchedule {
  _id: string;
  userId: string;
  auditType: string;
  scheduledDate: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  reason: string;
  notes: string;
  scheduledBy: string;
}

// Warning Letter interface
interface WarningLetter {
  _id: string;
  userId: string;
  type: string;
  reason: string;
  status: 'sent' | 'acknowledged' | 'resolved';
  sentDate: string;
  acknowledgedDate?: string;
  resolvedDate?: string;
}

export const KPIScoresPage: React.FC = () => {
  const { user, setCurrentPage } = useAuth();
  const [kpiScores, setKpiScores] = useState<KPIScore[]>([]);
  const [trainingAssignments, setTrainingAssignments] = useState<TrainingAssignment[]>([]);
  const [auditSchedules, setAuditSchedules] = useState<AuditSchedule[]>([]);
  const [warningLetters, setWarningLetters] = useState<WarningLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'report-card' | 'assignments' | 'audits' | 'warnings'>('report-card');

  useEffect(() => {
    if (user) {
      fetchKPIData();
    }
  }, [user]);

  const fetchKPIData = async () => {
    try {
      setLoading(true);
      
      // Fetch KPI scores
      const kpiResponse = await apiService.kpi.getUserKPIScores(user._id);
      if (kpiResponse && kpiResponse.data) {
        setKpiScores(Array.isArray(kpiResponse.data) ? kpiResponse.data : []);
      }

      // Fetch training assignments
      const trainingResponse = await apiService.trainingAssignments.getUserAssignments(user._id);
      if (trainingResponse && trainingResponse.data) {
        setTrainingAssignments(Array.isArray(trainingResponse.data) ? trainingResponse.data : []);
      }

      // Fetch audit schedules
      const auditResponse = await apiService.audits.getUserAudits(user._id);
      if (auditResponse && auditResponse.data) {
        setAuditSchedules(Array.isArray(auditResponse.data) ? auditResponse.data : []);
      }

      // Fetch warning letters
      const warningResponse = await apiService.users.getUserWarnings(user._id);
      if (warningResponse && warningResponse.data) {
        setWarningLetters(Array.isArray(warningResponse.data) ? warningResponse.data : []);
      }

    } catch (error) {
      console.error('Error fetching KPI data:', error);
      toast.error('Failed to load KPI data');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setCurrentPage('user-dashboard');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'Outstanding': return 'bg-green-100 text-green-800';
      case 'Excellent': return 'bg-blue-100 text-blue-800';
      case 'Satisfactory': return 'bg-yellow-100 text-yellow-800';
      case 'Need Improvement': return 'bg-orange-100 text-orange-800';
      case 'Unsatisfactory': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      case 'sent': return 'bg-orange-100 text-orange-800';
      case 'acknowledged': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading KPI data...</p>
        </div>
      </div>
    );
  }

  const latestKPI = kpiScores.length > 0 ? kpiScores[0] : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Back Button */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button onClick={handleBack} variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KPI Scores & Updates</h1>
              <p className="text-gray-600 dark:text-gray-400">Your performance metrics and assigned tasks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Tabs */}
        <div className="border-b mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'report-card', label: 'KPI Report Card', icon: BarChart3 },
              { id: 'assignments', label: 'Training Assignments', icon: Trophy },
              { id: 'audits', label: 'Audit Schedule', icon: Target },
              { id: 'warnings', label: 'Warning Letters', icon: AlertTriangle }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'report-card' && (
            <div className="space-y-6">
              {/* Current KPI Score */}
              {latestKPI ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      KPI Report Card - {latestKPI.period}
                    </CardTitle>
                    <CardDescription>
                      Your latest performance metrics and rating
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Overall Score */}
                      <div className="text-center">
                        <div className={`text-4xl font-bold ${getScoreColor(latestKPI.overallScore)}`}>
                          {latestKPI.overallScore}%
                        </div>
                        <div className="text-sm text-gray-600">Overall Score</div>
                        <Badge className={`mt-2 ${getRatingColor(latestKPI.rating)}`}>
                          {latestKPI.rating}
                        </Badge>
                      </div>

                      {/* Progress Bar */}
                      <div className="md:col-span-2">
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span>Overall Performance</span>
                              <span>{latestKPI.overallScore}%</span>
                            </div>
                            <Progress value={latestKPI.overallScore} className="h-3" />
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-lg font-semibold">{latestKPI.calculatedScores.operationalScore}%</div>
                              <div className="text-xs text-gray-600">Operational</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold">{latestKPI.calculatedScores.qualityScore}%</div>
                              <div className="text-xs text-gray-600">Quality</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold">{latestKPI.calculatedScores.efficiencyScore}%</div>
                              <div className="text-xs text-gray-600">Efficiency</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No KPI Scores Available</h3>
                    <p className="text-gray-600">No performance metrics have been recorded for you yet.</p>
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{kpiScores.length}</div>
                    <div className="text-sm text-gray-600">Total Records</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {kpiScores.filter(kpi => kpi.rating === 'Outstanding' || kpi.rating === 'Excellent').length}
                    </div>
                    <div className="text-sm text-gray-600">High Performers</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {kpiScores.filter(kpi => kpi.rating === 'Need Improvement' || kpi.rating === 'Unsatisfactory').length}
                    </div>
                    <div className="text-sm text-gray-600">Need Improvement</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {kpiScores.filter(kpi => kpi.triggeredActions.length > 0).length}
                    </div>
                    <div className="text-sm text-gray-600">With Actions</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Training Assignments
                </CardTitle>
                <CardDescription>Your assigned training modules and progress</CardDescription>
              </CardHeader>
              <CardContent>
                {trainingAssignments.length > 0 ? (
                  <div className="space-y-4">
                    {trainingAssignments.map((assignment) => (
                      <div key={assignment._id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{assignment.moduleTitle}</h4>
                            <p className="text-sm text-gray-600">Assigned: {formatDate(assignment.assignedAt)}</p>
                            <p className="text-sm text-gray-600">Due: {formatDate(assignment.dueDate)}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(assignment.status)}>
                              {assignment.status.replace('_', ' ')}
                            </Badge>
                            <div className="text-xs text-gray-500 mt-1">
                              Priority: {assignment.priority}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <strong>Reason:</strong> {assignment.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Training Assignments</h3>
                    <p className="text-gray-600">You have no pending training assignments.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'audits' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Audit Schedule
                </CardTitle>
                <CardDescription>Your scheduled audits and reviews</CardDescription>
              </CardHeader>
              <CardContent>
                {auditSchedules.length > 0 ? (
                  <div className="space-y-4">
                    {auditSchedules.map((audit) => (
                      <div key={audit._id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{audit.auditType}</h4>
                            <p className="text-sm text-gray-600">Scheduled: {formatDate(audit.scheduledDate)}</p>
                            <p className="text-sm text-gray-600">Scheduled by: {audit.scheduledBy}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(audit.status)}>
                              {audit.status.replace('_', ' ')}
                            </Badge>
                            <div className="text-xs text-gray-500 mt-1">
                              Priority: {audit.priority}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <strong>Reason:</strong> {audit.reason}
                        </div>
                        {audit.notes && (
                          <div className="text-sm text-gray-600 mt-2">
                            <strong>Notes:</strong> {audit.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Audit Schedule</h3>
                    <p className="text-gray-600">You have no scheduled audits.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'warnings' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Warning Letters
                </CardTitle>
                <CardDescription>Your warning letters and status</CardDescription>
              </CardHeader>
              <CardContent>
                {warningLetters.length > 0 ? (
                  <div className="space-y-4">
                    {warningLetters.map((warning) => (
                      <div key={warning._id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{warning.type}</h4>
                            <p className="text-sm text-gray-600">Sent: {formatDate(warning.sentDate)}</p>
                            {warning.acknowledgedDate && (
                              <p className="text-sm text-gray-600">Acknowledged: {formatDate(warning.acknowledgedDate)}</p>
                            )}
                            {warning.resolvedDate && (
                              <p className="text-sm text-gray-600">Resolved: {formatDate(warning.resolvedDate)}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(warning.status)}>
                              {warning.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <strong>Reason:</strong> {warning.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Warning Letters</h3>
                    <p className="text-gray-600">You have no warning letters.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
