import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle, 
  Users,
  TrendingUp,
  Eye,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface TriggerResult {
  fe: string;
  userId: string;
  kpiScore: number;
  rating: string;
  triggers: Array<{
    type: string;
    action: string;
    executed: boolean;
    error?: string;
  }>;
  success: boolean;
  error?: string;
}

interface PendingTrigger {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  trainingType?: string;
  auditType?: string;
  status: string;
  priority: string;
  assignedAt: string;
  dueDate?: string;
  scheduledDate?: string;
  reason: string;
}

export const KPITriggerDashboard: React.FC = () => {
  const { user, userType } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [period, setPeriod] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResults, setUploadResults] = useState<TriggerResult[]>([]);
  const [previewResults, setPreviewResults] = useState<any[]>([]);
  const [pendingTriggers, setPendingTriggers] = useState<{
    training: PendingTrigger[];
    audits: PendingTrigger[];
  }>({ training: [], audits: [] });
  const [showResults, setShowResults] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid Excel file (.xlsx or .xls)');
        return;
      }
      
      setSelectedFile(file);
      toast.success('File selected successfully');
    }
  };

  // Download template
  const downloadTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/kpi-triggers/template', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download template');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kpi-template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Template downloaded successfully');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error('Failed to download template');
    } finally {
      setLoading(false);
    }
  };

  // Preview triggers without executing
  const handlePreview = async () => {
    if (!selectedFile) {
      toast.error('Please select an Excel file');
      return;
    }

    try {
      setPreviewLoading(true);
      
      const formData = new FormData();
      formData.append('excelFile', selectedFile);
      // Period is now optional - will be auto-detected from Excel's Month column
      if (period) {
        formData.append('period', period);
      }

      console.log('Sending preview request with:', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        period: period || 'Auto-detect from Excel'
      });

      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/kpi-triggers/preview', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type - browser will set it with boundary
        },
        body: formData
      });

      console.log('Preview response status:', response.status);
      const result = await response.json();
      console.log('Preview result:', result);

      if (result.success) {
        setPreviewResults(result.data.previewResults || []);
        setPeriod(result.data.period); // Update period from response
        setShowPreview(true);
        toast.success(`Preview for ${result.data.period}: ${result.data.matchedUsers} matched, ${result.data.unmatchedUsers} unmatched`);
      } else {
        toast.error(result.message || 'Preview failed');
      }
    } catch (error: any) {
      console.error('Preview error:', error);
      toast.error('Failed to generate preview: ' + error.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Upload and process Excel file
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }
    
    if (!period) {
      toast.error('Please preview first to detect the period from Excel');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('excelFile', selectedFile);
      formData.append('period', period);

      const response = await fetch('/api/kpi-triggers/upload-excel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setUploadResults(result.data.results);
        setShowResults(true);
        setShowPreview(false); // Hide preview when actual upload is done
        toast.success(`Processed ${result.data.successfulRecords} records successfully`);
        
        // Refresh pending triggers
        await fetchPendingTriggers();
      } else {
        toast.error(result.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  // Fetch pending triggers
  const fetchPendingTriggers = async () => {
    try {
      const response = await fetch('/api/kpi-triggers/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const result = await response.json();
      if (result.success) {
        setPendingTriggers(result.data);
      }
    } catch (error) {
      console.error('Error fetching pending triggers:', error);
    }
  };

  // Get rating color
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'Outstanding': return 'bg-green-100 text-green-800';
      case 'Excellent': return 'bg-blue-100 text-blue-800';
      case 'Satisfactory': return 'bg-yellow-100 text-yellow-800';
      case 'Need Improvement': return 'bg-orange-100 text-orange-800';
      case 'Unsatisfactory': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get trigger type color
  const getTriggerTypeColor = (type: string) => {
    switch (type) {
      case 'training': return 'bg-blue-100 text-blue-800';
      case 'audit': return 'bg-purple-100 text-purple-800';
      case 'warning': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || userType !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            KPI Trigger Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload Excel files to automatically process KPI scores and trigger training/audit assignments
          </p>
        </div>

        {/* Upload Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Upload KPI Data
            </CardTitle>
            <CardDescription>
              Upload Excel file with KPI data to automatically trigger training and audit assignments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Period Display (Auto-detected from Excel) */}
            {period && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Period Detected</p>
                    <p className="text-lg font-bold text-blue-600">{period}</p>
                    <p className="text-xs text-blue-600 mt-1">Automatically detected from Excel's "Month" column</p>
                  </div>
                </div>
              </div>
            )}

            {/* File Upload */}
            <div>
              <Label>Excel File</Label>
              <div className="mt-2 flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {selectedFile ? selectedFile.name : 'Select Excel File'}
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </Button>
              </div>
            </div>

            {/* Helper Text */}
            {selectedFile && !period && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Step 1: Click "Preview Triggers"</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    This will auto-detect the period from Excel's "Month" column and show you what will happen before processing.
                  </p>
                </div>
              </div>
            )}
            
            {selectedFile && period && !showPreview && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-900 dark:text-green-100">Period Detected: {period}</p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Click "Preview Triggers" to see matched users and triggers before processing.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                onClick={handlePreview}
                disabled={!selectedFile || previewLoading}
                variant="outline"
                className="w-full"
              >
                {previewLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating Preview...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Triggers
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || !period || uploading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & Process
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pending Triggers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pending Training */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Pending Training ({pendingTriggers.training.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingTriggers.training.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No pending training assignments</p>
              ) : (
                <div className="space-y-3">
                  {pendingTriggers.training.slice(0, 5).map((trigger) => (
                    <div key={trigger._id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{trigger.userId.name}</p>
                          <p className="text-sm text-gray-600">{trigger.trainingType}</p>
                          <p className="text-xs text-gray-500">{trigger.reason}</p>
                        </div>
                        <Badge variant="outline">{trigger.priority}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Audits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Pending Audits ({pendingTriggers.audits.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingTriggers.audits.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No pending audit schedules</p>
              ) : (
                <div className="space-y-3">
                  {pendingTriggers.audits.slice(0, 5).map((trigger) => (
                    <div key={trigger._id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{trigger.userId.name}</p>
                          <p className="text-sm text-gray-600">{trigger.auditType}</p>
                          <p className="text-xs text-gray-500">{trigger.reason}</p>
                        </div>
                        <Badge variant="outline">{trigger.priority}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview Results */}
        {showPreview && previewResults.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Trigger Preview
              </CardTitle>
              <CardDescription>
                Preview of triggers that will be created (no actual actions taken yet)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {previewResults.map((result, index) => (
                  <Card key={index} className="border-2 shadow-sm">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* User Info */}
                        <div>
                          <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            {result.fe}
                          </h4>
                          <div className="space-y-2 text-sm">
                            {result.matchedUser ? (
                              <>
                                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="font-semibold">Matched User</span>
                                </div>
                                {result.matchedUser.email && (
                                  <div className="flex gap-2 bg-blue-50 dark:bg-blue-900/30 p-2 rounded">
                                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                                    <span className="font-medium text-blue-700 dark:text-blue-300">{result.matchedUser.email}</span>
                                  </div>
                                )}
                                {result.matchedUser.employeeId && (
                                  <div className="flex gap-2 bg-purple-50 dark:bg-purple-900/30 p-2 rounded">
                                    <span className="text-gray-600 dark:text-gray-400">Employee ID:</span>
                                    <span className="font-medium text-purple-700 dark:text-purple-300">{result.matchedUser.employeeId}</span>
                                  </div>
                                )}
                                <div className="flex gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                  <span className="text-gray-600 dark:text-gray-400">User ID:</span>
                                  <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{result.matchedUser._id}</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 p-2 rounded">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-sm">User not found in database</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* KPI Info */}
                        <div>
                          <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                            KPI Performance
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 p-3 rounded-lg">
                              <span className="font-semibold">Overall Score:</span>
                              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{result.kpiScore}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Rating:</span>
                              <Badge className={getRatingColor(result.rating) + ' text-sm px-3 py-1'}>
                                {result.rating}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Triggers */}
                      <div className="mt-4 pt-4 border-t">
                        <h5 className="font-semibold mb-2 text-sm text-gray-700 dark:text-gray-300">Actions to be Triggered:</h5>
                        <div className="flex flex-wrap gap-2">
                          {result.triggers.map((trigger: any, idx: number) => (
                            <Badge 
                              key={idx}
                              className={getTriggerTypeColor(trigger.type) + ' px-3 py-1'}
                              variant="outline"
                            >
                              {trigger.action}
                              {trigger.warning && ' + Warning Letter'}
                            </Badge>
                          ))}
                          {result.triggers.length === 0 && (
                            <span className="text-sm text-gray-500 italic">No triggers (Excellent performance!)</span>
                          )}
                        </div>
                      </div>

                      {/* Raw Data Summary */}
                      <div className="mt-4 pt-4 border-t">
                        <h5 className="font-semibold mb-2 text-sm text-gray-700 dark:text-gray-300">Performance Metrics:</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                          <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            <div className="text-gray-600 dark:text-gray-400">TAT</div>
                            <div className="font-semibold">{result.rawData.tatPercentage}%</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            <div className="text-gray-600 dark:text-gray-400">Major Neg</div>
                            <div className="font-semibold">{result.rawData.majorNegPercentage}%</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            <div className="text-gray-600 dark:text-gray-400">General Neg</div>
                            <div className="font-semibold">{result.rawData.generalNegPercentage}%</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            <div className="text-gray-600 dark:text-gray-400">Quality</div>
                            <div className="font-semibold">{result.rawData.qualityPercentage}%</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            <div className="text-gray-600 dark:text-gray-400">Online</div>
                            <div className="font-semibold">{result.rawData.onlinePercentage}%</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            <div className="text-gray-600 dark:text-gray-400">Insufficiency</div>
                            <div className="font-semibold">{result.rawData.insuffPercentage}%</div>
                          </div>
                        </div>
                      </div>

                      {/* Email Notification Info */}
                      {result.matchedUser && result.triggers.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-semibold text-green-900 dark:text-green-100 mb-1">
                                  Notifications Will Be Sent:
                                </p>
                                <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                                  <div>📧 <strong>Email to User:</strong> {result.matchedUser.email}</div>
                                  <div>📧 <strong>Email to Coordinator</strong> (if exists in system)</div>
                                  <div>📧 <strong>Email to Manager</strong> (if exists in system)</div>
                                  <div>📧 <strong>Email to HOD</strong> (if exists in system)</div>
                                  {result.triggers.some((t: any) => t.type === 'audit') && (
                                    <div>📧 <strong>Email to Compliance Team</strong> (for audits)</div>
                                  )}
                                  <div className="mt-2 pt-2 border-t border-green-300">
                                    <div>🔔 <strong>In-app notification to user dashboard</strong></div>
                                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                      User will see notification in their dashboard notifications page
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Results */}
        {showResults && uploadResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Processing Results
              </CardTitle>
              <CardDescription>
                Results from the latest KPI data upload
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">FE Name</th>
                      <th className="text-left p-2">KPI Score</th>
                      <th className="text-left p-2">Rating</th>
                      <th className="text-left p-2">Triggers</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadResults.map((result, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{result.fe}</td>
                        <td className="p-2">{result.kpiScore}%</td>
                        <td className="p-2">
                          <Badge className={getRatingColor(result.rating)}>
                            {result.rating}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="space-y-1">
                            {result.triggers.map((trigger: any, idx: number) => (
                              <Badge 
                                key={idx} 
                                className={getTriggerTypeColor(trigger.type)}
                                variant="outline"
                              >
                                {trigger.action}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-2">
                          {result.success ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Success
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
