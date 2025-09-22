import React, { useState, useEffect } from 'react';
// Version: 4.0 - Force refresh after deleting old file
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  BarChart3,
  PieChart,
  TrendingUp,
  AlertCircle,
  Loader2,
  Settings,
  UserCheck,
  ClipboardList,
  Activity
} from 'lucide-react';
import { apiService } from '../../services/apiService';

interface AuditSchedule {
  _id: string;
  userId: {
    _id: string;
    username: string;
    email: string;
    role: string;
  };
  auditType: 'audit_call' | 'cross_check' | 'dummy_audit';
  scheduledDate: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  kpiTriggerId?: string;
  completedDate?: string;
  findings?: string;
  createdAt: string;
}

interface AuditStats {
  total: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  overdue: number;
  completionRate: number;
}

const AuditManager: React.FC = () => {
  const [audits, setAudits] = useState<AuditSchedule[]>([]);
  const [stats, setStats] = useState<AuditStats>({
    total: 0,
    scheduled: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedAudit, setSelectedAudit] = useState<AuditSchedule | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Form states
  const [scheduleForm, setScheduleForm] = useState({
    userId: '',
    auditType: '',
    scheduledDate: '',
    notes: ''
  });
  const [completeForm, setCompleteForm] = useState({
    findings: '',
    status: 'completed'
  });

  useEffect(() => {
    loadAudits();
    loadStats();
  }, []);

  const loadAudits = async () => {
    try {
      setLoading(true);
      const response = await apiService.auditScheduling.getScheduled();
      const auditData = response?.data;
      if (Array.isArray(auditData)) {
        setAudits(auditData);
      } else {
        console.warn('Expected array but got:', typeof auditData, auditData);
        setAudits([]);
      }
    } catch (error) {
      console.error('Failed to load audits:', error);
      setAudits([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.auditScheduling.getStats();
      const statsData = response?.data;
      if (statsData && typeof statsData === 'object') {
        setStats(statsData);
      } else {
        setStats({
          total: 0,
          scheduled: 0,
          inProgress: 0,
          completed: 0,
          overdue: 0,
          completionRate: 0
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats({
        total: 0,
        scheduled: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0,
        completionRate: 0
      });
    }
  };

  const handleScheduleAudit = async () => {
    try {
      await apiService.auditScheduling.manualSchedule(scheduleForm);
      setShowScheduleDialog(false);
      setScheduleForm({ userId: '', auditType: '', scheduledDate: '', notes: '' });
      loadAudits();
      loadStats();
    } catch (error) {
      console.error('Failed to schedule audit:', error);
    }
  };

  const handleCompleteAudit = async () => {
    if (!selectedAudit) return;
    try {
      await apiService.auditScheduling.completeAudit(selectedAudit._id, completeForm);
      setShowCompleteDialog(false);
      setCompleteForm({ findings: '', status: 'completed' });
      setSelectedAudit(null);
      loadAudits();
      loadStats();
    } catch (error) {
      console.error('Failed to complete audit:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getAuditTypeBadge = (type: string) => {
    const typeConfig = {
      audit_call: { color: 'bg-purple-100 text-purple-800', label: 'Audit Call' },
      cross_check: { color: 'bg-orange-100 text-orange-800', label: 'Cross Check' },
      dummy_audit: { color: 'bg-cyan-100 text-cyan-800', label: 'Dummy Audit' }
    };
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.audit_call;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  // Safe filtering with proper array check
  const getFilteredAudits = () => {
    if (!Array.isArray(audits)) {
      console.warn('Audits is not an array:', audits);
      return [];
    }
    
    return audits.filter(audit => {
      if (!audit || !audit.userId) return false;
      
      const matchesSearch = audit.userId.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           audit.userId.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || audit.status === filterStatus;
      const matchesType = filterType === 'all' || audit.auditType === filterType;
      return matchesSearch && matchesStatus && matchesType;
    });
  };

  const filteredAudits = getFilteredAudits();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Audit Manager</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and track audit schedules and compliance</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setShowScheduleDialog(true)}
        >
          <Plus className="w-4 h-4" />
          Schedule Audit
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ClipboardList className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Audits</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.scheduled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="scheduled" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scheduled">Scheduled Audits</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <Input
                placeholder="Search audits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="audit_call">Audit Call</SelectItem>
                <SelectItem value="cross_check">Cross Check</SelectItem>
                <SelectItem value="dummy_audit">Dummy Audit</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadAudits}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Audits Table */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Schedules</CardTitle>
              <CardDescription>Manage and track all audit schedules</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading audits...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Scheduled Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAudits.map((audit) => (
                      <TableRow key={audit._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{audit.userId?.username || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">{audit.userId?.email || 'No email'}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getAuditTypeBadge(audit.auditType)}</TableCell>
                        <TableCell>
                          {new Date(audit.scheduledDate).toLocaleDateString()} {new Date(audit.scheduledDate).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(audit.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setSelectedAudit(audit)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {audit.status !== 'completed' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  setSelectedAudit(audit);
                                  setShowCompleteDialog(true);
                                }}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Overall Compliance</span>
                    <Badge className="bg-green-100 text-green-800">85%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Audit Completion</span>
                    <Badge className="bg-blue-100 text-blue-800">{stats.completionRate}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Overdue Audits</span>
                    <Badge className="bg-red-100 text-red-800">{stats.overdue}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                    <p>Risk assessment metrics</p>
                    <p className="text-sm">will be available here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-4" />
            <p>Audit analytics and trends</p>
            <p className="text-sm">will be available here</p>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4" />
            <p>Audit reports and exports</p>
            <p className="text-sm">will be available here</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Schedule Audit Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule New Audit</DialogTitle>
            <DialogDescription>Create a new audit schedule for a user</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                value={scheduleForm.userId}
                onChange={(e) => setScheduleForm({...scheduleForm, userId: e.target.value})}
                placeholder="Enter user ID"
              />
            </div>
            <div>
              <Label htmlFor="auditType">Audit Type</Label>
              <Select value={scheduleForm.auditType} onValueChange={(value) => setScheduleForm({...scheduleForm, auditType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select audit type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="audit_call">Audit Call</SelectItem>
                  <SelectItem value="cross_check">Cross Check</SelectItem>
                  <SelectItem value="dummy_audit">Dummy Audit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="scheduledDate">Scheduled Date</Label>
              <Input
                id="scheduledDate"
                type="datetime-local"
                value={scheduleForm.scheduledDate}
                onChange={(e) => setScheduleForm({...scheduleForm, scheduledDate: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={scheduleForm.notes}
                onChange={(e) => setScheduleForm({...scheduleForm, notes: e.target.value})}
                placeholder="Additional notes"
              />
            </div>
            <Button onClick={handleScheduleAudit} className="w-full">
              Schedule Audit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete Audit Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Audit</DialogTitle>
            <DialogDescription>Mark this audit as completed and add findings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="findings">Findings</Label>
              <Textarea
                id="findings"
                value={completeForm.findings}
                onChange={(e) => setCompleteForm({...completeForm, findings: e.target.value})}
                placeholder="Enter audit findings and observations"
                rows={4}
              />
            </div>
            <Button onClick={handleCompleteAudit} className="w-full">
              Complete Audit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditManager;
