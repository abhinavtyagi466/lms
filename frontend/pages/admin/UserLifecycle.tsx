import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Clock,
  UserPlus,
  LogIn,
  LogOut,
  AlertTriangle,
  CheckCircle,
  Eye,
  Filter,
  Search,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { apiService } from '../../services/apiService';
import { toast } from 'sonner';

interface UserLifecycleEvent {
  _id: string;
  userId: string;
  type: 'joined' | 'training' | 'audit' | 'warning' | 'achievement' | 'exit';
  title: string;
  description: string;
  category: 'milestone' | 'positive' | 'negative' | 'neutral';
  attachments?: Array<{
    type: string;
    path: string;
    name: string;
    uploadedAt: string;
  }>;
  metadata?: any;
  createdBy?: string;
  createdAt: string;
}

interface UserActivity {
  _id: string;
  userId: string;
  activityType: string;
  description: string;
  metadata: any;
  ipAddress: string;
  userAgent: string;
  deviceInfo: {
    type: string;
    os: string;
    browser: string;
    version: string;
  };
  location: {
    country: string;
    region: string;
    city: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  sessionId: string;
  duration: number;
  success: boolean;
  errorMessage?: string;
  relatedEntity?: {
    type: string;
    id: string;
  };
  tags: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  isSuspicious: boolean;
  riskScore: number;
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  userType: 'user' | 'admin';
  employeeId: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
  exitDetails?: {
    exitDate: string;
    exitReason: {
      mainCategory: string;
      subCategory?: string;
    };
    exitReasonDescription?: string;
    verifiedBy?: string;
    verifiedByUser?: any;
    verifiedAt?: string;
    remarks?: string;
    proofDocument?: {
      fileName: string;
      filePath: string;
      fileSize: number;
      mimeType: string;
      uploadedAt: string;
    };
  };
}

interface UserLifecycleData {
  user: User;
  lifecycleEvents: UserLifecycleEvent[];
  loginAttempts: UserActivity[];
  totalActivities: number;
  suspiciousActivities: number;
  lastActivity: string;
}

export const UserLifecycle: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userLifecycleData, setUserLifecycleData] = useState<UserLifecycleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingUserData, setLoadingUserData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.users.getAllUsers();
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLifecycleData = async (userId: string) => {
    try {
      setLoadingUserData(true);
      const [lifecycleResponse, loginAttemptsResponse, activitySummaryResponse] = await Promise.all([
        apiService.lifecycle.getUserLifecycle(userId, { limit: 50 }),
        apiService.userActivity.getLoginAttempts(userId, 30),
        apiService.userActivity.getActivitySummary(userId, 30)
      ]);

      const user = users.find(u => u._id === userId);
      if (!user) return;

      setUserLifecycleData({
        user,
        lifecycleEvents: lifecycleResponse.data?.events || [],
        loginAttempts: loginAttemptsResponse.data?.attempts || [],
        totalActivities: activitySummaryResponse.data?.totalActivities || 0,
        suspiciousActivities: activitySummaryResponse.data?.suspiciousActivities || 0,
        lastActivity: activitySummaryResponse.data?.recentActivities?.[0]?.createdAt || user.lastLogin || user.createdAt
      });
    } catch (error) {
      console.error('Error fetching user lifecycle data:', error);
      toast.error('Failed to fetch user lifecycle data');
    } finally {
      setLoadingUserData(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u._id === userId);
    setSelectedUser(user || null);
    if (user) {
      fetchUserLifecycleData(userId);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employeeId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || user.userType === filterType;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'joined': return <UserPlus className="w-4 h-4" />;
      case 'training': return <CheckCircle className="w-4 h-4" />;
      case 'audit': return <Eye className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'achievement': return <CheckCircle className="w-4 h-4" />;
      case 'exit': return <LogOut className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getEventColor = (category: string) => {
    switch (category) {
      case 'positive': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300';
      case 'negative': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300';
      case 'milestone': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'login': return <LogIn className="w-4 h-4" />;
      case 'logout': return <LogOut className="w-4 h-4" />;
      case 'login_failed': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Lifecycle Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Track user journey, activities, and lifecycle events
            </p>
          </div>
          <Button
            onClick={fetchUsers}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users List */}
          <div className="lg:col-span-1">
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                  <Users className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Users ({filteredUsers.length})
                </CardTitle>
                <CardDescription>
                  Select a user to view their lifecycle
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="space-y-4 mb-4">
                  <div>
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="user">Users</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Warning">Warning</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Audited">Audited</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Users List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => handleUserSelect(user._id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${selectedUser?._id === user._id
                        ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                        : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">ID: {user.employeeId}</p>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={`${user.userType === 'admin'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              }`}
                          >
                            {user.userType === 'admin' ? 'Admin' : 'User'}
                          </Badge>
                          <Badge
                            className={`mt-1 ${user.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                              user.status === 'Warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              }`}
                          >
                            {user.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                        Created: {new Date(user.createdAt).toLocaleDateString()}
                        {user.lastLogin && (
                          <span className="ml-2">
                            Last Login: {new Date(user.lastLogin).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Lifecycle Details */}
          <div className="lg:col-span-2">
            {selectedUser ? (
              <div className="space-y-6">
                {/* User Info Header */}
                <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                      <UserPlus className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                      {selectedUser.name} - Lifecycle Overview
                    </CardTitle>
                    <CardDescription>
                      Complete user journey and activity tracking
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingUserData ? (
                      <div className="flex items-center justify-center py-8">
                        <LoadingSpinner size="lg" />
                      </div>
                    ) : userLifecycleData ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {userLifecycleData.lifecycleEvents.length}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Lifecycle Events</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {userLifecycleData.loginAttempts.length}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Login Attempts</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {userLifecycleData.totalActivities}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Total Activities</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {userLifecycleData.suspiciousActivities}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Suspicious</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No lifecycle data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Lifecycle Events */}
                {userLifecycleData && (
                  <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                        <Calendar className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                        Lifecycle Events
                      </CardTitle>
                      <CardDescription>
                        Important milestones and events in user journey
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {userLifecycleData.lifecycleEvents.map((event) => (
                          <div key={event._id} className="flex items-start space-x-3 p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getEventColor(event.category)}`}>
                              {getEventIcon(event.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-gray-900 dark:text-white">{event.title}</h4>
                                <Badge className={getEventColor(event.category)}>
                                  {event.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{event.description}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                {new Date(event.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}

                        {userLifecycleData.lifecycleEvents.length === 0 && (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No lifecycle events recorded</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Exit Details */}
                {selectedUser?.exitDetails && (
                  <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                        <LogOut className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" />
                        Exit Details
                      </CardTitle>
                      <CardDescription>
                        Employee exit information and documentation
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Exit Date</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {new Date(selectedUser.exitDetails.exitDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Exit Reason</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {selectedUser.exitDetails.exitReason.mainCategory}
                            </p>
                            {selectedUser.exitDetails.exitReason.subCategory && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {selectedUser.exitDetails.exitReason.subCategory}
                              </p>
                            )}
                          </div>
                        </div>

                        {selectedUser.exitDetails.exitReasonDescription && (
                          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {selectedUser.exitDetails.exitReasonDescription}
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedUser.exitDetails.verifiedBy && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Verified By</p>
                              <p className="text-base font-medium text-gray-900 dark:text-white">
                                {selectedUser.exitDetails.verifiedBy}
                              </p>
                              {selectedUser.exitDetails.verifiedAt && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  {new Date(selectedUser.exitDetails.verifiedAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          )}

                          {selectedUser.exitDetails.proofDocument && (
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Proof Document</p>
                              <p className="text-base font-medium text-gray-900 dark:text-white">
                                {selectedUser.exitDetails.proofDocument.fileName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {(selectedUser.exitDetails.proofDocument.fileSize / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          )}
                        </div>

                        {selectedUser.exitDetails.remarks && (
                          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Remarks</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {selectedUser.exitDetails.remarks}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Login Attempts */}
                {userLifecycleData && (
                  <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                        <LogIn className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                        Login Attempts (Last 30 Days)
                      </CardTitle>
                      <CardDescription>
                        Authentication history and security events
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {userLifecycleData.loginAttempts.slice(0, 10).map((attempt) => (
                          <div key={attempt._id} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${attempt.success
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                }`}>
                                {getActivityIcon(attempt.activityType)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{attempt.description}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {attempt.ipAddress} • {attempt.deviceInfo?.type} • {attempt.deviceInfo?.os}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(attempt.createdAt).toLocaleString()}
                              </p>
                              {attempt.isSuspicious && (
                                <Badge variant="destructive" className="text-xs mt-1">
                                  Suspicious
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}

                        {userLifecycleData.loginAttempts.length === 0 && (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <LogIn className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No login attempts recorded</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Select a user to view their lifecycle</p>
                    <p className="text-sm">Choose a user from the list to see their complete journey</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
