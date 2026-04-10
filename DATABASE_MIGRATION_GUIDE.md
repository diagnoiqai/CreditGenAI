# Database Migration Guide - Production-Ready Updates

## Overview
This document outlines **mandatory database schema changes** required to transition your CreditGenAI application from a "marketplace browse" mode to a production-ready "bank lead marketplace."

> ⚠️ **CRITICAL**: Database changes are **permanent**. Follow all precautions before proceeding.

---

## 📋 Mandatory Changes Required

### 1. **Type Consistency & Foreign Keys**

#### Problem
- `bank_id` is UUID in `dev.bank_offers` but TEXT in `dev.applications`
- No foreign key relationships = loose data integrity
- Orphaned records possible when bank is deleted

#### Solution
```sql
-- Standardize bank_id type
ALTER TABLE dev.applications 
ALTER COLUMN bank_id TYPE UUID USING bank_id::uuid;

-- Add Foreign Key Constraints
ALTER TABLE dev.applications 
ADD CONSTRAINT fk_app_user 
FOREIGN KEY (uid) REFERENCES dev.users(uid) ON DELETE CASCADE;

ALTER TABLE dev.applications 
ADD CONSTRAINT fk_app_bank 
FOREIGN KEY (bank_id) REFERENCES dev.bank_offers(id) ON DELETE CASCADE;

ALTER TABLE dev.chat_sessions 
ADD CONSTRAINT fk_chat_user 
FOREIGN KEY (uid) REFERENCES dev.users(uid) ON DELETE CASCADE;
```

---

### 2. **Missing Application Columns** ⭐ **HIGH PRIORITY**

#### Problem
When you pass leads to banks, they ask for:
- What loan duration is the user applying for?
- What interest rate was offered?
- What's the monthly EMI amount?
- What's the exact processing fee charged?

Currently, this data is **NOT stored** in your applications table.

#### Solution - Add 4 Required Columns
```sql
ALTER TABLE dev.applications 
ADD COLUMN IF NOT EXISTS tenure_months INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS interest_rate NUMERIC(5,2) DEFAULT 9.99,
ADD COLUMN IF NOT EXISTS emi_amount NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS processing_fee_amount NUMERIC(15,2) DEFAULT 0;

-- Add NOT NULL constraints with sensible defaults
ALTER TABLE dev.applications 
ALTER COLUMN tenure_months SET NOT NULL,
ALTER COLUMN interest_rate SET NOT NULL,
ALTER COLUMN emi_amount SET NOT NULL,
ALTER COLUMN processing_fee_amount SET NOT NULL;
```

#### What Each Field Means
| Column | Purpose | Example |
|--------|---------|---------|
| `tenure_months` | Loan duration user selected | 60 months (5 years) |
| `interest_rate` | Rate offered at application time | 9.99% |
| `emi_amount` | Monthly installment calculated | ₹15,420 |
| `processing_fee_amount` | Upfront fee charged (in ₹) | ₹5,000 |

---

### 3. **Missing User Profile Columns** ⭐ **HIGH PRIORITY**

#### Problem
Indian banks use a "Tier-based" eligibility system that requires:
- **What kind of house?** (determines financial stability)
- **Which bank's salary account?** (some banks offer loyalty discounts)
- **PAN verified?** (essential for credit checks)

Currently missing from `dev.users`.

#### Solution - Add 3 Required Columns
```sql
ALTER TABLE dev.users 
ADD COLUMN IF NOT EXISTS residence_type TEXT CHECK (residence_type IN ('Owned', 'Rented', 'Company Provided')),
ADD COLUMN IF NOT EXISTS salary_bank TEXT,
ADD COLUMN IF NOT EXISTS pan_status BOOLEAN DEFAULT false;
```

#### What Each Field Means
| Column | Purpose | Example | Impact |
|--------|---------|---------|--------|
| `residence_type` | Housing status | "Owned" | Owned homes = higher FOIR score |
| `salary_bank` | Salary account bank | "HDFC" | HDFC salary holders get better HDFC rates |
| `pan_status` | PAN verified? | true/false | Required for CIBIL integration |

