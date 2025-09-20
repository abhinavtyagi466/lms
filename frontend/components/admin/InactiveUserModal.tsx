import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { X, AlertTriangle, UserX } from 'lucide-react';
import { apiService } from '../../services/apiService';
import { toast } from 'sonner';

interface InactiveUserModalProps {
  user: {
    _id: string;
    name: string;
    email: string;
    status: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const INACTIVE_REASONS = [
  'Performance Issues',
  'Policy Violation',
  'Attendance Problems',
  'Behavioral Issues',
  'Resignation',
  'Termination',
  'Other'
];

export const InactiveUserModal: React.FC<InactiveUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [inactiveReason, setInactiveReason] = useState('');
  const [inactiveRemark, setInactiveRemark] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inactiveReason) {
      toast.error('Please select a reason for deactivation');
      return;
    }

    setLoading(true);
    try {
      await apiService.users.setUserInactive(user._id, inactiveReason, inactiveRemark);
      toast.success('User has been set as inactive successfully');
      onSuccess();
      onClose();
      // Reset form
      setInactiveReason('');
      setInactiveRemark('');
    } catch (error: any) {
      console.error('Error setting user inactive:', error);
      toast.error(error.response?.data?.message || 'Failed to set user as inactive');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setInactiveReason('');
    setInactiveRemark('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Set User as Inactive</h2>
                <p className="text-sm text-gray-600">Deactivate user account</p>
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
              <span className="text-sm font-medium text-gray-700">User Information</span>
            </div>
            <div className="text-sm text-gray-600">
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Current Status:</strong> {user.status}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="inactiveReason" className="text-sm font-medium">
                Reason for Deactivation <span className="text-red-500">*</span>
              </Label>
              <select
                id="inactiveReason"
                value={inactiveReason}
                onChange={(e) => setInactiveReason(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a reason</option>
                {INACTIVE_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="inactiveRemark" className="text-sm font-medium">
                Additional Remarks
              </Label>
              <textarea
                id="inactiveRemark"
                value={inactiveRemark}
                onChange={(e) => setInactiveRemark(e.target.value)}
                placeholder="Enter additional details about the deactivation..."
                rows={4}
                maxLength={500}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="text-xs text-gray-500 mt-1">
                {inactiveRemark.length}/500 characters
              </div>
            </div>

            <div className="flex gap-3 pt-4">
  {/* Cancel Button */}
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

  {/* Set as Inactive Button */}
  <Button
    type="submit"
    disabled={loading || !inactiveReason}
    className="flex-1 h-11 bg-red-600 hover:bg-red-700 
               text-white font-medium rounded-lg shadow-sm
               disabled:opacity-50 disabled:cursor-not-allowed 
               transition-all duration-200"
  >
    {loading ? 'Setting Inactive...' : 'Set as Inactive'}
  </Button>
</div>

          </form>
        </div>
      </Card>
    </div>
  );
};