import React from 'react';
import { motion } from 'motion/react';
import { Cpu, Users, Calendar, TrendingUp, DollarSign } from 'lucide-react';

interface UsageViewProps {
  usageData: {
    daily: any[];
    users: any[];
  } | null;
}

export const UsageView: React.FC<UsageViewProps> = ({ usageData }) => {
  if (!usageData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5A5A40]"></div>
      </div>
    );
  }

  // Calculate some totals
  const totalInput = usageData.daily.reduce((acc, curr) => acc + parseInt(curr.total_input || '0'), 0);
  const totalOutput = usageData.daily.reduce((acc, curr) => acc + parseInt(curr.total_output || '0'), 0);
  const totalRequests = usageData.daily.reduce((acc, curr) => acc + parseInt(curr.total_requests || '0'), 0);

  // Estimated cost (Gemini 1.5 Flash pricing as example: $0.075 / 1M input, $0.30 / 1M output)
  const estimatedCost = (totalInput * 0.075 / 1000000) + (totalOutput * 0.30 / 1000000);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-[#5A5A40]/10 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Cpu className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-sans uppercase tracking-widest text-gray-500">Total Tokens</span>
          </div>
          <div className="text-2xl font-serif font-bold">{(totalInput + totalOutput).toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">Last 30 days</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#5A5A40]/10 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-sans uppercase tracking-widest text-gray-500">Total Requests</span>
          </div>
          <div className="text-2xl font-serif font-bold">{totalRequests.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">AI interactions</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#5A5A40]/10 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm font-sans uppercase tracking-widest text-gray-500">Active Users</span>
          </div>
          <div className="text-2xl font-serif font-bold">{usageData.users.length}</div>
          <div className="text-xs text-gray-400 mt-1">Using AI features</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#5A5A40]/10 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-amber-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm font-sans uppercase tracking-widest text-gray-500">Est. Cost</span>
          </div>
          <div className="text-2xl font-serif font-bold">${estimatedCost.toFixed(4)}</div>
          <div className="text-xs text-gray-400 mt-1">Based on token usage</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Usage Table */}
        <div className="bg-white rounded-xl border border-[#5A5A40]/10 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#5A5A40]/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#5A5A40]" />
              <h3 className="text-lg font-serif font-bold">Daily Usage</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-500 font-sans">
                  <th className="px-6 py-3 border-b border-[#5A5A40]/10">Date</th>
                  <th className="px-6 py-3 border-b border-[#5A5A40]/10">Requests</th>
                  <th className="px-6 py-3 border-b border-[#5A5A40]/10">Input</th>
                  <th className="px-6 py-3 border-b border-[#5A5A40]/10">Output</th>
                  <th className="px-6 py-3 border-b border-[#5A5A40]/10">Total</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {usageData.daily.map((day, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 border-b border-[#5A5A40]/5 font-medium">
                      {day.date ? new Date(day.date).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 border-b border-[#5A5A40]/5">{day.total_requests || 0}</td>
                    <td className="px-6 py-4 border-b border-[#5A5A40]/5">{parseInt(day.total_input || '0').toLocaleString()}</td>
                    <td className="px-6 py-4 border-b border-[#5A5A40]/5">{parseInt(day.total_output || '0').toLocaleString()}</td>
                    <td className="px-6 py-4 border-b border-[#5A5A40]/5 font-bold">
                      {(parseInt(day.total_input || '0') + parseInt(day.total_output || '0')).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Users Table */}
        <div className="bg-white rounded-xl border border-[#5A5A40]/10 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#5A5A40]/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#5A5A40]" />
              <h3 className="text-lg font-serif font-bold">Top Users (AI Usage)</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-500 font-sans">
                  <th className="px-6 py-3 border-b border-[#5A5A40]/10">User</th>
                  <th className="px-6 py-3 border-b border-[#5A5A40]/10">Requests</th>
                  <th className="px-6 py-3 border-b border-[#5A5A40]/10">Total Tokens</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {usageData.users.map((user, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 border-b border-[#5A5A40]/5">
                      <div className="font-medium">{user.display_name || 'Unknown'}</div>
                      <div className="text-xs text-gray-400">{user.email || 'No email'}</div>
                    </td>
                    <td className="px-6 py-4 border-b border-[#5A5A40]/5">{user.total_requests || 0}</td>
                    <td className="px-6 py-4 border-b border-[#5A5A40]/5 font-bold">
                      {(parseInt(user.total_input || '0') + parseInt(user.total_output || '0')).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
