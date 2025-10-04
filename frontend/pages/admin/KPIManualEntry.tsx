import React, { useState, useEffect } from 'react';
import { Save, UserSearch, TrendingUp, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { apiService } from '../../services/apiService';
import { toast } from 'sonner';

interface User {
  _id: string;
  name: string;
  email: string;
  employeeId: string;
  department: string;
}

export const KPIManualEntry: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [kpiData, setKpiData] = useState({
    period: '',
    totalCaseDone: 0,
    inTAT: 0,
    tatPercentage: 0,
    majorNegative: 0,
    majorNegativePercentage: 0,
    negative: 0,
    negativePercentage: 0,
    qualityConcern: 0,
    qualityConcernPercentage: 0,
    insuff: 0,
    insuffPercentage: 0,
    neighborCheck: 0,
    neighborCheckPercentage: 0,
    online: 0,
    onlinePercentage: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiService.users.getAllUsers();
      if (response.success) {
        const regularUsers = response.data.filter((u: User) => u.email !== 'admin@company.com');
        setUsers(regularUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    // Auto-set current month
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = `${monthNames[now.getMonth()]}-${now.getFullYear().toString().slice(-2)}`;
    setKpiData(prev => ({ ...prev, period: currentMonth }));
  };

  const handleInputChange = (field: string, value: string | number) => {
    setKpiData(prev => ({ ...prev, [field]: value }));
  };

  // Auto-calculate percentages
  const calculatePercentages = () => {
    const total = kpiData.totalCaseDone;
    if (total > 0) {
      setKpiData(prev => ({
        ...prev,
        tatPercentage: parseFloat(((prev.inTAT / total) * 100).toFixed(2)),
        majorNegativePercentage: parseFloat(((prev.majorNegative / total) * 100).toFixed(2)),
        negativePercentage: parseFloat(((prev.negative / total) * 100).toFixed(2)),
        qualityConcernPercentage: parseFloat(((prev.qualityConcern / total) * 100).toFixed(2)),
        insuffPercentage: parseFloat(((prev.insuff / total) * 100).toFixed(2)),
        neighborCheckPercentage: parseFloat(((prev.neighborCheck / total) * 100).toFixed(2)),
        onlinePercentage: parseFloat(((prev.online / total) * 100).toFixed(2))
      }));
    }
  };

  useEffect(() => {
    calculatePercentages();
  }, [
    kpiData.totalCaseDone,
    kpiData.inTAT,
    kpiData.majorNegative,
    kpiData.negative,
    kpiData.qualityConcern,
    kpiData.insuff,
    kpiData.neighborCheck,
    kpiData.online
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      toast.error('Please select a user first');
      return;
    }

    if (!kpiData.period) {
      toast.error('Please enter period (e.g., Oct-25)');
      return;
    }

    setLoading(true);
    
    try {
      // Create Excel-like data structure
      const excelData = [{
        'Month': kpiData.period,
        'FE': selectedUser.name,
        'Employee ID': selectedUser.employeeId,
        'Email': selectedUser.email,
        'Total Case Done': kpiData.totalCaseDone,
        'IN TAT': kpiData.inTAT,
        'TAT %': kpiData.tatPercentage,
        'Major Negative': kpiData.majorNegative,
        'Major Negative %': kpiData.majorNegativePercentage,
        'Negative': kpiData.negative,
        'Negative %': kpiData.negativePercentage,
        'Quality Concern': kpiData.qualityConcern,
        'Quality Concern % Age': kpiData.qualityConcernPercentage,
        'Insuff': kpiData.insuff,
        'Insuff %': kpiData.insuffPercentage,
        'Neighbor Check': kpiData.neighborCheck,
        'Neighbor Check % Age': kpiData.neighborCheckPercentage,
        'Online': kpiData.online,
        'Online % Age': kpiData.onlinePercentage
      }];

      // Send to process-single endpoint (same as Excel upload but for single user)
      const response = await apiService.kpiTriggers.processSingle({
        excelData,
        period: kpiData.period,
        userId: selectedUser._id
      });

      if (response.success) {
        toast.success(`KPI data saved successfully for ${selectedUser.name}!`);
        // Reset form
        setKpiData({
          period: '',
          totalCaseDone: 0,
          inTAT: 0,
          tatPercentage: 0,
          majorNegative: 0,
          majorNegativePercentage: 0,
          negative: 0,
          negativePercentage: 0,
          qualityConcern: 0,
          qualityConcernPercentage: 0,
          insuff: 0,
          insuffPercentage: 0,
          neighborCheck: 0,
          neighborCheckPercentage: 0,
          online: 0,
          onlinePercentage: 0
        });
        setSelectedUser(null);
        setSearchTerm('');
      } else {
        toast.error(response.message || 'Failed to save KPI data');
      }
    } catch (error: any) {
      console.error('Error saving KPI:', error);
      toast.error(error.message || 'Failed to save KPI data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
          <TrendingUp className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manual KPI Entry</h1>
          <p className="text-gray-600 dark:text-gray-400">Enter KPI data manually for individual users</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Selection Panel */}
        <Card className="p-6 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <UserSearch className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Select User</h2>
          </div>
          
          <div className="mb-4">
            <Input
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredUsers.map(user => (
              <div
                key={user._id}
                onClick={() => handleUserSelect(user)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedUser?._id === user._id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                }`}
              >
                <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">ID: {user.employeeId || 'N/A'}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* KPI Data Entry Form */}
        <Card className="p-6 lg:col-span-2">
          {!selectedUser ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No User Selected</h3>
              <p className="text-gray-500 dark:text-gray-500">Please select a user from the left panel to enter KPI data</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Selected User</h3>
                <p className="text-blue-800 dark:text-blue-200">{selectedUser.name}</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">{selectedUser.email}</p>
                <p className="text-xs text-blue-500 dark:text-blue-500">Employee ID: {selectedUser.employeeId}</p>
              </div>

              {/* Period */}
              <div className="mb-6">
                <Label htmlFor="period">Period (e.g., Oct-25) *</Label>
                <Input
                  id="period"
                  value={kpiData.period}
                  onChange={(e) => handleInputChange('period', e.target.value)}
                  placeholder="Oct-25"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Cases */}
                <div>
                  <Label htmlFor="totalCaseDone">Total Case Done *</Label>
                  <Input
                    id="totalCaseDone"
                    type="number"
                    value={kpiData.totalCaseDone}
                    onChange={(e) => handleInputChange('totalCaseDone', parseInt(e.target.value) || 0)}
                    required
                  />
                </div>

                {/* TAT */}
                <div>
                  <Label htmlFor="inTAT">IN TAT</Label>
                  <Input
                    id="inTAT"
                    type="number"
                    value={kpiData.inTAT}
                    onChange={(e) => handleInputChange('inTAT', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="tatPercentage">TAT % (Auto-calculated)</Label>
                  <Input
                    id="tatPercentage"
                    type="number"
                    step="0.01"
                    value={kpiData.tatPercentage}
                    readOnly
                    className="bg-gray-100 dark:bg-gray-800"
                  />
                </div>

                {/* Major Negative */}
                <div>
                  <Label htmlFor="majorNegative">Major Negative</Label>
                  <Input
                    id="majorNegative"
                    type="number"
                    value={kpiData.majorNegative}
                    onChange={(e) => handleInputChange('majorNegative', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="majorNegativePercentage">Major Negative % (Auto-calculated)</Label>
                  <Input
                    id="majorNegativePercentage"
                    type="number"
                    step="0.01"
                    value={kpiData.majorNegativePercentage}
                    readOnly
                    className="bg-gray-100 dark:bg-gray-800"
                  />
                </div>

                {/* Negative */}
                <div>
                  <Label htmlFor="negative">Negative</Label>
                  <Input
                    id="negative"
                    type="number"
                    value={kpiData.negative}
                    onChange={(e) => handleInputChange('negative', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="negativePercentage">Negative % (Auto-calculated)</Label>
                  <Input
                    id="negativePercentage"
                    type="number"
                    step="0.01"
                    value={kpiData.negativePercentage}
                    readOnly
                    className="bg-gray-100 dark:bg-gray-800"
                  />
                </div>

                {/* Quality Concern */}
                <div>
                  <Label htmlFor="qualityConcern">Quality Concern</Label>
                  <Input
                    id="qualityConcern"
                    type="number"
                    value={kpiData.qualityConcern}
                    onChange={(e) => handleInputChange('qualityConcern', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="qualityConcernPercentage">Quality Concern % (Auto-calculated)</Label>
                  <Input
                    id="qualityConcernPercentage"
                    type="number"
                    step="0.01"
                    value={kpiData.qualityConcernPercentage}
                    readOnly
                    className="bg-gray-100 dark:bg-gray-800"
                  />
                </div>

                {/* Insuff */}
                <div>
                  <Label htmlFor="insuff">Insuff</Label>
                  <Input
                    id="insuff"
                    type="number"
                    value={kpiData.insuff}
                    onChange={(e) => handleInputChange('insuff', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="insuffPercentage">Insuff % (Auto-calculated)</Label>
                  <Input
                    id="insuffPercentage"
                    type="number"
                    step="0.01"
                    value={kpiData.insuffPercentage}
                    readOnly
                    className="bg-gray-100 dark:bg-gray-800"
                  />
                </div>

                {/* Neighbor Check */}
                <div>
                  <Label htmlFor="neighborCheck">Neighbor Check</Label>
                  <Input
                    id="neighborCheck"
                    type="number"
                    value={kpiData.neighborCheck}
                    onChange={(e) => handleInputChange('neighborCheck', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="neighborCheckPercentage">Neighbor Check % (Auto-calculated)</Label>
                  <Input
                    id="neighborCheckPercentage"
                    type="number"
                    step="0.01"
                    value={kpiData.neighborCheckPercentage}
                    readOnly
                    className="bg-gray-100 dark:bg-gray-800"
                  />
                </div>

                {/* Online/App Usage */}
                <div>
                  <Label htmlFor="online">Cases Done on App (Online)</Label>
                  <Input
                    id="online"
                    type="number"
                    value={kpiData.online}
                    onChange={(e) => handleInputChange('online', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="onlinePercentage">Online % (Auto-calculated)</Label>
                  <Input
                    id="onlinePercentage"
                    type="number"
                    step="0.01"
                    value={kpiData.onlinePercentage}
                    readOnly
                    className="bg-gray-100 dark:bg-gray-800"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedUser(null);
                    setSearchTerm('');
                    setKpiData({
                      period: '',
                      totalCaseDone: 0,
                      inTAT: 0,
                      tatPercentage: 0,
                      majorNegative: 0,
                      majorNegativePercentage: 0,
                      negative: 0,
                      negativePercentage: 0,
                      qualityConcern: 0,
                      qualityConcernPercentage: 0,
                      insuff: 0,
                      insuffPercentage: 0,
                      neighborCheck: 0,
                      neighborCheckPercentage: 0,
                      online: 0,
                      onlinePercentage: 0
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save KPI Data'}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

