import React, { useState } from 'react';
import { BarChart3, Save } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';

export const KPIScoreEntry: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState('');
  const [kpiData, setKpiData] = useState({
    tat: '',
    quality: '',
    appUsage: '',
    negativity: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('KPI scores saved successfully!');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">KPI Score Entry</h1>
        <p className="text-gray-600">Enter performance scores for field executives</p>
      </div>

      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="user">Select User</Label>
            <select
              id="user"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Choose a user...</option>
              <option value="1">John Doe (FE001)</option>
              <option value="2">Jane Smith (FE002)</option>
              <option value="3">Mike Johnson (FE003)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tat">TAT Performance (%)</Label>
              <Input
                id="tat"
                type="number"
                min="0"
                max="100"
                value={kpiData.tat}
                onChange={(e) => setKpiData({...kpiData, tat: e.target.value})}
                placeholder="Enter TAT percentage"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="quality">Quality Score (%)</Label>
              <Input
                id="quality"
                type="number"
                min="0"
                max="100"
                value={kpiData.quality}
                onChange={(e) => setKpiData({...kpiData, quality: e.target.value})}
                placeholder="Enter quality percentage"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="appUsage">App Usage (%)</Label>
              <Input
                id="appUsage"
                type="number"
                min="0"
                max="100"
                value={kpiData.appUsage}
                onChange={(e) => setKpiData({...kpiData, appUsage: e.target.value})}
                placeholder="Enter app usage percentage"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="negativity">Negativity Score (%)</Label>
              <Input
                id="negativity"
                type="number"
                min="0"
                max="100"
                value={kpiData.negativity}
                onChange={(e) => setKpiData({...kpiData, negativity: e.target.value})}
                placeholder="Enter negativity percentage"
                className="mt-1"
              />
            </div>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Save KPI Scores
          </Button>
        </form>
      </Card>
    </div>
  );
};