import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Plus, FileText, Download } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { apiService } from '../../services/apiService';
import { toast } from 'sonner';

export const WarningAuditRecord: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notices, setNotices] = useState<any[]>([]);
  const [form, setForm] = useState<{ userId: string; title: string; description: string; pdfFile: File | null }>({
    userId: '',
    title: '',
    description: '',
    pdfFile: null
  });

  const canSubmit = useMemo(() => !!(form.userId && form.title && form.description && form.pdfFile), [form]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, noticesRes] = await Promise.all([
        apiService.users.listSimple(),
        apiService.audits.listNotices()
      ]);
      setUsers(usersRes.users || usersRes || []);
      setNotices(noticesRes.notices || noticesRes || []);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !form.pdfFile) return;
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('userId', form.userId);
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('pdfFile', form.pdfFile);
      await apiService.audits.sendNotice(fd);
      toast.success('Notice sent');
      setForm({ userId: '', title: '', description: '', pdfFile: null });
      await fetchData();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to send notice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Audit & Warning Records</h1>
          <p className="text-gray-600">Manage disciplinary actions and audit records</p>
        </div>
        <div className="text-sm text-gray-500">{loading ? 'Loading...' : ''}</div>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Send Notice</h2>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onSubmit}>
          <div className="col-span-1">
            <label className="text-sm text-gray-600">User</label>
            <select
              className="mt-1 w-full border rounded-md p-2"
              value={form.userId}
              onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
            >
              <option value="">Select user</option>
              {(users.users || users).map((u: any) => (
                <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div className="col-span-1">
            <label className="text-sm text-gray-600">Title</label>
            <input
              className="mt-1 w-full border rounded-md p-2"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Enter title"
            />
          </div>
          <div className="col-span-1 md:col-span-2">
            <label className="text-sm text-gray-600">Description</label>
            <textarea
              className="mt-1 w-full border rounded-md p-2"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Enter description"
            />
          </div>
          <div className="col-span-1">
            <label className="text-sm text-gray-600">PDF File</label>
            <input
              className="mt-1 w-full"
              type="file"
              accept="application/pdf"
              onChange={(e) => setForm((f) => ({ ...f, pdfFile: e.target.files?.[0] || null }))}
            />
          </div>
          <div className="col-span-1 flex items-end justify-end">
            <Button disabled={!canSubmit || submitting} className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              {submitting ? 'Sending...' : 'Send Notice'}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">User</th>
                <th className="text-left py-3">Title</th>
                <th className="text-left py-3">Date</th>
                <th className="text-left py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(notices.notices || notices).map((n: any) => (
                <tr key={n._id} className="border-b hover:bg-gray-50">
                  <td className="py-3">{n.userId?.name || 'User'}</td>
                  <td className="py-3">{n.title}</td>
                  <td className="py-3">{new Date(n.createdAt).toLocaleString()}</td>
                  <td className="py-3">
                    <a href={n.pdfUrl} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm">
                        <Download className="w-3 h-3 mr-1" /> PDF
                      </Button>
                    </a>
                  </td>
                </tr>
              ))}
              {(notices.notices || notices).length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">No notices found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};