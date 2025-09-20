import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { apiService } from '../../services/apiService';

export const LifecycleDashboard: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);

  const loadUsers = async () => {
    try {
      const res = await apiService.users.listSimple();
      setUsers(res.users || res || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    loadUsers();
    // connect socket.io without extra dependency (served by backend)
    const script = document.createElement('script');
    script.src = '/socket.io/socket.io.js';
    script.async = true;
    script.onload = () => {
      const io = (window as any).io ? (window as any).io() : null;
      if (io) {
        io.on('user:created', () => {
          loadUsers();
        });
      }
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Lifecycle Dashboard</h1>
        <p className="text-gray-600">Track employee journey and milestones</p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">Name</th>
                <th className="text-left py-3">Email</th>
                <th className="text-left py-3">Created At</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b hover:bg-gray-50">
                  <td className="py-3">{u.name}</td>
                  <td className="py-3">{u.email}</td>
                  <td className="py-3">{new Date(u.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-gray-500">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};