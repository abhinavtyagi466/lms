import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { X, UserCheck, AlertTriangle } from 'lucide-react';
import { apiService } from '../../services/apiService';
import { toast } from 'sonner';

interface ReactivateUserModalProps {
  user: {
    _id: string;
    name: string;
    email: string;
    status: string;
    inactiveReason?: string;
    inactiveRemark?: string;
    inactiveDate?: string;
    exitDetails?: {
      exitDate?: string;
      exitReason?: {
        mainCategory?: string;
        subCategory?: string;
      };
      exitReasonDescription?: string;
    };
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReactivateUserModal: React.FC<ReactivateUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);

  const handleReactivate = async () => {
    setLoading(true);
    try {
      await apiService.users.reactivateUser(user._id);
      toast.success('User has been reactivated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error reactivating user:', error);
      toast.error(error.response?.data?.message || 'Failed to reactivate user');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Reactivate User</h2>
                <p className="text-sm text-gray-600">Activate user account</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
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

          {/* Exit Information Section - Similar to UserDetailsPage */}
          {(user.exitDetails || user.inactiveReason || user.inactiveDate) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-800">Exit Information</h3>
              </div>
              <div className="space-y-3 text-sm">
                {user.exitDetails?.exitDate && (
                  <div>
                    <span className="text-gray-600">Exit Date:</span>
                    <div className="font-medium text-red-800">
                      {new Date(user.exitDetails.exitDate).toLocaleDateString()}
                    </div>
                  </div>
                )}
                {!user.exitDetails?.exitDate && user.inactiveDate && (
                  <div>
                    <span className="text-gray-600">Inactive Date:</span>
                    <div className="font-medium text-red-800">
                      {new Date(user.inactiveDate).toLocaleDateString()}
                    </div>
                  </div>
                )}
                
                {user.exitDetails?.exitReason?.mainCategory && (
                  <div>
                    <span className="text-gray-600">Exit Reason:</span>
                    <div className="font-medium text-red-800">
                      {user.exitDetails.exitReason.mainCategory}
                      {user.exitDetails.exitReason.subCategory &&
                        ` - ${user.exitDetails.exitReason.subCategory}`
                      }
                    </div>
                  </div>
                )}
                {!user.exitDetails?.exitReason?.mainCategory && user.inactiveReason && (
                  <div>
                    <span className="text-gray-600">Inactive Reason:</span>
                    <div className="font-medium text-red-800">
                      {user.inactiveReason}
                    </div>
                  </div>
                )}
                
                {user.exitDetails?.exitReasonDescription && (
                  <div>
                    <span className="text-gray-600">Description:</span>
                    <div className="font-medium text-red-800">
                      {user.exitDetails.exitReasonDescription}
                    </div>
                  </div>
                )}
                {!user.exitDetails?.exitReasonDescription && user.inactiveRemark && (
                  <div>
                    <span className="text-gray-600">Remarks:</span>
                    <div className="font-medium text-red-800">
                      {user.inactiveRemark}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">What happens when you reactivate:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>User status will be set to "Active"</li>
                <li>User will be able to log in again</li>
                <li>Inactive reason and remarks will be cleared</li>
                <li>This action will be logged in the audit trail</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleReactivate}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Reactivating...' : 'Reactivate User'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};