import { UserProfile, ChatMessage, LoanApplication, BankOffer, OTPResponse, VerificationResult } from '../types';

const API_BASE = '/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const handleResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!response.ok) {
    let errorMessage = 'An unexpected error occurred';
    if (isJson) {
      const errorData = await response.json().catch(() => ({}));
      errorMessage = errorData.error || errorMessage;
    } else {
      const text = await response.text().catch(() => '');
      console.error('Non-JSON Error Response:', text.substring(0, 200));
    }
    throw new ApiError(response.status, errorMessage);
  }

  if (!isJson) {
    const text = await response.text().catch(() => '');
    console.error('Expected JSON but received:', text.substring(0, 200));
    throw new ApiError(500, 'Server returned an invalid response format');
  }

  return response.json();
};

export const apiService = {
  // User Profile
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${API_BASE}/user/${uid}`);
      if (response.status === 404) return null;
      const data = await handleResponse(response);
      
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
        phone: data.phone,
        gender: data.gender,
        maritalStatus: data.marital_status,
        loanAmountRequired: Number(data.loan_amount_required),
        loanType: data.loan_type,
        role: data.role,
        permissions: data.permissions,
        formCompleted: data.form_completed,
        authMethod: data.auth_method,
        itrFiled: data.itr_filed,
        annualIncomeITR: Number(data.annual_income_itr),
        annualIncomeIdeal: Number(data.annual_income_ideal),
        yearsOfBusiness: data.years_of_business,
      };
    } catch (error) {
      console.error('API Error (getUserProfile):', error);
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
          phone: profile.phone,
          gender: profile.gender,
          marital_status: profile.maritalStatus,
          loan_amount_required: profile.loanAmountRequired,
          loan_type: profile.loanType,
          role: profile.role,
          permissions: profile.permissions,
          form_completed: profile.formCompleted,
          itr_filed: profile.itrFiled,
          annual_income_itr: profile.annualIncomeITR,
          annual_income_ideal: profile.annualIncomeIdeal,
          years_of_business: profile.yearsOfBusiness
        }),
      });
      await handleResponse(response);
      return true;
    } catch (error) {
      console.error('API Error (saveUserProfile):', error);
      return false;
    }
  },

  // Chat History
  async getChatHistory(uid: string): Promise<ChatMessage[]> {
    try {
      const response = await fetch(`${API_BASE}/chat/${uid}`);
      const data = await handleResponse(response);
      return data.messages || [];
    } catch (error) {
      console.error('API Error (getChatHistory):', error);
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
      await handleResponse(response);
      return true;
    } catch (error) {
      console.error('API Error (saveChatHistory):', error);
      return false;
    }
  },

  // Applications
  async getApplications(uid: string): Promise<LoanApplication[]> {
    try {
      const response = await fetch(`${API_BASE}/applications/${uid}`);
      const data = await handleResponse(response);
      return data.map((app: any) => ({
        id: app.id,
        uid: app.uid,
        bankId: app.bankId || app.bank_id,
        bankName: app.bankName || app.bank_name,
        loanAmount: Number(app.loanAmount || app.loan_amount),
        loanType: app.loanType || app.loan_type,
        status: app.status,
        subStatus: app.subStatus || app.sub_status,
        statusNotes: app.statusNotes || app.status_notes,
        rejectionReason: app.rejectionReason || app.rejection_reason,
        timestamp: app.timestamp || app.created_at,
        attachments: app.attachments?.map((att: any) => ({
          id: att.id,
          fileUrl: att.fileUrl || att.file_url,
          fileName: att.fileName || att.file_name,
          fileType: att.fileType || att.file_type,
          timestamp: att.timestamp || att.created_at,
        })),
      }));
    } catch (error) {
      console.error('API Error (getApplications):', error);
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
      return await handleResponse(response);
    } catch (error) {
      console.error('API Error (applyForLoan):', error);
      return { success: false, message: error instanceof ApiError ? error.message : 'Failed to connect to server.' };
    }
  },

  // Public: Bank Offers
  async getBankOffers(): Promise<BankOffer[]> {
    try {
      const response = await fetch(`${API_BASE}/bank-offers`);
      const data = await handleResponse(response);
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
        interestRateBelow750: Number(offer.interest_rate_below_750),
        maxAmountPercentBelow750: Number(offer.max_amount_percent_below_750),
        repaymentPolicy: offer.repayment_policy,
        preclosureCharges: offer.preclosure_charges,
        termsConditions: offer.terms_conditions,
        contactPerson: offer.contact_person,
        contactPhone: offer.contact_phone,
        contactEmail: offer.contact_email,
        minAge: offer.min_age,
        maxAge: offer.max_age,
        minNetSalaryTier1: offer.min_net_salary_tier1 ? Number(offer.min_net_salary_tier1) : undefined,
        minNetSalaryTier2: offer.min_net_salary_tier2 ? Number(offer.min_net_salary_tier2) : undefined,
        employmentType: offer.employment_type,
        minWorkExperience: offer.min_work_experience,
        salaryMode: offer.salary_mode,
        foirCap: offer.foir_cap ? Number(offer.foir_cap) : undefined,
        prepaymentCharges: offer.prepayment_charges,
        foreclosureCharges: offer.foreclosure_charges,
        timeToDisbursal: offer.time_to_disbursal,
        documentsRequired: offer.documents_required,
        stampDutyFee: offer.stamp_duty_fee,
        emiBounceCharges: offer.emi_bounce_charges,
        multiplier: offer.multiplier ? Number(offer.multiplier) : undefined,
        createdAt: offer.created_at
      }));
    } catch (error) {
      console.error('API Error (getBankOffers):', error);
      return [];
    }
  },

  // Admin: Bank Offers
  async getAdminBankOffers(): Promise<BankOffer[]> {
    try {
      const response = await fetch(`${API_BASE}/admin/bank-offers`);
      const data = await handleResponse(response);
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
        interestRateBelow750: Number(offer.interest_rate_below_750),
        maxAmountPercentBelow750: Number(offer.max_amount_percent_below_750),
        repaymentPolicy: offer.repayment_policy,
        preclosureCharges: offer.preclosure_charges,
        termsConditions: offer.terms_conditions,
        contactPerson: offer.contact_person,
        contactPhone: offer.contact_phone,
        contactEmail: offer.contact_email,
        minAge: offer.min_age,
        maxAge: offer.max_age,
        minNetSalaryTier1: offer.min_net_salary_tier1 ? Number(offer.min_net_salary_tier1) : undefined,
        minNetSalaryTier2: offer.min_net_salary_tier2 ? Number(offer.min_net_salary_tier2) : undefined,
        employmentType: offer.employment_type,
        minWorkExperience: offer.min_work_experience,
        salaryMode: offer.salary_mode,
        foirCap: offer.foir_cap ? Number(offer.foir_cap) : undefined,
        prepaymentCharges: offer.prepayment_charges,
        foreclosureCharges: offer.foreclosure_charges,
        timeToDisbursal: offer.time_to_disbursal,
        documentsRequired: offer.documents_required,
        stampDutyFee: offer.stamp_duty_fee,
        emiBounceCharges: offer.emi_bounce_charges,
        multiplier: offer.multiplier ? Number(offer.multiplier) : undefined,
        createdAt: offer.created_at
      }));
    } catch (error) {
      console.error('API Error (getAdminBankOffers):', error);
      return [];
    }
  },

  async createBankOffer(offer: Partial<BankOffer>): Promise<BankOffer | null> {
    try {
      const response = await fetch(`${API_BASE}/admin/bank-offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...offer,
          bankName: offer.bankName,
          loanType: offer.loanType,
          minAmount: offer.minAmount,
          maxAmount: offer.maxAmount,
          minInterestRate: offer.minInterestRate,
          maxInterestRate: offer.maxInterestRate,
          processingFee: offer.processingFee,
          minTenure: offer.minTenure,
          maxTenure: offer.maxTenure,
          minCibilScore: offer.minCibilScore,
          interestRateBelow750: offer.interestRateBelow750,
          maxAmountPercentBelow750: offer.maxAmountPercentBelow750,
          contactPerson: offer.contactPerson,
          contactPhone: offer.contactPhone,
          contactEmail: offer.contactEmail,
          repaymentPolicy: offer.repaymentPolicy,
          preclosureCharges: offer.preclosureCharges,
          termsConditions: offer.termsConditions,
          minAge: offer.minAge,
          maxAge: offer.maxAge,
          minNetSalaryTier1: offer.minNetSalaryTier1,
          minNetSalaryTier2: offer.minNetSalaryTier2,
          employmentType: offer.employmentType,
          minWorkExperience: offer.minWorkExperience,
          salaryMode: offer.salaryMode,
          foirCap: offer.foirCap,
          prepaymentCharges: offer.prepaymentCharges,
          foreclosureCharges: offer.foreclosureCharges,
          timeToDisbursal: offer.timeToDisbursal,
          documentsRequired: offer.documentsRequired,
          stampDutyFee: offer.stampDutyFee,
          emiBounceCharges: offer.emiBounceCharges,
          multiplier: offer.multiplier,
          policyVector: offer.policyVector
        })
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('API Error (createBankOffer):', error);
      return null;
    }
  },

  async updateBankOffer(id: string, offer: Partial<BankOffer>): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/admin/bank-offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...offer,
          id,
          bankName: offer.bankName,
          loanType: offer.loanType,
          minAmount: offer.minAmount,
          maxAmount: offer.maxAmount,
          minInterestRate: offer.minInterestRate,
          maxInterestRate: offer.maxInterestRate,
          processingFee: offer.processingFee,
          minTenure: offer.minTenure,
          maxTenure: offer.maxTenure,
          minCibilScore: offer.minCibilScore,
          interestRateBelow750: offer.interestRateBelow750,
          maxAmountPercentBelow750: offer.maxAmountPercentBelow750,
          contactPerson: offer.contactPerson,
          contactPhone: offer.contactPhone,
          contactEmail: offer.contactEmail,
          repaymentPolicy: offer.repaymentPolicy,
          preclosureCharges: offer.preclosureCharges,
          termsConditions: offer.termsConditions,
          minAge: offer.minAge,
          maxAge: offer.maxAge,
          minNetSalaryTier1: offer.minNetSalaryTier1,
          minNetSalaryTier2: offer.minNetSalaryTier2,
          employmentType: offer.employmentType,
          minWorkExperience: offer.minWorkExperience,
          salaryMode: offer.salaryMode,
          foirCap: offer.foirCap,
          prepaymentCharges: offer.prepaymentCharges,
          foreclosureCharges: offer.foreclosureCharges,
          timeToDisbursal: offer.timeToDisbursal,
          documentsRequired: offer.documentsRequired,
          stampDutyFee: offer.stampDutyFee,
          emiBounceCharges: offer.emiBounceCharges,
          multiplier: offer.multiplier,
          policyVector: offer.policyVector
        })
      });
      await handleResponse(response);
      return true;
    } catch (error) {
      console.error('API Error (updateBankOffer):', error);
      return false;
    }
  },

  async deleteBankOffer(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/admin/bank-offers/${id}`, {
        method: 'DELETE'
      });
      await handleResponse(response);
      return true;
    } catch (error) {
      console.error('API Error (deleteBankOffer):', error);
      return false;
    }
  },

  // Admin: Leads (Applications)
  async getLeads(page: number = 1, pageSize: number = 20): Promise<{data: LoanApplication[], pagination: any}> {
    try {
      const response = await fetch(`${API_BASE}/admin/leads?page=${page}&pageSize=${pageSize}`);
      const result = await handleResponse(response);
      
      return {
        data: result.data.map((app: any) => ({
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
        })),
        pagination: result.pagination
      };
    } catch (error) {
      console.error('API Error (getLeads):', error);
      return { data: [], pagination: { totalCount: 0, page: 1, pageSize: 20, totalPages: 0 } };
    }
  },

  async updateLeadStatus(id: string, status: string, rejectionReason?: string, subStatus?: string, statusNotes?: string, updatedBy?: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/admin/leads/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status, 
          rejectionReason: rejectionReason, 
          subStatus: subStatus, 
          statusNotes: statusNotes, 
          updatedBy 
        })
      });
      await handleResponse(response);
      return true;
    } catch (error) {
      console.error('API Error (updateLeadStatus):', error);
      return false;
    }
  },

  async getLeadHistory(id: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/admin/leads/${id}/history`);
      return await handleResponse(response);
    } catch (error) {
      console.error('API Error (getLeadHistory):', error);
      return [];
    }
  },

  // Admin: Users
  async getUsers(page: number = 1, pageSize: number = 20): Promise<{data: UserProfile[], pagination: any}> {
    try {
      const response = await fetch(`${API_BASE}/admin/users?page=${page}&pageSize=${pageSize}`);
      const result = await handleResponse(response);
      return {
        data: result.data.map((u: any) => ({
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
          phone: u.phone,
          gender: u.gender,
          maritalStatus: u.marital_status,
          loanAmountRequired: Number(u.loan_amount_required),
          loanType: u.loan_type,
          role: u.role,
          permissions: u.permissions,
          createdAt: u.created_at,
          lastSeen: u.last_seen
        })),
        pagination: result.pagination
      };
    } catch (error) {
      console.error('API Error (getUsers):', error);
      return { data: [], pagination: { totalCount: 0, page: 1, pageSize: 20, totalPages: 0 } };
    }
  },

  async updateUserRole(uid: string, role: string, permissions?: any): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/admin/users/${uid}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, permissions })
      });
      await handleResponse(response);
      return true;
    } catch (error) {
      console.error('API Error (updateUserRole):', error);
      return false;
    }
  },

  async updateUserPermissions(uid: string, permissions: any): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/admin/users/${uid}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions })
      });
      await handleResponse(response);
      return true;
    } catch (error) {
      console.error('API Error (updateUserPermissions):', error);
      return false;
    }
  },

  async updateUserProfile(uid: string, profile: Partial<UserProfile>): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          uid,
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
          phone: profile.phone,
          gender: profile.gender,
          marital_status: profile.maritalStatus,
          loan_amount_required: profile.loanAmountRequired,
          loan_type: profile.loanType,
          form_completed: profile.formCompleted,
          itr_filed: profile.itrFiled,
          annual_income_itr: profile.annualIncomeITR,
          annual_income_ideal: profile.annualIncomeIdeal,
          years_of_business: profile.yearsOfBusiness
        }),
      });
      await handleResponse(response);
      return true;
    } catch (error) {
      console.error('API Error (updateUserProfile):', error);
      return false;
    }
  },

  // Admin: Staff Management
  async getStaffInvites(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/admin/staff-invites`);
      return await handleResponse(response);
    } catch (error) {
      console.error('API Error (getStaffInvites):', error);
      return [];
    }
  },

  async inviteStaff(email: string, role: string, permissions: any, invitedBy: string): Promise<any | null> {
    try {
      const response = await fetch(`${API_BASE}/admin/staff-invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, permissions, invitedBy })
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('API Error (inviteStaff):', error);
      throw error;
    }
  },

  async deleteStaffInvite(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/admin/staff-invites/${id}`, {
        method: 'DELETE'
      });
      await handleResponse(response);
      return true;
    } catch (error) {
      console.error('API Error (deleteStaffInvite):', error);
      return false;
    }
  },

  async removeStaff(uid: string): Promise<boolean> {
    try {
      // Demote staff to regular user
      return await this.updateUserRole(uid, 'user', { canManageBanks: false, canManageLeads: false, canManageUsers: false });
    } catch (error) {
      console.error('API Error (removeStaff):', error);
      return false;
    }
  },

  // Admin: System Status & Analytics
  async getAdminAnalytics(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/admin/analytics`);
      return await handleResponse(response);
    } catch (error) {
      console.error('API Error (getAdminAnalytics):', error);
      return null;
    }
  },

  async getDbStatus(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/admin/status`);
      return await handleResponse(response);
    } catch (error) {
      console.error('API Error (getDbStatus):', error);
      return null;
    }
  },

  async getTokenUsage(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/admin/usage`);
      return await handleResponse(response);
    } catch (error) {
      console.error('API Error (getTokenUsage):', error);
      return null;
    }
  },

  // Dynamic Suggestions
  async getSuggestions(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/chat/suggestions`);
      return await handleResponse(response);
    } catch (error) {
      console.error('API Error (getSuggestions):', error);
      return [];
    }
  },

  async recordSuggestion(label: string, category?: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/chat/suggestions/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, category })
      });
      await handleResponse(response);
      return true;
    } catch (error) {
      console.error('API Error (recordSuggestion):', error);
      return false;
    }
  },

  // Policy Search
  async searchPolicies(query: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/policy-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('API Error (searchPolicies):', error);
      return [];
    }
  },

  // Auth
  async checkInvite(email: string): Promise<any | null> {
    try {
      const response = await fetch(`${API_BASE}/auth/check-invite/${email}`);
      if (response.status === 404) return null;
      return await handleResponse(response);
    } catch (error) {
      console.error('API Error (checkInvite):', error);
      return null;
    }
  },

  // Phone Auth
  async sendOTP(phone: string): Promise<OTPResponse> {
    try {
      const response = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      return await handleResponse(response);
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to send OTP' };
    }
  },

  async verifyOTP(phone: string, otp: string): Promise<VerificationResult> {
    try {
      const response = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      return await handleResponse(response);
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message || 'Verification failed',
        isExistingUser: false, 
        isNewUser: false, 
        formCompleted: false 
      };
    }
  }
};
