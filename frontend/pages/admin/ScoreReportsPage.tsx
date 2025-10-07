import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Award,
  CheckCircle,
  BarChart3,
  FileText,
  Users
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

export const ScoreReportsPage: React.FC = () => {
  // State for users and their scores
  const [users, setUsers] = useState<any[]>([]);
  const [userScores, setUserScores] = useState<any[]>([]);
  const [loadingScores, setLoadingScores] = useState(false);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('all');
  const [sortBy, setSortBy] = useState('averageScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState('all');
  
  // Pagination state
  const [pageNumber, setPageNumber] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Export state
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchUserScores();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiService.users.getAllUsers();
      if (response && (response as any).success) {
        setUsers((response as any).users || (response as any).data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  const fetchUserScores = async () => {
    try {
      setLoadingScores(true);
      
      console.log('🔍 Starting to fetch user scores...');
      
      // Fetch all users first
      const usersResponse = await apiService.users.getAllUsers();
      console.log('👥 Users response:', usersResponse);
      
      if (!usersResponse || !(usersResponse as any).success) {
        throw new Error('Failed to fetch users');
      }
      
      const allUsers = (usersResponse as any).users || (usersResponse as any).data || [];
      console.log('👥 All users:', allUsers);
      
      const userScoresData = [];
      
      // For each user, fetch their quiz attempts and calculate scores
      for (const user of allUsers) {
        try {
          console.log(`🔍 Fetching data for user: ${user.name} (${user._id})`);
          
          // Fetch user's quiz attempts
          const quizAttemptsResponse = await apiService.quizAttempts.getUserQuizAttempts(user._id, { limit: 100 });
          console.log(`📊 Quiz attempts for ${user.name}:`, quizAttemptsResponse);
          
          const quizAttempts = (quizAttemptsResponse as any).data || [];
          console.log(`📊 Quiz attempts data for ${user.name}:`, quizAttempts);
          
          // Calculate user statistics
          const totalModules = new Set(quizAttempts.map((attempt: any) => attempt.moduleId)).size;
          const completedModules = new Set(quizAttempts.filter((attempt: any) => attempt.passed).map((attempt: any) => attempt.moduleId)).size;
          const scores = quizAttempts.map((attempt: any) => attempt.score || 0);
          const averageScore = scores.length > 0 ? scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length : 0;
          const lastActivity = quizAttempts.length > 0 ? Math.max(...quizAttempts.map((attempt: any) => new Date(attempt.createdAt).getTime())) : null;
          
          const userScoreData = {
            userId: user._id,
            userName: user.name,
            userEmail: user.email,
            employeeId: user.employeeId,
            totalModules,
            completedModules,
            averageScore: Math.round(averageScore),
            lastActivity: lastActivity ? new Date(lastActivity).toISOString() : null
          };
          
          console.log(`✅ User score data for ${user.name}:`, userScoreData);
          userScoresData.push(userScoreData);
        } catch (userError) {
          console.error(`❌ Error fetching data for user ${user.name}:`, userError);
          // Add user with zero scores if we can't fetch their data
          const userScoreData = {
            userId: user._id,
            userName: user.name,
            userEmail: user.email,
            employeeId: user.employeeId,
            totalModules: 0,
            completedModules: 0,
            averageScore: 0,
            lastActivity: null
          };
          console.log(`⚠️ Adding user with zero scores: ${user.name}`, userScoreData);
          userScoresData.push(userScoreData);
        }
      }
      
      console.log('🎯 Final user scores data:', userScoresData);
      setUserScores(userScoresData);
    } catch (error) {
      console.error('❌ Error fetching user scores:', error);
      toast.error('Failed to fetch user scores');
    } finally {
      setLoadingScores(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      
      // Use local filtered data for export
      const dataToExport = filteredAndSortedScores;
      
      // Generate CSV content
      const csvHeader = 'User Name,Email,Employee ID,Total Modules,Completed Modules,Average Score,Completion Rate,Last Activity,Status\n';
      const csvRows = dataToExport.map(score => {
        const completionRate = score.totalModules > 0 ? Math.round((score.completedModules / score.totalModules) * 100) : 0;
        const status = score.averageScore >= 85 ? 'Outstanding' : score.averageScore >= 70 ? 'Excellent' : score.averageScore >= 50 ? 'Satisfactory' : 'Needs Improvement';
        const lastActivity = score.lastActivity ? new Date(score.lastActivity).toLocaleDateString() : 'Never';
        
        return `"${score.userName || 'Unknown'}","${score.userEmail || ''}","${score.employeeId || ''}",${score.totalModules},${score.completedModules},${score.averageScore}%,${completionRate}%,"${lastActivity}","${status}"`;
      }).join('\n');

      const csvData = csvHeader + csvRows;
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-scores-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('CSV report exported successfully!');
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
      
      // Use local filtered data for export
      const dataToExport = filteredAndSortedScores;
      
      // Generate PDF content (simplified - in real implementation, use a PDF library)
      const pdfContent = `
        User Score Report
        Generated on: ${new Date().toLocaleDateString()}
        
        Total Users: ${dataToExport.length}
        Average Score: ${dataToExport.length > 0 ? Math.round(dataToExport.reduce((sum, score) => sum + (score.averageScore || 0), 0) / dataToExport.length) : 0}%
        
        User Details:
        ${dataToExport.map(score => `
          Name: ${score.userName || 'Unknown'}
          Email: ${score.userEmail || ''}
          Employee ID: ${score.employeeId || ''}
          Total Modules: ${score.totalModules}
          Completed Modules: ${score.completedModules}
          Average Score: ${score.averageScore}%
          Last Activity: ${score.lastActivity ? new Date(score.lastActivity).toLocaleDateString() : 'Never'}
          ---
        `).join('')}
      `;

      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-scores-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Report exported successfully!');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
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
      
      const matchesUser = selectedUser === 'all' || score.userId === selectedUser;
      
      return matchesSearch && matchesUser;
    })
    .sort((a, b) => {
      let aValue = a[sortBy] || 0;
      let bValue = b[sortBy] || 0;
      
      if (sortBy === 'userName' || sortBy === 'userEmail') {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedScores.length / itemsPerPage);
  const startIndex = (pageNumber - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedScores = filteredAndSortedScores.slice(startIndex, endIndex);

  const getScoreBadge = (score: number) => {
    if (score >= 85) return <Badge className="bg-green-100 text-green-800">Outstanding</Badge>;
    if (score >= 70) return <Badge className="bg-blue-100 text-blue-800">Excellent</Badge>;
    if (score >= 50) return <Badge className="bg-yellow-100 text-yellow-800">Satisfactory</Badge>;
    if (score >= 40) return <Badge className="bg-orange-100 text-orange-800">Needs Improvement</Badge>;
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userScores.filter(s => s.totalModules > 0).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userScores.length > 0 
                    ? Math.round(userScores.reduce((sum, s) => sum + (s.averageScore || 0), 0) / userScores.length) 
                    : 0}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Top Performers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userScores.filter(s => (s.averageScore || 0) >= 85).length}
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="search"
                  placeholder="Name, Email, Employee ID..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="userFilter">Filter by User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger id="userFilter">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.name} ({user.employeeId || 'No ID'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sortBy">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sortBy">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="averageScore">Average Score</SelectItem>
                  <SelectItem value="userName">User Name</SelectItem>
                  <SelectItem value="lastActivity">Last Activity</SelectItem>
                  <SelectItem value="completedModules">Completed Modules</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Select value={sortOrder} onValueChange={(val) => setSortOrder(val as 'asc' | 'desc')}>
                <SelectTrigger id="sortOrder">
                  <SelectValue placeholder="Sort order..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedUser('all');
                  setSortBy('averageScore');
                  setSortOrder('desc');
                  setDateRange('all');
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Results Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              User Performance Overview
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {paginatedScores.length} of {filteredAndSortedScores.length} results
            </p>
          </div>

          {loadingScores ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner text="Loading user scores..." />
            </div>
          ) : filteredAndSortedScores.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-lg font-medium">No user scores found</p>
              <p className="text-sm mt-2">Try adjusting your filters or search criteria</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Employee ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Modules</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Avg Score</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Completion</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Last Activity</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedScores.map((score) => (
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
                              {score.completedModules || 0}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">/</span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {score.totalModules || 0}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 dark:text-white">
                              {Math.round(score.averageScore || 0)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${getCompletionRate(score.completedModules, score.totalModules)}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {getCompletionRate(score.completedModules, score.totalModules)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500 dark:text-gray-400">
                          {score.lastActivity 
                            ? new Date(score.lastActivity).toLocaleDateString() 
                            : 'Never'}
                        </td>
                        <td className="py-4 px-4">
                          {getScoreBadge(score.averageScore || 0)}
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
                    Page {pageNumber} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                      disabled={pageNumber === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageNumber(prev => Math.min(prev + 1, totalPages))}
                      disabled={pageNumber === totalPages}
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

