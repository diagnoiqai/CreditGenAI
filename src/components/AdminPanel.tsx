import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import { useAdmin } from '../hooks/useAdmin';
import { AdminSidebar } from './admin/AdminSidebar';
import { MobileHeader } from './admin/MobileHeader';
import { DashboardView } from './admin/DashboardView';
import { BanksView } from './admin/BanksView';
import { LeadsView } from './admin/LeadsView';
import { UsersView } from './admin/UsersView';
import { StaffView } from './admin/StaffView';
import { StatusView } from './admin/StatusView';
import { UsageView } from './admin/UsageView';
import { LeadDetailsModal } from './admin/LeadDetailsModal';
import { UserEditModal } from './admin/UserEditModal';
import { DeleteConfirmationModal } from './admin/DeleteConfirmationModal';
import { RejectionModal } from './admin/RejectionModal';
import { Toast } from './admin/Toast';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPanelProps {
  profile: UserProfile | null;
  user: User | null;
  isStaff?: boolean;
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ profile, user, onLogout }) => {
  const admin = useAdmin(profile, user);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (admin.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#5A5A40] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#5A5A40] font-serif italic">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#F5F5F0] flex flex-col lg:flex-row overflow-hidden">
      <Toast toast={admin.toast} />
      
      <MobileHeader setIsMobileMenuOpen={setIsMobileMenuOpen} />
      
      <AdminSidebar 
        activeView={admin.activeView}
        setActiveView={admin.setActiveView}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        setSearchQuery={admin.setSearchQuery}
        setUserLeadsFilter={admin.setUserLeadsFilter}
        refreshData={admin.refreshData}
        isRefreshing={admin.isRefreshing}
        dbStatus={admin.dbStatus}
        onLogout={onLogout}
      />

      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={admin.activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {admin.activeView === 'dashboard' && (
              <DashboardView 
                analytics={admin.analytics} 
                setActiveView={admin.setActiveView}
                setLeadsStatusFilter={admin.setLeadsStatusFilter}
              />
            )}

            {admin.activeView === 'banks' && (
              <BanksView 
                offers={admin.offers}
                canManageBanks={admin.canManageBanks}
                formData={admin.formData}
                setFormData={admin.setFormData}
                editingId={admin.editingId}
                setEditingId={admin.setEditingId}
                handleSaveOffer={admin.handleSaveOffer}
                handleDeleteOffer={admin.handleDeleteOffer}
                exportBanksToExcel={admin.exportBanksToExcel}
                importBanksFromExcel={admin.importBanksFromExcel}
                isRefreshing={admin.isRefreshing}
                searchQuery={admin.searchQuery}
                setSearchQuery={admin.setSearchQuery}
                setDeleteConfirmation={admin.setDeleteConfirmation}
              />
            )}

            {admin.activeView === 'leads' && (
              <LeadsView 
                leads={admin.leads}
                users={admin.users}
                searchQuery={admin.searchQuery}
                setSearchQuery={admin.setSearchQuery}
                userLeadsFilter={admin.userLeadsFilter}
                setUserLeadsFilter={admin.setUserLeadsFilter}
                leadsStatusFilter={admin.leadsStatusFilter}
                setLeadsStatusFilter={admin.setLeadsStatusFilter}
                startDate={admin.startDate}
                setStartDate={admin.setStartDate}
                endDate={admin.endDate}
                setEndDate={admin.setEndDate}
                isWithinRange={admin.isWithinRange}
                setDetailsModal={admin.setDetailsModal}
                setDetailsForm={admin.setDetailsForm}
                setRejectionModal={admin.setRejectionModal}
                fetchHistory={admin.fetchHistory}
                leadsPage={admin.leadsPage}
                leadsPagination={admin.leadsPagination}
                nextLeadsPage={admin.nextLeadsPage}
                prevLeadsPage={admin.prevLeadsPage}
                goToLeadsPage={admin.goToLeadsPage}
              />
            )}

            {admin.activeView === 'users' && (
              <UsersView 
                users={admin.users}
                staffInvites={admin.staffInvites}
                searchQuery={admin.searchQuery}
                setSearchQuery={admin.setSearchQuery}
                startDate={admin.startDate}
                setStartDate={admin.setStartDate}
                endDate={admin.endDate}
                setEndDate={admin.setEndDate}
                isWithinRange={admin.isWithinRange}
                setEditingUser={admin.setEditingUser}
                setUserLeadsFilter={admin.setUserLeadsFilter}
                setActiveView={admin.setActiveView}
                usersPage={admin.usersPage}
                usersPagination={admin.usersPagination}
                nextUsersPage={admin.nextUsersPage}
                prevUsersPage={admin.prevUsersPage}
                goToUsersPage={admin.goToUsersPage}
              />
            )}

            {admin.activeView === 'staff' && (
              <StaffView 
                users={admin.users}
                staffInvites={admin.staffInvites}
                staffInviteData={admin.staffInviteData}
                setStaffInviteData={admin.setStaffInviteData}
                handleInviteStaff={admin.handleInviteStaff}
                updateUserRole={admin.updateUserRole}
                updateUserPermission={admin.updateUserPermission}
                setDeleteConfirmation={admin.setDeleteConfirmation}
              />
            )}

            {admin.activeView === 'status' && (
              <StatusView dbStatus={admin.dbStatus} />
            )}

            {admin.activeView === 'usage' && (
              <UsageView usageData={admin.usageData} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {admin.detailsModal && (
          <LeadDetailsModal 
            detailsModal={admin.detailsModal}
            setDetailsModal={admin.setDetailsModal}
            detailsForm={admin.detailsForm}
            setDetailsForm={admin.setDetailsForm}
            leadHistory={admin.leadHistory}
            loadingHistory={admin.loadingHistory}
            updateLeadStatus={admin.updateLeadStatus}
          />
        )}

        {admin.editingUser && (
          <UserEditModal 
            editingUser={admin.editingUser}
            setEditingUser={admin.setEditingUser}
            handleUpdateUser={admin.handleUpdateUser}
          />
        )}

        {admin.deleteConfirmation && (
          <DeleteConfirmationModal 
            deleteConfirmation={admin.deleteConfirmation}
            setDeleteConfirmation={admin.setDeleteConfirmation}
            handleDeleteOffer={admin.handleDeleteOffer}
            handleRemoveInvite={admin.handleRemoveInvite}
            handleRemoveStaff={admin.handleRemoveStaff}
          />
        )}

        {admin.rejectionModal && (
          <RejectionModal 
            rejectionModal={admin.rejectionModal}
            setRejectionModal={admin.setRejectionModal}
            updateLeadStatus={admin.updateLeadStatus}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
