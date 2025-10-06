import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  FileText,
  Users,
  Calendar
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { apiService } from '../../services/apiService';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

// NEW: Score Reports Page (NEW PAGE WITHOUT TOUCHING EXISTING)
export const ScoreReportsPage: React.FC = () => {
  const { user, userType, setCurrentPage } = useAuth();
  
  // State for users and their scores
  const [users, setUsers] = useState<any[]>([]);
  const [userScores, setUserScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingScores, setLoadingScores] = useState(false);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [sortBy, setSortBy] = useState('averageScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Export state
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchUserScores();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.users.getAllUsers();
      if (response && (response as any).success) {
        setUsers((response as any).data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserScores = async () => {
    try {
      setLoadingScores(true);
      const response = await apiService.quizAttempts.getAllUserScores();
      if (response && (response as any).success) {
        setUserScores((response as any).data || []);
      }
    } catch (error) {
      console.error('Error fetching user scores:', error);
      toast.error('Failed to fetch user scores');
    } finally {
      setLoadingScores(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const response = await apiService.reports.exportUserScores({
        searchTerm,
        selectedUser,
        sortBy,
        sortOrder,
        dateRange
      });
      
      if (response && (response as any).success) {
        // Create and download CSV
        const csvData = (response as any).data;
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-scores-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Report exported successfully!');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const response = await apiService.reports.exportUserScoresPDF({
        searchTerm,
        selectedUser,
        sortBy,
        sortOrder,
        dateRange
      });
      
      if (response && (response as any).success) {
        // Create and download PDF
        const pdfData = (response as any).data;
        const blob = new Blob([pdfData], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-scores-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('PDF report exported successfully!');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF report');
    } finally {
      setIsExporting(false);
    }
  };

  // Filter and sort logic
  const filteredAndSortedScores = userScores
    .filter(score => {
      const matchesSearch = !searchTerm || 
        score.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        score.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        score.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesUser = !selectedUser || score.userId === selectedUser;
      
      return matchesSearch && matchesUser;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'averageScore' || sortBy === 'totalModules' || sortBy === 'completedModules') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedScores.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedScores = filteredAndSortedScores.slice(startIndex, endIndex);

  const getScoreBadge = (score: number) => {
    if (score >= 85) return <Badge className="bg-green-100 text-green-800">Outstanding</Badge>;
    if (score >= 70) return <Badge className="bg-blue-100 text-blue-800">Excellent</Badge>;
    if (score >= 50) return <Badge className="bg-yellow-100 text-yellow-800">Satisfactory</Badge>;
    if (score >= 40) return <Badge className="bg-orange-100 text-orange-800">Need Improvement</Badge>;
    return <Badge className="bg-red-100 text-red-800">Unsatisfactory</Badge>;
  };

  const getCompletionRate = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                User Score Reports
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Comprehensive performance analysis and reporting for all users
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleExportCSV}
                disabled={isExporting}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </Button>
              <Button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Learners</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userScores.filter(score => score.totalModules > 0).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userScores.length > 0 
                    ? Math.round(userScores.reduce((sum, score) => sum + (score.averageScore || 0), 0) / userScores.length)
                    : 0}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userScores.length > 0 
                    ? Math.round(userScores.reduce((sum, score) => sum + getCompletionRate(score.completedModules, score.totalModules), 0) / userScores.length)
                    : 0}%
                </p>
              </div>
              <Award className="h-8 w-8 text-orange-600" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="userFilter">Filter by User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.name} ({user.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="sortBy">Sort by</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="averageScore">Average Score</SelectItem>
                  <SelectItem value="totalModules">Total Modules</SelectItem>
                  <SelectItem value="completedModules">Completed Modules</SelectItem>
                  <SelectItem value="userName">User Name</SelectItem>
                  <SelectItem value="lastActivity">Last Activity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="sortOrder">Order</Label>
              <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="dateRange">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Results Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              User Performance Report
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedScores.length)} of {filteredAndSortedScores.length} users
            </div>
          </div>

          {loadingScores ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Employee ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Average Score</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Modules</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Completion</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Last Activity</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedScores.map((score, index) => (
                      <tr key={score.userId} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {score.userName || 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {score.userEmail || 'No email'}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-900 dark:text-white">
                          {score.employeeId || 'N/A'}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {score.averageScore || 0}%
                            </span>
                            {getScoreBadge(score.averageScore || 0)}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-900 dark:text-white">
                          {score.completedModules || 0} / {score.totalModules || 0}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${getCompletionRate(score.completedModules || 0, score.totalModules || 0)}%` 
                                }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {getCompletionRate(score.completedModules || 0, score.totalModules || 0)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-900 dark:text-white">
                          {score.lastActivity ? new Date(score.lastActivity).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="py-4 px-4">
                          {score.totalModules > 0 ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
};
