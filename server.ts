import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database Connection
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase.co') || process.env.DATABASE_URL?.includes('neon.tech') 
    ? { rejectUnauthorized: false } 
    : false,
  max: 20, // Increase max connections for better performance
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Database Initialization and Indexing
const initDb = async () => {
  console.log('INFO: Initializing database...');
  if (!process.env.DATABASE_URL) {
    console.warn('WARNING: DATABASE_URL is not defined. Database features will not work.');
    return;
  }
  try {
    const client = await pool.connect();
    console.log('INFO: Database client connected.');
    try {
      console.log('SUCCESS: Connected to PostgreSQL database. Running migrations...');
      
      console.log('INFO: Initializing database schema...');
      // Ensure schema exists
      await client.query('CREATE SCHEMA IF NOT EXISTS dev');
      
      // Try to enable pgvector
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS vector');
        console.log('SUCCESS: pgvector extension enabled.');
      } catch (e) {
        console.warn('WARNING: pgvector extension could not be enabled. Falling back to text search.', e);
      }
      
      // Create tables if they don't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS dev.users (
          uid TEXT PRIMARY KEY,
          email TEXT,
          display_name TEXT,
          monthly_income NUMERIC,
          employment_type TEXT,
          company_type TEXT,
          company_name TEXT,
          work_experience TEXT,
          total_experience TEXT,
          city TEXT,
          existing_emis NUMERIC,
          age INTEGER,
          loan_amount_required NUMERIC,
          loan_type TEXT,
          cibil_score INTEGER,
          mobile TEXT,
          role TEXT DEFAULT 'user',
          permissions JSONB DEFAULT '[]',
          last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS dev.chat_sessions (
          uid TEXT PRIMARY KEY,
          messages JSONB,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS dev.bank_offers (
          id SERIAL PRIMARY KEY,
          bank_name TEXT,
          loan_type TEXT,
          min_amount NUMERIC,
          max_amount NUMERIC,
          min_interest_rate NUMERIC,
          max_interest_rate NUMERIC,
          processing_fee NUMERIC,
          min_tenure INTEGER,
          max_tenure INTEGER,
          min_cibil_score INTEGER,
          interest_rate_below_750 NUMERIC,
          max_amount_percent_below_750 NUMERIC,
          min_income NUMERIC,
          contact_person TEXT,
          contact_phone TEXT,
          contact_email TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Add missing columns to bank_offers if they don't exist
      const bankOffersCols = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'dev' AND table_name = 'bank_offers'
      `);
      const existingBankCols = bankOffersCols.rows.map(r => r.column_name);
      
      if (!existingBankCols.includes('repayment_policy')) {
        await client.query('ALTER TABLE dev.bank_offers ADD COLUMN repayment_policy TEXT');
      }
      if (!existingBankCols.includes('preclosure_charges')) {
        await client.query('ALTER TABLE dev.bank_offers ADD COLUMN preclosure_charges TEXT');
      }
      if (!existingBankCols.includes('terms_conditions')) {
        await client.query('ALTER TABLE dev.bank_offers ADD COLUMN terms_conditions TEXT');
      }
      if (!existingBankCols.includes('policy_vector')) {
        try {
          await client.query('ALTER TABLE dev.bank_offers ADD COLUMN policy_vector vector(1536)');
        } catch (e) {
          console.warn('Could not add policy_vector column. pgvector might not be enabled.');
        }
      }

      // Seed bank offers if table is empty
      const offersCount = await client.query('SELECT COUNT(*) FROM dev.bank_offers');
      if (parseInt(offersCount.rows[0].count) === 0) {
        console.log('INFO: Seeding default bank offers...');
        const seedOffers = [
          ['HDFC Bank', 'Personal Loan', 100000, 5000000, 10.5, 15.0, 1.0, 12, 60, 750, 12.5, 80, 25000, 'Rahul Sharma', '9876543210', 'rahul@hdfc.com', 'Flexible repayment options available with part-payment facility.', '2% of outstanding principal after 12 months.', 'Standard bank T&C apply. Minimum 2 years work experience required.'],
          ['ICICI Bank', 'Personal Loan', 50000, 3000000, 10.75, 16.0, 1.5, 12, 72, 720, 13.0, 75, 20000, 'Priya Gupta', '9876543211', 'priya@icici.com', 'Monthly EMI through ECS/NACH.', '3% preclosure charges apply.', 'Processing fee is non-refundable.'],
          ['SBI', 'Personal Loan', 25000, 2000000, 9.6, 12.0, 0.5, 12, 60, 700, 11.0, 90, 15000, 'Amit Kumar', '9876543212', 'amit@sbi.com', 'No hidden charges. Simple repayment.', 'Nil preclosure charges for government employees.', 'Lowest interest rates for salary account holders.'],
          ['Axis Bank', 'Personal Loan', 50000, 4000000, 10.49, 14.5, 1.0, 12, 60, 750, 12.0, 85, 25000, 'Sanjay Singh', '9876543213', 'sanjay@axis.com', 'Multiple repayment channels.', 'Lock-in period of 6 months.', 'Instant approval for pre-qualified customers.'],
          ['Bajaj Finserv', 'Personal Loan', 30000, 2500000, 11.0, 18.0, 2.0, 12, 84, 750, 14.0, 70, 30000, 'Neha Verma', '9876543214', 'neha@bajaj.com', 'Flexi-loan options available.', 'Part-payment allowed at zero cost.', 'Minimal documentation required.']
        ];

        for (const offer of seedOffers) {
          await client.query(`
            INSERT INTO dev.bank_offers (
              bank_name, loan_type, min_amount, max_amount, 
              min_interest_rate, max_interest_rate, processing_fee, 
              min_tenure, max_tenure, min_cibil_score, 
              interest_rate_below_750, max_amount_percent_below_750, 
              min_income, contact_person, contact_phone, contact_email,
              repayment_policy, preclosure_charges, terms_conditions
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
          `, offer);
        }
        console.log('SUCCESS: Seeded 5 bank offers.');
      }

      await client.query(`
        CREATE TABLE IF NOT EXISTS dev.applications (
          id SERIAL PRIMARY KEY,
          uid TEXT,
          user_name TEXT,
          user_email TEXT,
          user_mobile TEXT,
          bank_id TEXT,
          bank_name TEXT,
          loan_type TEXT,
          loan_amount NUMERIC,
          status TEXT DEFAULT 'pending',
          rejection_reason TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Ensure applications table has all required columns
      try {
        const appsCols = await client.query(`
          SELECT column_name, data_type, column_default 
          FROM information_schema.columns 
          WHERE table_schema = 'dev' AND table_name = 'applications'
        `);
        const existingAppsCols = appsCols.rows.map(r => r.column_name);
        const columns = appsCols.rows;
        
        if (!existingAppsCols.includes('user_name')) {
          await client.query('ALTER TABLE dev.applications ADD COLUMN user_name TEXT');
        }
        if (!existingAppsCols.includes('user_email')) {
          await client.query('ALTER TABLE dev.applications ADD COLUMN user_email TEXT');
        }
        if (!existingAppsCols.includes('user_mobile')) {
          await client.query('ALTER TABLE dev.applications ADD COLUMN user_mobile TEXT');
        }
        if (!existingAppsCols.includes('loan_type')) {
          await client.query('ALTER TABLE dev.applications ADD COLUMN loan_type TEXT');
        }
        if (!existingAppsCols.includes('rejection_reason')) {
          await client.query('ALTER TABLE dev.applications ADD COLUMN rejection_reason TEXT');
        }

        // Fix bank_id type if it's integer
        const bankIdCol = columns.find(c => c.column_name === 'bank_id');
        if (bankIdCol && bankIdCol.data_type === 'integer') {
          console.log('INFO: Converting applications.bank_id from integer to text...');
          await client.query('ALTER TABLE dev.applications ALTER COLUMN bank_id TYPE TEXT');
        }

        // Fix id column to be serial if it's not
        const idCol = columns.find(c => c.column_name === 'id');
        if (idCol && (!idCol.column_default || !idCol.column_default.includes('nextval'))) {
          console.log('INFO: Fixing applications table id column to be serial...');
          try {
            await client.query('CREATE SEQUENCE IF NOT EXISTS dev.applications_id_seq');
            await client.query("ALTER TABLE dev.applications ALTER COLUMN id SET DEFAULT nextval('dev.applications_id_seq')");
            await client.query('ALTER SEQUENCE dev.applications_id_seq OWNED BY dev.applications.id');
            await client.query("SELECT setval('dev.applications_id_seq', COALESCE((SELECT MAX(id) FROM dev.applications), 0) + 1)");
            console.log('INFO: Successfully fixed applications table id column.');
          } catch (seqError) {
            console.warn('Could not fix id column default:', seqError);
          }
        }
      } catch (e) {
        console.warn('Could not fix applications table columns:', e);
      }

      await client.query(`
        CREATE TABLE IF NOT EXISTS dev.dynamic_suggestions (
          id SERIAL PRIMARY KEY,
          label TEXT UNIQUE,
          category TEXT,
          usage_count INTEGER DEFAULT 0,
          last_used TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Add missing columns to dynamic_suggestions if they don't exist
      const suggestionCols = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'dev' AND table_name = 'dynamic_suggestions'
      `);
      const existingSugCols = suggestionCols.rows.map(r => r.column_name);
      
      if (!existingSugCols.includes('label') && existingSugCols.includes('suggestion')) {
        await client.query('ALTER TABLE dev.dynamic_suggestions RENAME COLUMN suggestion TO label');
      } else if (!existingSugCols.includes('label')) {
        await client.query('ALTER TABLE dev.dynamic_suggestions ADD COLUMN label TEXT UNIQUE');
      }
      
      if (!existingSugCols.includes('last_used')) {
        await client.query('ALTER TABLE dev.dynamic_suggestions ADD COLUMN last_used TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP');
      }

      // Seed initial suggestions if empty
      const suggestionsCount = await client.query('SELECT COUNT(*) FROM dev.dynamic_suggestions');
      if (parseInt(suggestionsCount.rows[0].count) === 0) {
        const initialSuggestions = [
          ['Check my loan eligibility', 'Eligibility'],
          ['Can I get loan with my current salary?', 'Eligibility'],
          ['Can I get loan with low credit score?', 'Eligibility'],
          ['Find best loan offers for me', 'Offers'],
          ['Compare interest rates', 'Offers'],
          ['Which bank approves fastest?', 'Offers'],
          ['Calculate EMI for my loan', 'Planning'],
          ['Plan my loan repayment', 'Planning']
        ];
        for (const [label, cat] of initialSuggestions) {
          await client.query('INSERT INTO dev.dynamic_suggestions (label, category) VALUES ($1, $2) ON CONFLICT (label) DO NOTHING', [label, cat]);
        }
      }

      await client.query(`
        CREATE TABLE IF NOT EXISTS dev.staff_invites (
          id SERIAL PRIMARY KEY,
          email TEXT,
          role TEXT,
          permissions JSONB,
          invited_by TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Ensure primary keys exist for ON CONFLICT operations (in case tables were created without them)
      await client.query(`
        DO $$
        BEGIN
            -- Clean up duplicates in dev.users if any
            DELETE FROM dev.users a USING dev.users b
            WHERE a.ctid < b.ctid AND a.uid = b.uid;

            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                           WHERE table_schema = 'dev' AND table_name = 'users' AND constraint_type = 'PRIMARY KEY') THEN
                ALTER TABLE dev.users ADD PRIMARY KEY (uid);
            END IF;
            
            -- Clean up duplicates in dev.chat_sessions if any
            DELETE FROM dev.chat_sessions a USING dev.chat_sessions b
            WHERE a.ctid < b.ctid AND a.uid = b.uid;

            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                           WHERE table_schema = 'dev' AND table_name = 'chat_sessions' AND constraint_type = 'PRIMARY KEY') THEN
                ALTER TABLE dev.chat_sessions ADD PRIMARY KEY (uid);
            END IF;
        END $$;
      `);

      // Explicitly create UNIQUE indexes just in case PRIMARY KEY check is insufficient for some reason
      await client.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_uid_unique ON dev.users(uid)');
      await client.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_sessions_uid_unique ON dev.chat_sessions(uid)');
      
      // Create indexes for performance tuning
      await client.query('CREATE INDEX IF NOT EXISTS idx_bank_offers_bank_name ON dev.bank_offers(bank_name)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_applications_uid ON dev.applications(uid)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_applications_created_at ON dev.applications(created_at DESC)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_display_name ON dev.users(display_name)');
      
      console.log('SUCCESS: Database schema, unique constraints, and indexes verified/created.');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('CRITICAL: Database initialization failed!', err.stack);
  }
};

initDb();

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- DATABASE API ENDPOINTS ---

  // Health Check
  app.get("/api/health", async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: "ok", database: "connected" });
    } catch (err) {
      res.status(500).json({ status: "error", database: "disconnected", message: err.message });
    }
  });

  // Get User Profile
  app.get("/api/user/:uid", async (req, res) => {
    try {
      const { uid } = req.params;
      const result = await pool.query("SELECT * FROM dev.users WHERE uid = $1", [uid]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("DB Error:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Create/Update User Profile
  app.post("/api/user", async (req, res) => {
    try {
      const { 
        uid, email, display_name, monthly_income, employment_type, 
        company_type, company_name, existing_emis, cibil_score, 
        loan_amount_required, loan_type 
      } = req.body;

      const query = `
        INSERT INTO dev.users (
          uid, email, display_name, monthly_income, employment_type, 
          company_type, company_name, existing_emis, cibil_score, 
          loan_amount_required, loan_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (uid) DO UPDATE SET
          email = EXCLUDED.email,
          display_name = EXCLUDED.display_name,
          monthly_income = EXCLUDED.monthly_income,
          employment_type = EXCLUDED.employment_type,
          company_type = EXCLUDED.company_type,
          company_name = EXCLUDED.company_name,
          existing_emis = EXCLUDED.existing_emis,
          cibil_score = EXCLUDED.cibil_score,
          loan_amount_required = EXCLUDED.loan_amount_required,
          loan_type = EXCLUDED.loan_type
        RETURNING *
      `;

      const result = await pool.query(query, [
        uid, email, display_name, monthly_income, employment_type, 
        company_type, company_name, existing_emis, cibil_score, 
        loan_amount_required, loan_type
      ]);

      res.json(result.rows[0]);
    } catch (error) {
      console.error("DB Error:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Get Chat History
  app.get("/api/chat/:uid", async (req, res) => {
    try {
      const { uid } = req.params;
      const result = await pool.query("SELECT * FROM dev.chat_sessions WHERE uid = $1", [uid]);
      res.json(result.rows[0] || { messages: [] });
    } catch (error) {
      console.error("DB Error:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Save Chat History
  app.post("/api/chat", async (req, res) => {
    try {
      const { uid, messages } = req.body;
      const query = `
        INSERT INTO dev.chat_sessions (uid, messages)
        VALUES ($1, $2)
        ON CONFLICT (uid) DO UPDATE SET
          messages = EXCLUDED.messages
        RETURNING *
      `;
      const result = await pool.query(query, [uid, JSON.stringify(messages)]);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("DB Error:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Get Applications
  app.get("/api/applications/:uid", async (req, res) => {
    try {
      const { uid } = req.params;
      const result = await pool.query("SELECT * FROM dev.applications WHERE uid = $1 ORDER BY created_at DESC", [uid]);
      res.json(result.rows);
    } catch (error) {
      console.error("DB Error:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  // API Route for Loan Application (Email + DB)
  app.post("/api/apply", async (req, res) => {
    const { profile, bankOffer } = req.body;

    if (!profile || !bankOffer) {
      return res.status(400).json({ error: "Missing profile or bank offer data" });
    }

    // Save to Database
    try {
      await pool.query(
        "INSERT INTO dev.applications (uid, user_name, user_email, user_mobile, bank_id, bank_name, loan_type, loan_amount, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [profile.uid, profile.displayName, profile.email, profile.mobile, String(bankOffer.id), bankOffer.bankName, bankOffer.loanType, profile.loanAmountRequired, 'Pending']
      );
    } catch (dbError) {
      console.error("Failed to save application to DB:", dbError);
      return res.status(500).json({ success: false, message: 'Failed to process application in database. Please try again.' });
    }

    const emailContent = `
      Dear ${bankOffer.contactPerson || 'Bank Representative'},
      
      A new loan application has been received for ${bankOffer.bankName} (${bankOffer.loanType}).
      
      User Details:
      - Name: ${profile.displayName}
      - Email: ${profile.email}
      - Phone: ${profile.mobile}
      - Monthly Income: ₹${profile.monthlyIncome}
      - Employment: ${profile.employmentType} (${profile.companyName || 'N/A'})
      - Age: ${profile.age}
      - City: ${profile.city}
      - CIBIL Score: ${profile.cibilScore || 'N/A'}
      - Loan Amount Required: ₹${profile.loanAmountRequired}
      
      Please follow up with the customer at ${profile.mobile} or ${profile.email}.
      
      Best regards,
      CreditGenAI Automated System
    `;

    try {
      // Check if SMTP credentials are provided
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail({
          from: `"${process.env.SMTP_FROM_NAME || 'CreditGenAI'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
          to: bankOffer.contactEmail || 'bank-representative@example.com',
          subject: `New Loan Application - ${profile.displayName}`,
          text: emailContent,
        });
        
        console.log(`EMAIL SENT TO: ${bankOffer.contactEmail}`);
      } else {
        console.log("=========================================");
        console.log("SMTP CREDENTIALS MISSING! LOGGING EMAIL TO CONSOLE INSTEAD:");
        console.log(emailContent);
        console.log("=========================================");
      }

      res.json({ 
        success: true, 
        message: `Application details sent to ${bankOffer.bankName} representative (${bankOffer.contactPerson}).` 
      });
    } catch (error: any) {
      console.error("FAILED TO SEND EMAIL:", error);
      
      let userMessage = `Application received! We'll notify ${bankOffer.bankName} representative (${bankOffer.contactPerson}) shortly.`;
      
      // Provide more helpful error messages for common SMTP issues
      if (error.message?.includes('535 5.7.139')) {
        console.error("HINT: SMTP AUTH is disabled for this Office365/Outlook tenant. Please enable 'SMTP AUTH' for this mailbox in the Microsoft 365 Admin Center.");
        userMessage = "Application received! Note: Email notification failed because SMTP AUTH is disabled for your Outlook/Office365 account. Please enable it in your Admin Center.";
      } else if (error.message?.includes('Invalid login')) {
        console.error("HINT: Check your SMTP_USER and SMTP_PASS. If using Gmail, ensure you use an 'App Password'.");
        userMessage = "Application received! Note: Email notification failed due to invalid login credentials. Please check your SMTP settings.";
      }

      // Still return success to user (since DB save worked) but include the warning
      res.json({ 
        success: true, 
        message: userMessage
      });
    }
  });

  // Dynamic Suggestions
  app.get("/api/suggestions", async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM dev.dynamic_suggestions ORDER BY usage_count DESC, last_used DESC LIMIT 10');
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
  });

  app.post("/api/suggestions/record", async (req, res) => {
    const { label, category } = req.body;
    try {
      await pool.query(`
        INSERT INTO dev.dynamic_suggestions (label, category, usage_count, last_used)
        VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
        ON CONFLICT (label) DO UPDATE SET
          usage_count = dev.dynamic_suggestions.usage_count + 1,
          last_used = CURRENT_TIMESTAMP
      `, [label, category || 'General']);
      res.json({ success: true });
    } catch (error) {
      console.error('Error recording suggestion:', error);
      res.status(500).json({ error: 'Failed to record suggestion' });
    }
  });

  // Policy Search (Vector)
  app.post("/api/policy-search", async (req, res) => {
    const { query, vector } = req.body;
    try {
      if (vector) {
        // If vector is provided (client-side embedding), use it
        const result = await pool.query(`
          SELECT id, bank_name, loan_type, repayment_policy, preclosure_charges, terms_conditions,
                 (policy_vector <=> $1::vector) as distance
          FROM dev.bank_offers
          WHERE policy_vector IS NOT NULL
          ORDER BY distance ASC
          LIMIT 3
        `, [JSON.stringify(vector)]);
        res.json(result.rows);
      } else {
        // Fallback to text search if no vector
        const result = await pool.query(`
          SELECT id, bank_name, loan_type, repayment_policy, preclosure_charges, terms_conditions
          FROM dev.bank_offers
          WHERE repayment_policy ILIKE $1 OR preclosure_charges ILIKE $1 OR terms_conditions ILIKE $1
          LIMIT 3
        `, [`%${query}%`]);
        res.json(result.rows);
      }
    } catch (error) {
      console.error('Error searching policies:', error);
      res.status(500).json({ error: 'Failed to search policies' });
    }
  });

  // Public: Get Bank Offers
  app.get("/api/bank-offers", async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM dev.bank_offers ORDER BY bank_name ASC');
      res.json(result.rows.map(row => ({
        id: row.id,
        bankName: row.bank_name,
        loanType: row.loan_type,
        minAmount: Number(row.min_amount),
        maxAmount: Number(row.max_amount),
        minInterestRate: Number(row.min_interest_rate),
        maxInterestRate: Number(row.max_interest_rate),
        processingFee: Number(row.processing_fee),
        minTenure: row.min_tenure,
        maxTenure: row.max_tenure,
        minCibilScore: row.min_cibil_score,
        interestRateBelow750: Number(row.interest_rate_below_750),
        maxAmountPercentBelow750: Number(row.max_amount_percent_below_750),
        minIncome: Number(row.min_income),
        contactPerson: row.contact_person,
        contactPhone: row.contact_phone,
        contactEmail: row.contact_email
      })));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch bank offers" });
    }
  });

  // Admin: Bank Offers
