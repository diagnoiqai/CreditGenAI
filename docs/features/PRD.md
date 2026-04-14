# Product Requirement Document (PRD): CreditGenAI

## 1. Project Overview
**CreditGenAI** is an AI-powered financial assistant platform designed to simplify the personal loan application process. It combines a conversational AI interface with a robust backend for managing bank offers, user profiles, and loan applications.

---

## 2. User Personas
1.  **End User (Borrower)**: Seeks loan eligibility, compares offers, and applies for loans via an AI chat.
2.  **Admin**: Manages bank offers, reviews loan leads, manages users, and invites staff.
3.  **Staff**: Assists in managing leads and bank offers with restricted permissions.

---

## 3. Core Application Flows

### 3.1 Authentication & Onboarding
1.  **Landing Page**: Public-facing page showcasing features and "Get Started" options.
2.  **Login**: Secure Google Authentication (Popup-based).
3.  **Profile Check**:
    *   If a new user: Redirected to a 4-step **Loan Onboarding Form**.
    *   If an existing user: Redirected to the **AI Chat Interface**.
4.  **Onboarding Form Steps**:
    *   **Step 1: Loan Type**: Selection of loan category (Personal, Home, etc.).
    *   **Step 2: Employment**: Salary details, employment type, and company search.
    *   **Step 3: Financials**: Monthly income and existing EMIs.
    *   **Step 4: Personal**: Age, City (with suggestions), Gender, Marital Status, and CIBIL score.

### 3.2 User Chat & AI Interaction
1.  **Interface**: A clean, conversational UI with suggestion chips.
2.  **AI Context**: The AI (Gemini 3 Flash) is initialized with the user's full profile, active applications, and available bank offers.
3.  **Response Handling**:
    *   **Eligibility Check**: AI calculates eligibility based on FOIR, CIBIL, Age, and Salary.
    *   **Offer Comparison**: Displays a dynamic table of eligible banks with EMI calculations.
    *   **Policy Search**: Triggers a database search for specific bank terms (preclosure, foreclosure, etc.).
    *   **EMI Calculation**: Interactive calculator for custom loan scenarios.
4.  **Application Process**: Users can click "Apply" directly from the AI-generated offer table.

### 3.3 Admin Portal
1.  **Dashboard**: Real-time analytics on leads, users, and token usage.
2.  **Bank Management**:
    *   CRUD operations for bank offers.
    *   Bulk Import/Export via Excel.
    *   Policy details management (Repayment, Foreclosure, etc.).
3.  **Lead Management**:
    *   View all loan applications.
    *   Update status (Pending, Documents Received, Approved, Rejected).
    *   Add status notes and sub-statuses.
    *   View application history and attachments.
4.  **User & Staff Management**:
    *   Manage user profiles.
    *   Invite staff via email with granular permissions (Manage Banks, Leads, Users).
    *   Role escalation (User -> Staff -> Admin).

---

## 4. Business Rules for AI Assistant

### 4.1 Data Integrity
*   **Source of Truth**: The User Profile is the definitive source of truth.
*   **No Redundancy**: The AI is **forbidden** from asking for information already present in the user profile (Salary, City, Age, etc.).
*   **Missing Data**: The AI only requests fields explicitly marked as "Not provided" or "N/A".

### 4.2 Loan Eligibility Logic
*   **FOIR (Fixed Obligation to Income Ratio)**: Total EMIs (Existing + New) must not exceed the bank's FOIR cap (default 50%).
*   **CIBIL Score**: Minimum score requirements (usually 650-750).
*   **City Tiers**: Salary requirements vary by city (Tier 1 vs. Tier 2).
*   **Age Limits**: Must fall within the bank's Min/Max age range.
*   **Experience**: Minimum work experience requirements enforced.

### 4.3 Policy Queries
*   **Database First**: AI must search the internal database (`SEARCH_POLICIES`) for any bank-specific terms.
*   **No Hallucinations**: AI is strictly prohibited from using general knowledge or "typical" bank rates.
*   **Direct Answers**: For specific questions (e.g., "What are preclosure charges?"), the system provides a direct, natural language answer derived from the DB.

### 4.4 Application Restrictions
*   **Active Application Lock**: If a user has an active application, the AI blocks new eligibility checks and directs the user to check their current status.

---

## 5. Technical Architecture
*   **Frontend**: React, Tailwind CSS, Framer Motion (Lucide Icons).
*   **Backend**: Node.js (Express) with TypeScript.
*   **Database**: PostgreSQL (hosted on Cloud SQL) with `pgvector` for future semantic search.
*   **AI**: Google Gemini 3 Flash via `@google/genai`.
*   **Auth**: Firebase Authentication (Google Provider).

---

## 6. Security & Permissions
*   **Role-Based Access Control (RBAC)**:
    *   `admin`: Full access to all modules.
    *   `staff`: Restricted access based on assigned permissions.
    *   `user`: Access only to their own chat and applications.
*   **Data Protection**: PII is restricted to owners and authorized admins.
