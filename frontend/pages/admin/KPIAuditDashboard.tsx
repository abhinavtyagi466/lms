import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import {
  Trophy,
  Star,
  ThumbsUp,
  TrendingUp,
  AlertTriangle,
  Search,
  RefreshCw,
  Loader2,
  Calendar,
  Award,
  AlertCircle,
  BarChart3,
  Users,
  Eye,
  Mail,
  FilePlus
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

interface UserKPIData {
  userId: string;
  name: string;
  email: string;
  employeeId: string;
  department: string;
  kpiScore: number;
  rating: string;
  period: string;
  kpiScoreId: string;
  triggeredActions: string[];
  metrics: {
    tat: number;
    majorNegativity: number;
    quality: number;
    neighborCheck: number;
    negativity: number;
    appUsage: number;
    insufficiency: number;
  };
  pendingAudits: any[];
  pendingTraining: any[];
  auditRequirement: string;
  trainingRequirement: string;
  warningRequired: boolean;
  rewardEligible: boolean;
  lastUpdated: string;
}

interface GroupedData {
  outstanding: UserKPIData[];
  excellent: UserKPIData[];
  satisfactory: UserKPIData[];
  needImprovement: UserKPIData[];
  unsatisfactory: UserKPIData[];
}

interface Statistics {
  total: number;
  outstanding: number;
  excellent: number;
  satisfactory: number;
  needImprovement: number;
  unsatisfactory: number;
  averageScore: number;
}

const KPIAuditDashboard: React.FC = () => {
  const { setCurrentPage } = useAuth();
  const [data, setData] = useState<GroupedData>({
    outstanding: [],
    excellent: [],
    satisfactory: [],
    needImprovement: [],
    unsatisfactory: []
  });
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    outstanding: 0,
    excellent: 0,
    satisfactory: 0,
    needImprovement: 0,
    unsatisfactory: 0,
    averageScore: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedUser, setSelectedUser] = useState<UserKPIData | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Navigate to Audit Management
  const openAuditManagement = () => {
    setCurrentPage('warnings-audit');
  };

  // View user details
  const viewUserDetails = (user: UserKPIData) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  // Send email to user
  const sendEmailToUser = async (user: UserKPIData) => {
    try {
      // TODO: Implement actual email sending logic
      // Email sending functionality will be implemented here
      console.log('Email functionality for:', user.email);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  useEffect(() => {
    loadKPIData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadKPIData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadKPIData = async () => {
    try {
      setLoading(true);
      const response = await apiService.auditScheduling.getByKPIRating();
      
      // Response interceptor already returns response.data, so response is the API data
      if (response && typeof response === 'object' && 'success' in response && response.success && response.data) {
        setData(response.data.groupedByRating);
        setStatistics(response.data.statistics);
        setLastUpdated(new Date(response.data.lastUpdated));
      }
    } catch (error) {
      console.error('Failed to load KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating: string) => {
    const colors: Record<string, string> = {
      'Outstanding': 'bg-green-100 text-green-800 border-green-200',
      'Excellent': 'bg-blue-100 text-blue-800 border-blue-200',
      'Satisfactory': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Need Improvement': 'bg-orange-100 text-orange-800 border-orange-200',
      'Unsatisfactory': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[rating] || 'bg-gray-100 text-gray-800 border-gray-200';
  };


  const filterUsers = (users: UserKPIData[]) => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(user => 
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.employeeId?.toLowerCase().includes(term)
    );
  };

  const renderUserTable = (users: UserKPIData[], rating: string) => {
    const filteredUsers = filterUsers(users);

    if (filteredUsers.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No users in this category</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>KPI Score</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Training Required</TableHead>
              <TableHead>Audit Required</TableHead>
              <TableHead>Pending Actions</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.userId} className="hover:bg-gray-50">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-sm text-gray-500">{user.employeeId}</span>
                    <span className="text-xs text-gray-400">{user.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <span className="font-bold text-lg">{user.kpiScore.toFixed(2)}%</span>
                      <Badge className={`${getRatingColor(rating)} text-xs`}>
                        {rating}
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{user.period}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={user.trainingRequirement === 'None' ? 'outline' : 'default'}
                    className={user.trainingRequirement === 'None' ? '' : 'bg-orange-600 text-black dark:text-white font-semibold'}
                  >
                    {user.trainingRequirement}
                  </Badge>
                  {user.pendingTraining.length > 0 && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">
                      {user.pendingTraining.length} pending
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    <span className="text-sm text-gray-900 dark:text-gray-100">{user.auditRequirement}</span>
                    {user.pendingAudits.length > 0 && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">
                        {user.pendingAudits.length} scheduled
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.rewardEligible && (
                      <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                        <Award className="w-3 h-3 mr-1" />
                        Reward
                      </Badge>
                    )}
                    {user.warningRequired && (
                      <Badge className="bg-red-100 text-red-800 text-xs">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Warning
                      </Badge>
                    )}
                    {user.pendingAudits.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {user.pendingAudits.length} Audits
                      </Badge>
                    )}
                    {user.pendingTraining.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {user.pendingTraining.length} Training
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      title="View Details"
                      onClick={() => viewUserDetails(user)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      title="Send Email"
                      onClick={() => sendEmailToUser(user)}
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            KPI-Based Audit Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Users categorized by KPI performance ratings with real-time audit requirements
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={loadKPIData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={openAuditManagement}
            className="bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800 text-black dark:text-black font-semibold shadow-lg flex items-center gap-2"
          >
            <FilePlus className="w-4 h-4" />
            Audit Management
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total</p>
                <p className="text-2xl font-bold">{statistics.total}</p>
              </div>
              <Users className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600">Outstanding</p>
                <p className="text-2xl font-bold text-green-700">{statistics.outstanding}</p>
              </div>
              <Trophy className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600">Excellent</p>
                <p className="text-2xl font-bold text-blue-700">{statistics.excellent}</p>
              </div>
              <Star className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-yellow-600">Satisfactory</p>
                <p className="text-2xl font-bold text-yellow-700">{statistics.satisfactory}</p>
              </div>
              <ThumbsUp className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-600">Need Improvement</p>
                <p className="text-2xl font-bold text-orange-700">{statistics.needImprovement}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600">Unsatisfactory</p>
                <p className="text-2xl font-bold text-red-700">{statistics.unsatisfactory}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <Search className="w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search by name, email, or employee ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        {searchTerm && (
          <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')}>
            Clear
          </Button>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="outstanding">
            Outstanding ({statistics.outstanding})
          </TabsTrigger>
          <TabsTrigger value="excellent">
            Excellent ({statistics.excellent})
          </TabsTrigger>
          <TabsTrigger value="satisfactory">
            Satisfactory ({statistics.satisfactory})
          </TabsTrigger>
          <TabsTrigger value="needImprovement">
            Need Improvement ({statistics.needImprovement})
          </TabsTrigger>
          <TabsTrigger value="unsatisfactory">
            Unsatisfactory ({statistics.unsatisfactory})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  KPI Performance Overview
                </CardTitle>
                <CardDescription>
                  Distribution of users across KPI rating categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Average KPI Score</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {statistics.averageScore.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-green-700 font-semibold">Outstanding (85-100)</div>
                      <div className="text-2xl font-bold text-green-800">{statistics.outstanding}</div>
                      <div className="text-xs text-green-600">
                        {statistics.total > 0 ? ((statistics.outstanding / statistics.total) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-blue-700 font-semibold">Excellent (70-84)</div>
                      <div className="text-2xl font-bold text-blue-800">{statistics.excellent}</div>
                      <div className="text-xs text-blue-600">
                        {statistics.total > 0 ? ((statistics.excellent / statistics.total) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="text-yellow-700 font-semibold">Satisfactory (50-69)</div>
                      <div className="text-2xl font-bold text-yellow-800">{statistics.satisfactory}</div>
                      <div className="text-xs text-yellow-600">
                        {statistics.total > 0 ? ((statistics.satisfactory / statistics.total) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="text-orange-700 font-semibold">Need Improvement (40-49)</div>
                      <div className="text-2xl font-bold text-orange-800">{statistics.needImprovement}</div>
                      <div className="text-xs text-orange-600">
                        {statistics.total > 0 ? ((statistics.needImprovement / statistics.total) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-red-700 font-semibold">Unsatisfactory (&lt;40)</div>
                      <div className="text-2xl font-bold text-red-800">{statistics.unsatisfactory}</div>
                      <div className="text-xs text-red-600">
                        {statistics.total > 0 ? ((statistics.unsatisfactory / statistics.total) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audit & Training Requirements Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Total Pending Audits</h3>
                    <p className="text-3xl font-bold text-blue-700">
                      {data.excellent.reduce((sum, u) => sum + u.pendingAudits.length, 0) +
                       data.satisfactory.reduce((sum, u) => sum + u.pendingAudits.length, 0) +
                       data.needImprovement.reduce((sum, u) => sum + u.pendingAudits.length, 0) +
                       data.unsatisfactory.reduce((sum, u) => sum + u.pendingAudits.length, 0)}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h3 className="font-semibold text-orange-900 mb-2">Total Pending Training</h3>
                    <p className="text-3xl font-bold text-orange-700">
                      {data.needImprovement.reduce((sum, u) => sum + u.pendingTraining.length, 0) +
                       data.unsatisfactory.reduce((sum, u) => sum + u.pendingTraining.length, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="outstanding">
          <Card className="border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-green-600" />
                Outstanding Performance (85-100)
              </CardTitle>
              <CardDescription>
                No training or audit required • Eligible for rewards
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                renderUserTable(data.outstanding, 'Outstanding')
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="excellent">
          <Card className="border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-blue-600" />
                Excellent Performance (70-84)
              </CardTitle>
              <CardDescription>
                Audit Call required • No training needed
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                renderUserTable(data.excellent, 'Excellent')
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="satisfactory">
          <Card className="border-yellow-200">
            <CardHeader className="bg-yellow-50">
              <CardTitle className="flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-yellow-600" />
                Satisfactory Performance (50-69)
              </CardTitle>
              <CardDescription>
                Audit Call + Cross-check last 3 months data required • No training needed
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                renderUserTable(data.satisfactory, 'Satisfactory')
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="needImprovement">
          <Card className="border-orange-200">
            <CardHeader className="bg-orange-50">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                Need Improvement (40-49)
              </CardTitle>
              <CardDescription>
                Basic Training + Audit Call + Cross-check required
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                renderUserTable(data.needImprovement, 'Need Improvement')
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unsatisfactory">
          <Card className="border-red-200">
            <CardHeader className="bg-red-50">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Unsatisfactory Performance (&lt;40)
              </CardTitle>
              <CardDescription>
                Basic Training + Audit Call + Cross-check + Warning Letter required
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                renderUserTable(data.unsatisfactory, 'Unsatisfactory')
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  User KPI Details
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetailsModal(false)}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                {/* User Info */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Employee Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Name:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{selectedUser.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Employee ID:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{selectedUser.employeeId}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Email:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{selectedUser.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Department:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{selectedUser.department}</span>
                    </div>
                  </div>
                </div>

                {/* KPI Score */}
                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">KPI Performance</h3>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedUser.kpiScore.toFixed(2)}%
                      </p>
                      <Badge className={getRatingColor(selectedUser.rating)}>
                        {selectedUser.rating}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <p>Period: {selectedUser.period}</p>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Performance Metrics</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">TAT:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedUser.metrics.tat}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Major Negativity:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedUser.metrics.majorNegativity}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Quality:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedUser.metrics.quality}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Neighbor Check:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedUser.metrics.neighborCheck}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">App Usage:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedUser.metrics.appUsage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Insufficiency:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedUser.metrics.insufficiency}%</span>
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Action Requirements</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Training:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{selectedUser.trainingRequirement}</span>
                    </div>
                    <div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Audit:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{selectedUser.auditRequirement}</span>
                    </div>
                  </div>
                </div>

                {/* Pending Actions */}
                {(selectedUser.pendingAudits.length > 0 || selectedUser.pendingTraining.length > 0) && (
                  <div className="bg-orange-50 dark:bg-orange-900 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Pending Actions</h3>
                    {selectedUser.pendingAudits.length > 0 && (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Audits: {selectedUser.pendingAudits.length} scheduled
                      </p>
                    )}
                    {selectedUser.pendingTraining.length > 0 && (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Training: {selectedUser.pendingTraining.length} assigned
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    sendEmailToUser(selectedUser);
                    setShowDetailsModal(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KPIAuditDashboard;