app.get('/api/admin/bank-offers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM dev.bank_offers ORDER BY bank_name ASC');
    res.json(result.rows.map(row => ({
      id: row.id,
      bankName: row.bank_name,
      loanType: row.loan_type,
      minAmount: Number(row.min_amount),
      maxAmount: Number(row.max_amount),
      minInterestRate: Number(row.min_interest_rate),
      maxInterestRate: Number(row.max_interest_rate),
      processingFee: row.processing_fee,
      minTenure: row.min_tenure,
      maxTenure: row.max_tenure,
      minCibilScore: row.min_cibil_score,
      interestRateBelow750: row.interest_rate_below_750 ? Number(row.interest_rate_below_750) : undefined,
      maxAmountPercentBelow750: row.max_amount_percent_below_750 ? Number(row.max_amount_percent_below_750) : undefined,
      contactPerson: row.contact_person,
      contactPhone: row.contact_phone,
      contactEmail: row.contact_email
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bank offers' });
  }
});

app.post('/api/admin/bank-offers', async (req, res) => {
  const offer = req.body;
  try {
    if (offer.id) {
      await pool.query(
        `UPDATE dev.bank_offers SET 
          bank_name = $1, loan_type = $2, min_amount = $3, max_amount = $4, 
          min_interest_rate = $5, max_interest_rate = $6, processing_fee = $7, 
          min_tenure = $8, max_tenure = $9, min_cibil_score = $10, 
          interest_rate_below_750 = $11, max_amount_percent_below_750 = $12, 
          contact_person = $13, contact_phone = $14, contact_email = $15,
          repayment_policy = $16, preclosure_charges = $17, terms_conditions = $18
        WHERE id = $19`,
        [
          offer.bankName, offer.loanType, offer.minAmount, offer.maxAmount,
          offer.minInterestRate, offer.maxInterestRate, offer.processingFee,
          offer.minTenure, offer.maxTenure, offer.minCibilScore,
          offer.interestRateBelow750, offer.maxAmountPercentBelow750,
          offer.contactPerson, offer.contactPhone, offer.contactEmail,
          offer.repaymentPolicy, offer.preclosureCharges, offer.termsConditions,
          offer.id
        ]
      );
      res.json({ success: true });
    } else {
      const result = await pool.query(
        `INSERT INTO dev.bank_offers (
          bank_name, loan_type, min_amount, max_amount, 
          min_interest_rate, max_interest_rate, processing_fee, 
          min_tenure, max_tenure, min_cibil_score, 
          interest_rate_below_750, max_amount_percent_below_750, 
          contact_person, contact_phone, contact_email,
          repayment_policy, preclosure_charges, terms_conditions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING id`,
        [
          offer.bankName, offer.loanType, offer.minAmount, offer.maxAmount,
          offer.minInterestRate, offer.maxInterestRate, offer.processingFee,
          offer.minTenure, offer.maxTenure, offer.minCibilScore,
          offer.interestRateBelow750, offer.maxAmountPercentBelow750,
          offer.contactPerson, offer.contactPhone, offer.contactEmail,
          offer.repaymentPolicy, offer.preclosureCharges, offer.termsConditions
        ]
      );
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save bank offer' });
  }
});

app.delete('/api/admin/bank-offers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM dev.bank_offers WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete bank offer' });
  }
});