---

### 4. **Data Integrity Constraints (Enums)**

#### Problem
Without constraints, data becomes "dirty":
- Status might be "pending" (lowercase), "Pending", "PENDING", or "Approved" (wrong value)
- AI advisor breaks because logic expects exact values

#### Solution - Add CHECK Constraints
```sql
-- Restrict application status values
ALTER TABLE dev.applications 
DROP CONSTRAINT IF EXISTS check_status,
ADD CONSTRAINT check_status 
CHECK (status IN ('Pending', 'Contacted', 'Approved', 'Rejected'));

-- Restrict employment type values
ALTER TABLE dev.users 
DROP CONSTRAINT IF EXISTS check_employment,
ADD CONSTRAINT check_employment 
CHECK (employment_type IN ('Salaried', 'Self-employed'));

-- Restrict loan type values (must match bank_offers offerings)
ALTER TABLE dev.users 
DROP CONSTRAINT IF EXISTS check_loan_type,
ADD CONSTRAINT check_loan_type 
CHECK (loan_type IN ('Personal Loan', 'Home Loan', 'Car Loan', 'Business Loan', 'Jewelry Loan'));
```

---

### 5. **Document Management Enhancement**

#### Problem
Current `dev.application_attachments` stores:
- File name, MIME type, URL

But doesn't specify **WHAT** document it is:
- Is it PAN? Salary slip? Aadhaar? Bank statement?

This breaks automated document verification workflows.

#### Solution
```sql
ALTER TABLE dev.application_attachments 
ADD COLUMN IF NOT EXISTS document_type TEXT 
CHECK (document_type IN ('PAN', 'Aadhaar', 'Salary Slip', 'Bank Statement', 'ITR', 'Driving License', 'Other'));
```

---

## ✅ Precautions BEFORE Making Changes

### Step 1: Backup Your Database (Required)
```
Supabase Dashboard → Database → Backups → Create Backup
OR
SQL Editor → Run: SELECT * FROM dev.users; → Export as CSV
```
**Do this for ALL tables**: users, applications, bank_offers, chat_sessions, application_attachments

### Step 2: Verify Your Setup
- [ ] DATABASE_URL is correct in `.env`
- [ ] You have **Owner/Superuser** permissions on DB
- [ ] No active users on the live app (maintenance mode)
- [ ] You're working on **dev/test DB**, not production

### Step 3: Test on Empty Data
Before running on your actual data:
1. Create a test database with same schema
2. Run the migration scripts there first
3. Verify no errors occur

### Step 4: Record Current Schema
```sql
-- Run this and save the output
\d dev.users;
\d dev.applications;
\d dev.bank_offers;
\d dev.chat_sessions;
\d dev.application_attachments;
```

---

## 🚀 Safe Migration Strategy

### Key Principle: **"Expand and Contract"**

We will NOT delete, drop, or truncate anything. Instead:

1. **ADD** new columns safely
2. **MIGRATE** existing data without loss
3. **ADD** constraints gradually
4. **VALIDATE** before final cleanup

### Syntax Rules for Safety

#### ✅ **SAFE** - What I Will Use
```sql
-- Only adds, never removes
ALTER TABLE dev.applications ADD COLUMN IF NOT EXISTS tenure_months INTEGER;

-- Conversion with USING clause (zero data loss)
ALTER TABLE dev.applications 
ALTER COLUMN bank_id TYPE UUID USING bank_id::uuid;

-- Transactional safety
BEGIN;
  -- multiple statements
COMMIT;
```

#### ❌ **NEVER** - What I Won't Do
```sql
DROP TABLE ...;           -- Never
TRUNCATE ...;             -- Never
DELETE FROM ...;          -- Never (without data migration)
ALTER TABLE ... DROP COLUMN ...; -- Never
```

---

## 📊 Execution Plan

### Phase 1: Preparation (You do this)
- [ ] Create Supabase backup
- [ ] Export all table data as CSV (keep safely)
- [ ] Verify DB permissions
- [ ] Put app in maintenance mode (notify users if needed)

