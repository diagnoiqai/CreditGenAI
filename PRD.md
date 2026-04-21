# Product Requirements Document (PRD): CreditGenAI

## 1. Project Overview
**CreditGenAI** is an AI-powered personal loan marketplace designed to simplify and humanize the loan discovery process. By combining a semantic lead generation engine with a high-performance AI financial consultant (Gemini), CreditGenAI bridges the gap between complex banking criteria and end-user needs.

---

## 2. Target Audience
- **Retail Borrowers**: Salaried or self-employed individuals seeking personal loans.
- **Financial Advisors (Admins/Staff)**: Direct sales agents or portal managers who handle lead fulfillment and bank coordination.

---

## 3. Core Functional Requirements

### 3.1. User Onboarding & Identity
- **Guest Access**: Seamless landing-to-form flow without initial barrier.
- **OTP Verification**: Secure login via mobile OTP (One-Time Password) to verify high-intent leads.
- **Profile Persistence**: Normalized PostgreSQL schema saving progress for returning users.

### 3.2. Semantic Data Engine (The Funnel)
- **Multi-Step Form**: Intelligent collection of Employment, Financial, and Personal data.
- **Dynamic Validation**: Real-time validation for realistic financial ranges (e.g., CIBIL: 300-900, Loan: ₹50k - ₹5Cr).
- **Extension Schema**: Separated storage for Salaried vs. Self-Employed details (PostgreSQL `dev.user_salaried_details` and `dev.user_self_employed_details`).

### 3.3. AI Financial Consultant (The Conversationalist)
- **Direct-to-Chat**: Instant transition from form completion to a personalized AI consultation.
- **Top-3 Matching**: Automated backend scoring that identifies and presents the top 3 best-fit bank offers upon chat initiation.
- **Contextual Reasoning**: AI uses lead profile data (income, work exp, location) to justify bank recommendations with authoritative reasons.
- **Policy Engine**: Ability to search and interpret complex preclosure, repayment, and foreclosure policies for various banks through natural language.

### 3.4. Administrative CRM (The Backend)
- **Lead Oversight**: Centralized dashboard to track lead flow and conversion stages.
- **Status Management**: Ability to update application status (Processing, Approved, Rejected, etc.) with reason logging.
- **Bank Offer Management**: CRUD interface for managing 20+ bank lending criteria, including Excel import/export capability.
- **Role-Based Access Control (RBAC)**: Distinct permissions for Admin (Full Control) vs. Staff (Lead management).
- **System Monitoring**: Real-time status checks for database connectivity and API usage.

---

## 4. Technical Architecture
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion.
- **State Management**: React Context (Auth) + Custom Hooks (Journey, Chat, Admin).
- **Backend**: Express.js (Node.js).
- **Database**: PostgreSQL (Structured data & Vector search simulation).
- **AI**: Google Gemini Pro (Text reasoning & Parameter extraction).
- **Communications**: Twilio (WhatsApp) & NodeMailer (Email).

---

## 5. Success Metrics
- **Conversion Rate**: Percentage of landing page visitors who complete the lead form.
- **AI Engagement**: Average number of queries per user in the chat interface.
- **Time to List**: Speed at which user profile results in a "Top 3" match display.
- **Lead Quality**: Percentage of leads meeting bank-specific credit (CIBIL) minimums.

---

## 6. Future Roadmap
- **Document OCR**: Automated Aadhaar/PAN extraction via AI vision.
- **Pincode Intelligence**: Automatic city/state mapping based on pincode entries.
- **Direct Bank API Integration**: Bridge from consultant recommendation to real-time bank application submission.
