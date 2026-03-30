import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { User } from 'firebase/auth';
import { BankOffer, LoanType, LoanApplication, UserProfile, StaffInvite } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Plus, Trash2, Edit2, Save, X, IndianRupee, 
  LayoutDashboard, Users, FileText, Search, TrendingUp, 
  CheckCircle2, Clock, AlertCircle, ChevronRight, Filter,
  Activity, UserPlus, ShieldCheck, Mail, Download, Upload, XCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';

type AdminView = 'dashboard' | 'banks' | 'leads' | 'users' | 'staff';

interface AdminPanelProps {
  profile: UserProfile | null;
  user: User | null;
  isStaff?: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ profile, user, isStaff = false }) => {
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [offers, setOffers] = useState<BankOffer[]>([]);
  const [leads, setLeads] = useState<LoanApplication[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [staffInvites, setStaffInvites] = useState<StaffInvite[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [rejectionModal, setRejectionModal] = useState<{ id: string; reason: string } | null>(null);
  const [formData, setFormData] = useState<Partial<BankOffer>>({
    loanType: 'Personal Loan',
  });
  const [staffInviteData, setStaffInviteData] = useState({
    email: '',
    role: 'staff' as 'staff' | 'admin',
    permissions: {
      canManageBanks: false,
      canManageLeads: true,
      canManageUsers: false
    }
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; type: 'bank' | 'invite' | 'staff'; name: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardFilter, setDashboardFilter] = useState<'loan-seekers' | 'pending' | 'approved' | 'rejected' | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [userLeadsFilter, setUserLeadsFilter] = useState<string | null>(null);
  const [leadsStatusFilter, setLeadsStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Pagination states
  const [leadsLimit, setLeadsLimit] = useState(100);
  const [usersLimit, setUsersLimit] = useState(200);

  const isSuperAdmin = user?.email === 'theskyaigiants@gmail.com' || profile?.email === 'theskyaigiants@gmail.com';
  const canManageBanks = profile?.permissions?.canManageBanks || profile?.role === 'admin' || isSuperAdmin;
  const canManageLeads = profile?.permissions?.canManageLeads || profile?.role === 'admin' || isSuperAdmin || isStaff;
  const canManageUsers = profile?.permissions?.canManageUsers || profile?.role === 'admin' || isSuperAdmin;

  const [dbStatus, setDbStatus] = useState<{ status: string; database: string } | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        setDbStatus(data);
      } catch (err) {
        setDbStatus({ status: 'error', database: 'disconnected' });
      }
    };
    checkStatus();
    const statusInterval = setInterval(checkStatus, 60000);
    return () => statusInterval && clearInterval(statusInterval);
  }, []);

  useEffect(() => {
    const fetchData = async (isInitial = false) => {
      if (isInitial) setIsLoading(true);
      else setIsRefreshing(true);
      
      try {
        const [bankOffers, leadsData, usersData, invitesData] = await Promise.all([
          apiService.getAdminBankOffers(),
          apiService.getLeads(leadsLimit),
          apiService.getUsers(usersLimit),
          apiService.getStaffInvites()
        ]);
        setOffers(bankOffers);
        setLeads(leadsData);
        setUsers(usersData);
        setStaffInvites(invitesData);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        setToast({ message: 'Failed to fetch some data. Please refresh.', type: 'error' });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };
    
    fetchData(true);
    
    // Polling interval increased to 60s for better performance
    const interval = setInterval(() => fetchData(false), 60000);
    return () => clearInterval(interval);
  }, [leadsLimit, usersLimit]);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const [bankOffers, leadsData, usersData, invitesData] = await Promise.all([
        apiService.getAdminBankOffers(),
        apiService.getLeads(leadsLimit),
        apiService.getUsers(usersLimit),
        apiService.getStaffInvites()
      ]);
      setOffers(bankOffers);
      setLeads(leadsData);
      setUsers(usersData);
      setStaffInvites(invitesData);
      setToast({ message: 'Data refreshed successfully', type: 'success' });
    } catch (error) {
      console.error('Error refreshing data:', error);
      setToast({ message: 'Refresh failed', type: 'error' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const updateUserRole = async (uid: string, role: UserProfile['role']) => {
    if (!canManageUsers) return;
    try {
      const updateData: any = { role };
      if (role === 'admin') {
        updateData.permissions = {
          canManageBanks: true,
          canManageLeads: true,
          canManageUsers: true
        };
      } else if (role === 'staff') {
        updateData.permissions = {
          canManageBanks: false,
          canManageLeads: true,
          canManageUsers: false
        };
      }
      await apiService.updateUserRole(uid, role, updateData.permissions);
      refreshData();
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const updateUserPermission = async (uid: string, permission: keyof NonNullable<UserProfile['permissions']>, value: boolean) => {
    if (!canManageUsers) return;
    try {
      const user = users.find(u => u.uid === uid);
      const currentPermissions = user?.permissions || { canManageBanks: false, canManageLeads: false, canManageUsers: false };
      const newPermissions = { ...currentPermissions, [permission]: value };
      await apiService.updateUserPermissions(uid, newPermissions);
      refreshData();
    } catch (error) {
      console.error('Error updating permissions:', error);
    }
  };

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageBanks) return;
    try {
      const data = { ...formData, id: editingId || undefined };
      await apiService.saveBankOffer(data);
      setEditingId(null);
      setFormData({ loanType: 'Personal Loan' });
      refreshData();
    } catch (error) {
      console.error('Error saving bank offer:', error);
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!canManageBanks) return;
    try {
      await apiService.deleteBankOffer(id);
      setToast({ message: 'Bank offer deleted successfully', type: 'success' });
      refreshData();
    } catch (error) {
      setToast({ message: 'Failed to delete bank offer.', type: 'error' });
    }
    setDeleteConfirmation(null);
  };

  const updateLeadStatus = async (id: string, status: LoanApplication['status'], reason?: string) => {
    if (!canManageLeads) return;
    try {
      await apiService.updateLeadStatus(id, status, reason);
      setRejectionModal(null);
      setToast({ message: `Application ${(status || '').toLowerCase()} successfully`, type: 'success' });
      refreshData();
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !canManageUsers) return;
    try {
      await apiService.saveUserProfile(editingUser);
      setEditingUser(null);
      setToast({ message: 'User updated successfully', type: 'success' });
      refreshData();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const exportBanksToExcel = () => {
    const data = offers.map(({ id, lastUpdated, ...rest }) => rest);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Banks");
    XLSX.writeFile(wb, "CreditGenAI_Banks.xlsx");
  };

  const importBanksFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        for (const item of data) {
          await apiService.saveBankOffer(item);
        }
        
        setToast({ message: 'Banks imported successfully!', type: 'success' });
        refreshData();
      } catch (error) {
        console.error('Import error:', error);
        setToast({ message: 'Error importing banks. Please check the file format.', type: 'error' });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageUsers) return;
    try {
      const invite: any = {
        ...staffInviteData,
        email: (staffInviteData.email || '').trim().toLowerCase(),
        invitedBy: user?.uid || 'system'
      };
      await apiService.saveStaffInvite(invite);
      setStaffInviteData({
        email: '',
        role: 'staff',
        permissions: {
          canManageBanks: false,
          canManageLeads: true,
          canManageUsers: false
        }
      });
      setToast({ message: 'Staff invitation sent', type: 'success' });
      refreshData();
    } catch (error) {
      console.error('Error inviting staff:', error);
    }
  };

  const handleRemoveInvite = async (id: string) => {
    if (!canManageUsers) return;
    try {
      await apiService.deleteStaffInvite(id);
      setToast({ message: 'Invitation cancelled', type: 'success' });
      refreshData();
    } catch (error) {
      setToast({ message: 'Failed to cancel invitation', type: 'error' });
    }
    setDeleteConfirmation(null);
  };

  const handleRemoveStaff = async (uid: string) => {
    if (!canManageUsers) return;
    try {
      await apiService.updateUserRole(uid, 'user', null);
      setToast({ message: 'Staff member removed from team', type: 'success' });
      refreshData();
    } catch (error) {
      setToast({ message: 'Failed to remove staff member', type: 'error' });
    }
    setDeleteConfirmation(null);
  };

  const loanTypes: LoanType[] = ['Personal Loan', 'Home Loan', 'Car Loan', 'Jewelry Loan', 'Business Loan'];
  const inputClass = "w-full bg-white border border-gray-200 rounded-lg p-2 focus:border-[#5A5A40] outline-none transition-all text-sm";
  const labelClass = "block text-[10px] font-sans uppercase tracking-widest text-[#5A5A40] mb-1 font-bold";

  const renderDashboard = () => {
    const filteredLeads = dateFilter 
      ? leads.filter(l => l.timestamp && new Date(l.timestamp).toISOString().split('T')[0] === dateFilter)
      : leads;
    
    const filteredUsers = dateFilter
      ? users.filter(u => u.createdAt && new Date(u.createdAt).toISOString().split('T')[0] === dateFilter)
      : users;

    const totalLeads = filteredLeads.length;
    const pendingLeads = filteredLeads.filter(l => l.status === 'Pending').length;
    const approvedLeads = filteredLeads.filter(l => l.status === 'Approved').length;
    const rejectedLeads = filteredLeads.filter(l => l.status === 'Rejected').length;
    const loanSeekers = filteredUsers.filter(u => (u.role === 'user' || !u.role) && u.email !== 'theskyaigiants@gmail.com');
    const loanSeekersCount = loanSeekers.length;
    
    const leadCounts = filteredLeads.reduce((acc, lead) => {
      if (lead.bankId) {
        acc[lead.bankId] = (acc[lead.bankId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const bankStats = offers.map(offer => ({
      name: offer.bankName,
      leads: leadCounts[offer.id] || 0
    })).sort((a, b) => b.leads - a.leads).slice(0, 5);

    // Active users (last seen in last 10 mins)
    const tenMinsAgo = new Date(Date.now() - 600000).toISOString();
    const activeUsers = filteredUsers.filter(u => u.lastSeen && u.lastSeen > tenMinsAgo);

    const renderFilteredTable = () => {
      if (!dashboardFilter) return null;

      let filteredData: any[] = [];
      let title = "";

      if (dashboardFilter === 'loan-seekers') {
        filteredData = loanSeekers;
        title = "Loan Seekers List";
      } else if (dashboardFilter === 'pending') {
        filteredData = filteredLeads.filter(l => l.status === 'Pending');
        title = "Pending Applications";
      } else if (dashboardFilter === 'approved') {
        filteredData = filteredLeads.filter(l => l.status === 'Approved');
        title = "Approved Applications";
      } else if (dashboardFilter === 'rejected') {
        filteredData = filteredLeads.filter(l => l.status === 'Rejected');
        title = "Rejected Applications";
      }

      if (filteredData.length === 0) return null;

      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-3xl shadow-lg border border-[#5A5A40]/10 mt-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-serif font-bold text-[#5A5A40]">{title}</h3>
            <button onClick={() => setDashboardFilter(null)} className="text-sm text-gray-400 hover:text-[#5A5A40] font-bold uppercase tracking-widest">Close Table</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F5F0] text-[10px] font-sans uppercase tracking-widest text-[#5A5A40] font-bold">
                  <th className="p-4">Details</th>
                  {dashboardFilter !== 'loan-seekers' && <th className="p-4">Bank</th>}
                  <th className="p-4">Financials</th>
                  {dashboardFilter === 'rejected' && <th className="p-4">Rejection Reason</th>}
                  {dashboardFilter === 'approved' && <th className="p-4">Approved Bank</th>}
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredData.map((item, i) => (
                  <tr key={`${item.id || item.uid || 'item'}-${i}`} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold">{item.userName || item.displayName || 'N/A'}</p>
                      <p className="text-xs text-gray-400">{item.userEmail || item.email}</p>
                      <p className="text-xs text-gray-400">{item.userMobile || item.mobile}</p>
                    </td>
                    {dashboardFilter !== 'loan-seekers' && (
                      <td className="p-4">
                        <p className="font-bold">{item.bankName}</p>
                        <p className="text-xs text-[#5A5A40]">{item.loanType}</p>
                      </td>
                    )}
                    <td className="p-4">
                      <p className="font-serif font-bold">₹{(item.loanAmount || item.monthlyIncome || 0).toLocaleString('en-IN')}</p>
                      {item.cibilScore && <p className="text-[10px] text-orange-600">CIBIL: {item.cibilScore}</p>}
                    </td>
                    {dashboardFilter === 'rejected' && (
                      <td className="p-4 text-xs text-red-500 italic max-w-[200px]">{item.rejectionReason || 'No reason provided'}</td>
                    )}
                    {dashboardFilter === 'approved' && (
                      <td className="p-4 text-xs text-green-600 font-bold">{item.bankName}</td>
                    )}
                    <td className="p-4 text-xs text-gray-400">
                      {new Date(item.timestamp || item.created_at || item.lastUpdated).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      );
    };

    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-2xl font-serif font-bold text-[#5A5A40]">Dashboard Overview</h2>
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-[#5A5A40]/10">
            <Filter className="w-4 h-4 text-[#5A5A40]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">Filter by Date:</span>
            <input 
              type="date" 
              className="text-xs border-none outline-none focus:ring-0 bg-transparent"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            {dateFilter && (
              <button onClick={() => setDateFilter('')} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div onClick={() => loanSeekersCount > 0 && setDashboardFilter('loan-seekers')} className="cursor-pointer">
            <StatCard title="Loan Seekers" value={loanSeekersCount} icon={<Users />} color="blue" active={dashboardFilter === 'loan-seekers'} />
          </div>
          <div 
            onClick={() => {
              if (pendingLeads > 0) {
                setLeadsStatusFilter('Pending');
                setActiveView('leads');
              }
            }} 
            className="cursor-pointer"
          >
            <StatCard title="Pending Leads" value={pendingLeads} icon={<Clock />} color="orange" active={false} />
          </div>
          <div 
            onClick={() => {
              if (approvedLeads > 0) {
                setLeadsStatusFilter('Approved');
                setActiveView('leads');
              }
            }} 
            className="cursor-pointer"
          >
            <StatCard title="Approved" value={approvedLeads} icon={<CheckCircle2 />} color="emerald" active={false} />
          </div>
          <div 
            onClick={() => {
              if (rejectedLeads > 0) {
                setLeadsStatusFilter('Rejected');
                setActiveView('leads');
              }
            }} 
            className="cursor-pointer"
          >
            <StatCard title="Rejected" value={rejectedLeads} icon={<XCircle />} color="red" active={false} />
          </div>
        </div>

        {renderFilteredTable()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-serif font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#5A5A40]" />
              Top Banks by Leads
            </h3>
            <div className="space-y-4">
              {bankStats.map((stat, i) => (
                <div key={`bank-stat-${stat.name}-${i}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#F5F5F0] rounded-full flex items-center justify-center text-xs font-bold text-[#5A5A40]">
                      {i + 1}
                    </div>
                    <span className="font-serif font-bold">{stat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#5A5A40]" 
                        style={{ width: `${(stat.leads / (totalLeads || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-[#5A5A40]">{stat.leads}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-serif font-bold mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#5A5A40]" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              {filteredLeads.slice(0, 5).map((lead, i) => (
                <div key={`recent-lead-${lead.id || i}`} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-[#5A5A40] rounded-full" />
                  <p className="flex-1">
                    <span className="font-bold">{lead.userName || 'Someone'}</span> applied for <span className="font-bold">{lead.loanType}</span> at <span className="font-bold">{lead.bankName}</span>
                    {lead.status === 'Rejected' && lead.rejectionReason && (
                      <span className="block text-[10px] text-red-500 mt-1 italic">Reason: {lead.rejectionReason}</span>
                    )}
                  </p>
                  <span className="text-[10px] text-gray-400 uppercase">{lead.timestamp ? new Date(lead.timestamp).toLocaleDateString() : 'N/A'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBanks = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {canManageBanks && (
        <div className="lg:col-span-1">
          <div className="space-y-6 sticky top-6">
            <form onSubmit={handleSubmitOffer} className="bg-white p-6 rounded-3xl shadow-lg border border-[#5A5A40]/10">
              <h2 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
                {editingId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingId ? 'Edit Offer' : 'Add New Offer'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Bank/NBFC Name</label>
                  <input type="text" required className={inputClass} value={formData.bankName || ''} onChange={e => setFormData({ ...formData, bankName: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Loan Type</label>
                  <select className={inputClass} value={formData.loanType} onChange={e => setFormData({ ...formData, loanType: e.target.value as any })}>
                    {loanTypes.map((t, idx) => <option key={`loan-type-opt-${t}-${idx}`} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Min Amount (₹)</label>
                    <input type="number" required className={inputClass} value={formData.minAmount || ''} onChange={e => setFormData({ ...formData, minAmount: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className={labelClass}>Max Amount (₹)</label>
                    <input type="number" required className={inputClass} value={formData.maxAmount || ''} onChange={e => setFormData({ ...formData, maxAmount: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Min Interest (%)</label>
                    <input type="number" step="0.01" required className={inputClass} value={formData.minInterestRate || ''} onChange={e => setFormData({ ...formData, minInterestRate: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className={labelClass}>Max Interest (%)</label>
                    <input type="number" step="0.01" required className={inputClass} value={formData.maxInterestRate || ''} onChange={e => setFormData({ ...formData, maxInterestRate: Number(e.target.value) })} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Processing Fee (%)</label>
                  <input type="number" step="0.01" required placeholder="e.g. 1.0" className={inputClass} value={formData.processingFee || ''} onChange={e => setFormData({ ...formData, processingFee: Number(e.target.value) })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Min Tenure (Mo)</label>
                    <input type="number" required className={inputClass} value={formData.minTenure || ''} onChange={e => setFormData({ ...formData, minTenure: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className={labelClass}>Max Tenure (Mo)</label>
                    <input type="number" required className={inputClass} value={formData.maxTenure || ''} onChange={e => setFormData({ ...formData, maxTenure: Number(e.target.value) })} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Min CIBIL Score</label>
                  <input type="number" required placeholder="e.g. 750" className={inputClass} value={formData.minCibilScore || ''} onChange={e => setFormData({ ...formData, minCibilScore: Number(e.target.value) })} />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Repayment Policy</label>
                    <textarea 
                      className={`${inputClass} min-h-[80px] py-2`} 
                      placeholder="e.g. Flexible repayment options available..."
                      value={formData.repaymentPolicy || ''} 
                      onChange={e => setFormData({ ...formData, repaymentPolicy: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Preclosure Charges</label>
                    <textarea 
                      className={`${inputClass} min-h-[80px] py-2`} 
                      placeholder="e.g. 2% of outstanding principal after 12 months..."
                      value={formData.preclosureCharges || ''} 
                      onChange={e => setFormData({ ...formData, preclosureCharges: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Terms & Conditions</label>
                    <textarea 
                      className={`${inputClass} min-h-[80px] py-2`} 
                      placeholder="e.g. Standard bank T&C apply..."
                      value={formData.termsConditions || ''} 
                      onChange={e => setFormData({ ...formData, termsConditions: e.target.value })} 
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-sans uppercase tracking-widest text-[#5A5A40] font-bold mb-3">Bank Contact</h3>
                  <div className="space-y-3">
                    <input type="text" placeholder="Contact Person" className={inputClass} value={formData.contactPerson || ''} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="tel" placeholder="Phone" className={inputClass} value={formData.contactPhone || ''} onChange={e => setFormData({ ...formData, contactPhone: e.target.value })} />
                      <input type="email" placeholder="Email" className={inputClass} value={formData.contactEmail || ''} onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button type="submit" className="flex-1 bg-[#5A5A40] text-white py-2 rounded-lg hover:bg-[#4A4A30] transition-all font-bold flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Save Offer'}
                  </button>
                  {editingId && (
                    <button type="button" onClick={() => { setEditingId(null); setFormData({ loanType: 'Personal Loan' }); }} className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </form>

            <div className="bg-white p-6 rounded-3xl shadow-lg border border-[#5A5A40]/10 space-y-4">
              <h3 className="text-sm font-sans uppercase tracking-widest text-[#5A5A40] font-bold">Data Management</h3>
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={exportBanksToExcel}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 py-2 rounded-lg hover:bg-emerald-100 transition-all font-bold text-xs"
                >
                  <Download className="w-4 h-4" /> Export Banks to Excel
                </button>
                <div className="relative">
                  <input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    onChange={importBanksFromExcel}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <button className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-2 rounded-lg hover:bg-blue-100 transition-all font-bold text-xs">
                    <Upload className="w-4 h-4" /> Import Banks from Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className={`${canManageBanks ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
        <div className="relative mb-6">
          <input type="text" placeholder="Search banks..." className={`${inputClass} pl-10 h-12 text-base shadow-sm`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
        {offers.filter(o => (o.bankName || '').toLowerCase().includes(searchQuery.toLowerCase())).map((offer, idx) => (
          <div key={`bank-offer-${offer.id}-${idx}`} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-serif font-bold">{offer.bankName}</h3>
                <span className="text-[10px] bg-[#F5F5F0] text-[#5A5A40] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">{offer.loanType}</span>
              </div>
              <p className="text-sm text-gray-500 font-serif">₹{offer.minAmount?.toLocaleString('en-IN') || 0} - ₹{offer.maxAmount?.toLocaleString('en-IN') || 0} @ {offer.minInterestRate}%</p>
            </div>
            {canManageBanks && (
              <div className="flex gap-2">
                <button onClick={() => { setEditingId(offer.id); setFormData(offer); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"><Edit2 className="w-5 h-5" /></button>
                <button onClick={() => setDeleteConfirmation({ id: offer.id, type: 'bank', name: offer.bankName })} className="p-2 text-red-600 hover:bg-red-50 rounded-full"><Trash2 className="w-5 h-5" /></button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderLeads = () => {
    const filteredLeads = leads.filter(l => {
      const matchesSearch = (l.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (l.bankName || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesUser = userLeadsFilter ? l.uid === userLeadsFilter : true;
      const matchesStatus = leadsStatusFilter ? l.status === leadsStatusFilter : true;
      return matchesSearch && matchesUser && matchesStatus;
    });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-serif font-bold">Loan Applications (Leads)</h2>
            {(userLeadsFilter || leadsStatusFilter) && (
              <div className="flex items-center gap-4 text-xs text-[#5A5A40] font-bold">
                {userLeadsFilter && (
                  <div className="flex items-center gap-2">
                    <span>User: {users.find(u => u.uid === userLeadsFilter)?.displayName || leads.find(l => l.uid === userLeadsFilter)?.userName || userLeadsFilter}</span>
                    <button onClick={() => setUserLeadsFilter(null)} className="text-red-500 hover:underline">Clear</button>
                  </div>
                )}
                {leadsStatusFilter && (
                  <div className="flex items-center gap-2">
                    <span>Status: {leadsStatusFilter}</span>
                    <button onClick={() => setLeadsStatusFilter(null)} className="text-red-500 hover:underline">Clear</button>
                  </div>
                )}
                {(userLeadsFilter && leadsStatusFilter) && (
                  <button 
                    onClick={() => { setUserLeadsFilter(null); setLeadsStatusFilter(null); }} 
                    className="bg-red-50 text-red-600 px-2 py-0.5 rounded hover:bg-red-100"
                  >
                    Clear All
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search leads..." 
                className={inputClass + " pl-10"} 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-[#5A5A40] hover:bg-gray-50">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F5F0] text-[10px] font-sans uppercase tracking-widest text-[#5A5A40] font-bold">
                <th className="p-4">User</th>
                <th className="p-4">Bank & Loan</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-12 h-12 opacity-20" />
                      <p className="font-serif italic">No loan applications found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead, idx) => (
                <tr key={`${lead.id}-${idx}`} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold">{lead.userName || 'N/A'}</p>
                    <p className="text-xs text-gray-400">{lead.userEmail || 'N/A'}</p>
                    <p className="text-xs text-gray-400">{lead.userMobile || 'N/A'}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-bold">{lead.bankName}</p>
                    <p className="text-xs text-[#5A5A40]">{lead.loanType}</p>
                  </td>
                  <td className="p-4 font-serif font-bold">₹{lead.loanAmount?.toLocaleString('en-IN') || 0}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      lead.status === 'Approved' ? 'bg-green-100 text-green-700' :
                      lead.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                      lead.status === 'Contacted' ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {lead.status}
                    </span>
                    {lead.status === 'Rejected' && lead.rejectionReason && (
                      <p className="text-[8px] text-red-400 mt-1 italic max-w-[120px] truncate" title={lead.rejectionReason}>
                        Reason: {lead.rejectionReason}
                      </p>
                    )}
                  </td>
                  <td className="p-4 text-xs text-gray-400">{lead.timestamp ? new Date(lead.timestamp).toLocaleDateString() : 'N/A'}</td>
                  <td className="p-4">
                    <select 
                      className="text-xs border border-gray-200 rounded p-1 outline-none"
                      value={lead.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as any;
                        if (newStatus === 'Rejected') {
                          setRejectionModal({ id: lead.id, reason: '' });
                        } else {
                          updateLeadStatus(lead.id, newStatus);
                        }
                      }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
          {rejectionModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-6 rounded-[32px] shadow-2xl max-w-md w-full border border-[#5A5A40]/10">
                <h3 className="text-xl font-serif font-bold mb-4">Rejection Reason</h3>
                <textarea 
                  className={inputClass + " h-32 mb-4"}
                  placeholder="Why is this application being rejected?"
                  value={rejectionModal.reason}
                  onChange={e => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => updateLeadStatus(rejectionModal.id, 'Rejected', rejectionModal.reason)}
                    disabled={!rejectionModal.reason.trim()}
                    className="flex-1 bg-red-600 text-white py-2 rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm Rejection
                  </button>
                  <button 
                    onClick={() => setRejectionModal(null)}
                    className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          {leads.length >= leadsLimit && (
            <div className="p-4 text-center border-t border-gray-50">
              <button 
                onClick={() => setLeadsLimit(prev => prev + 50)}
                className="text-sm font-bold text-[#5A5A40] hover:underline"
              >
                Load More Leads
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderUsers = () => {
    const loanSeekers = users.filter(u => 
      (u.role === 'user' || !u.role) && 
      u.email !== 'theskyaigiants@gmail.com' &&
      !staffInvites.some(i => i.email === u.email)
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif font-bold">Loan Seekers</h2>
          <div className="relative w-64">
            <input 
              type="text" 
              placeholder="Search users..." 
              className={inputClass} 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
        </div>
        
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F5F0] text-[10px] font-sans uppercase tracking-widest text-[#5A5A40] font-bold">
                <th className="p-4">User Details</th>
                <th className="p-4">Financials</th>
                <th className="p-4">Mobile</th>
                <th className="p-4">Last Seen</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loanSeekers.filter(u => 
                (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
              ).map((u, idx) => {
                const tenMinsAgo = new Date(Date.now() - 600000).toISOString();
                const isOnline = u.lastSeen && u.lastSeen > tenMinsAgo;
                
                return (
                  <tr key={`user-${u.uid}-${idx}`} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-8 h-8 bg-[#F5F5F0] rounded-full flex items-center justify-center text-[#5A5A40]">
                            <Users className="w-4 h-4" />
                          </div>
                          {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />}
                        </div>
                        <div>
                          <p className="font-bold">{u.displayName || 'Unnamed User'}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold">₹{u.monthlyIncome?.toLocaleString('en-IN') || 0}</p>
                      <p className={`text-xs ${u.cibilScore && u.cibilScore >= 750 ? 'text-green-600' : 'text-orange-600'}`}>
                        CIBIL: {u.cibilScore || 'N/A'}
                      </p>
                    </td>
                    <td className="p-4 text-xs font-mono">{u.mobile || 'N/A'}</td>
                    <td className="p-4 text-xs text-gray-400">
                      {u.lastSeen ? new Date(u.lastSeen).toLocaleString() : 'Never'}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEditingUser(u)}
                          className="p-1 text-[#5A5A40] hover:bg-[#F5F5F0] rounded transition-colors"
                          title="Edit User Data"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setUserLeadsFilter(u.uid);
                            setActiveView('leads');
                          }}
                          className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] hover:underline"
                        >
                          View Leads
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {editingUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-8 rounded-[40px] shadow-2xl max-w-2xl w-full border border-[#5A5A40]/10 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-serif font-bold text-[#5A5A40]">Edit Loan Seeker Data</h3>
                  <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-gray-100 rounded-full">
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>
                <form onSubmit={handleUpdateUser} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Full Name</label>
                      <input type="text" className={inputClass} value={editingUser.displayName || ''} onChange={e => setEditingUser({ ...editingUser, displayName: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Mobile Number</label>
                      <input type="tel" className={inputClass} value={editingUser.mobile || ''} onChange={e => setEditingUser({ ...editingUser, mobile: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Monthly Income (₹)</label>
                      <input type="number" className={inputClass} value={editingUser.monthlyIncome || ''} onChange={e => setEditingUser({ ...editingUser, monthlyIncome: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className={labelClass}>Existing EMIs (₹)</label>
                      <input type="number" className={inputClass} value={editingUser.existingEMIs || ''} onChange={e => setEditingUser({ ...editingUser, existingEMIs: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className={labelClass}>CIBIL Score</label>
                      <input type="number" className={inputClass} value={editingUser.cibilScore || ''} onChange={e => setEditingUser({ ...editingUser, cibilScore: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className={labelClass}>Employment Type</label>
                      <select className={inputClass} value={editingUser.employmentType} onChange={e => setEditingUser({ ...editingUser, employmentType: e.target.value as any })}>
                        <option value="Salaried">Salaried</option>
                        <option value="Self-employed">Self-employed</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-[#5A5A40] text-white py-4 rounded-full font-bold text-lg hover:bg-[#4A4A30] transition-all shadow-lg">
                    Update Profile Data
                  </button>
                </form>
              </div>
            </div>
          )}
          {users.length >= usersLimit && (
            <div className="p-4 text-center border-t border-gray-50">
              <button 
                onClick={() => setUsersLimit(prev => prev + 100)}
                className="text-sm font-bold text-[#5A5A40] hover:underline"
              >
                Load More Users
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStaff = () => {
    const activeStaff = users.filter(u => u.role === 'staff' || (u.role === 'admin' && u.email !== 'theskyaigiants@gmail.com'));
    
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <form onSubmit={handleInviteStaff} className="bg-white p-6 rounded-3xl shadow-lg border border-[#5A5A40]/10 sticky top-6">
              <h2 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Hire New Staff
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Email Address</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="staff@company.com"
                    className={inputClass} 
                    value={staffInviteData.email} 
                    onChange={e => setStaffInviteData({ ...staffInviteData, email: e.target.value })} 
                  />
                </div>
                <div>
                  <label className={labelClass}>Initial Role</label>
                  <select 
                    className={inputClass} 
                    value={staffInviteData.role} 
                    onChange={e => setStaffInviteData({ ...staffInviteData, role: e.target.value as any })}
                  >
                    <option value="staff">Staff Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-[10px] font-sans uppercase tracking-widest text-[#5A5A40] font-bold mb-3">Permissions</h3>
                  <div className="space-y-2">
                    <PermissionToggle 
                      label="Manage Banks" 
                      value={staffInviteData.permissions.canManageBanks} 
                      onChange={(v) => setStaffInviteData({ ...staffInviteData, permissions: { ...staffInviteData.permissions, canManageBanks: v } })} 
                    />
                    <PermissionToggle 
                      label="Manage Leads" 
                      value={staffInviteData.permissions.canManageLeads} 
                      onChange={(v) => setStaffInviteData({ ...staffInviteData, permissions: { ...staffInviteData.permissions, canManageLeads: v } })} 
                    />
                    <PermissionToggle 
                      label="Manage Users" 
                      value={staffInviteData.permissions.canManageUsers} 
                      onChange={(v) => setStaffInviteData({ ...staffInviteData, permissions: { ...staffInviteData.permissions, canManageUsers: v } })} 
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-[#5A5A40] text-white py-3 rounded-xl hover:bg-[#4A4A30] transition-all font-bold flex items-center justify-center gap-2 mt-4">
                  <ShieldCheck className="w-5 h-5" /> Authorize Staff
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {staffInvites.length > 0 && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100">
                <h3 className="text-sm font-sans uppercase tracking-widest text-orange-600 font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Pending Invitations
                </h3>
                <div className="space-y-3">
                  {staffInvites.map((invite, idx) => (
                    <div key={`invite-${invite.id}-${idx}`} className="flex items-center justify-between p-3 bg-orange-50/50 rounded-xl border border-orange-100">
                      <div>
                        <p className="font-bold text-sm">{invite.email}</p>
                        <p className="text-[10px] text-orange-600 uppercase tracking-widest">Role: {invite.role}</p>
                      </div>
                      <button onClick={() => setDeleteConfirmation({ id: invite.id, type: 'invite', name: invite.email })} className="p-2 text-red-600 hover:bg-red-100 rounded-full">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50">
                <h3 className="text-lg font-serif font-bold">Active Staff Members</h3>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5F5F0] text-[10px] font-sans uppercase tracking-widest text-[#5A5A40] font-bold">
                    <th className="p-4">Staff Member</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Permissions</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {activeStaff.map((s, idx) => (
                    <tr key={`staff-${s.uid}-${idx}`} className="border-t border-gray-50">
                      <td className="p-4">
                        <p className="font-bold">{s.displayName || 'Staff Member'}</p>
                        <p className="text-xs text-gray-400">{s.email}</p>
                      </td>
                      <td className="p-4">
                        <select 
                          className="bg-transparent border-b border-gray-100 font-bold text-xs"
                          value={s.role}
                          onChange={(e) => updateUserRole(s.uid, e.target.value as any)}
                        >
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <PermissionToggle 
                            label="Banks" 
                            value={s.permissions?.canManageBanks || false} 
                            onChange={(v) => updateUserPermission(s.uid, 'canManageBanks', v)} 
                          />
                          <PermissionToggle 
                            label="Leads" 
                            value={s.permissions?.canManageLeads || false} 
                            onChange={(v) => updateUserPermission(s.uid, 'canManageLeads', v)} 
                          />
                          <PermissionToggle 
                            label="Users" 
                            value={s.permissions?.canManageUsers || false} 
                            onChange={(v) => updateUserPermission(s.uid, 'canManageUsers', v)} 
                          />
                        </div>
                      </td>
                      <td className="p-4">
                        <button onClick={() => setDeleteConfirmation({ id: s.uid, type: 'staff', name: s.displayName || s.email })} className="p-2 text-red-600 hover:bg-red-50 rounded-full">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {activeStaff.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-400 italic">No staff members found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed bottom-8 left-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${
              toast.type === 'success' ? 'bg-white border-green-100 text-green-800' : 'bg-white border-red-100 text-red-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="font-bold text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-2xl font-serif font-bold mb-2">Are you sure?</h3>
                <p className="text-[#5A5A40] mb-8">
                  You are about to delete <span className="font-bold text-black">{deleteConfirmation.name}</span>. 
                  {deleteConfirmation.type === 'staff' ? ' This staff member will be demoted to a regular user.' : ' This action cannot be undone.'}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirmation(null)}
                    className="flex-1 px-6 py-3 rounded-xl border border-gray-200 font-bold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (deleteConfirmation.type === 'bank') handleDeleteOffer(deleteConfirmation.id);
                      else if (deleteConfirmation.type === 'invite') handleRemoveInvite(deleteConfirmation.id);
                      else if (deleteConfirmation.type === 'staff') handleRemoveStaff(deleteConfirmation.id);
                    }}
                    className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-h-[80vh] bg-[#F5F5F0] rounded-[40px] overflow-hidden border border-[#5A5A40]/10">
      {/* Sidebar */}
      <div className="w-64 bg-[#5A5A40] p-8 text-white flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8" />
          <h1 className="text-xl font-serif font-bold">Admin</h1>
        </div>
        
        <nav className="flex flex-col gap-2">
          <MenuButton active={activeView === 'dashboard'} onClick={() => { setActiveView('dashboard'); setSearchQuery(''); setUserLeadsFilter(null); }} icon={<LayoutDashboard />} label="Dashboard" />
          <MenuButton active={activeView === 'banks'} onClick={() => { setActiveView('banks'); setSearchQuery(''); setUserLeadsFilter(null); }} icon={<Building2 />} label="Bank Offers" />
          <MenuButton active={activeView === 'leads'} onClick={() => { setActiveView('leads'); setSearchQuery(''); }} icon={<FileText />} label="Loan Leads" />
          <MenuButton active={activeView === 'users'} onClick={() => { setActiveView('users'); setSearchQuery(''); setUserLeadsFilter(null); }} icon={<Users />} label="Loan Seekers" />
          <MenuButton active={activeView === 'staff'} onClick={() => { setActiveView('staff'); setSearchQuery(''); setUserLeadsFilter(null); }} icon={<ShieldCheck />} label="Staff Management" />
        </nav>

        <button 
          onClick={refreshData}
          disabled={isRefreshing}
          className="mt-4 flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-sans text-[10px] uppercase tracking-widest font-bold bg-white/10 hover:bg-white/20 text-white disabled:opacity-50"
        >
          <Activity className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
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

      {/* Main Content */}
      <div className="flex-1 p-10 overflow-y-auto max-h-[80vh]">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <div className="w-12 h-12 border-4 border-[#5A5A40] border-t-transparent rounded-full animate-spin absolute" />
            <p className="font-serif italic text-[#5A5A40] animate-pulse">Loading admin data...</p>
          </div>
        ) : (
          <>
            {isRefreshing && (
              <div className="fixed top-24 right-12 z-50 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-[#5A5A40]/10">
                <div className="w-3 h-3 border-2 border-[#5A5A40] border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-sans uppercase tracking-widest font-bold text-[#5A5A40]">Refreshing...</span>
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {activeView === 'dashboard' && renderDashboard()}
                {activeView === 'banks' && renderBanks()}
                {activeView === 'leads' && renderLeads()}
                {activeView === 'users' && renderUsers()}
                {activeView === 'staff' && renderStaff()}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
    </>
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

const PermissionToggle: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between group">
    <span className="text-[10px] text-gray-500 group-hover:text-[#5A5A40] transition-colors">{label}</span>
    <button 
      onClick={() => onChange(!value)}
      className={`w-8 h-4 rounded-full relative transition-all ${value ? 'bg-[#5A5A40]' : 'bg-gray-200'}`}
    >
      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${value ? 'left-4.5' : 'left-0.5'}`} />
    </button>
  </div>
);

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  active?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, active }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    emerald: 'bg-emerald-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
  };

  return (
    <div className={`p-6 rounded-3xl border-2 transition-all hover:shadow-lg flex items-center gap-4 ${active ? 'border-[#5A5A40] shadow-md scale-105' : 'border-transparent bg-white shadow-sm'}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${colorMap[color] || 'bg-gray-500'} shadow-lg`}>
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
      </div>
      <div>
        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{title}</p>
        <p className="text-2xl font-serif font-bold text-[#1a1a1a]">{value}</p>
      </div>
    </div>
  );
};
