import React, { useState, useEffect } from 'react';
import { ArrowLeft, BarChart3, TrendingUp, Target, Award, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { toast } from 'sonner';

interface KPIScoresPageProps {
  userId: string;
}

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

export const KPIScoresPage: React.FC<KPIScoresPageProps> = ({ userId }) => {
  const { setCurrentPage } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [kpiScores, setKpiScores] = useState<KPIScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'history' | 'comparison'>('overview');

  useEffect(() => {
    if (userId) {
      fetchUserAndKPIData();
    }
  }, [userId]);

  const fetchUserAndKPIData = async () => {
    try {
      setLoading(true);
      
      // Fetch user details
      const userResponse = await apiService.users.getUserById(userId);
      if (userResponse && userResponse.data) {
        setUser(userResponse.data);
      } else if (userResponse && userResponse._id) {
        setUser(userResponse);
      }

      // Fetch KPI scores
      const kpiResponse = await apiService.kpi.getUserKPIScores(userId);
      if (kpiResponse && kpiResponse.data) {
        setKpiScores(Array.isArray(kpiResponse.data) ? kpiResponse.data : []);
      }

    } catch (error) {
      console.error('Error fetching KPI data:', error);
      toast.error('Failed to load KPI data');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setCurrentPage('user-management');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading KPI scores...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
          <p className="text-lg text-gray-600 mb-6">The requested user details could not be loaded.</p>
          <Button onClick={handleBack} className="bg-blue-600 hover:bg-blue-700 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to User Management
          </Button>
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
              <ArrowLeft className="w-4 h-4" /> Back to User Management
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KPI Scores</h1>
              <p className="text-gray-600 dark:text-gray-400">Performance metrics for {user.name}</p>
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
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'detailed', label: 'Detailed Analysis', icon: TrendingUp },
              { id: 'history', label: 'History', icon: Clock },
              { id: 'comparison', label: 'Comparison', icon: Target }
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
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Current KPI Score */}
              {latestKPI ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Current KPI Score - {latestKPI.period}
                    </CardTitle>
                    <CardDescription>
                      Latest performance metrics and rating
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
                    <p className="text-gray-600">No performance metrics have been recorded for this user yet.</p>
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

          {activeTab === 'detailed' && (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Analysis</CardTitle>
                <CardDescription>In-depth breakdown of performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Detailed Analysis Coming Soon</h3>
                  <p className="text-gray-600">This section will contain detailed performance analysis and insights.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'history' && (
            <Card>
              <CardHeader>
                <CardTitle>KPI History</CardTitle>
                <CardDescription>Historical performance data and trends</CardDescription>
              </CardHeader>
              <CardContent>
                {kpiScores.length > 0 ? (
                  <div className="space-y-4">
                    {kpiScores.map((kpi) => (
                      <div key={kpi._id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{kpi.period}</h4>
                            <p className="text-sm text-gray-600">{formatDate(kpi.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${getScoreColor(kpi.overallScore)}`}>
                              {kpi.overallScore}%
                            </div>
                            <Badge className={getRatingColor(kpi.rating)}>
                              {kpi.rating}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-center text-sm">
                          <div>
                            <div className="font-medium">{kpi.calculatedScores.operationalScore}%</div>
                            <div className="text-gray-600">Operational</div>
                          </div>
                          <div>
                            <div className="font-medium">{kpi.calculatedScores.qualityScore}%</div>
                            <div className="text-gray-600">Quality</div>
                          </div>
                          <div>
                            <div className="font-medium">{kpi.calculatedScores.efficiencyScore}%</div>
                            <div className="text-gray-600">Efficiency</div>
                          </div>
                        </div>

                        {kpi.triggeredActions.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-sm text-gray-600 mb-2">Triggered Actions:</div>
                            <div className="flex flex-wrap gap-2">
                              {kpi.triggeredActions.map((action, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {action}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No History Available</h3>
                    <p className="text-gray-600">No historical KPI data found for this user.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'comparison' && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
                <CardDescription>Compare performance across different periods</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Comparison Analysis Coming Soon</h3>
                  <p className="text-gray-600">This section will contain performance comparison and benchmarking features.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
