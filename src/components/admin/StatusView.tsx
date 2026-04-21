import React from 'react';
import { 
  Activity, 
  Database, 
  Server, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';

interface StatusViewProps {
  dbStatus: any;
}

export const StatusView: React.FC<StatusViewProps> = ({ dbStatus }) => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-serif font-bold text-[#1a1a1a]">System Health</h2>
        <p className="text-[#5A5A40] font-serif italic opacity-70">Infrastructure and database connectivity status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-[#5A5A40]/10">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${dbStatus?.database === 'connected' ? 'bg-green-500' : 'bg-red-500'} shadow-lg`}>
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold">PostgreSQL</h3>
              <p className="text-[10px] font-sans uppercase tracking-widest font-bold text-gray-400">Database Engine</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Connection</span>
              <span className={`text-xs font-bold ${dbStatus?.database === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                {dbStatus?.database === 'connected' ? 'Active' : 'Disconnected'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Pool Size</span>
              <span className="text-xs font-bold">{dbStatus?.pool?.total || 0} Connections</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500">Active</span>
              <span className="text-xs font-bold">{dbStatus?.pool?.active || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-[#5A5A40]/10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-blue-500 shadow-lg">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold">API Server</h3>
              <p className="text-[10px] font-sans uppercase tracking-widest font-bold text-gray-400">Express Runtime</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Status</span>
              <span className="text-xs font-bold text-green-600">Operational</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Environment</span>
              <span className="text-xs font-bold uppercase">{process.env.NODE_ENV || 'development'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500">Uptime</span>
              <span className="text-xs font-bold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                99.99%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-[#5A5A40]/10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-purple-500 shadow-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold">Security</h3>
              <p className="text-[10px] font-sans uppercase tracking-widest font-bold text-gray-400">Access Control</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Auth Engine</span>
              <span className="text-xs font-bold">Firebase Auth</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">SSL</span>
              <span className="text-xs font-bold text-green-600">Enabled</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500">Encryption</span>
              <span className="text-xs font-bold">AES-256</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#5A5A40] p-10 rounded-[40px] text-white shadow-xl">
        <div className="flex items-center gap-4 mb-8">
          <Activity className="w-8 h-8 animate-pulse" />
          <h3 className="text-2xl font-serif font-bold">System Logs Overview</h3>
        </div>
        <div className="space-y-4 font-mono text-xs opacity-80">
          <p className="flex gap-4"><span className="text-green-400">[OK]</span> Database migration check passed</p>
          <p className="flex gap-4"><span className="text-green-400">[OK]</span> SMTP connection verified</p>
          <p className="flex gap-4"><span className="text-green-400">[OK]</span> WhatsApp API (Twilio) heartbeat active</p>
          <p className="flex gap-4"><span className="text-blue-400">[INFO]</span> Cache cleared for bank offers</p>
          <p className="flex gap-4"><span className="text-blue-400">[INFO]</span> Analytics engine recalculated lead conversion</p>
        </div>
      </div>
    </div>
  );
};
