import React from 'react';
import { Mail, Send } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export const MailPreview: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mail Preview</h1>
        <p className="text-gray-600">Preview and manage automated email notifications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Email Templates</h2>
          <div className="space-y-3">
            <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <h3 className="font-medium">KPI Warning Notification</h3>
              <p className="text-sm text-gray-600">Sent when KPI score falls below threshold</p>
            </div>
            <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <h3 className="font-medium">Training Completion</h3>
              <p className="text-sm text-gray-600">Sent when user completes a module</p>
            </div>
            <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <h3 className="font-medium">Award Notification</h3>
              <p className="text-sm text-gray-600">Sent when user receives recognition</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Email Preview</h2>
          <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="border-b pb-3 mb-3">
              <p className="text-sm text-gray-600">To: john.doe@company.com</p>
              <p className="text-sm text-gray-600">Subject: KPI Performance Alert</p>
            </div>
            <div className="space-y-3">
              <p>Dear John Doe,</p>
              <p>This is to inform you that your recent KPI score has fallen below the expected threshold. Please schedule a meeting with your supervisor to discuss improvement strategies.</p>
              <p>Best regards,<br/>HR Team</p>
            </div>
          </div>
          <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
            <Send className="w-4 h-4 mr-2" />
            Send Test Email
          </Button>
        </Card>
      </div>
    </div>
  );
};