import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '../services/apiService';
import { BankOffer, LoanApplication, UserProfile, StaffInvite } from '../types';
import { User } from 'firebase/auth';
import * as XLSX from 'xlsx';

export type AdminView = 'dashboard' | 'banks' | 'leads' | 'users' | 'staff' | 'status' | 'usage';

export const useAdmin = (userProfile: UserProfile | null, user: User | null) => {
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; type: 'bank' | 'invite' | 'staff'; name: string } | null>(null);

  // Data State
  const [offers, setOffers] = useState<BankOffer[]>([]);
  const [leads, setLeads] = useState<LoanApplication[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [staffInvites, setStaffInvites] = useState<StaffInvite[]>([]);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [usageData, setUsageData] = useState<any>(null);

  // Filters
  const [userLeadsFilter, setUserLeadsFilter] = useState<string | null>(null);
  const [leadsStatusFilter, setLeadsStatusFilter] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Pagination State
  const [leadsPage, setLeadsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [leadsPagination, setLeadsPagination] = useState({ totalCount: 0, totalPages: 0, page: 1, pageSize: 20 });
  const [usersPagination, setUsersPagination] = useState({ totalCount: 0, totalPages: 0, page: 1, pageSize: 20 });
  const leadsLimit = 20; // Default page size for leads
  const usersLimit = 20; // Default page size for users

  // Forms
  const [formData, setFormData] = useState<Partial<BankOffer>>({ loanType: 'Personal Loan' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [staffInviteData, setStaffInviteData] = useState({
    email: '',
    role: 'staff' as 'staff' | 'admin',
    permissions: { canManageBanks: false, canManageLeads: true, canManageUsers: false }
  });
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [detailsModal, setDetailsModal] = useState<LoanApplication | null>(null);
  const [detailsForm, setDetailsForm] = useState({ subStatus: '', statusNotes: '', newStatus: undefined as string | undefined });
  const [rejectionModal, setRejectionModal] = useState<{ id: string; reason: string } | null>(null);
  const [leadHistory, setLeadHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [o, l, u, i, s, a, usage] = await Promise.all([
        apiService.getBankOffers(),
        apiService.getLeads(leadsPage, leadsLimit),
        apiService.getUsers(usersPage, usersLimit),
        apiService.getStaffInvites(),
        apiService.getDbStatus(),
        apiService.getAdminAnalytics(),
        apiService.getTokenUsage()
      ]);
      setOffers(o);
      setLeads(l.data);
      setLeadsPagination(l.pagination);
      setUsers(u.data);
      setUsersPagination(u.pagination);
      setStaffInvites(i);
      setDbStatus(s);
      setAnalytics(a);
      setUsageData(usage);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [leadsPage, usersPage, leadsLimit, usersLimit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshData = () => fetchData(true);

  // Pagination Handlers
  const nextLeadsPage = () => {
    if (leadsPage < leadsPagination.totalPages) setLeadsPage(prev => prev + 1);
  };
  const prevLeadsPage = () => {
    if (leadsPage > 1) setLeadsPage(prev => prev - 1);
  };
  const goToLeadsPage = (page: number) => {
    if (page >= 1 && page <= leadsPagination.totalPages) setLeadsPage(page);
  };

  const nextUsersPage = () => {
    if (usersPage < usersPagination.totalPages) setUsersPage(prev => prev + 1);
  };
  const prevUsersPage = () => {
    if (usersPage > 1) setUsersPage(prev => prev - 1);
  };
  const goToUsersPage = (page: number) => {
    if (page >= 1 && page <= usersPagination.totalPages) setUsersPage(page);
  };

  // Bank Offer Actions
  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = { ...formData };

      if (editingId) {
        await apiService.updateBankOffer(editingId, dataToSave);
        showToast('Bank offer updated successfully');
      } else {
        await apiService.createBankOffer(dataToSave as BankOffer);
        showToast('New bank offer created');
      }
      setEditingId(null);
      setFormData({ loanType: 'Personal Loan' });
      refreshData();
    } catch (error) {
      showToast('Failed to save offer', 'error');
    }
  };

  const handleDeleteOffer = async (id: string) => {
    try {
      await apiService.deleteBankOffer(id);
      showToast('Bank offer deleted');
      setDeleteConfirmation(null);
      refreshData();
    } catch (error) {
      showToast('Failed to delete offer', 'error');
    }
  };

  // Staff Actions
  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.inviteStaff(staffInviteData.email, staffInviteData.role, staffInviteData.permissions, userProfile?.uid || '');
      showToast(`Invitation sent to ${staffInviteData.email}`);
      setStaffInviteData({ email: '', role: 'staff', permissions: { canManageBanks: false, canManageLeads: true, canManageUsers: false } });
      refreshData();
    } catch (error: any) {
      showToast(error.message || 'Failed to send invitation', 'error');
    }
  };

  const handleRemoveInvite = async (id: string) => {
    try {
      await apiService.deleteStaffInvite(id);
      showToast('Invitation revoked');
      setDeleteConfirmation(null);
      refreshData();
    } catch (error) {
      showToast('Failed to revoke invitation', 'error');
    }
  };

  const handleRemoveStaff = async (uid: string) => {
    try {
      await apiService.removeStaff(uid);
      showToast('Staff member removed');
      setDeleteConfirmation(null);
      refreshData();
    } catch (error) {
      showToast('Failed to remove staff', 'error');
    }
  };

  const updateUserRole = async (uid: string, role: 'staff' | 'admin') => {
    try {
      await apiService.updateUserRole(uid, role);
      showToast('User role updated');
      refreshData();
    } catch (error) {
      showToast('Failed to update role', 'error');
    }
  };

  const updateUserPermission = async (uid: string, permission: string, value: boolean) => {
    try {
      const user = users.find(u => u.uid === uid);
      if (!user) return;
      const newPermissions = { ...(user.permissions || { canManageBanks: false, canManageLeads: true, canManageUsers: false }), [permission]: value };
      await apiService.updateUserPermissions(uid, newPermissions);
      showToast('Permissions updated');
      refreshData();
    } catch (error) {
      showToast('Failed to update permissions', 'error');
    }
  };

  // Lead Actions
  const updateLeadStatus = async (id: string, status: string, rejectionReason?: string, subStatus?: string, statusNotes?: string) => {
    try {
      await apiService.updateLeadStatus(id, status, rejectionReason, subStatus, statusNotes, userProfile?.displayName || userProfile?.email);
      showToast(`Application marked as ${status}`);
      setDetailsModal(null);
      setRejectionModal(null);
      refreshData();
    } catch (error) {
      showToast('Failed to update status', 'error');
    }
  };

  const fetchHistory = async (leadId: string) => {
    setLoadingHistory(true);
    try {
      const history = await apiService.getLeadHistory(leadId);
      setLeadHistory(history);
    } catch (error) {
      console.error('Failed to fetch lead history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // User Actions
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await apiService.updateUserProfile(editingUser.uid, editingUser);
      showToast('User profile updated');
      setEditingUser(null);
      refreshData();
    } catch (error) {
      showToast('Failed to update user', 'error');
    }
  };

  // Excel Actions
  const exportBanksToExcel = () => {
    const data = offers.map(o => ({
      'Bank Name': o.bankName,
      'Loan Type': o.loanType,
      'Min Amount': o.minAmount,
      'Max Amount': o.maxAmount,
      'Min Interest Rate (%)': o.minInterestRate,
      'Max Interest Rate (%)': o.maxInterestRate,
      'Processing Fee (%)': o.processingFee,
      'Min Tenure (Mo)': o.minTenure,
      'Max Tenure (Mo)': o.maxTenure,
      'Min CIBIL Score': o.minCibilScore,
      'Min Age': o.minAge,
      'Max Age': o.maxAge,
      'Min Net Salary (Tier 1)': o.minNetSalaryTier1,
      'Min Net Salary (Tier 2)': o.minNetSalaryTier2,
      'Employment Type': o.employmentType,
      'Min Work Experience': o.minWorkExperience,
      'Salary Mode': o.salaryMode,
      'FOIR Cap (%)': o.foirCap,
      'Prepayment Charges': o.prepaymentCharges,
      'Foreclosure Charges': o.foreclosureCharges,
      'Time to Disbursal': o.timeToDisbursal,
      'Documents Required': o.documentsRequired,
      'Stamp Duty Fee': o.stampDutyFee,
      'EMI Bounce Charges': o.emiBounceCharges,
      'Multiplier': o.multiplier,
      'Contact Person': o.contactPerson,
      'Contact Phone': o.contactPhone,
      'Contact Email': o.contactEmail,
      'Repayment Policy': o.repaymentPolicy,
      'Terms & Conditions': o.termsConditions
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bank Offers');
    XLSX.writeFile(wb, 'Bank_Offers_Export.xlsx');
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
        const data = XLSX.utils.sheet_to_json(ws);
        
        showToast(`Importing ${data.length} bank offers...`);
        for (const row of data as any[]) {
          const offer: Partial<BankOffer> = {
            bankName: row['Bank Name'],
            loanType: row['Loan Type'] || 'Personal Loan',
            minAmount: Number(row['Min Amount']),
            maxAmount: Number(row['Max Amount']),
            minInterestRate: Number(row['Min Interest Rate (%)']),
            maxInterestRate: Number(row['Max Interest Rate (%)']),
            processingFee: Number(row['Processing Fee (%)']),
            minTenure: Number(row['Min Tenure (Mo)']),
            maxTenure: Number(row['Max Tenure (Mo)']),
            minCibilScore: Number(row['Min CIBIL Score']),
            minAge: row['Min Age'] ? Number(row['Min Age']) : undefined,
            maxAge: row['Max Age'] ? Number(row['Max Age']) : undefined,
            minNetSalaryTier1: row['Min Net Salary (Tier 1)'] ? Number(row['Min Net Salary (Tier 1)']) : undefined,
            minNetSalaryTier2: row['Min Net Salary (Tier 2)'] ? Number(row['Min Net Salary (Tier 2)']) : undefined,
            employmentType: row['Employment Type'],
            minWorkExperience: row['Min Work Experience'],
            salaryMode: row['Salary Mode'],
            foirCap: row['FOIR Cap (%)'] ? Number(row['FOIR Cap (%)']) : undefined,
            prepaymentCharges: row['Prepayment Charges'],
            foreclosureCharges: row['Foreclosure Charges'],
            timeToDisbursal: row['Time to Disbursal'],
            documentsRequired: row['Documents Required'],
            stampDutyFee: row['Stamp Duty Fee'],
            emiBounceCharges: row['EMI Bounce Charges'],
            multiplier: row['Multiplier'] ? Number(row['Multiplier']) : undefined,
            contactPerson: row['Contact Person'],
            contactPhone: String(row['Contact Phone'] || ''),
            contactEmail: row['Contact Email'],
            repaymentPolicy: row['Repayment Policy'],
            termsConditions: row['Terms & Conditions']
          };
          
          await apiService.createBankOffer(offer as BankOffer);
        }
        showToast('Import completed successfully');
        refreshData();
      } catch (error) {
        console.error('Import error:', error);
        showToast('Failed to import data', 'error');
      }
    };
    reader.readAsBinaryString(file);
  };

  const isWithinRange = (dateStr: string | undefined) => {
    if (!dateStr || !startDate || !endDate) return true;
    const date = new Date(dateStr);
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return date >= start && date <= end;
  };

  const isSuperAdmin = userProfile?.email === 'theskyaigiants@gmail.com' || user?.email === 'theskyaigiants@gmail.com';
  const canManageBanks = userProfile?.permissions?.canManageBanks || userProfile?.role === 'admin' || isSuperAdmin;
  const canManageLeads = userProfile?.permissions?.canManageLeads || userProfile?.role === 'admin' || isSuperAdmin;
  const canManageUsers = userProfile?.permissions?.canManageUsers || userProfile?.role === 'admin' || isSuperAdmin;

  return {
    activeView, setActiveView,
    searchQuery, setSearchQuery,
    isLoading, isRefreshing,
    toast, deleteConfirmation, setDeleteConfirmation,
    offers, leads, users, staffInvites, dbStatus, analytics, usageData,
    userLeadsFilter, setUserLeadsFilter,
    leadsStatusFilter, setLeadsStatusFilter,
    startDate, setStartDate,
    endDate, setEndDate,
    leadsPage, setLeadsPage,
    usersPage, setUsersPage,
    leadsPagination, usersPagination,
    nextLeadsPage, prevLeadsPage, goToLeadsPage,
    nextUsersPage, prevUsersPage, goToUsersPage,
    formData, setFormData,
    editingId, setEditingId,
    staffInviteData, setStaffInviteData,
    editingUser, setEditingUser,
    detailsModal, setDetailsModal,
    detailsForm, setDetailsForm,
    rejectionModal, setRejectionModal,
    leadHistory, loadingHistory,
    refreshData,
    handleSaveOffer, handleDeleteOffer,
    handleInviteStaff, handleRemoveInvite, handleRemoveStaff,
    updateUserRole, updateUserPermission,
    updateLeadStatus, fetchHistory,
    handleUpdateUser,
    exportBanksToExcel, importBanksFromExcel,
    isWithinRange,
    canManageBanks, canManageLeads, canManageUsers, isSuperAdmin
  };
};