### Phase 2: Schema Migration (I do this)
- [ ] Read current `src/db/init.ts`
- [ ] Add migration blocks for all 5 changes
- [ ] Wrap in transaction + try-catch blocks
- [ ] Include rollback logic

### Phase 3: Validation (You do this)
- [ ] Restart dev server
- [ ] Check for any error logs
- [ ] Run test queries
- [ ] Verify UI still works

### Phase 4: Data Verification (You do this)
```sql
-- Run these to verify changes worked:
SELECT * FROM dev.applications LIMIT 1;
SELECT * FROM dev.users LIMIT 1;
\d dev.applications  -- Check schema
\d dev.users         -- Check schema
```

### Phase 5: Cleanup (Optional)
Once validated:
- [ ] Remove old backup files (keep one final backup)
- [ ] Update documentation
- [ ] Update TypeScript types in `src/types.ts`

---

## 🔄 Rollback Strategy (If Something Fails)

### Scenario 1: Error During Execution
**Status**: Migration partially applied

**Recovery**:
```sql
-- Restore from backup in Supabase Dashboard
-- Takes ~5 minutes
-- OR revert init.ts and restart server
```

### Scenario 2: Constraint Violation
**Error**: "Foreign key violation" or "CHECK constraint failed"

**Recovery**:
```sql
-- Find bad data
SELECT * FROM dev.applications WHERE bank_id NOT IN (SELECT id FROM dev.bank_offers);

-- Fix it manually or remove it
DELETE FROM dev.applications WHERE bank_id NOT IN (SELECT id FROM dev.bank_offers);

-- Re-run migration
```

### Scenario 3: Type Mismatch
**Error**: Cannot convert bank_id to UUID

**Recovery**:
```sql
-- Check current data
SELECT bank_id, pg_typeof(bank_id) FROM dev.applications LIMIT 5;

-- If data is corrupted, restore backup and try again
```

---

## 📝 TypeScript Updates (After DB Changes)

After migration, update `src/types.ts`:

```typescript
// OLD
interface LoanApplication {
  id: string;
  bankId: string;  // Used to be loose
  bankName: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

// NEW
interface LoanApplication {
  id: string;
  bankId: UUID;  // Now strictly typed
  bankName: string;
  status: 'Pending' | 'Contacted' | 'Approved' | 'Rejected';
  tenureMonths: number;  // NEW
  interestRate: number;  // NEW
  emiAmount: number;     // NEW
  processingFeeAmount: number;  // NEW
}

interface UserProfile {
  // ... existing fields
  residenceType?: 'Owned' | 'Rented' | 'Company Provided';  // NEW
  salaryBank?: string;  // NEW
  panStatus?: boolean;  // NEW
}
```

---

## ⏱️ Timeline

| Phase | Duration | Who |
|-------|----------|-----|
| Backup & Precautions | 10 min | You |
| Migration Script Review | 15 min | You (review my code) |
| Execution | 2-5 min | Automatic (init.ts runs on server restart) |
| Validation | 10 min | You (run test queries) |
| TypeScript Updates | 10 min | Me (I'll update types.ts) |
| **Total** | **~1 hour** | - |

---

## 🛑 When to STOP & Ask for Help

Stop the migration if:
- Database URL is not verified ✓
- You don't have backups ✓
- Current database has >1M rows (might be slow) ✓
- Foreign key violations occur (indicates data inconsistency)
- You see error: "Permission denied for schema dev"

---

## ✨ Summary of What You Get

After this migration, your database will:

✅ Have **zero data loss**  
✅ Support **bank lead exports** with complete application details  
✅ Enforce **data quality** via constraints  
✅ Enable **Tier-1/Tier-2 eligibility** calculations  
✅ Preplan for **document verification** automation  
✅ Be **production-ready** for scaling  

---

## 🎯 Next Steps

1. **Read this document completely**
2. **Create backups** (non-negotiable)
3. **Verify precautions** (all checkboxes)
4. **Reply: "I'm ready to proceed"**
5. I will generate the exact migration SQL
6. You review it
7. Run: `npm run dev` (triggers `initDb()`)
8. Validate & celebrate! 🎉

