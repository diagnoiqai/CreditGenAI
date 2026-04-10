import React from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  FileText, 
  Users, 
  ShieldCheck, 
  Activity, 
  Menu, 
  X,
  MessageSquarePlus
} from 'lucide-react';
import { AdminView } from '../../hooks/useAdmin';

interface AdminSidebarProps {
  activeView: AdminView;
  setActiveView: (view: AdminView) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setUserLeadsFilter: (uid: string | null) => void;
  refreshData: () => void;
  isRefreshing: boolean;
  dbStatus: any;
  onLogout: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeView,
  setActiveView,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  setSearchQuery,
  setUserLeadsFilter,
  refreshData,
  isRefreshing,
  dbStatus,
  onLogout
}) => {
  const handleNav = (view: AdminView) => {
    setActiveView(view);
    setSearchQuery('');
    setUserLeadsFilter(null);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={`
      fixed lg:relative inset-y-0 left-0 w-64 bg-[#5A5A40] p-8 text-white flex flex-col gap-8 z-50 transform transition-transform duration-300 ease-in-out
      ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="hidden lg:flex items-center gap-3">
        <Building2 className="w-8 h-8" />
        <h1 className="text-xl font-serif font-bold">Admin</h1>
      </div>
      
      <nav className="flex flex-col gap-2">
        <MenuButton active={activeView === 'dashboard'} onClick={() => handleNav('dashboard')} icon={<LayoutDashboard />} label="Dashboard" />
        <MenuButton active={activeView === 'banks'} onClick={() => handleNav('banks')} icon={<Building2 />} label="Bank Offers" />
        <MenuButton active={activeView === 'leads'} onClick={() => handleNav('leads')} icon={<FileText />} label="Loan Leads" />
        <MenuButton active={activeView === 'users'} onClick={() => handleNav('users')} icon={<Users />} label="Loan Seekers" />
        <MenuButton active={activeView === 'staff'} onClick={() => handleNav('staff')} icon={<ShieldCheck />} label="Staff Management" />
        <MenuButton active={activeView === 'usage'} onClick={() => handleNav('usage')} icon={<Activity />} label="AI Usage" />
        <MenuButton active={activeView === 'status'} onClick={() => handleNav('status')} icon={<Activity />} label="System Status" />
      </nav>

      <button 
        onClick={() => { refreshData(); setIsMobileMenuOpen(false); }}
        disabled={isRefreshing}
        className="mt-4 flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-sans text-[10px] uppercase tracking-widest font-bold bg-white/10 hover:bg-white/20 text-white disabled:opacity-50"
      >
        <Activity className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
      </button>

      <button 
        onClick={onLogout}
        className="mt-2 flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-sans text-[10px] uppercase tracking-widest font-bold bg-red-500/20 hover:bg-red-500/40 text-white"
      >
        <X className="w-4 h-4" />
        Logout
      </button>

      <div className="mt-auto pt-8 border-t border-white/10">
        <p className="text-[10px] font-sans uppercase tracking-widest opacity-50">Database Status</p>
        <div className="flex items-center gap-2 mt-2">
          <div className={`w-2 h-2 rounded-full ${dbStatus?.database === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-xs">{dbStatus?.database === 'connected' ? 'Connected' : 'Disconnected'}</span>
        </div>
        <p className="text-[10px] font-sans uppercase tracking-widest opacity-50 mt-4">System Status</p>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs">Live & Secure</span>
        </div>
      </div>
    </div>
  );
};

const MenuButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-sans text-sm uppercase tracking-widest font-bold ${
      active ? 'bg-white text-[#5A5A40] shadow-lg' : 'hover:bg-white/10 text-white/70'
    }`}
  >
    {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
    {label}
  </button>
);
