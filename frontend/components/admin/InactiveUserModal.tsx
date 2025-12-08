import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { X, AlertTriangle, UserX, Upload, FileText } from 'lucide-react';
import { apiService } from '../../services/apiService';
import { toast } from 'sonner';
import { ModalPortal } from '../common/ModalPortal';

interface InactiveUserModalProps {
  user: {
    _id: string;
    name: string;
    email: string;
    status: string;
    employeeId?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Main categories for exit reasons
const EXIT_CATEGORIES = {
  'Resignation': [
    'Better employment opportunity',
    'Higher salary expectation',
    'Relocation',
    'Career change',
    'Personal/family reasons'
  ],
  'Termination': [
    'Performance issues',
    'Low KPI',
    'Repeated warnings',
    'Misconduct',
    'Bribe',
    'Unethical behaviour',
    'Bad habits',
    'Non compliance with rules',
    'Fraudulent activity'
  ],
  'End of Contract / Project': [],
  'Retirement': [],
  'Death': [
    'Natural death',
    'Accidental death'
  ],
  'Other': [
    'Health issues',
    'Further studies',
    'Migration',
    'Own business'
  ]
};

export const InactiveUserModal: React.FC<InactiveUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [exitDate, setExitDate] = useState('');
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [exitReasonDescription, setExitReasonDescription] = useState('');
  const [verifiedBy, setVerifiedBy] = useState<'By Management' | 'HR' | 'Compliance'>('By Management');
  const [remarks, setRemarks] = useState('');
  const [proofDocument, setProofDocument] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!exitDate) {
      toast.error('Please select exit date');
      return;
    }

    if (!mainCategory) {
      toast.error('Please select exit reason category');
      return;
    }

    setLoading(true);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('exitDate', exitDate);
      formData.append('mainCategory', mainCategory);
      // Only append subCategory if it's not empty
      if (subCategory && subCategory.trim() !== '') {
        formData.append('subCategory', subCategory);
      }
      if (exitReasonDescription && exitReasonDescription.trim() !== '') {
        formData.append('exitReasonDescription', exitReasonDescription);
      }
      formData.append('verifiedBy', verifiedBy);
      if (remarks && remarks.trim() !== '') {
        formData.append('remarks', remarks);
      }
      if (proofDocument) {
        // Simulate upload progress for better UX
        setUploadProgress(30);
        formData.append('proofDocument', proofDocument);
      }

      // Simulate progress increment
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await apiService.users.setUserInactiveWithExitDetails(user._id, formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Show completion for a moment
      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success('User has been set as inactive with exit details successfully');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error setting user inactive:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to set user as inactive');
    } finally {
      setLoading(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setExitDate('');
    setMainCategory('');
    setSubCategory('');
    setExitReasonDescription('');
    setVerifiedBy('By Management');
    setRemarks('');
    setProofDocument(null);
    setUploadProgress(0);
    setIsUploading(false);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setProofDocument(file);
    }
  };

  if (!isOpen) return null;