// Admin: Leads
app.get('/api/admin/leads', async (req, res) => {
  const limit = req.query.limit || 100;
  try {
    const result = await pool.query('SELECT * FROM dev.applications ORDER BY created_at DESC LIMIT $1', [limit]);
    res.json(result.rows.map(row => ({
      id: row.id,
      uid: row.uid,
      userName: row.user_name,
      userEmail: row.user_email,
      userMobile: row.user_mobile,
      bankId: row.bank_id,
      bankName: row.bank_name,
      loanType: row.loan_type,
      loanAmount: Number(row.loan_amount),
      status: row.status,
      rejectionReason: row.rejection_reason,
      timestamp: row.created_at
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

app.patch('/api/admin/leads/:id/status', async (req, res) => {
  const { status, rejectionReason } = req.body;
  try {
    await pool.query('UPDATE dev.applications SET status = $1, rejection_reason = $2 WHERE id = $3', [status, rejectionReason, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update lead status' });
  }
});

// Admin: Users
app.get('/api/admin/users', async (req, res) => {
  const limit = req.query.limit || 200;
  try {
    const result = await pool.query('SELECT * FROM dev.users LIMIT $1', [limit]);
    res.json(result.rows.map(row => ({
      uid: row.uid,
      email: row.email,
      displayName: row.display_name,
      monthlyIncome: Number(row.monthly_income),
      employmentType: row.employment_type,
      companyType: row.company_type,
      companyName: row.company_name,
      existingEMIs: Number(row.existing_emis),
      cibilScore: row.cibil_score,
      loanAmountRequired: Number(row.loan_amount_required),
      loanType: row.loan_type,
      role: row.role,
      permissions: row.permissions,
      createdAt: row.created_at,
      lastSeen: row.last_seen
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.patch('/api/admin/users/:uid/role', async (req, res) => {
  const { role, permissions } = req.body;
  try {
    await pool.query('UPDATE dev.users SET role = $1, permissions = $2 WHERE uid = $3', [role, permissions, req.params.uid]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

app.patch('/api/admin/users/:uid/permissions', async (req, res) => {
  const { permissions } = req.body;
  try {
    await pool.query('UPDATE dev.users SET permissions = $1 WHERE uid = $2', [permissions, req.params.uid]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user permissions' });
  }
});

// Admin: Staff Invites
app.get('/api/admin/staff-invites', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM dev.staff_invites ORDER BY created_at DESC');
    res.json(result.rows.map(row => ({
      id: row.id,
      email: row.email,
      role: row.role,
      permissions: row.permissions,
      invitedBy: row.invited_by,
      timestamp: row.created_at
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch staff invites' });
  }
});

app.post('/api/admin/staff-invites', async (req, res) => {
  const invite = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO dev.staff_invites (email, role, permissions, invited_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [invite.email, invite.role, invite.permissions, invite.invitedBy]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save staff invite' });
  }
});

app.delete('/api/admin/staff-invites/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM dev.staff_invites WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete staff invite' });
  }
});

// Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SUCCESS: Server running on http://localhost:${PORT}`);
    console.log(`SUCCESS: Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

console.log('INFO: Starting server...');
startServer();
