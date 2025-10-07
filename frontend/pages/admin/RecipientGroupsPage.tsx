import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Mail,
  Search,
  RefreshCw,
  UserPlus,
  UserMinus,
  Settings,
  BarChart3,
  Filter,
  Download,
  Eye,
  Zap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import { toast } from 'sonner';

interface RecipientGroup {
  _id: string;
  name: string;
  description: string;
  recipients: Array<{
    email: string;
    name?: string;
    role: string;
    department?: string;
    isActive: boolean;
  }>;
  criteria?: {
    userTypes?: string[];
    departments?: string[];
    roles?: string[];
    kpiRanges?: { min: number; max: number };
    trainingStatus?: string;
  };
  isActive: boolean;
  createdBy: any;
  updatedBy?: any;
  usageCount: number;
  lastUsed?: string;
  recipientCount: number;
  createdAt: string;
  updatedAt: string;
}

interface GroupStats {
  totalGroups: number;
  totalRecipients: number;
  activeRecipients: number;
  averageRecipientsPerGroup: number;
  totalUsage: number;
  mostUsedGroup: number;
}

const RecipientGroupsPage: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<RecipientGroup[]>([]);
  const [stats, setStats] = useState<GroupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRecipientsModal, setShowRecipientsModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<RecipientGroup | null>(null);
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    recipients: [] as Array<{
      email: string;
      name: string;
      role: string;
      department: string;
    }>,
    criteria: {
      userTypes: [] as string[],
      departments: [] as string[],
      roles: [] as string[],
      kpiRanges: { min: 0, max: 100 },
      trainingStatus: ''
    }
  });

  useEffect(() => {
    fetchGroups();
    fetchStats();
  }, [searchTerm, pagination.page]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.recipientGroups.getAll({
        search: searchTerm,
        page: pagination.page,
        limit: pagination.limit
      });
      
      setGroups(response.data || []);
      setPagination(prev => ({
        ...prev,
        ...response.pagination
      }));
      
    } catch (error) {
      console.error('Error fetching recipient groups:', error);
      toast.error('Failed to load recipient groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.recipientGroups.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching group stats:', error);
    }
  };

  const handleCreateGroup = async () => {
    try {
      if (!groupForm.name.trim()) {
        toast.error('Group name is required');
        return;
      }

      await apiService.recipientGroups.create(groupForm);
      
      toast.success('Recipient group created successfully');

      setGroupForm({
        name: '',
        description: '',
        recipients: [],
        criteria: {
          userTypes: [],
          departments: [],
          roles: [],
          kpiRanges: { min: 0, max: 100 },
          trainingStatus: ''
        }
      });
      setShowCreateModal(false);
      fetchGroups();
      fetchStats();
      
    } catch (error) {
      console.error('Error creating recipient group:', error);
      toast.error('Failed to create recipient group');
    }
  };

  const handleUpdateGroup = async () => {
    try {
      if (!selectedGroup || !groupForm.name.trim()) {
        toast.error('Group name is required');
        return;
      }

      await apiService.recipientGroups.update(selectedGroup._id, groupForm);
      
      toast.success('Recipient group updated successfully');

      setShowEditModal(false);
      setSelectedGroup(null);
      fetchGroups();
      
    } catch (error) {
      console.error('Error updating recipient group:', error);
      toast.error('Failed to update recipient group');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      if (!confirm('Are you sure you want to delete this recipient group?')) {
        return;
      }

      await apiService.recipientGroups.delete(groupId);
      
      toast.success('Recipient group deleted successfully');

      fetchGroups();
      fetchStats();
      
    } catch (error) {
      console.error('Error deleting recipient group:', error);
      toast.error('Failed to delete recipient group');
    }
  };

  const handleAutoPopulate = async (groupId: string) => {
    try {
      await apiService.recipientGroups.autoPopulate(groupId);
      
      toast.success('Group auto-populated successfully');

      fetchGroups();
      
    } catch (error) {
      console.error('Error auto-populating group:', error);
      toast.error('Failed to auto-populate group');
    }
  };

  const handleEditGroup = (group: RecipientGroup) => {
    setSelectedGroup(group);
    setGroupForm({
      name: group.name,
      description: group.description || '',
      recipients: group.recipients.map(r => ({
        email: r.email,
        name: r.name || '',
        role: r.role,
        department: r.department || ''
      })),
      criteria: group.criteria || {
        userTypes: [],
        departments: [],
        roles: [],
        kpiRanges: { min: 0, max: 100 },
        trainingStatus: ''
      }
    });
    setShowEditModal(true);
  };

  const handleViewRecipients = (group: RecipientGroup) => {
    setSelectedGroup(group);
    setShowRecipientsModal(true);
  };

  const addRecipient = () => {
    setGroupForm(prev => ({
      ...prev,
      recipients: [...prev.recipients, {
        email: '',
        name: '',
        role: 'other',
        department: ''
      }]
    }));
  };

  const removeRecipient = (index: number) => {
    setGroupForm(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  const updateRecipient = (index: number, field: string, value: string) => {
    setGroupForm(prev => ({
      ...prev,
      recipients: prev.recipients.map((recipient, i) => 
        i === index ? { ...recipient, [field]: value } : recipient
      )
    }));
  };

  const getRoleColor = (role: string) => {
    const colors = {
      'fe': 'bg-blue-100 text-blue-800',
      'coordinator': 'bg-green-100 text-green-800',
      'manager': 'bg-purple-100 text-purple-800',
      'hod': 'bg-red-100 text-red-800',
      'compliance': 'bg-orange-100 text-orange-800',
      'admin': 'bg-gray-100 text-gray-800',
      'other': 'bg-gray-100 text-gray-600'
    };
    return colors[role as keyof typeof colors] || colors.other;
  };

  if (loading && groups.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading recipient groups...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Recipient Groups
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage email recipient groups for targeted communications
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
              <Button
                onClick={fetchGroups}
                variant="outline"
                className="border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Groups</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalGroups}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Recipients</p>
                    <p className="text-2xl font-bold text-green-600">{stats.totalRecipients}</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <UserPlus className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Recipients</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.activeRecipients}</p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <Mail className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg per Group</p>
                    <p className="text-2xl font-bold text-orange-600">{Math.round(stats.averageRecipientsPerGroup)}</p>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                    <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search recipient groups..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Groups List */}
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-xl font-semibold text-gray-900 dark:text-white">
              <Users className="w-6 h-6 mr-3 text-blue-600" />
              Recipient Groups ({pagination.total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {groups.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No recipient groups found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create your first recipient group to get started
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {groups.map((group) => (
                  <div
                    key={group._id}
                    className="p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          {group.name}
                        </h3>
                        {group.description && (
                          <p className="text-gray-600 dark:text-gray-400 mb-3">
                            {group.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {group.recipientCount} recipients
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            Used {group.usageCount} times
                          </span>
                          <span>
                            Created {new Date(group.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewRecipients(group)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditGroup(group)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAutoPopulate(group._id)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Zap className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteGroup(group._id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Criteria Display */}
                    {group.criteria && (
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Auto-Population Criteria:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {group.criteria.userTypes && group.criteria.userTypes.length > 0 && (
                            <Badge variant="outline">
                              User Types: {group.criteria.userTypes.join(', ')}
                            </Badge>
                          )}
                          {group.criteria.departments && group.criteria.departments.length > 0 && (
                            <Badge variant="outline">
                              Departments: {group.criteria.departments.join(', ')}
                            </Badge>
                          )}
                          {group.criteria.roles && group.criteria.roles.length > 0 && (
                            <Badge variant="outline">
                              Roles: {group.criteria.roles.join(', ')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Group Modal */}
        <Dialog open={showCreateModal || showEditModal} onOpenChange={(open) => {
          if (!open) {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedGroup(null);
            setGroupForm({
              name: '',
              description: '',
              recipients: [],
              criteria: {
                userTypes: [],
                departments: [],
                roles: [],
                kpiRanges: { min: 0, max: 100 },
                trainingStatus: ''
              }
            });
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                {showCreateModal ? 'Create Recipient Group' : 'Edit Recipient Group'}
              </DialogTitle>
              <DialogDescription>
                {showCreateModal ? 'Create a new recipient group for targeted email communications' : 'Edit the recipient group details'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">
                    Group Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter group name"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Input
                    id="description"
                    placeholder="Enter group description"
                    value={groupForm.description}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Recipients */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium">Recipients</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRecipient}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Recipient
                  </Button>
                </div>
                
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {groupForm.recipients.map((recipient, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Input
                        placeholder="Email"
                        value={recipient.email}
                        onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                      />
                      <Input
                        placeholder="Name"
                        value={recipient.name}
                        onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                      />
                      <select
                        value={recipient.role}
                        onChange={(e) => updateRecipient(index, 'role', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="other">Other</option>
                        <option value="fe">Field Executive</option>
                        <option value="coordinator">Coordinator</option>
                        <option value="manager">Manager</option>
                        <option value="hod">HOD</option>
                        <option value="compliance">Compliance</option>
                        <option value="admin">Admin</option>
                      </select>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Department"
                          value={recipient.department}
                          onChange={(e) => updateRecipient(index, 'department', e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeRecipient(index)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={showCreateModal ? handleCreateGroup : handleUpdateGroup}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {showCreateModal ? 'Create Group' : 'Update Group'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Recipients Modal */}
        <Dialog open={showRecipientsModal} onOpenChange={setShowRecipientsModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Group Recipients
              </DialogTitle>
              <DialogDescription>
                View all recipients in this group
              </DialogDescription>
            </DialogHeader>
            
            {selectedGroup && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-blue-900 dark:text-blue-100">Group Name</Label>
                    <p className="text-blue-800 dark:text-blue-200">{selectedGroup.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Recipients</Label>
                    <p className="text-blue-800 dark:text-blue-200">{selectedGroup.recipientCount}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-blue-900 dark:text-blue-100">Usage Count</Label>
                    <p className="text-blue-800 dark:text-blue-200">{selectedGroup.usageCount}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedGroup.recipients.filter(r => r.isActive).map((recipient, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{recipient.name || 'No Name'}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{recipient.email}</p>
                          </div>
                          <Badge className={getRoleColor(recipient.role)}>
                            {recipient.role}
                          </Badge>
                          {recipient.department && (
                            <Badge variant="outline">
                              {recipient.department}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRecipientsModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default RecipientGroupsPage;