  const availableSubCategories = mainCategory ? EXIT_CATEGORIES[mainCategory as keyof typeof EXIT_CATEGORIES] || [] : [];

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
        <Card className="w-full max-w-2xl mx-auto my-8 shadow-2xl border border-gray-100 dark:border-gray-700 rounded-2xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <UserX className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Exit Management</h2>
                  <p className="text-sm text-gray-600">Set user as inactive with exit details</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-gray-700">Field Executive Information</span>
              </div>
              <div className="text-sm text-gray-600">
                <p><strong>FE Name:</strong> {user.name}</p>
                <p><strong>Employee ID:</strong> {user.employeeId || 'N/A'}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Current Status:</strong> {user.status}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Exit Date */}
              <div>
                <Label htmlFor="exitDate" className="text-sm font-medium">
                  Exit Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="exitDate"
                  type="date"
                  value={exitDate}
                  onChange={(e) => setExitDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                  required
                />
              </div>

              {/* Main Category */}
              <div>
                <Label htmlFor="mainCategory" className="text-sm font-medium">
                  Reason for Leaving <span className="text-red-500">*</span>
                </Label>
                <select
                  id="mainCategory"
                  value={mainCategory}
                  onChange={(e) => {
                    setMainCategory(e.target.value);
                    setSubCategory(''); // Reset sub-category when main category changes
                  }}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a reason</option>
                  {Object.keys(EXIT_CATEGORIES).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sub Category */}
              {availableSubCategories.length > 0 && (
                <div>
                  <Label htmlFor="subCategory" className="text-sm font-medium">
                    Specific Reason
                  </Label>
                  <select
                    id="subCategory"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select specific reason (optional)</option>
                    {availableSubCategories.map((subCat) => (
                      <option key={subCat} value={subCat}>
                        {subCat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Exit Reason Description */}
              <div>
                <Label htmlFor="exitReasonDescription" className="text-sm font-medium">
                  Exit Reason Description
                </Label>
                <textarea
                  id="exitReasonDescription"
                  value={exitReasonDescription}
                  onChange={(e) => setExitReasonDescription(e.target.value)}
                  placeholder="Enter detailed description of the exit reason..."
                  rows={4}
                  maxLength={1000}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {exitReasonDescription.length}/1000 characters
                </div>
              </div>

              {/* Proof Document Upload */}
              <div>
                <Label htmlFor="proofDocument" className="text-sm font-medium">
                  Proof Document Upload
                </Label>
                <div className="mt-1">
                  <Input
                    id="proofDocument"
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="proofDocument"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    {proofDocument ? (
                      <>
                        <FileText className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-green-700 font-medium">
                          {proofDocument.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({(proofDocument.size / 1024).toFixed(1)} KB)
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Click to upload proof document
                        </span>
                      </>
                    )}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Accepted: PDF, DOC, DOCX, Images (max 10MB)
                  </p>
                </div>
              </div>

              {/* Verified By */}
              <div>
                <Label htmlFor="verifiedBy" className="text-sm font-medium">
                  Verified By
                </Label>
                <div className="flex gap-4 mt-2">
                  {(['By Management', 'HR', 'Compliance'] as const).map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="verifiedBy"
                        value={option}
                        checked={verifiedBy === option}
                        onChange={(e) => setVerifiedBy(e.target.value as 'By Management' | 'HR' | 'Compliance')}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <Label htmlFor="remarks" className="text-sm font-medium">
                  Additional Remarks
                </Label>
                <textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter any additional remarks..."
                  rows={3}
                  maxLength={500}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {remarks.length}/500 characters
                </div>
              </div>

              {/* Upload Progress Bar */}
              {isUploading && proofDocument && (
                <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-blue-700 dark:text-blue-400">
                      {uploadProgress < 100 ? 'Uploading document...' : 'Upload complete!'}
                    </span>
                    <span className="text-blue-600 dark:text-blue-300 font-semibold">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    >
                      <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <FileText className="h-3 w-3" />
                    <span className="truncate">{proofDocument.name}</span>
                    <span className="text-blue-500">({(proofDocument.size / 1024).toFixed(1)} KB)</span>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 h-11 border border-red-500 text-red-600 dark:text-red-400 
                           bg-white dark:bg-gray-700 
                           hover:bg-red-50 dark:hover:bg-red-900/30 
                           transition-all duration-200 font-medium rounded-lg shadow-sm
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={loading || !exitDate || !mainCategory}
                  className="flex-1 h-11 bg-red-600 hover:bg-red-700 
                           text-white font-medium rounded-lg shadow-sm
                           disabled:opacity-50 disabled:cursor-not-allowed 
                           transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {isUploading ? 'Uploading & Processing...' : 'Setting Inactive...'}
                    </div>
                  ) : (
                    'Set as Inactive'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </ModalPortal>
  );
};