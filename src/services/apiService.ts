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
        status: app.status,
        timestamp: app.created_at,
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
    const response = await fetch(`${API_BASE}/bank-offers`);
    if (!response.ok) return [];
    return response.json();
  },

  // Admin: Bank Offers
  async getAdminBankOffers(): Promise<BankOffer[]> {
    const response = await fetch(`${API_BASE}/admin/bank-offers`);
    if (!response.ok) return [];
    return response.json();
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
    const response = await fetch(`${API_BASE}/admin/leads?limit=${limit}`);
    if (!response.ok) return [];
    return response.json();
  },

  async updateLeadStatus(id: string, status: string, rejectionReason?: string): Promise<boolean> {
    const response = await fetch(`${API_BASE}/admin/leads/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, rejectionReason })
    });
    return response.ok;
  },

  // Admin: Users
  async getUsers(limit: number = 200): Promise<UserProfile[]> {
    const response = await fetch(`${API_BASE}/admin/users?limit=${limit}`);
    if (!response.ok) return [];
    return response.json();
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
  }
};
