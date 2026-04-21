import React from 'react';
import { 
  Building2, 
  FileText, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight 
} from 'lucide-react';
import { StatCard } from './StatCard';
import { AdminView } from '../../hooks/useAdmin';

interface DashboardViewProps {
  analytics: any;
  setActiveView: (view: AdminView) => void;
  setLeadsStatusFilter: (status: string | null) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  analytics,
  setActiveView,
  setLeadsStatusFilter
}) => {
  const handleStatusClick = (status: string) => {
    setLeadsStatusFilter(status);
    setActiveView('leads');
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-serif font-bold text-[#1a1a1a]">Overview</h2>
        <p className="text-[#5A5A40] font-serif italic opacity-70">Real-time platform performance and lead analytics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Total Leads" value={analytics?.totalLeads || 0} icon={<TrendingUp />} color="blue" />
        <StatCard title="Total Users" value={analytics?.totalUsers || 0} icon={<Users />} color="purple" />
        <StatCard title="Bank Partners" value={analytics?.totalBanks || 0} icon={<Building2 />} color="emerald" />
        <StatCard title="Conversion" value={`${analytics?.conversionRate || 0}%`} icon={<TrendingUp />} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-[#5A5A40]/10">
          <h3 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#5A5A40]" />
            Lead Status Distribution
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleStatusClick('Pending')} className="p-6 rounded-3xl bg-orange-50 border border-orange-100 text-left group hover:shadow-md transition-all">
              <Clock className="w-6 h-6 text-orange-500 mb-2" />
              <p className="text-2xl font-serif font-bold text-orange-700">{analytics?.leadsByStatus?.Pending || 0}</p>
              <p className="text-[10px] font-sans uppercase tracking-widest font-bold text-orange-600/60">Pending Review</p>
            </button>
            <button onClick={() => handleStatusClick('Approved')} className="p-6 rounded-3xl bg-green-50 border border-green-100 text-left group hover:shadow-md transition-all">
              <CheckCircle2 className="w-6 h-6 text-green-500 mb-2" />
              <p className="text-2xl font-serif font-bold text-green-700">{analytics?.leadsByStatus?.Approved || 0}</p>
              <p className="text-[10px] font-sans uppercase tracking-widest font-bold text-green-600/60">Approved Loans</p>
            </button>
            <button onClick={() => handleStatusClick('Rejected')} className="p-6 rounded-3xl bg-red-50 border border-red-100 text-left group hover:shadow-md transition-all">
              <XCircle className="w-6 h-6 text-red-500 mb-2" />
              <p className="text-2xl font-serif font-bold text-red-700">{analytics?.leadsByStatus?.Rejected || 0}</p>
              <p className="text-[10px] font-sans uppercase tracking-widest font-bold text-red-600/60">Rejected Leads</p>
            </button>
            <button onClick={() => handleStatusClick('Contacted')} className="p-6 rounded-3xl bg-blue-50 border border-blue-100 text-left group hover:shadow-md transition-all">
              <TrendingUp className="w-6 h-6 text-blue-500 mb-2" />
              <p className="text-2xl font-serif font-bold text-blue-700">{analytics?.leadsByStatus?.Contacted || 0}</p>
              <p className="text-[10px] font-sans uppercase tracking-widest font-bold text-blue-600/60">In Progress</p>
            </button>
          </div>
        </div>

        <div className="bg-[#5A5A40] p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-serif font-bold mb-2">Quick Actions</h3>
            <p className="text-white/60 text-sm mb-8">Manage your platform resources efficiently</p>
            <div className="space-y-3">
              <button onClick={() => setActiveView('banks')} className="w-full flex items-center justify-between p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all group">
                <span className="font-bold text-sm">Manage Bank Offers</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => setActiveView('leads')} className="w-full flex items-center justify-between p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all group">
                <span className="font-bold text-sm">Review New Leads</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => setActiveView('staff')} className="w-full flex items-center justify-between p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all group">
                <span className="font-bold text-sm">Staff Management</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
};
