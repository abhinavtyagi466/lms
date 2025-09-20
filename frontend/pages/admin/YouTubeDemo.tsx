import React, { useState } from 'react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { AdminModuleForm } from '../../components/AdminModuleForm';
import { YouTubePlayer } from '../../components/YouTubePlayer';
import { UserStats } from '../../components/UserStats';
import { toast } from 'sonner';

export const YouTubeDemo: React.FC = () => {
  const [modules, setModules] = useState([
    {
      _id: '1',
      title: 'Sample Training Video',
      description: 'This is a sample training module for demonstration purposes.',
      ytVideoId: 'dQw4w9WgXcQ',
      tags: ['training', 'sample'],
      status: 'published' as const
    }
  ]);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [demoUserId] = useState('demo-user-123');

  const handleModuleCreated = () => {
    // In a real app, this would refresh the modules list
    toast.success('Module created successfully!');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">YouTube Module Management Demo</h1>
        <p className="text-gray-600">A complete demonstration of the YouTube-based learning system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admin Module Creation */}
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Admin: Create YouTube Module</h2>
            <p className="text-sm text-gray-600">
              Admins can paste YouTube links and the system extracts video IDs automatically.
            </p>
          </div>
          <AdminModuleForm onModuleCreated={handleModuleCreated} />
        </Card>

        {/* User Stats */}
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">User: View Progress Stats</h2>
            <p className="text-sm text-gray-600">
              Users can view their YouTube video progress with detailed statistics.
            </p>
          </div>
          <UserStats userId={demoUserId} />
        </Card>
      </div>

      {/* YouTube Player Demo */}
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">YouTube Player with Progress Tracking</h2>
          <p className="text-sm text-gray-600">
            The player tracks progress every 5 seconds and sends data to the backend.
          </p>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select a module to play:
          </label>
          <select
            value={selectedModule || ''}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a module...</option>
            {modules.map((module) => (
              <option key={module._id} value={module._id}>
                {module.title}
              </option>
            ))}
          </select>
        </div>

        {selectedModule && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Demo Mode
              </Badge>
              <span className="text-sm text-gray-600">
                Progress is tracked every 5 seconds and sent to /api/progress
              </span>
            </div>
            
            <YouTubePlayer
              videoId={modules.find(m => m._id === selectedModule)?.ytVideoId || ''}
              userId={demoUserId}
              title={modules.find(m => m._id === selectedModule)?.title}
              description={modules.find(m => m._id === selectedModule)?.description}
              onProgress={(progress) => {
                console.log('Progress updated:', progress);
              }}
              onComplete={() => {
                console.log('Video completed!');
              }}
            />
          </div>
        )}
      </Card>

      {/* System Features Overview */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">System Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Admin Features</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Paste YouTube links or video IDs</li>
              <li>• Automatic video ID extraction</li>
              <li>• Video thumbnail preview</li>
              <li>• Module management (create, delete)</li>
              <li>• Status management (draft/published)</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">User Features</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• YouTube IFrame Player API integration</li>
              <li>• Progress tracking every 5 seconds</li>
              <li>• Real-time progress updates</li>
              <li>• Detailed progress statistics</li>
              <li>• Video completion tracking</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Backend APIs</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• POST /api/progress - Update progress</li>
              <li>• GET /api/progress/:userId - Get user stats</li>
              <li>• POST /api/modules - Create module</li>
              <li>• GET /api/modules - List modules</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Database Schema</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Module: {`{id, title, description, videoId}`}</li>
              <li>• Progress: {`{userId, videoId, currentTime, duration}`}</li>
              <li>• Unique user-video combinations</li>
              <li>• Timestamp tracking</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Technical Details */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Technical Implementation</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">YouTube IFrame Player API</h3>
            <p className="text-sm text-gray-600">
              The system uses the official YouTube IFrame Player API for enhanced control and progress tracking.
              Progress is sent to the backend every 5 seconds while the video is playing.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Progress Tracking</h3>
            <p className="text-sm text-gray-600">
              Every 5 seconds, the system sends {`{userId, videoId, currentTime, duration}`} to the backend.
              This data is stored in the Progress collection and can be retrieved for user statistics.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Real-time Updates</h3>
            <p className="text-sm text-gray-600">
              The frontend components update in real-time as progress is tracked, providing immediate feedback
              to users about their learning progress.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
