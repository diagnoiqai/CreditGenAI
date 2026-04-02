import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import pg from "pg";
import twilio from "twilio";

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
      
      // Try to enable pgvector and pgcrypto
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS vector');
        await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
        console.log('SUCCESS: pgvector and pgcrypto extensions enabled.');
      } catch (e) {
        console.warn('WARNING: extensions could not be enabled. Falling back to text search.', e);
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

      // Ensure users table has all required columns (for existing tables)
      try {
        const userCols = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'dev' AND table_name = 'users'
        `);
        const existingUserCols = userCols.rows.map(r => r.column_name);
        
        if (!existingUserCols.includes('mobile')) {
          await client.query('ALTER TABLE dev.users ADD COLUMN mobile TEXT');
        }
        if (!existingUserCols.includes('role')) {
          await client.query("ALTER TABLE dev.users ADD COLUMN role TEXT DEFAULT 'user'");
        }
        if (!existingUserCols.includes('permissions')) {
          await client.query("ALTER TABLE dev.users ADD COLUMN permissions JSONB DEFAULT '[]'");
        }
        if (!existingUserCols.includes('work_experience')) {
          await client.query('ALTER TABLE dev.users ADD COLUMN work_experience TEXT');
        }
        if (!existingUserCols.includes('total_experience')) {
          await client.query('ALTER TABLE dev.users ADD COLUMN total_experience TEXT');
        }
        if (!existingUserCols.includes('city')) {
          await client.query('ALTER TABLE dev.users ADD COLUMN city TEXT');
        }
      } catch (e) {
        console.warn('Could not fix users table columns:', e);
      }

      await client.query(`
        CREATE TABLE IF NOT EXISTS dev.chat_sessions (
          uid TEXT PRIMARY KEY,
          messages JSONB,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS dev.bank_offers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

      // 1. Ensure applications table exists
      try {
        await client.query('CREATE SEQUENCE IF NOT EXISTS dev.applications_id_seq');
        await client.query(`
          CREATE TABLE IF NOT EXISTS dev.applications (
            id TEXT PRIMARY KEY DEFAULT nextval('dev.applications_id_seq'::regclass)::text,
            uid TEXT,
            user_name TEXT,
            user_email TEXT,
            user_mobile TEXT,
            bank_id TEXT,
            bank_name TEXT,
            loan_type TEXT,
            loan_amount NUMERIC,
            status TEXT DEFAULT 'pending',
            sub_status TEXT,
            status_notes TEXT,
            rejection_reason TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } catch (e) {
        console.warn('Could not create applications table:', e);
      }

      // 2. Ensure applications table has all required columns and correct types
      try {
        const appsCols = await client.query(`
          SELECT column_name, data_type, column_default 
          FROM information_schema.columns 
          WHERE table_schema = 'dev' AND table_name = 'applications'
        `);
        const existingAppsCols = appsCols.rows.map(r => r.column_name);
        const columns = appsCols.rows;
        
        if (!existingAppsCols.includes('id')) {
          console.log('INFO: Adding id column to dev.applications...');
          await client.query('ALTER TABLE dev.applications ADD COLUMN id SERIAL PRIMARY KEY');
        } else {
          // Clean up duplicates in dev.applications if any before adding PK
          try {
            await client.query(`
              DELETE FROM dev.applications a USING dev.applications b
              WHERE a.ctid < b.ctid AND a.id = b.id;
            `);
          } catch (dupError) {
            console.warn('Could not clean up duplicates in applications table:', dupError);
          }

          // Ensure id is primary key
          const pkCheck = await client.query(`
            SELECT a.attname
            FROM pg_index i
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
            WHERE i.indrelid = (SELECT oid FROM pg_class WHERE relname = 'applications' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'dev'))
            AND i.indisprimary;
          `);
          if (pkCheck.rows.length === 0) {
            console.log('INFO: Adding primary key to dev.applications...');
            try {
              // First ensure no nulls in id
              await client.query('ALTER TABLE dev.applications ALTER COLUMN id SET NOT NULL');
              await client.query('ALTER TABLE dev.applications ADD PRIMARY KEY (id)');
            } catch (pkAddError) {
              console.warn('Could not add primary key to applications table:', pkAddError);
            }
          }

          // Ensure id is serial
          const idCol = columns.find(c => c.column_name === 'id');
          if (idCol && (!idCol.column_default || !idCol.column_default.includes('nextval'))) {
            console.log('INFO: Fixing applications table id column to be serial...');
            try {
              await client.query('CREATE SEQUENCE IF NOT EXISTS dev.applications_id_seq');
              await client.query("ALTER TABLE dev.applications ALTER COLUMN id SET DEFAULT nextval('dev.applications_id_seq')");
              await client.query('ALTER SEQUENCE dev.applications_id_seq OWNED BY dev.applications.id');
              await client.query("SELECT setval('dev.applications_id_seq', COALESCE((SELECT MAX(id) FROM dev.applications), 0) + 1)");
            } catch (seqError) {
              console.warn('Could not fix id column default:', seqError);
            }
          }
        }

        if (!existingAppsCols.includes('user_name')) {
          await client.query('ALTER TABLE dev.applications ADD COLUMN user_name TEXT');
        }
        if (!existingAppsCols.includes('sub_status')) {
          await client.query('ALTER TABLE dev.applications ADD COLUMN sub_status TEXT');
        }
        if (!existingAppsCols.includes('status_notes')) {
          await client.query('ALTER TABLE dev.applications ADD COLUMN status_notes TEXT');
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
      } catch (e) {
        console.warn('Could not fix applications table columns:', e);
      }

      // 3. Create application_history table
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS dev.application_history (
            id SERIAL PRIMARY KEY,
            application_id TEXT REFERENCES dev.applications(id) ON DELETE CASCADE,
            status TEXT,
            sub_status TEXT,
            status_notes TEXT,
            rejection_reason TEXT,
            updated_by TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } catch (e) {
        console.warn('Could not create application_history table:', e);
        // Fallback: Create without foreign key if it fails (e.g. due to PK issue)
        try {
          await client.query(`
            CREATE TABLE IF NOT EXISTS dev.application_history (
              id SERIAL PRIMARY KEY,
              application_id TEXT,
              status TEXT,
              sub_status TEXT,
              status_notes TEXT,
              rejection_reason TEXT,
              updated_by TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
          `);
          console.log('INFO: Created application_history without foreign key constraint.');
        } catch (fallbackError) {
          console.error('CRITICAL: Could not create application_history table even without FK:', fallbackError);
        }
      }

      // 4. Ensure application_history table has all required columns and correct types
      try {
        const histColsResult = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = 'dev' AND table_name = 'application_history'
        `);
        const existingHistCols = histColsResult.rows.map(r => r.column_name);
        const appIdCol = histColsResult.rows.find(r => r.column_name === 'application_id');
        
        if (appIdCol && appIdCol.data_type !== 'text') {
          console.log(`INFO: Converting application_history.application_id from ${appIdCol.data_type} to text...`);
          try {
            // Drop FK first if it exists
            await client.query('ALTER TABLE dev.application_history DROP CONSTRAINT IF EXISTS application_history_application_id_fkey');
            // Alter column with USING clause for safety
            await client.query('ALTER TABLE dev.application_history ALTER COLUMN application_id TYPE TEXT USING application_id::text');
            // Re-add FK
            await client.query('ALTER TABLE dev.application_history ADD CONSTRAINT application_history_application_id_fkey FOREIGN KEY (application_id) REFERENCES dev.applications(id) ON DELETE CASCADE');
            console.log('SUCCESS: Converted application_history.application_id to TEXT');
          } catch (alterError) {
            console.warn('Could not fully convert application_id with FK. Attempting simple alter...', alterError);
            await client.query('ALTER TABLE dev.application_history ALTER COLUMN application_id TYPE TEXT USING application_id::text');
          }
        }
        
        if (!existingHistCols.includes('sub_status')) {
          await client.query('ALTER TABLE dev.application_history ADD COLUMN sub_status TEXT');
        }
        if (!existingHistCols.includes('status_notes')) {
          await client.query('ALTER TABLE dev.application_history ADD COLUMN status_notes TEXT');
        }
        if (!existingHistCols.includes('rejection_reason')) {
          await client.query('ALTER TABLE dev.application_history ADD COLUMN rejection_reason TEXT');
        }
        if (!existingHistCols.includes('updated_by')) {
          await client.query('ALTER TABLE dev.application_history ADD COLUMN updated_by TEXT');
        }
      } catch (e) {
        console.warn('Could not fix application_history table columns:', e);
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
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT,
          role TEXT,
          permissions JSONB,
          invited_by TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS dev.application_attachments (
            id SERIAL PRIMARY KEY,
            application_id TEXT REFERENCES dev.applications(id) ON DELETE CASCADE,
            file_url TEXT,
            file_name TEXT,
            file_type TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } catch (e) {
        console.warn('Could not create application_attachments table with foreign key:', e);
        try {
          await client.query(`
            CREATE TABLE IF NOT EXISTS dev.application_attachments (
              id SERIAL PRIMARY KEY,
              application_id TEXT,
              file_url TEXT,
              file_name TEXT,
              file_type TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
          `);
          console.log('INFO: Created application_attachments without foreign key constraint.');
        } catch (fallbackError) {
          console.error('CRITICAL: Could not create application_attachments table even without FK:', fallbackError);
        }
      }

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

// Twilio Client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

if (twilioClient) {
  console.log('SUCCESS: Twilio client initialized for WhatsApp notifications.');
  const whatsappNum = process.env.TWILIO_WHATSAPP_NUMBER;
  if (whatsappNum) {
    console.log(`INFO: WhatsApp sender number configured: ${whatsappNum.substring(0, 12)}...`);
  } else {
    console.warn('WARNING: TWILIO_WHATSAPP_NUMBER is missing. Notifications will fail.');
  }
} else {
  console.warn('WARNING: Twilio credentials missing. WhatsApp notifications will not work.');
}

async function startServer() {
  console.log('INFO: Initializing database...');
  await initDb();
  
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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
      const result = await pool.query("SELECT * FROM dev.users WHERE uid = $1::text", [uid]);
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
        loan_amount_required, loan_type, mobile, role, permissions
      } = req.body;

      const query = `
        INSERT INTO dev.users (
          uid, email, display_name, monthly_income, employment_type, 
          company_type, company_name, existing_emis, cibil_score, 
          loan_amount_required, loan_type, mobile, role, permissions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
          loan_type = EXCLUDED.loan_type,
          mobile = EXCLUDED.mobile,
          role = EXCLUDED.role,
          permissions = EXCLUDED.permissions
        RETURNING *
      `;

      const result = await pool.query(query, [
        uid, email, display_name, monthly_income, employment_type, 
        company_type, company_name, existing_emis, cibil_score, 
        loan_amount_required, loan_type, mobile, role || 'user', 
        JSON.stringify(permissions || [])
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
      const result = await pool.query("SELECT * FROM dev.chat_sessions WHERE uid = $1::text", [uid]);
      
      if (result.rows.length > 0) {
        const session = result.rows[0];
        const updatedAt = new Date(session.updated_at);
        const now = new Date();
        const diffHours = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
        
        if (diffHours > 24) {
          // Chat is older than 24 hours, return empty
          return res.json({ messages: [] });
        }
        return res.json(session);
      }
      
      res.json({ messages: [] });
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
        INSERT INTO dev.chat_sessions (uid, messages, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (uid) DO UPDATE SET
          messages = EXCLUDED.messages,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      const result = await pool.query(query, [uid, JSON.stringify(messages)]);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("DB Error:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  // WhatsApp Webhook
  app.post("/api/whatsapp/webhook", async (req, res) => {
    const { From, Body, NumMedia, MessageSid } = req.body;
    const fromMobile = From.replace('whatsapp:', ''); // e.g. +919876543210
    
    console.log(`RECEIVED WHATSAPP FROM ${fromMobile}: ${Body} (${NumMedia} media)`);

    if (parseInt(NumMedia) > 0) {
      try {
        // Find the user by mobile number
        // We try to match with and without country code if possible, but let's stick to exact match or suffix match
        const userResult = await pool.query(
          "SELECT uid FROM dev.users WHERE mobile LIKE $1::text OR mobile = $2::text",
          [`%${fromMobile.slice(-10)}`, fromMobile]
        );

        if (userResult.rows.length > 0) {
          const uid = userResult.rows[0].uid;
          
          // Find the most recent pending application
          const appResult = await pool.query(
            "SELECT id FROM dev.applications WHERE uid = $1::text AND status = 'Pending' ORDER BY created_at DESC LIMIT 1",
            [uid]
          );

          if (appResult.rows.length > 0) {
            const appId = appResult.rows[0].id;

            // Process each media attachment
            for (let i = 0; i < parseInt(NumMedia); i++) {
              const mediaUrl = req.body[`MediaUrl${i}`];
              const contentType = req.body[`MediaContentType${i}`];
              const fileName = `whatsapp_media_${MessageSid}_${i}`;

              await pool.query(
                "INSERT INTO dev.application_attachments (application_id, file_url, file_name, file_type) VALUES ($1, $2, $3, $4)",
                [appId, mediaUrl, fileName, contentType]
              );
            }

            // Update application status
            await pool.query(
              "UPDATE dev.applications SET status = 'Documents Received', sub_status = 'Documents Uploaded via WhatsApp' WHERE id = $1::text",
              [appId]
            );

            // Add history entry
            await pool.query(
              "INSERT INTO dev.application_history (application_id, status, sub_status, status_notes) VALUES ($1, $2, $3, $4)",
              [appId, 'Documents Received', 'Documents Uploaded via WhatsApp', `Received ${NumMedia} documents via WhatsApp.`]
            );

            console.log(`SUCCESS: Documents processed for application ${appId}`);
            
            // Send acknowledgement
            if (twilioClient) {
              await twilioClient.messages.create({
                from: process.env.TWILIO_WHATSAPP_NUMBER!,
                to: From,
                body: "Thank you! We have received your documents. Our team will review them and proceed with the CIBIL check shortly."
              });
            }
          }
        }
      } catch (err) {
        console.error("ERROR PROCESSING WHATSAPP MEDIA:", err);
      }
    }

    res.status(200).send('<Response></Response>');
  });

  // Get Applications
  app.get("/api/applications/:uid", async (req, res) => {
    try {
      const { uid } = req.params;
      const query = `
        SELECT a.*, 
               COALESCE(
                 json_agg(
                   json_build_object(
                     'id', att.id,
                     'fileUrl', att.file_url,
                     'fileName', att.file_name,
                     'fileType', att.file_type,
                     'timestamp', att.created_at
                   )
                 ) FILTER (WHERE att.id IS NOT NULL),
                 '[]'
               ) as attachments
        FROM dev.applications a
        LEFT JOIN dev.application_attachments att ON a.id::text = att.application_id::text
        WHERE a.uid = $1::text
        GROUP BY a.id
        ORDER BY a.created_at DESC
      `;
      const result = await pool.query(query, [uid]);
      res.json(result.rows.map(row => ({
        id: row.id,
        uid: row.uid,
        bankId: row.bank_id,
        bankName: row.bank_name,
        loanType: row.loan_type,
        loanAmount: Number(row.loan_amount),
        status: row.status,
        subStatus: row.sub_status,
        statusNotes: row.status_notes,
        rejectionReason: row.rejection_reason,
        timestamp: row.created_at,
        attachments: row.attachments
      })));
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
      // Check for 6-month rejection lock
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const recentRejection = await pool.query(
        'SELECT created_at FROM dev.applications WHERE uid = $1::text AND bank_id = $2::text AND status = $3::text AND created_at > $4 ORDER BY created_at DESC LIMIT 1',
        [profile.uid, String(bankOffer.id), 'Rejected', sixMonthsAgo]
      );

      if (recentRejection.rows.length > 0) {
        const rejectedDate = new Date(recentRejection.rows[0].created_at);
        const canReapplyDate = new Date(rejectedDate);
        canReapplyDate.setMonth(canReapplyDate.getMonth() + 6);
        
        return res.status(400).json({ 
          success: false, 
          message: `Your application for ${bankOffer.bankName} was rejected on ${rejectedDate.toLocaleDateString()}. You can re-apply after ${canReapplyDate.toLocaleDateString()}.` 
        });
      }

      const result = await pool.query(
        "INSERT INTO dev.applications (uid, user_name, user_email, user_mobile, bank_id, bank_name, loan_type, loan_amount, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id",
        [profile.uid, profile.displayName, profile.email, profile.mobile, String(bankOffer.id), bankOffer.bankName, bankOffer.loanType, profile.loanAmountRequired, 'Pending']
      );
      
      // Initial history entry
      await pool.query(
        'INSERT INTO dev.application_history (application_id, status, sub_status, status_notes) VALUES ($1::text, $2, $3, $4)',
        [result.rows[0].id, 'Pending', 'Application Submitted', 'User submitted the application through CreditGenAI.']
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

      // WhatsApp Notification
      if (twilioClient && process.env.TWILIO_WHATSAPP_NUMBER && profile.mobile) {
        try {
          console.log(`DEBUG: Attempting initial WhatsApp notification for ${profile.displayName}`);
          // Format mobile number: ensure it starts with + and has country code
          // For India, if it's 10 digits, add +91
          let formattedMobile = profile.mobile.trim().replace(/\s+/g, '');
          if (formattedMobile.length === 10 && !formattedMobile.startsWith('+')) {
            formattedMobile = '+91' + formattedMobile;
          } else if (!formattedMobile.startsWith('+')) {
            formattedMobile = '+' + formattedMobile;
          }

          // Ensure from number has whatsapp: prefix
          let fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
          if (!fromNumber.startsWith('whatsapp:')) {
            fromNumber = `whatsapp:${fromNumber}`;
          }

          console.log(`DEBUG: Sending initial WhatsApp from ${fromNumber} to whatsapp:${formattedMobile}`);

          const waResult = await twilioClient.messages.create({
            from: fromNumber,
            to: `whatsapp:${formattedMobile}`,
            body: `Hi ${profile.displayName}, we received your application for ${bankOffer.bankName}. To proceed further, please send PAN, AADHAR, Last 3 month payslips, and last 6 months bank statement as attachments here.`
          });
          console.log(`SUCCESS: INITIAL WHATSAPP SENT. SID: ${waResult.sid}`);
        } catch (waError) {
          console.error("FAILED TO SEND INITIAL WHATSAPP:", waError);
        }
      } else {
        console.warn(`WARNING: Initial WhatsApp notification skipped. twilioClient: ${!!twilioClient}, from: ${!!process.env.TWILIO_WHATSAPP_NUMBER}, mobile: ${!!profile.mobile}`);
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
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch bank offers" });
    }
  });

  // Admin: Bank Offers
  app.get('/api/admin/bank-offers', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM dev.bank_offers ORDER BY bank_name ASC');
      res.json(result.rows);
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
        WHERE id = $19::uuid`,
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
      await pool.query('DELETE FROM dev.bank_offers WHERE id = $1::uuid', [req.params.id]);
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
      // Modified query to include all users who are 'user' role, even if they haven't applied
      // AND include attachments
      const query = `
        WITH lead_attachments AS (
          SELECT application_id, 
                 json_agg(
                   json_build_object(
                     'id', id,
                     'fileUrl', file_url,
                     'fileName', file_name,
                     'fileType', file_type,
                     'timestamp', created_at
                   )
                 ) as attachments
          FROM dev.application_attachments
          GROUP BY application_id
        )
        SELECT 
          u.uid, 
          COALESCE(u.display_name, a.user_name) as user_name, 
          COALESCE(u.email, a.user_email) as user_email, 
          COALESCE(u.mobile, a.user_mobile) as user_mobile, 
          a.id, 
          a.bank_id, 
          a.bank_name, 
          COALESCE(a.loan_type, u.loan_type) as loan_type, 
          COALESCE(a.loan_amount, u.loan_amount_required) as loan_amount, 
          COALESCE(a.status, 'Interested') as status, 
          a.sub_status,
          a.status_notes,
          a.rejection_reason, 
          COALESCE(a.created_at, u.created_at) as created_at,
          COALESCE(la.attachments, '[]') as attachments
        FROM dev.users u
        LEFT JOIN dev.applications a ON u.uid = a.uid
        LEFT JOIN lead_attachments la ON a.id::text = la.application_id::text
        WHERE u.role = 'user'
        ORDER BY created_at DESC
        LIMIT $1::integer
      `;
      const result = await pool.query(query, [limit]);
      res.json(result.rows.map(row => ({
        id: row.id || `user-${row.uid}`, // Use a virtual ID if no application exists
        uid: row.uid,
        user_name: row.user_name,
        user_email: row.user_email,
        user_mobile: row.user_mobile,
        bank_id: row.bank_id,
        bank_name: row.bank_name || 'No Bank Selected',
        loan_type: row.loan_type,
        loan_amount: row.loan_amount,
        status: row.status,
        sub_status: row.sub_status,
        status_notes: row.status_notes,
        rejection_reason: row.rejection_reason,
        created_at: row.created_at,
        attachments: row.attachments
      })));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch leads' });
    }
  });

  app.patch('/api/admin/leads/:id/status', async (req, res) => {
    const { status, rejectionReason, subStatus, statusNotes, updatedBy } = req.body;
    const leadId = req.params.id;
    
    try {
      console.log(`DEBUG: PATCH status for leadId: ${leadId}, status: ${status}`);
      let applicationId: any;
      
      // Check if it's a virtual ID (starts with 'user-')
      if (leadId.startsWith('user-')) {
        const uid = leadId.replace('user-', '');
        console.log(`DEBUG: Handling virtual lead for uid: ${uid}`);
        
        // Fetch user details to create an application
        const userResult = await pool.query('SELECT * FROM dev.users WHERE uid = $1::text', [uid]);
        if (userResult.rows.length === 0) {
          console.warn(`WARNING: User not found for uid: ${uid}`);
          return res.status(404).json({ error: 'User not found' });
        }
        
        const user = userResult.rows[0];
        console.log(`DEBUG: Creating application for virtual lead. User: ${user.display_name}`);
        
        // Create a new application record for this lead
        const insertResult = await pool.query(
          `INSERT INTO dev.applications 
           (uid, user_name, user_email, user_mobile, loan_type, loan_amount, status, sub_status, status_notes, rejection_reason, bank_id, bank_name) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
           RETURNING id`,
          [
            uid, 
            user.display_name || null, 
            user.email || null, 
            user.mobile || null, 
            user.loan_type || 'Personal Loan', 
            user.loan_amount_required || 0, 
            status, 
            subStatus || null, 
            statusNotes || null, 
            rejectionReason || null,
            'manual',
            'Manual Entry'
          ]
        );
        
        applicationId = insertResult.rows[0].id;
        console.log(`DEBUG: Created application with id: ${applicationId}`);
      } else {
        // It's a real application ID
        applicationId = leadId;
        console.log(`DEBUG: Updating real application with id: ${applicationId}`);
        if (!applicationId) {
          return res.status(400).json({ error: 'Invalid lead ID' });
        }
        
        await pool.query(
          'UPDATE dev.applications SET status = $1, rejection_reason = $2, sub_status = $3, status_notes = $4 WHERE id = $5::text',
          [status, rejectionReason, subStatus, statusNotes, applicationId]
        );
      }
      
      // Record history
      console.log(`DEBUG: Recording history for applicationId: ${applicationId}`);
      await pool.query(
        'INSERT INTO dev.application_history (application_id, status, sub_status, status_notes, rejection_reason, updated_by) VALUES ($1::text, $2, $3, $4, $5, $6)',
        [applicationId, status, subStatus, statusNotes, rejectionReason, updatedBy]
      );

      // Send WhatsApp Notification if status changed
      try {
        console.log(`DEBUG: Attempting WhatsApp notification for applicationId: ${applicationId}`);
        const appResult = await pool.query('SELECT * FROM dev.applications WHERE id = $1::text', [applicationId]);
        if (appResult.rows.length > 0) {
          const app = appResult.rows[0];
          console.log(`DEBUG: Application found. user_mobile: ${app.user_mobile}, twilioClient: ${!!twilioClient}, TWILIO_WHATSAPP_NUMBER: ${process.env.TWILIO_WHATSAPP_NUMBER}`);
          
          if (twilioClient && process.env.TWILIO_WHATSAPP_NUMBER && app.user_mobile) {
            let formattedMobile = app.user_mobile.trim().replace(/\s+/g, '');
            if (formattedMobile.length === 10 && !formattedMobile.startsWith('+')) {
              formattedMobile = '+91' + formattedMobile;
            } else if (!formattedMobile.startsWith('+')) {
              formattedMobile = '+' + formattedMobile;
            }

            const messageBody = `Hello ${app.user_name},\n\nYour loan application for ${app.bank_name || 'your chosen bank'} has been updated.\n\nNew Status: *${status}*\n${subStatus ? `Update: ${subStatus}` : ''}\n\nYou can check more details in your dashboard.`;

            // Ensure from number has whatsapp: prefix
            let fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
            if (!fromNumber.startsWith('whatsapp:')) {
              fromNumber = `whatsapp:${fromNumber}`;
            }

            console.log(`DEBUG: Sending WhatsApp from ${fromNumber} to whatsapp:${formattedMobile}`);

            const waResult = await twilioClient.messages.create({
              from: fromNumber,
              to: `whatsapp:${formattedMobile}`,
              body: messageBody
            });
            console.log(`SUCCESS: WHATSAPP STATUS UPDATE SENT. SID: ${waResult.sid}`);
          } else {
            console.warn(`WARNING: WhatsApp notification skipped. twilioClient: ${!!twilioClient}, from: ${!!process.env.TWILIO_WHATSAPP_NUMBER}, mobile: ${!!app.user_mobile}`);
          }
        } else {
          console.warn(`WARNING: Application not found for WhatsApp notification: ${applicationId}`);
        }
      } catch (waError) {
        console.error("FAILED TO SEND WHATSAPP STATUS UPDATE:", waError);
      }

      res.json({ success: true, applicationId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update lead status' });
    }
  });

  app.get('/api/admin/leads/:id/history', async (req, res) => {
    const leadId = req.params.id;
    
    try {
      // If it's a virtual ID, there is no history yet
      if (leadId.startsWith('user-')) {
        return res.json([]);
      }
      
      const result = await pool.query(
        `SELECT h.*, u.display_name as staff_name 
         FROM dev.application_history h 
         LEFT JOIN dev.users u ON h.updated_by = u.uid 
         WHERE h.application_id = $1::text 
         ORDER BY h.created_at DESC`,
        [leadId]
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch application history' });
    }
  });

  // Admin: Users
  app.get('/api/admin/users', async (req, res) => {
    const limit = req.query.limit || 200;
    try {
      const result = await pool.query('SELECT * FROM dev.users LIMIT $1::integer', [limit]);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.patch('/api/admin/users/:uid/role', async (req, res) => {
    const { role, permissions } = req.body;
    try {
      await pool.query('UPDATE dev.users SET role = $1, permissions = $2 WHERE uid = $3::text', [role, permissions, req.params.uid]);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  });

  app.patch('/api/admin/users/:uid/permissions', async (req, res) => {
    const { permissions } = req.body;
    try {
      await pool.query('UPDATE dev.users SET permissions = $1 WHERE uid = $2::text', [permissions, req.params.uid]);
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
      await pool.query('DELETE FROM dev.staff_invites WHERE id = $1::uuid', [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete staff invite' });
    }
  });

  // Auth: Check Invite
  app.get('/api/auth/check-invite/:email', async (req, res) => {
    try {
      const { email } = req.params;
      const result = await pool.query('SELECT * FROM dev.staff_invites WHERE email = $1::text', [email]);
      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.status(404).json({ error: 'No invite found' });
      }
    } catch (error) {
      console.error('DB Error:', error);
      res.status(500).json({ error: 'Database error' });
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
