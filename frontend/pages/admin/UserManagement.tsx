import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Eye, 
  UserCheck, 
  UserX, 
  AlertTriangle,
  Award,
  X,
  Users,
  Shield,
  Briefcase,
  Crown,
  UserCog
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmationPopup } from '../../components/common/ConfirmationPopup';
import { SuccessNotification } from '../../components/common/SuccessNotification';
import { apiService } from '../../services/apiService';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { UserDetailsModal } from '../../components/admin/UserDetailsModal';
import { InactiveUserModal } from '../../components/admin/InactiveUserModal';
import { ReactivateUserModal } from '../../components/admin/ReactivateUserModal';

export const UserManagement: React.FC = () => {
  const { user, userType, setCurrentPage } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [warningData, setWarningData] = useState({
    message: '',
    attachment: null as File | null
  });
  const [certificateData, setCertificateData] = useState({
    title: '',
    message: '',
    attachment: null as File | null
  });
  const [selectedTab, setSelectedTab] = useState('all');

  // Popup states
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successData, setSuccessData] = useState({
    type: 'user' as 'user' | 'module' | 'quiz' | 'question' | 'award' | 'certificate',
    action: 'created' as 'created' | 'updated' | 'deleted' | 'completed',
    itemName: ''
  });
  const [createUserData, setCreateUserData] = useState({
    // Basic Information
    name: '',
    email: '',
    password: '',
    phone: '',
    userType: 'user', // Default to user, can be 'user', 'manager', 'hod', 'hr', 'admin'
    
    // Personal Information
    dateOfBirth: '',
    fathersName: '',
    
    // Employment Information
    dateOfJoining: '',
    reportingManager: '', // Only for users
    highestEducation: '',
    
    // Address Information
    currentAddress: '',
    location: '',
    city: '',
    state: '',
    region: '',
    
    // Identification Documents
    aadhaarNo: '',
    panNo: '',
    
    // Document Uploads
    documents: [] as File[],
    avatar: null as File | null
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);




  useEffect(() => {
    // Only fetch data if user is authenticated and is admin
    if (user && userType === 'admin') {
      fetchUsers();
      // fetchUserStats(); // No longer needed - using roleStats instead
    } else {
      setLoading(false);
    }
  }, [filterStatus, user, userType]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response: any = await apiService.users.getAllUsers({ filter: filterStatus });
      
      // Check if response has users array
      if (response && Array.isArray(response.users)) {
        setUsers(response.users);
      } else if (response && Array.isArray(response)) {
        setUsers(response);
      } else {
        setUsers([]);
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      // Don't show error toast for auth failures, let the auth system handle it
      if (!error.message?.includes('Authentication failed')) {
        toast.error('Failed to load users');
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Stats now calculated from roleStats - no longer need separate API call

    const handleCreateUser = async () => {
    try {
      console.log('Create user button clicked');
      console.log('Form data:', createUserData);
      
      // Validate required fields
      const requiredFields = [
        'name', 'email', 'password', 'phone'
      ];
      
      const missingFields = requiredFields.filter(field => !createUserData[field as keyof typeof createUserData]);
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      setIsCreatingUser(true);
      console.log('Calling API to create user...');
      
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add all text fields (only non-empty values)
      Object.keys(createUserData).forEach(key => {
        const value = createUserData[key as keyof typeof createUserData];
        // Skip documents, avatar, and empty/null/undefined values
        // BUT always include userType even if it's the default 'user'
        if (key !== 'documents' && key !== 'avatar' && (value && value !== '' || key === 'userType')) {
          formData.append(key, value as string);
        }
      });
      
      
      // Add avatar if selected
      if (createUserData.avatar) {
        formData.append('avatar', createUserData.avatar);
      }
      
      // Add documents if any
      createUserData.documents.forEach((doc) => {
        formData.append(`documents`, doc);
      });
      
      console.log('=== CREATE USER DEBUG ===');
      console.log('Form Data being sent:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      
      const response: any = await apiService.users.createUser(formData);
      console.log('API response:', response);
      toast.success(`✅ User created successfully! They can login with email: ${createUserData.email}`);
      
      // Add new user to the list (Employee ID will be auto-generated by backend)
      const newUser = {
        _id: response.user._id,
        name: createUserData.name,
        email: createUserData.email,
        phone: createUserData.phone,
        userType: createUserData.userType,
        dateOfBirth: createUserData.dateOfBirth,
        fathersName: createUserData.fathersName,
        dateOfJoining: createUserData.dateOfJoining,
        reportingManager: createUserData.reportingManager,
        highestEducation: createUserData.highestEducation,
        currentAddress: createUserData.currentAddress,
        location: createUserData.location,
        city: createUserData.city,
        state: createUserData.state,
        region: createUserData.region,
        aadhaarNo: createUserData.aadhaarNo,
        panNo: createUserData.panNo,
        employeeId: response.user.employeeId,
        status: 'Active',
        isActive: true
      };
      
      setUsers(prev => [...prev, newUser]);
      setShowCreateModal(false);
      setCreateUserData({
        name: '',
        email: '',
        password: '',
        phone: '',
        userType: 'user',
        dateOfBirth: '',
        fathersName: '',
        dateOfJoining: '',
        reportingManager: '',
        highestEducation: '',
        currentAddress: '',
        location: '',
        city: '',
        state: '',
        region: '',
        aadhaarNo: '',
        panNo: '',
        documents: [],
        avatar: null
      });
      // Stats will auto-update from roleStats calculation
      
      // Show success notification
      setSuccessData({
        type: 'user',
        action: 'created',
        itemName: newUser.name
      });
      setShowSuccessNotification(true);
    } catch (error: any) {
      console.error('=== CREATE USER ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      
      // Handle specific error cases
      if (error.message?.includes('User already exists') || error.message?.includes('email already exists')) {
        toast.error('❌ A user with this email already exists. Please use a different email address.');
      } else if (error.message?.includes('Backend server is not running')) {
        toast.error('❌ Backend server is not running. Please start the backend server.');
      } else if (error.message?.includes('Validation Error') || error.message?.includes('check your input')) {
        // Show detailed validation errors if available
        if (error.response && error.response.details && Array.isArray(error.response.details)) {
          const errorMessages = error.response.details.map((detail: any) => 
            `• ${detail.field}: ${detail.message} (value: "${detail.value}")`
          ).join('\n');
          toast.error(`❌ Validation Failed:\n${errorMessages}\n\nCheck the console for more details.`, {
            duration: 10000
          });
          console.error('Detailed validation errors:', error.response.details);
      } else {
          toast.error('❌ Validation failed. Please check:\n• Name (required, 2-100 chars)\n• Email (required, valid format)\n• Password (required, 6+ chars)\n• Phone (10 digits if provided)\n• Other fields as needed');
        }
      } else {
        toast.error('❌ Failed to create user: ' + (error.message || 'Unknown error. Check console.'));
      }
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleSendWarning = async () => {
    try {
      if (!warningData.message.trim()) {
        toast.error('Warning message is required');
        return;
      }

      await apiService.users.sendWarning(selectedUser._id, warningData.message);
      toast.success('Warning sent to user');
      setUsers(prev => prev.map(user => 
        user._id === selectedUser._id ? { ...user, status: 'Warning' } : user
      ));
      // Stats auto-update from roleStats
      setShowWarningModal(false);
      setSelectedUser(null);
      setWarningData({ message: '', attachment: null });
    } catch (error) {
      console.error('Error sending warning:', error);
      toast.error('Failed to send warning');
    }
  };

  const handleDeleteUser = async () => {
    try {
      if (!selectedUser) return;
      
      await apiService.users.deleteUser(selectedUser._id);
      setUsers(prev => prev.filter(user => user._id !== selectedUser._id));
      // Stats auto-update from roleStats
      setShowDeletePopup(false);
      setSelectedUser(null);
      
      // Show success notification
      setSuccessData({
        type: 'user',
        action: 'deleted',
        itemName: selectedUser.name
      });
      setShowSuccessNotification(true);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleSendCertificate = async () => {
    try {
      if (!certificateData.title.trim() || !certificateData.message.trim()) {
        toast.error('Certificate title and message are required');
        return;
      }

      await apiService.users.sendCertificate(selectedUser._id, certificateData.title, certificateData.message);
      toast.success('Certificate sent to user');
      setShowCertificateModal(false);
      setSelectedUser(null);
      setCertificateData({ title: '', message: '', attachment: null });
    } catch (error) {
      console.error('Error sending certificate:', error);
      toast.error('Failed to send certificate');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'warning' | 'certificate') => {
    const file = event.target.files?.[0];
    if (file) {
      if (type === 'warning') {
        setWarningData(prev => ({ ...prev, attachment: file }));
      } else {
        setCertificateData(prev => ({ ...prev, attachment: file }));
      }
    }
  };

  const handleUserAction = async (userId: string, action: string) => {
    try {
      switch (action) {
        case 'activate':
          await apiService.users.activateUser(userId);
          toast.success('User activated successfully');
          setUsers(prev => prev.map(user => 
            user._id === userId ? { ...user, isActive: true, status: 'Active' } : user
          ));
          // Stats auto-update from roleStats // Refresh stats
          break;
        case 'deactivate':
          const inactiveUser = users.find(u => u._id === userId);
          setSelectedUser(inactiveUser);
          setShowInactiveModal(true);
          break;
        case 'setInactive':
          await apiService.users.setUserInactive(userId, 'Other', 'Set inactive by admin');
          toast.success('User set as inactive successfully');
          fetchUsers(); // Refresh users list
          // Stats auto-update from roleStats // Refresh stats
          break;
        case 'reactivate':
          const reactivateUser = users.find(u => u._id === userId);
          setSelectedUser(reactivateUser);
          setShowReactivateModal(true);
          break;
        case 'delete':
          const deleteUser = users.find(u => u._id === userId);
          setSelectedUser(deleteUser);
          setShowDeletePopup(true);
          break;
        case 'sendWarning':
          const warningUser = users.find(u => u._id === userId);
          setSelectedUser(warningUser);
          setWarningData({ message: '', attachment: null });
          setShowWarningModal(true);
          break;
        case 'sendCertificate':
          const certificateUser = users.find(u => u._id === userId);
          setSelectedUser(certificateUser);
          setCertificateData({ title: '', message: '', attachment: null });
          setShowCertificateModal(true);
          break;
        case 'view':
          const userToView = users.find(u => u._id === userId);
          if (userToView) {
            // Navigate to user details page
            setCurrentPage(`user-details/${userId}`);
          } else {
            toast.error('User not found');
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      toast.error(`Failed to ${action} user`);
    }
  };

  // Group users by role
  const groupedUsers = {
    all: users.filter(u => {
      const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           u.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           u.aadhaarNo?.includes(searchTerm) ||
                           u.panNo?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesFilter = true;
    if (filterStatus !== 'all') {
        if (filterStatus === 'active') matchesFilter = u.isActive === true && u.status === 'Active';
        else if (filterStatus === 'inactive') matchesFilter = u.isActive === false;
        else if (filterStatus === 'warning') matchesFilter = u.status === 'Warning';
        else if (filterStatus === 'audited') matchesFilter = u.status === 'Audited';
        else matchesFilter = u.status?.toLowerCase() === filterStatus.toLowerCase();
    }

    return matchesSearch && matchesFilter;
    }),
    users: users.filter(u => {
      const isUser = u.userType === 'user'; // Only exact 'user' type
      const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           u.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesFilter = true;
      if (filterStatus !== 'all') {
        if (filterStatus === 'active') matchesFilter = u.isActive === true;
        else if (filterStatus === 'inactive') matchesFilter = u.isActive === false;
        else matchesFilter = u.status?.toLowerCase() === filterStatus.toLowerCase();
      }
      
      return isUser && matchesSearch && matchesFilter;
    }),
    managers: users.filter(u => {
      const isManager = u.userType === 'manager';
      const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           u.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesFilter = true;
      if (filterStatus !== 'all') {
        if (filterStatus === 'active') matchesFilter = u.isActive === true;
        else if (filterStatus === 'inactive') matchesFilter = u.isActive === false;
      }
      
      return isManager && matchesSearch && matchesFilter;
    }),
    hod: users.filter(u => {
      const isHOD = u.userType === 'hod';
      const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           u.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesFilter = true;
      if (filterStatus !== 'all') {
        if (filterStatus === 'active') matchesFilter = u.isActive === true;
        else if (filterStatus === 'inactive') matchesFilter = u.isActive === false;
      }
      
      return isHOD && matchesSearch && matchesFilter;
    }),
    hr: users.filter(u => {
      const isHR = u.userType === 'hr';
      const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           u.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesFilter = true;
      if (filterStatus !== 'all') {
        if (filterStatus === 'active') matchesFilter = u.isActive === true;
        else if (filterStatus === 'inactive') matchesFilter = u.isActive === false;
      }
      
      return isHR && matchesSearch && matchesFilter;
    }),
    admins: users.filter(u => {
      const isAdmin = u.userType === 'admin';
      const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           u.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesFilter = true;
      if (filterStatus !== 'all') {
        if (filterStatus === 'active') matchesFilter = u.isActive === true;
        else if (filterStatus === 'inactive') matchesFilter = u.isActive === false;
      }
      
      return isAdmin && matchesSearch && matchesFilter;
    })
  };

  // Role-wise statistics - Exact matching only
  const roleStats = {
    total: users.length,
    users: users.filter(u => u.userType === 'user').length, // Only exact 'user'
    managers: users.filter(u => u.userType === 'manager').length,
    hod: users.filter(u => u.userType === 'hod').length,
    hr: users.filter(u => u.userType === 'hr').length,
    admins: users.filter(u => u.userType === 'admin').length
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">Manage field executives and their accounts</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-gray-100 to-gray-200 
             hover:from-gray-200 hover:to-gray-300 
             text-gray-800 
             dark:from-gray-800 dark:to-gray-900 
             dark:hover:from-gray-900 dark:hover:to-black 
             dark:text-white 
             px-8 py-3 rounded-xl shadow-lg hover:shadow-xl 
             transition-all duration-300 transform hover:scale-105 
             border border-gray-300 dark:border-gray-600"
          onClick={() => {
      setCreateUserData({
        name: '',
        email: '',
        password: '',
        phone: '',
        userType: 'user',
        dateOfBirth: '',
        fathersName: '',
        dateOfJoining: '',
        reportingManager: '',
        highestEducation: '',
        currentAddress: '',
        location: '',
        city: '',
        state: '',
        region: '',
        aadhaarNo: '',
        panNo: '',
        documents: [],
        avatar: null
      });
            setShowCreateModal(true);
          }}
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New User
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 z-10" />
              <Input
                placeholder="Search by name, email, EmpID, Aadhaar, or PAN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="flex-shrink-0">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full sm:w-auto px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-w-[140px]"
              >
                <option value="all">All Users</option>
                <option value="active">Active</option>
                <option value="warning">Warning</option>
                <option value="audited">Audited</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            💡 You can search by: Name, Email, Employee ID (FE24120001), Aadhaar (123456789012), or PAN (ABCDE1234F)
          </div>
        </div>
      </Card>

      {/* Role-wise Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{roleStats.total}</p>
            </div>
            <Users className="w-8 h-8 text-gray-600 dark:text-gray-400" />
          </div>
        </Card>
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 backdrop-blur-sm border border-blue-200 dark:border-blue-800 shadow-lg rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Users (FE)</p>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{roleStats.users}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </Card>
        <Card className="p-4 bg-green-50 dark:bg-green-900/20 backdrop-blur-sm border border-green-200 dark:border-green-800 shadow-lg rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-green-700 dark:text-green-300">Managers</p>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">{roleStats.managers}</p>
            </div>
            <Briefcase className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
        </Card>
        <Card className="p-4 bg-purple-50 dark:bg-purple-900/20 backdrop-blur-sm border border-purple-200 dark:border-purple-800 shadow-lg rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-purple-700 dark:text-purple-300">HOD</p>
              <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">{roleStats.hod}</p>
            </div>
            <Crown className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
        </Card>
        <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 backdrop-blur-sm border border-orange-200 dark:border-orange-800 shadow-lg rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-orange-700 dark:text-orange-300">HR</p>
              <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">{roleStats.hr}</p>
            </div>
            <UserCog className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
        </Card>
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 backdrop-blur-sm border border-red-200 dark:border-red-800 shadow-lg rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-red-700 dark:text-red-300">Admins</p>
              <p className="text-2xl font-bold text-red-800 dark:text-red-200">{roleStats.admins}</p>
            </div>
            <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </Card>
      </div>

      {/* Role-wise Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 bg-white/80 dark:bg-gray-800/80">
          <TabsTrigger value="all">All ({roleStats.total})</TabsTrigger>
          <TabsTrigger value="users">Users ({roleStats.users})</TabsTrigger>
          <TabsTrigger value="managers">Managers ({roleStats.managers})</TabsTrigger>
          <TabsTrigger value="hod">HOD ({roleStats.hod})</TabsTrigger>
          <TabsTrigger value="hr">HR ({roleStats.hr})</TabsTrigger>
          <TabsTrigger value="admins">Admins ({roleStats.admins})</TabsTrigger>
        </TabsList>

        {/* All Users Tab */}
        <TabsContent value="all">
      <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                All Users
              </CardTitle>
              <CardDescription>Complete list of all users across all roles</CardDescription>
            </CardHeader>
            <CardContent>
        <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200 dark:border-gray-700">
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedUsers.all.map((user) => (
                      <TableRow key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <TableCell>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">ID: {user.employeeId}</p>
                    </div>
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-white">{user.email}</TableCell>
                        <TableCell className="text-gray-900 dark:text-white">{user.phone}</TableCell>
                        <TableCell>
                    <Badge 
                      className={`${
                              user.userType === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                              user.userType === 'manager' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                              user.userType === 'hod' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                              user.userType === 'hr' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                              'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            }`}
                          >
                            {user.userType === 'admin' ? 'Admin' :
                             user.userType === 'manager' ? 'Manager' :
                             user.userType === 'hod' ? 'HOD' :
                             user.userType === 'hr' ? 'HR' : 'User'}
                    </Badge>
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-white">{user.city || '-'}</TableCell>
                        <TableCell>
                    <div className="space-y-1">
                      <Badge variant={
                        user.status === 'Active' ? 'default' :
                        user.status === 'Warning' ? 'secondary' : 'destructive'
                      } className={
                        user.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                        user.status === 'Warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' : 
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                      }>
                        {user.status}
                      </Badge>
                      {user.status === 'Inactive' && user.inactiveReason && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <p><strong>Reason:</strong> {user.inactiveReason}</p>
                          {user.inactiveDate && (
                            <p><strong>Since:</strong> {new Date(user.inactiveDate).toLocaleDateString()}</p>
                          )}
                        </div>
                      )}
                    </div>
                        </TableCell>
                        <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUserAction(user._id, 'view')}
                        title="View Details"
                        className="h-8 w-8 p-0 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
                      >
                        <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUserAction(user._id, 'sendWarning')}
                        title="Send Warning"
                        className="h-8 w-8 p-0 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:border-yellow-300 dark:hover:border-yellow-600 transition-all duration-200"
                      >
                        <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUserAction(user._id, 'sendCertificate')}
                        title="Send Certificate"
                        className="h-8 w-8 p-0 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 transition-all duration-200"
                      >
                        <Award className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </Button>
                      {user.isActive ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction(user._id, 'deactivate')}
                          title="Set as Inactive"
                          className="h-8 w-8 p-0 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 transition-all duration-200"
                        >
                          <UserX className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction(user._id, 'reactivate')}
                          title="Reactivate User"
                          className="h-8 w-8 p-0 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 transition-all duration-200"
                        >
                          <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </Button>
                      )}
                      {/* <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUserAction(user._id, 'delete')}
                        title="Delete User"
                        className="h-8 w-8 p-0 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </Button> */}
                    </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {groupedUsers.all.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No users found</p>
        </div>
              )}
            </div>
          </CardContent>
      </Card>
      </TabsContent>

      {/* Users (FE) Tab */}
      <TabsContent value="users">
        <Card className="p-6 bg-blue-50/50 dark:bg-blue-900/10 backdrop-blur-sm border border-blue-200 dark:border-blue-800 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
              <Users className="w-5 h-5" />
              Field Executives & Users
            </CardTitle>
            <CardDescription>All regular users (Field Executives)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name & ID</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedUsers.users.map((user) => (
                    <TableRow key={user._id} className="hover:bg-blue-100/50 dark:hover:bg-blue-900/20">
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">ID: {user.employeeId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white">{user.email}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{user.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-white">{user.city || '-'}</TableCell>
                      <TableCell>
                        <Badge className={
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleUserAction(user._id, 'view')}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {groupedUsers.users.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No users found in this category</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Managers Tab */}
      <TabsContent value="managers">
        <Card className="p-6 bg-green-50/50 dark:bg-green-900/10 backdrop-blur-sm border border-green-200 dark:border-green-800 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-300">
              <Briefcase className="w-5 h-5" />
              Managers
            </CardTitle>
            <CardDescription>Team managers and coordinators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name & ID</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedUsers.managers.map((user) => (
                    <TableRow key={user._id} className="hover:bg-green-100/50 dark:hover:bg-green-900/20">
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">ID: {user.employeeId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white">{user.email}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{user.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-white">{user.department || '-'}</TableCell>
                      <TableCell>
                        <Badge className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleUserAction(user._id, 'view')}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {groupedUsers.managers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No managers found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* HOD Tab */}
      <TabsContent value="hod">
        <Card className="p-6 bg-purple-50/50 dark:bg-purple-900/10 backdrop-blur-sm border border-purple-200 dark:border-purple-800 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-300">
              <Crown className="w-5 h-5" />
              Head of Departments
            </CardTitle>
            <CardDescription>Department heads and senior leadership</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name & ID</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedUsers.hod.map((user) => (
                    <TableRow key={user._id} className="hover:bg-purple-100/50 dark:hover:bg-purple-900/20">
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">ID: {user.employeeId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white">{user.email}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{user.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-white">{user.department || '-'}</TableCell>
                      <TableCell>
                        <Badge className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleUserAction(user._id, 'view')}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {groupedUsers.hod.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Crown className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No HODs found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* HR Tab */}
      <TabsContent value="hr">
        <Card className="p-6 bg-orange-50/50 dark:bg-orange-900/10 backdrop-blur-sm border border-orange-200 dark:border-orange-800 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
              <UserCog className="w-5 h-5" />
              Human Resources
            </CardTitle>
            <CardDescription>HR team members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name & ID</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedUsers.hr.map((user) => (
                    <TableRow key={user._id} className="hover:bg-orange-100/50 dark:hover:bg-orange-900/20">
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">ID: {user.employeeId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white">{user.email}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{user.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-white">{user.department || '-'}</TableCell>
                      <TableCell>
                        <Badge className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleUserAction(user._id, 'view')}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {groupedUsers.hr.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <UserCog className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No HR members found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Admins Tab */}
      <TabsContent value="admins">
        <Card className="p-6 bg-red-50/50 dark:bg-red-900/10 backdrop-blur-sm border border-red-200 dark:border-red-800 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-300">
              <Shield className="w-5 h-5" />
              System Administrators
            </CardTitle>
            <CardDescription>Admin users with full system access</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name & ID</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedUsers.admins.map((user) => (
                    <TableRow key={user._id} className="hover:bg-red-100/50 dark:hover:bg-red-900/20">
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">ID: {user.employeeId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white">{user.email}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{user.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-white">{user.department || '-'}</TableCell>
                      <TableCell>
                        <Badge className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleUserAction(user._id, 'view')}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {groupedUsers.admins.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No admins found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      </Tabs>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New User</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> Employee ID will be automatically generated by the system in the format FE{new Date().getFullYear().toString().slice(-2)}{(new Date().getMonth() + 1).toString().padStart(2, '0')}XXXX
                </p>
              </div>
              
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Basic Information</h3>
              
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={createUserData.name}
                      onChange={(e) => setCreateUserData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={createUserData.email}
                      onChange={(e) => setCreateUserData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={createUserData.password}
                      onChange={(e) => setCreateUserData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter password"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={createUserData.phone}
                      onChange={(e) => setCreateUserData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                
                {/* Personal Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Personal Information</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={createUserData.dateOfBirth}
                        onChange={(e) => setCreateUserData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="fathersName">Father's Name</Label>
                      <Input
                        id="fathersName"
                        value={createUserData.fathersName}
                        onChange={(e) => setCreateUserData(prev => ({ ...prev, fathersName: e.target.value }))}
                        placeholder="Enter father's name"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Employment Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Employment Information</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateOfJoining">Date of Joining</Label>
                      <Input
                        id="dateOfJoining"
                        type="date"
                        value={createUserData.dateOfJoining}
                        onChange={(e) => setCreateUserData(prev => ({ ...prev, dateOfJoining: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="highestEducation">Highest Education</Label>
                      <Input
                        id="highestEducation"
                        value={createUserData.highestEducation}
                        onChange={(e) => setCreateUserData(prev => ({ ...prev, highestEducation: e.target.value }))}
                        placeholder="Enter highest education qualification"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="userType">User Type *</Label>
                    <Select
                      value={createUserData.userType}
                      onValueChange={(value) => setCreateUserData(prev => ({ ...prev, userType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User (Field Executive)</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="hod">HOD (Head of Department)</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {createUserData.userType === 'user' && 'User will login to user panel only'}
                      {createUserData.userType === 'manager' && 'Manager will login to admin panel'}
                      {createUserData.userType === 'hod' && 'HOD will login to admin panel'}
                      {createUserData.userType === 'hr' && 'HR will login to admin panel'}
                      {createUserData.userType === 'admin' && 'Admin will have full access to admin panel'}
                    </p>
                  </div>
                  
                  {/* Conditional Reporting Manager - Only for Users */}
                  {createUserData.userType === 'user' && (
                  <div>
                      <Label htmlFor="reportingManager">Reporting Manager *</Label>
                    <Input
                      id="reportingManager"
                      value={createUserData.reportingManager}
                      onChange={(e) => setCreateUserData(prev => ({ ...prev, reportingManager: e.target.value }))}
                      placeholder="Enter reporting manager name"
                    />
                  </div>
                  )}
                </div>
              </div>
              
              {/* Address Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Address Information</h3>
              
                <div>
                  <Label htmlFor="currentAddress">Current Address</Label>
                  <textarea
                    id="currentAddress"
                    value={createUserData.currentAddress}
                    onChange={(e) => setCreateUserData(prev => ({ ...prev, currentAddress: e.target.value }))}
                    placeholder="Enter complete current address"
                    rows={3}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={createUserData.location}
                      onChange={(e) => setCreateUserData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Enter location/area"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={createUserData.city}
                      onChange={(e) => setCreateUserData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={createUserData.state}
                      onChange={(e) => setCreateUserData(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="Enter state"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="region">Region Assigned</Label>
                  <Input
                    id="region"
                    value={createUserData.region}
                    onChange={(e) => setCreateUserData(prev => ({ ...prev, region: e.target.value }))}
                    placeholder="Enter assigned region"
                  />
                </div>
              </div>
              
              {/* Identification Documents Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Identification Documents</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="aadhaarNo">Aadhaar Number</Label>
                    <Input
                      id="aadhaarNo"
                      value={createUserData.aadhaarNo}
                      onChange={(e) => setCreateUserData(prev => ({ ...prev, aadhaarNo: e.target.value }))}
                      placeholder="Enter 12-digit Aadhaar number"
                      maxLength={12}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">12-digit Aadhaar number</p>
                  </div>
                  <div>
                    <Label htmlFor="panNo">PAN Number</Label>
                    <Input
                      id="panNo"
                      value={createUserData.panNo}
                      onChange={(e) => setCreateUserData(prev => ({ ...prev, panNo: e.target.value.toUpperCase() }))}
                      placeholder="Enter PAN number (ABCDE1234F)"
                      maxLength={10}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Format: ABCDE1234F</p>
                  </div>
                </div>
              </div>
              
              {/* Document Upload Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Document Uploads</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="avatar">Employee Photo</Label>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCreateUserData(prev => ({ ...prev, avatar: file }));
                        }
                      }}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Upload employee photo (JPG, PNG, GIF)
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="documents">Documents (PDF/Images)</Label>
                    <Input
                      id="documents"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.gif"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setCreateUserData(prev => ({ ...prev, documents: files }));
                      }}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Upload documents like Aadhaar, PAN, Education certificates (PDF, JPG, PNG)
                    </p>
                  </div>
                </div>
                
                {createUserData.documents.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected Documents:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                      {createUserData.documents.map((doc, index) => (
                        <li key={index}>{doc.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            {/* Fixed Button Section */}
<div className="sticky bottom-0 bg-white dark:bg-gray-800 pt-4 mt-6 border-t border-gray-200 dark:border-gray-700">
  <div className="flex flex-col sm:flex-row gap-3">
    
    {/* Cancel Button (Red Outline) */}
    <Button
      type="button"
      onClick={() => setShowCreateModal(false)}
      className="flex-1 h-11 border border-red-500 text-red-600 dark:text-red-400 
                 bg-white dark:bg-gray-700 
                 hover:bg-red-50 dark:hover:bg-red-900/30 
                 transition-all duration-200 font-medium rounded-lg shadow-sm"
    >
      Cancel
    </Button>

    {/* Create User Button (Solid Blue) */}
    <Button
      type="button"
      onClick={handleCreateUser}
      disabled={isCreatingUser}
      className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 
                 text-white font-medium rounded-lg shadow-sm
                 disabled:opacity-50 disabled:cursor-not-allowed 
                 transition-all duration-200"
    >
      {isCreatingUser ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Creating User...
        </div>
      ) : (
        'Create User'
      )}
    </Button>

  </div>
</div>

          </div>
        </div>
      )}

      {/* Send Warning Modal */}
      {showWarningModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Send Warning</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWarningModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>To:</strong> {selectedUser.name} ({selectedUser.email})
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="warningMessage">Warning Message *</Label>
                <textarea
                  id="warningMessage"
                  value={warningData.message}
                  onChange={(e) => setWarningData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter warning message..."
                  className="w-full h-24 p-2 border border-gray-300 dark:border-gray-600 rounded-md resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="warningAttachment">Attachment (PDF)</Label>
                <Input
                  id="warningAttachment"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, 'warning')}
                  className="cursor-pointer"
                />
                {warningData.attachment && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ {warningData.attachment.name}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowWarningModal(false)}
                className="flex-1 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendWarning}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Send Warning
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Send Certificate Modal */}
      {showCertificateModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Send Certificate</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCertificateModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>To:</strong> {selectedUser.name} ({selectedUser.email})
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="certificateTitle">Certificate Title *</Label>
                <Input
                  id="certificateTitle"
                  value={certificateData.title}
                  onChange={(e) => setCertificateData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Performance Excellence Award"
                />
              </div>
              
              <div>
                <Label htmlFor="certificateMessage">Certificate Message *</Label>
                <textarea
                  id="certificateMessage"
                  value={certificateData.message}
                  onChange={(e) => setCertificateData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter certificate message..."
                  className="w-full h-24 p-2 border border-gray-300 dark:border-gray-600 rounded-md resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="certificateAttachment">Certificate File (PDF)</Label>
                <Input
                  id="certificateAttachment"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, 'certificate')}
                  className="cursor-pointer"
                />
                {certificateData.attachment && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ {certificateData.attachment.name}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCertificateModal(false)}
                className="flex-1 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendCertificate}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Send Certificate
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      <ConfirmationPopup
        isOpen={showDeletePopup}
        onClose={() => {
          setShowDeletePopup(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.name}? This action cannot be undone.`}
        type="danger"
        confirmText="Delete User"
        cancelText="Cancel"
      />

      {/* Success Notification */}
      <SuccessNotification
        isVisible={showSuccessNotification}
        onClose={() => setShowSuccessNotification(false)}
        type={successData.type}
        action={successData.action}
        itemName={successData.itemName}
      />

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={showUserDetailsModal}
        onClose={() => setShowUserDetailsModal(false)}
        user={selectedUser}
      />

      {/* Inactive User Modal */}
      <InactiveUserModal
        isOpen={showInactiveModal}
        onClose={() => {
          setShowInactiveModal(false);
          setSelectedUser(null);
        }}
        onSuccess={() => {
          fetchUsers();
          // Stats auto-update from roleStats
        }}
        user={selectedUser}
      />

      {/* Reactivate User Modal */}
      <ReactivateUserModal
        isOpen={showReactivateModal}
        onClose={() => {
          setShowReactivateModal(false);
          setSelectedUser(null);
        }}
        onSuccess={() => {
          fetchUsers();
          // Stats auto-update from roleStats
        }}
        user={selectedUser}
      />

      </div>
    </div>
  );
};