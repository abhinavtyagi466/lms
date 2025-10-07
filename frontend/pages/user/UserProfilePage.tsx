import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  User, Mail, Phone, MapPin, Calendar, Briefcase, GraduationCap,
  CreditCard, FileText, Award, AlertTriangle, BarChart3, Activity,
  Clock, Target, TrendingUp, Download, Eye
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface KPIScore {
  period: string;
  overallScore: number;
  rating: string;
  metrics: any;
}

interface Award {
  _id: string;
  type: string;
  title: string;
  description: string;
  awardDate: string;
  value?: number;
}

interface Warning {
  _id: string;
  title: string;
  message: string;
  severity: string;
  createdAt: string;
}

export const UserProfilePage: React.FC = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [kpiScores, setKpiScores] = useState<KPIScore[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    if (authUser?._id) {
      fetchUserProfile();
    }
  }, [authUser]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const [profileRes, kpiRes, awardsRes, warningsRes]: any[] = await Promise.all([
        apiService.users.getProfile(authUser._id),
        apiService.kpi.getUserKPIScores(authUser._id).catch(() => ({ scores: [] })),
        apiService.awards.getUserAwards(authUser._id).catch(() => ({ awards: [] })),
        apiService.users.getUserWarnings(authUser._id).catch(() => ({ warnings: [] }))
      ]);

      // Get KPI scores and find latest
      const scores = kpiRes.scores || kpiRes || [];
      setKpiScores(scores);
      
      // Update user profile with latest KPI score from KPIScore database (overrides user model kpiScore field)
      // Backend already returns latest KPI via KPIScore.getLatestForUser() but we double-check here
      if (scores.length > 0) {
        // Find latest by sorting by createdAt or period
        const sortedScores = [...scores].sort((a, b) => {
          const dateA = new Date(a.createdAt || a.period);
          const dateB = new Date(b.createdAt || b.period);
          return dateB.getTime() - dateA.getTime();
        });
        
        const latestKPI = sortedScores[0];
        console.log('📊 Latest KPI Score from database:', latestKPI.overallScore, '|', latestKPI.rating);
        
        // Override with actual database KPI score
        profileRes.kpiScore = latestKPI.overallScore;
        profileRes.kpiRating = latestKPI.rating;
      } else {
        console.log('⚠ No KPI scores found for user, using default 0');
        profileRes.kpiScore = 0;
        profileRes.kpiRating = 'No Score';
      }
      
      setUser(profileRes);
      setAwards(awardsRes.awards || awardsRes || []);
      setWarnings(warningsRes.warnings || warningsRes || []);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getKPIColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-blue-600 bg-blue-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getRatingBadge = (rating: string) => {
    const colors: any = {
      'Outstanding': 'bg-purple-100 text-purple-800',
      'Excellent': 'bg-green-100 text-green-800',
      'Very Good': 'bg-blue-100 text-blue-800',
      'Good': 'bg-cyan-100 text-cyan-800',
      'Satisfactory': 'bg-yellow-100 text-yellow-800',
      'Needs Improvement': 'bg-orange-100 text-orange-800',
      'Poor': 'bg-red-100 text-red-800'
    };
    return colors[rating] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="p-6 space-y-6">
        {/* Header with Profile Summary */}
        <Card className="p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {user.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  {user.designation || 'Field Executive'}
                </Badge>
                <Badge className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {user.status}
                </Badge>
                <Badge variant="outline">ID: {user.employeeId}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{user.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{user.city || 'N/A'}, {user.state || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* KPI Score Card */}
            <div className="flex-shrink-0">
              <Card className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 text-white border-0">
                <div className="text-center">
                  <p className="text-sm opacity-90 mb-1">Current KPI</p>
                  <p className="text-4xl font-bold">{user.kpiScore || 0}</p>
                  <p className="text-xs opacity-75 mt-1">Out of 100</p>
                  {user.kpiRating && user.kpiRating !== 'No Score' && (
                    <Badge className="mt-2 bg-white/20 text-white border-0">
                      {user.kpiRating}
                    </Badge>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Awards</p>
                <p className="text-3xl font-bold text-green-600">{awards.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Warnings</p>
                <p className="text-3xl font-bold text-orange-600">{warnings.length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">KPI Records</p>
                <p className="text-3xl font-bold text-blue-600">{kpiScores.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tenure</p>
                <p className="text-3xl font-bold text-purple-600">
                  {user.dateOfJoining 
                    ? Math.floor((new Date().getTime() - new Date(user.dateOfJoining).getTime()) / (1000 * 60 * 60 * 24 * 30))
                    : 0}
                </p>
                <p className="text-xs text-gray-500">Months</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Tabbed Content */}
        <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="personal">
                <User className="w-4 h-4 mr-2" />
                Personal
              </TabsTrigger>
              <TabsTrigger value="kpi">
                <BarChart3 className="w-4 h-4 mr-2" />
                KPI Scores
              </TabsTrigger>
              <TabsTrigger value="awards">
                <Award className="w-4 h-4 mr-2" />
                Awards ({awards.length})
              </TabsTrigger>
              <TabsTrigger value="warnings">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Warnings ({warnings.length})
              </TabsTrigger>
              <TabsTrigger value="activity">
                <Activity className="w-4 h-4 mr-2" />
                Activity
              </TabsTrigger>
            </TabsList>

            {/* Personal Details Tab */}
            <TabsContent value="personal" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Basic Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-medium">{user.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Employee ID</p>
                      <p className="font-medium">{user.employeeId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date of Birth</p>
                      <p className="font-medium">{formatDate(user.dateOfBirth)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Father's Name</p>
                      <p className="font-medium">{user.fathersName || 'N/A'}</p>
                    </div>
                  </div>
                </Card>

                {/* Contact Information */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-green-600" />
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{user.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Current Address</p>
                      <p className="font-medium text-sm">{user.currentAddress || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium">{user.city}, {user.state}</p>
                    </div>
                  </div>
                </Card>

                {/* Employment Information */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                    Employment Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Designation</p>
                      <p className="font-medium">{user.designation || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Department</p>
                      <p className="font-medium">{user.department || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date of Joining</p>
                      <p className="font-medium">{formatDate(user.dateOfJoining)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Reporting Manager</p>
                      <p className="font-medium">{user.reportingManager || 'N/A'}</p>
                    </div>
                  </div>
                </Card>

                {/* Documents & Identification */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-orange-600" />
                    Identification
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Aadhaar Number</p>
                      <p className="font-medium">{user.aadhaarNo ? `XXXX-XXXX-${user.aadhaarNo.slice(-4)}` : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">PAN Number</p>
                      <p className="font-medium">{user.panNo || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Highest Education</p>
                      <p className="font-medium">{user.highestEducation || 'N/A'}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Account Status */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  Account Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Account Status</p>
                    <Badge className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Performance Status</p>
                    <Badge variant="outline">{user.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Login</p>
                    <p className="font-medium text-sm">{user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* KPI Scores Tab */}
            <TabsContent value="kpi" className="space-y-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">KPI Performance History</h3>
                <Badge className="bg-blue-100 text-blue-800">
                  {kpiScores.length} Records
                </Badge>
              </div>

              {kpiScores.length === 0 ? (
                <Card className="p-12 text-center">
                  <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No KPI scores recorded yet</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {kpiScores.map((score, index) => (
                    <Card key={index} className="p-6 hover:shadow-lg transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-lg">{score.period}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(score.period).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-4xl font-bold ${getKPIColor(score.overallScore)} px-4 py-2 rounded-lg`}>
                            {score.overallScore}
                          </div>
                          <Badge className={`mt-2 ${getRatingBadge(score.rating)}`}>
                            {score.rating}
                          </Badge>
                        </div>
                      </div>

                      {/* KPI Metrics Breakdown */}
                      {score.metrics && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t">
                          {Object.entries(score.metrics).map(([key, value]: [string, any]) => (
                            <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-600 capitalize">{key}</p>
                              <p className="text-lg font-bold">{value.score || 0}</p>
                              <p className="text-xs text-gray-500">{value.percentage?.toFixed(1)}%</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Awards Tab */}
            <TabsContent value="awards" className="space-y-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Awards & Recognition</h3>
                <Badge className="bg-green-100 text-green-800">
                  {awards.length} Awards
                </Badge>
              </div>

              {awards.length === 0 ? (
                <Card className="p-12 text-center">
                  <Award className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No awards received yet</p>
                  <p className="text-sm text-gray-500 mt-2">Keep up the good work to earn recognition!</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {awards.map((award) => (
                    <Card key={award._id} className="p-6 border-l-4 border-l-green-500 hover:shadow-lg transition-all">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <Award className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">{award.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{award.description}</p>
                          <div className="flex items-center gap-3 text-sm">
                            <Badge variant="outline">{award.type}</Badge>
                            <span className="text-gray-500">{formatDate(award.awardDate)}</span>
                            {award.value && (
                              <Badge className="bg-yellow-100 text-yellow-800">₹{award.value}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Warnings Tab */}
            <TabsContent value="warnings" className="space-y-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Warnings & Notices</h3>
                <Badge className="bg-orange-100 text-orange-800">
                  {warnings.length} Warnings
                </Badge>
              </div>

              {warnings.length === 0 ? (
                <Card className="p-12 text-center">
                  <AlertTriangle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No warnings issued</p>
                  <p className="text-sm text-gray-500 mt-2">Great job! Keep maintaining good performance.</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {warnings.map((warning) => (
                    <Card key={warning._id} className="p-6 border-l-4 border-l-orange-500">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-lg">{warning.title}</h4>
                            <Badge className="bg-orange-100 text-orange-800">{warning.severity}</Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-3">{warning.message}</p>
                          <p className="text-xs text-gray-500">{formatDate(warning.createdAt)}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Session Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Last Login</p>
                      <p className="font-medium">{user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Account Created</p>
                      <p className="font-medium">{formatDate(user.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Updated</p>
                      <p className="font-medium">{formatDate(user.updatedAt)}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    Performance Summary
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Current KPI Score</p>
                      <div className="flex items-center gap-2">
                        <Progress value={user.kpiScore || 0} className="flex-1" />
                        <span className="font-bold text-lg">{user.kpiScore || 0}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Performance Status</p>
                      <Badge className={
                        user.status === 'Active' ? 'bg-green-100 text-green-800' :
                        user.status === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {user.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Months</p>
                      <p className="font-medium">
                        {user.dateOfJoining 
                          ? Math.floor((new Date().getTime() - new Date(user.dateOfJoining).getTime()) / (1000 * 60 * 60 * 24 * 30))
                          : 0} months
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

