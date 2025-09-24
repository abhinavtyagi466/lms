import React, { useState } from 'react';
import { Card } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { KPIEntryForm } from '../../components/KPIEntryForm';
import { 
  Plus,
  AlertCircle
} from 'lucide-react';

export const KPITriggers: React.FC = () => {
  const [activeTab, setActiveTab] = useState('entry');

  const handleKPISuccess = (data: any) => {
    console.log('KPI submitted successfully:', data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">KPI Triggers & Automation</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Complete KPI entry, automation, and trigger management</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="entry" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              KPI Entry
            </TabsTrigger>
            {/* TEMPORARILY HIDDEN FOR MEETING */}
            {/* <TabsTrigger value="simulator" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Rule Simulator
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger> */}
          </TabsList>

          <TabsContent value="entry" className="space-y-6">
            <KPIEntryForm onSuccess={handleKPISuccess} />
            
            {/* Rule Engine Logic Display */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Rule Engine Logic
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-blue-600 mb-2">KPI Score Based Triggers</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• Score ≥ 85: Outstanding (No actions)</li>
                    <li>• Score ≥ 70: Excellent (Audit Call)</li>
                    <li>• Score ≥ 50: Satisfactory (Audit + Cross-check)</li>
                    <li>• Score ≥ 40: Need Improvement (Training + Audit + Cross-check + Dummy)</li>
                    <li>• Score &lt; 40: Critical (All actions + Warning)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-red-600 mb-2">Individual Metric Triggers</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• TAT &lt; 80%: Audit Call</li>
                    <li>• Major Neg &gt; 5%: Warning + Training</li>
                    <li>• Quality &gt; 3%: Cross Verification</li>
                    <li>• Neighbor &lt; 70%: Training</li>
                    <li>• Negativity &gt; 15%: Warning</li>
                    <li>• Cases on App &lt; 60%: Training</li>
                    <li>• Insuff &gt; 2%: Cross Verification</li>
                    <li>• Score &lt; 55: Basic Training + Audit</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* TEMPORARILY HIDDEN FOR MEETING */}
          {/* <TabsContent value="simulator" className="space-y-6">
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Rule Simulator temporarily hidden for meeting</p>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Analytics temporarily hidden for meeting</p>
            </div>
          </TabsContent> */}
        </Tabs>
      </div>
    </div>
  );
};