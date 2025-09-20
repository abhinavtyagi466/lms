import React, { useEffect, useMemo, useState } from 'react';
import { Award, Plus, Download } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { apiService } from '../../services/apiService';
import { toast } from 'sonner';

export const AwardsRecognition: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<{ userId: string; awardTitle: string; description: string; pdfFile: File | null }>({
    userId: '', awardTitle: '', description: '', pdfFile: null
  });
  const canSubmit = useMemo(() => !!(form.userId && form.awardTitle && form.description && form.pdfFile), [form]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [usersRes, awardsRes] = await Promise.all([
        apiService.users.listSimple(),
        apiService.awards.getAllAwards()
      ]);
      setUsers(usersRes.users || usersRes || []);
      // Filter only certificates having certificateUrl
      const arr = (awardsRes.awards || awardsRes || []).filter((a: any) => a.type === 'certificate');
      setCerts(arr);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchAll(); }, []);

  const onSubmit = async (e: any) => {
    e.preventDefault();
    if (!canSubmit || !form.pdfFile) return;
    
    try {
      setSubmitting(true);
      
      const fd = new FormData();
      fd.append('userId', form.userId);
      fd.append('awardTitle', form.awardTitle);
      fd.append('description', form.description);
      
      if (form.pdfFile) {
        fd.append('pdfFile', form.pdfFile, form.pdfFile.name);
        fd.append('fileInfo', JSON.stringify({
          name: form.pdfFile.name,
          size: form.pdfFile.size,
          type: form.pdfFile.type,
          lastModified: form.pdfFile.lastModified
        }));
      }
      
      const response = await apiService.awards.sendCertificate(fd);
      
      toast.success('Certificate sent');
      setForm({ userId: '', awardTitle: '', description: '', pdfFile: null });
      await fetchAll();
    } catch (e: any) {
      console.error('Error sending certificate:', e);
      toast.error(e.message || 'Failed to send certificate');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Awards & Recognition</h1>
          <p className="text-gray-600">Recognize outstanding performance and achievements</p>
        </div>
        <div className="text-sm text-gray-500">{loading ? 'Loading...' : ''}</div>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Send Certificate</h2>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onSubmit}>
          <div className="col-span-1">
            <label className="text-sm text-gray-600">User</label>
            <select className="mt-1 w-full border rounded-md p-2" value={form.userId} onChange={(e) => setForm(f => ({ ...f, userId: e.target.value }))}>
              <option value="">Select user</option>
              {(users.users || users).map((u: any) => (
                <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div className="col-span-1">
            <label className="text-sm text-gray-600">Award Title</label>
            <input className="mt-1 w-full border rounded-md p-2" value={form.awardTitle} onChange={(e) => setForm(f => ({ ...f, awardTitle: e.target.value }))} placeholder="e.g. Employee of the Month" />
          </div>
          <div className="col-span-1 md:col-span-2">
            <label className="text-sm text-gray-600">Description</label>
            <textarea className="mt-1 w-full border rounded-md p-2" rows={3} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Enter description" />
          </div>
          <div className="col-span-1">
            <label className="text-sm text-gray-600">PDF File</label>
            <input className="mt-1 w-full" type="file" accept="application/pdf" onChange={(e) => setForm(f => ({ ...f, pdfFile: e.target.files?.[0] || null }))} />
              </div>
          <div className="col-span-1 flex items-end justify-end">
            <Button disabled={!canSubmit || submitting} className="bg-yellow-600 hover:bg-yellow-700">
              <Plus className="w-4 h-4 mr-2" /> {submitting ? 'Sending...' : 'Send Certificate'}
              </Button>
            </div>
        </form>
          </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Certificates</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">User</th>
                <th className="text-left py-3">Title</th>
                <th className="text-left py-3">Date</th>
                <th className="text-left py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {certs.map((c: any) => (
                <tr key={c._id} className="border-b hover:bg-gray-50">
                  <td className="py-3">{c.userId?.name || 'User'}</td>
                  <td className="py-3">{c.title}</td>
                  <td className="py-3">{new Date(c.awardDate).toLocaleString()}</td>
                  <td className="py-3">
                    <a href={c.certificateUrl} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm"><Download className="w-3 h-3 mr-1" /> PDF</Button>
                    </a>
                  </td>
                </tr>
              ))}
              {certs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">No certificates found</td>
                </tr>
              )}
            </tbody>
          </table>
      </div>
      </Card>
    </div>
  );
};