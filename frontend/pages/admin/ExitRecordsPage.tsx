import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Search, Download, Eye, FileText, Filter, Calendar } from 'lucide-react';
import { apiService } from '../../services/apiService';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

export const ExitRecordsPage: React.FC = () => {
  const { setCurrentPage } = useAuth();
  const [exitRecords, setExitRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mainCategory, setMainCategory] = useState('');
  const [verifiedBy, setVerifiedBy] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const EXIT_CATEGORIES = [
    'Resignation',
    'Termination',
    'End of Contract / Project',
    'Retirement',
    'Death',
    'Other'
  ];

  useEffect(() => {
    fetchExitRecords();
  }, [page, mainCategory, verifiedBy, startDate, endDate]);

  const fetchExitRecords = async () => {
    setLoading(true);
    try {
      const response: any = await apiService.users.getExitRecords({
        mainCategory,
        verifiedBy,
        search: searchTerm,
        startDate,
        endDate,
        page,
        limit: 20
      });

      if (response && response.success) {
        setExitRecords(response.exitRecords || []);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalRecords(response.pagination?.total || 0);
      }
    } catch (error: any) {
      console.error('Error fetching exit records:', error);
      toast.error('Failed to load exit records');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1); // Reset to first page on new search
    fetchExitRecords();
  };

  const handleExport = () => {
    try {
      apiService.users.exportExitRecords({
        mainCategory,
        verifiedBy,
        startDate,
        endDate
      });
      toast.success('Exporting exit records to CSV...');
    } catch (error) {
      console.error('Error exporting records:', error);
      toast.error('Failed to export records');
    }
  };

  const handleViewDetails = (userId: string) => {
    setCurrentPage(`user-details/${userId}`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading && page === 1) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              Exit Records
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
              View and manage employee exit records
            </p>
          </div>
          <Button
            onClick={handleExport}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-black dark:text-black px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center"
          >
            <Download className="w-5 h-5 mr-2" />
            Export to CSV
          </Button>
        </div>

        {/* Stats Card */}
        <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Exits</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalRecords}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">This Page</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{exitRecords.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Page</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{page} / {totalPages}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Filtered</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {mainCategory || verifiedBy || startDate || endDate ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </Card>

        {/* Filters */}
        <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <Label htmlFor="search">Search</Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Search
                    className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <Input
                    id="search"
                    placeholder="Search by name, email, or employee ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10 !text-start"
                  />
                </div>

                <Button
                  onClick={handleSearch}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Search
                </Button>
              </div>
            </div>


            {/* Main Category Filter */}
            <div>
              <Label htmlFor="mainCategory">Exit Category</Label>
              <select
                id="mainCategory"
                value={mainCategory}
                onChange={(e) => setMainCategory(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">All Categories</option>
                {EXIT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Verification Status Filter */}
            <div>
              <Label htmlFor="verifiedBy">Verification</Label>
              <select
                id="verifiedBy"
                value={verifiedBy}
                onChange={(e) => setVerifiedBy(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="HR">HR Verified</option>
                <option value="Compliance">Compliance Verified</option>
              </select>
            </div>

            {/* Date Range - Start Date */}
            <div>
              <Label htmlFor="startDate">
                <Calendar className="w-4 h-4 inline mr-1" />
                From Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Date Range - End Date */}
            <div>
              <Label htmlFor="endDate">
                <Calendar className="w-4 h-4 inline mr-1" />
                To Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="mt-1"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {(mainCategory || verifiedBy || searchTerm || startDate || endDate) && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMainCategory('');
                  setVerifiedBy('');
                  setSearchTerm('');
                  setStartDate('');
                  setEndDate('');
                  setPage(1);
                }}
                className="text-sm"
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </Card>

        {/* Exit Records Table */}
        <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
          <div className="overflow-x-auto">
            {exitRecords.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-lg">No exit records found</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Try adjusting your filters or search criteria
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-4 px-2 text-sm font-semibold text-gray-900 dark:text-white">
                      Employee
                    </th>
                    <th className="text-left py-4 px-2 text-sm font-semibold text-gray-900 dark:text-white">
                      Exit Date
                    </th>
                    <th className="text-left py-4 px-2 text-sm font-semibold text-gray-900 dark:text-white">
                      Exit Reason
                    </th>
                    <th className="text-left py-4 px-2 text-sm font-semibold text-gray-900 dark:text-white">
                      Department
                    </th>
                    <th className="text-left py-4 px-2 text-sm font-semibold text-gray-900 dark:text-white">
                      Verification
                    </th>
                    <th className="text-left py-4 px-2 text-sm font-semibold text-gray-900 dark:text-white">
                      Document
                    </th>
                    <th className="text-center py-4 px-2 text-sm font-semibold text-gray-900 dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {exitRecords.map((record) => (
                    <tr
                      key={record._id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                    >
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{record.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{record.employeeId}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">{record.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-gray-900 dark:text-white">
                        {record.exitDetails?.exitDate ? formatDate(record.exitDetails.exitDate) : 'N/A'}
                      </td>
                      <td className="py-3 px-2">
                        <div>
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                            {record.exitDetails?.exitReason?.mainCategory || 'N/A'}
                          </Badge>
                          {record.exitDetails?.exitReason?.subCategory && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {record.exitDetails.exitReason.subCategory}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-gray-900 dark:text-white">
                        {record.department || 'N/A'}
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          className={`${record.exitDetails?.verifiedBy === 'HR'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : record.exitDetails?.verifiedBy === 'Compliance'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            }`}
                        >
                          {record.exitDetails?.verifiedBy || 'Pending'}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {record.exitDetails?.proofDocument ? (
                          <button
                            onClick={() => apiService.users.downloadExitDocument(record._id)}
                            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                            title="Download proof document"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(record._id)}
                          className="h-8 px-3"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1 || loading}
                className="px-4 py-2"
              >
                Previous
              </Button>

              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {totalPages} ({totalRecords} total records)
              </span>

              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages || loading}
                className="px-4 py-2"
              >
                Next
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

