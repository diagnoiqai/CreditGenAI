import { UserProfile, ChatMessage, LoanApplication, BankOffer } from '../types';

const API_BASE = '/api';

export const apiService = {
  // User Profile
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${API_BASE}/user/${uid}`);
      if (!response.ok) return null;
      const data = await response.json();
      // Map DB fields to UserProfile interface
      return {
        uid: data.uid,
        email: data.email,
        displayName: data.display_name,
        monthlyIncome: Number(data.monthly_income),
        employmentType: data.employment_type,
        companyType: data.company_type,
        companyName: data.company_name,
        workExperience: data.work_experience,
        totalExperience: data.total_experience,
        city: data.city,
        existingEMIs: Number(data.existing_emis),
        age: data.age,
        cibilScore: data.cibil_score,
        mobile: data.mobile,
        loanAmountRequired: Number(data.loan_amount_required),
        loanType: data.loan_type,
        role: data.role,
        permissions: data.permissions,
      };
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  },

  async saveUserProfile(profile: UserProfile): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: profile.uid,
          email: profile.email,
          display_name: profile.displayName,
          monthly_income: profile.monthlyIncome,
          employment_type: profile.employmentType,
          company_type: profile.companyType,
          company_name: profile.companyName,
          work_experience: profile.workExperience,
          total_experience: profile.totalExperience,
          city: profile.city,
          existing_emis: profile.existingEMIs,
          age: profile.age,
          cibil_score: profile.cibilScore,
          mobile: profile.mobile,
          loan_amount_required: profile.loanAmountRequired,
          loan_type: profile.loanType,
          role: profile.role,
          permissions: profile.permissions,
        }),
      });
      return response.ok;
    } catch (error) {
      console.error('API Error:', error);
      return false;
    }
  },

  // Chat History
  async getChatHistory(uid: string): Promise<ChatMessage[]> {
    try {
      const response = await fetch(`${API_BASE}/chat/${uid}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('API Error:', error);
      return [];
    }
  },

  async saveChatHistory(uid: string, messages: ChatMessage[]): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, messages }),
      });
      return response.ok;
    } catch (error) {
      console.error('API Error:', error);
      return false;
    }
  },

  // Applications
  async getApplications(uid: string): Promise<LoanApplication[]> {
    try {
      const response = await fetch(`${API_BASE}/applications/${uid}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.map((app: any) => ({
        id: app.id,
        uid: app.uid,
        bankId: app.bank_id,
        bankName: app.bank_name,
        loanAmount: Number(app.loan_amount),
        loanType: app.loan_type,
        status: app.status,
        subStatus: app.sub_status,
        statusNotes: app.status_notes,
        rejectionReason: app.rejection_reason,
        timestamp: app.timestamp || app.created_at,
        attachments: app.attachments?.map((att: any) => ({
          id: att.id,
          fileUrl: att.file_url,
          fileName: att.file_name,
          fileType: att.file_type,
          timestamp: att.created_at,
        })),
      }));
    } catch (error) {
      console.error('API Error:', error);
      return [];
    }
  },

  async applyForLoan(profile: UserProfile, bankOffer: BankOffer): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, bankOffer }),
      });
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, message: 'Failed to connect to server.' };
    }
  },

  // Public: Bank Offers
  async getBankOffers(): Promise<BankOffer[]> {
    try {
      const response = await fetch(`${API_BASE}/bank-offers`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.map((offer: any) => ({
        id: offer.id,
        bankName: offer.bank_name,
        loanType: offer.loan_type,
        minAmount: Number(offer.min_amount),
        maxAmount: Number(offer.max_amount),
        minInterestRate: Number(offer.min_interest_rate),
        maxInterestRate: Number(offer.max_interest_rate),
        processingFee: Number(offer.processing_fee),
        minTenure: Number(offer.min_tenure),
        maxTenure: Number(offer.max_tenure),
        minCibilScore: Number(offer.min_cibil_score),
        repaymentPolicy: offer.repayment_policy,
        preclosureCharges: offer.preclosure_charges,
        termsConditions: offer.terms_conditions,
        contactPerson: offer.contact_person,
        contactPhone: offer.contact_phone,
        contactEmail: offer.contact_email,
        createdAt: offer.created_at
      }));
    } catch (error) {
      console.error('API Error:', error);
      return [];
    }
  },

  // Admin: Bank Offers
  async getAdminBankOffers(): Promise<BankOffer[]> {
    try {
      const response = await fetch(`${API_BASE}/admin/bank-offers`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.map((offer: any) => ({
        id: offer.id,
        bankName: offer.bank_name,
        loanType: offer.loan_type,
        minAmount: Number(offer.min_amount),
        maxAmount: Number(offer.max_amount),
        minInterestRate: Number(offer.min_interest_rate),
        maxInterestRate: Number(offer.max_interest_rate),
        processingFee: Number(offer.processing_fee),
        minTenure: Number(offer.min_tenure),
        maxTenure: Number(offer.max_tenure),
        minCibilScore: Number(offer.min_cibil_score),
        repaymentPolicy: offer.repayment_policy,
        preclosureCharges: offer.preclosure_charges,
        termsConditions: offer.terms_conditions,
        contactPerson: offer.contact_person,
        contactPhone: offer.contact_phone,
        contactEmail: offer.contact_email,
        createdAt: offer.created_at
      }));
    } catch (error) {
      console.error('API Error:', error);
      return [];
    }
  },

  async saveBankOffer(offer: Partial<BankOffer>): Promise<BankOffer | null> {
    const response = await fetch(`${API_BASE}/admin/bank-offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offer)
    });
    if (!response.ok) return null;
    return response.json();
  },

  async deleteBankOffer(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE}/admin/bank-offers/${id}`, {
      method: 'DELETE'
    });
    return response.ok;
  },

  // Admin: Leads (Applications)
  async getLeads(limit: number = 100): Promise<LoanApplication[]> {
    try {
      const response = await fetch(`${API_BASE}/admin/leads?limit=${limit}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.map((app: any) => ({
        id: app.id,
        uid: app.uid,
        bankId: app.bank_id,
        bankName: app.bank_name,
        loanAmount: Number(app.loan_amount),
        loanType: app.loan_type,
        status: app.status,
        subStatus: app.sub_status,
        statusNotes: app.status_notes,
        rejectionReason: app.rejection_reason,
        timestamp: app.timestamp || app.created_at,
        userName: app.user_name,
        userEmail: app.user_email,
        userMobile: app.user_mobile,
        attachments: app.attachments?.map((att: any) => ({
          id: att.id,
          fileUrl: att.file_url,
          fileName: att.file_name,
          fileType: att.file_type,
          timestamp: att.created_at,
        })),
      }));
    } catch (error) {
      console.error('API Error:', error);
      return [];
    }
  },

  async updateLeadStatus(id: string, status: string, rejectionReason?: string, subStatus?: string, statusNotes?: string, updatedBy?: string): Promise<boolean> {
    const response = await fetch(`${API_BASE}/admin/leads/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, rejectionReason, subStatus, statusNotes, updatedBy })
    });
    return response.ok;
  },

  async getLeadHistory(id: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/admin/leads/${id}/history`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return [];
    }
  },

  // Admin: Users
  async getUsers(limit: number = 200): Promise<UserProfile[]> {
    try {
      const response = await fetch(`${API_BASE}/admin/users?limit=${limit}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.map((u: any) => ({
        uid: u.uid,
        email: u.email,
        displayName: u.display_name,
        monthlyIncome: Number(u.monthly_income),
        employmentType: u.employment_type,
        companyType: u.company_type,
        companyName: u.company_name,
        workExperience: u.work_experience,
        totalExperience: u.total_experience,
        city: u.city,
        existingEMIs: Number(u.existing_emis),
        age: u.age,
        cibilScore: u.cibil_score,
        mobile: u.mobile,
        loanAmountRequired: Number(u.loan_amount_required),
        loanType: u.loan_type,
        role: u.role,
        permissions: u.permissions,
        createdAt: u.created_at,
        lastSeen: u.last_seen
      }));
    } catch (error) {
      console.error('API Error:', error);
      return [];
    }
  },

  async updateUserRole(uid: string, role: string, permissions?: any): Promise<boolean> {
    const response = await fetch(`${API_BASE}/admin/users/${uid}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, permissions })
    });
    return response.ok;
  },

  async updateUserPermissions(uid: string, permissions: any): Promise<boolean> {
    const response = await fetch(`${API_BASE}/admin/users/${uid}/permissions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions })
    });
    return response.ok;
  },

  // Admin: Staff Invites
  async getStaffInvites(): Promise<any[]> {
    const response = await fetch(`${API_BASE}/admin/staff-invites`);
    if (!response.ok) return [];
    return response.json();
  },

  async saveStaffInvite(invite: any): Promise<any | null> {
    const response = await fetch(`${API_BASE}/admin/staff-invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invite)
    });
    if (!response.ok) return null;
    return response.json();
  },

  async deleteStaffInvite(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE}/admin/staff-invites/${id}`, {
      method: 'DELETE'
    });
    return response.ok;
  },

  // Dynamic Suggestions
  async getSuggestions(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/suggestions`);
      if (!response.ok) return [];
      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      return [];
    }
  },

  async recordSuggestion(label: string, category?: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/suggestions/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, category })
      });
      return response.ok;
    } catch (error) {
      console.error('API Error:', error);
      return false;
    }
  },

  // Policy Search (Vector)
  async searchPolicies(query: string, vector?: number[]): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/policy-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, vector })
      });
      if (!response.ok) return [];
      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      return [];
    }
  },

  // Auth
  async checkInvite(email: string): Promise<any | null> {
    try {
      const response = await fetch(`${API_BASE}/auth/check-invite/${email}`);
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  }
};
