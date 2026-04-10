import { pool } from '../config/db.ts';

export const initDb = async () => {
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
      } catch (e: unknown) {
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
          gender TEXT,
          marital_status TEXT,
          role TEXT DEFAULT 'user',
          permissions JSONB DEFAULT '[]',
          last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS dev.token_usage (
          id SERIAL PRIMARY KEY,
          uid TEXT,
          input_tokens INTEGER,
          output_tokens INTEGER,
          model TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Ensure token_usage table has all required columns
      try {
        const tokenCols = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'dev' AND table_name = 'token_usage'
        `);
        const existingTokenCols = tokenCols.rows.map(r => r.column_name);
        
        if (!existingTokenCols.includes('input_tokens')) {
          await client.query('ALTER TABLE dev.token_usage ADD COLUMN input_tokens INTEGER DEFAULT 0');
        }
        if (!existingTokenCols.includes('output_tokens')) {
          await client.query('ALTER TABLE dev.token_usage ADD COLUMN output_tokens INTEGER DEFAULT 0');
        }
        if (!existingTokenCols.includes('model')) {
          await client.query('ALTER TABLE dev.token_usage ADD COLUMN model TEXT');
        }
      } catch (err: unknown) {
        console.error('Error checking token_usage columns:', err);
      }

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
        if (!existingUserCols.includes('gender')) {
          await client.query('ALTER TABLE dev.users ADD COLUMN gender TEXT');
        }
        if (!existingUserCols.includes('marital_status')) {
          await client.query('ALTER TABLE dev.users ADD COLUMN marital_status TEXT');
        }
      } catch (e: unknown) {
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
          multiplier NUMERIC,
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
      if (!existingBankCols.includes('min_age')) {
        await client.query('ALTER TABLE dev.bank_offers ADD COLUMN min_age INTEGER');
      }
      if (!existingBankCols.includes('max_age')) {
        await client.query('ALTER TABLE dev.bank_offers ADD COLUMN max_age INTEGER');
      }
      if (!existingBankCols.includes('min_net_salary_tier1')) {
        await client.query('ALTER TABLE dev.bank_offers ADD COLUMN min_net_salary_tier1 NUMERIC');
      }
      if (!existingBankCols.includes('min_net_salary_tier2')) {
        await client.query('ALTER TABLE dev.bank_offers ADD COLUMN min_net_salary_tier2 NUMERIC');
      }
      if (!existingBankCols.includes('employment_type')) {
        await client.query('ALTER TABLE dev.bank_offers ADD COLUMN employment_type TEXT');
      }
      if (!existingBankCols.includes('min_work_experience')) {
        await client.query('ALTER TABLE dev.bank_offers ADD COLUMN min_work_experience TEXT');
      }
      if (!existingBankCols.includes('salary_mode')) {
        await client.query('ALTER TABLE dev.bank_offers ADD COLUMN salary_mode TEXT');
      }
      if (!existingBankCols.includes('foir_cap')) {
        await client.query('ALTER TABLE dev.bank_offers ADD COLUMN foir_cap NUMERIC');
      }
      if (!existingBankCols.includes('prepayment_charges')) {
        await client.query('ALTER TABLE dev.bank_offers ADD COLUMN prepayment_charges TEXT');
      }
      if (!existingBankCols.includes('foreclosure_charges')) {
        await client.query('ALTER TABLE dev.bank_offers ADD COLUMN foreclosure_charges TEXT');
      }
      if (!existingBankCols.includes('time_to_disbursal')) {
        await client.query('ALTER TABLE dev.bank_offers ADD COLUMN time_to_disbursal TEXT');
      }
      if (!existingBankCols.includes('documents_required')) {
        await client.query('ALTER TABLE dev.bank_offers ADD COLUMN documents_required TEXT');
      }
      if (!existingBankCols.includes('stamp_duty_fee')) {
        await client.query('ALTER TABLE dev.bank_offers ADD COLUMN stamp_duty_fee TEXT');
      }
      if (!existingBankCols.includes('emi_bounce_charges')) {
        await client.query('ALTER TABLE dev.bank_offers ADD COLUMN emi_bounce_charges TEXT');
      }
      if (!existingBankCols.includes('multiplier')) {
        await client.query('ALTER TABLE dev.bank_offers ADD COLUMN multiplier NUMERIC');
      }
      if (!existingBankCols.includes('policy_vector')) {
        try {
          await client.query('ALTER TABLE dev.bank_offers ADD COLUMN policy_vector vector(3072)');
        } catch (e: unknown) {
          console.warn('Could not add policy_vector column. pgvector might not be enabled.');
        }
      } else {
        // Check dimension and update if necessary
        try {
          const dimResult = await client.query(`
            SELECT atttypmod 
            FROM pg_attribute 
            WHERE attrelid = 'dev.bank_offers'::regclass 
            AND attname = 'policy_vector'
          `);
          if (dimResult.rows.length > 0 && dimResult.rows[0].atttypmod !== 3072) {
            console.log('INFO: Updating bank_offers.policy_vector dimension to 3072...');
            await client.query('ALTER TABLE dev.bank_offers ALTER COLUMN policy_vector TYPE vector(3072)');
          }
        } catch (e: unknown) {
          console.warn('Could not update policy_vector dimension:', e);
        }
      }

      // Seed bank offers if table is empty
      const offersCount = await client.query('SELECT COUNT(*) FROM dev.bank_offers');
      if (parseInt(offersCount.rows[0].count) === 0) {
        console.log('INFO: Seeding default bank offers...');
        const seedOffers = [
          ['HDFC Bank', 'Personal Loan', 100000, 5000000, 10.5, 15.0, 1.0, 12, 60, 750, 12.5, 80, 25000, 'Rahul Sharma', '9876543210', 'rahul@hdfc.com', 'Flexible repayment options available with part-payment facility.', '2% of outstanding principal after 12 months.', 'Standard bank T&C apply. Minimum 2 years work experience required.', '2% of principal amount.'],
          ['ICICI Bank', 'Personal Loan', 50000, 3000000, 10.75, 16.0, 1.5, 12, 72, 720, 13.0, 75, 20000, 'Priya Gupta', '9876543211', 'priya@icici.com', 'Monthly EMI through ECS/NACH.', '3% preclosure charges apply.', 'Processing fee is non-refundable.', '3% of outstanding amount.'],
          ['SBI', 'Personal Loan', 25000, 2000000, 9.6, 12.0, 0.5, 12, 60, 700, 11.0, 90, 15000, 'Amit Kumar', '9876543212', 'amit@sbi.com', 'No hidden charges. Simple repayment.', 'Nil preclosure charges for government employees.', 'Lowest interest rates for salary account holders.', 'Nil for salary account holders, 1% for others.'],
          ['Axis Bank', 'Personal Loan', 50000, 4000000, 10.49, 14.5, 1.0, 12, 60, 750, 12.0, 85, 25000, 'Sanjay Singh', '9876543213', 'sanjay@axis.com', 'Multiple repayment channels.', 'Lock-in period of 6 months.', 'Instant approval for pre-qualified customers.', '5% of outstanding principal.'],
          ['Bajaj Finserv', 'Personal Loan', 30000, 2500000, 11.0, 18.0, 2.0, 12, 84, 750, 14.0, 70, 30000, 'Neha Verma', '9876543214', 'neha@bajaj.com', 'Flexi-loan options available.', 'Part-payment allowed at zero cost.', 'Minimal documentation required.', '3% of outstanding principal amount.']
        ];

        for (const offer of seedOffers) {
          await client.query(`
            INSERT INTO dev.bank_offers (
              bank_name, loan_type, min_amount, max_amount, 
              min_interest_rate, max_interest_rate, processing_fee, 
              min_tenure, max_tenure, min_cibil_score, 
              interest_rate_below_750, max_amount_percent_below_750, 
              min_income, contact_person, contact_phone, contact_email,
              repayment_policy, preclosure_charges, terms_conditions,
              foreclosure_charges
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
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
      } catch (e: unknown) {
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
          } catch (dupError: unknown) {
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
            } catch (pkAddError: unknown) {
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
            } catch (seqError: unknown) {
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
      } catch (e: unknown) {
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
      } catch (e: unknown) {
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
        } catch (fallbackError: unknown) {
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
          } catch (alterError: unknown) {
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
      } catch (e: unknown) {
        console.warn('Could not fix application_history table columns:', e);
      }

      await client.query(`
        CREATE TABLE IF NOT EXISTS dev.dynamic_suggestions (
          id SERIAL PRIMARY KEY,
          label TEXT UNIQUE,
          category TEXT,
          usage_count INTEGER DEFAULT 0,
          last_used TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          embedding vector(3072)
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

      if (!existingSugCols.includes('updated_at')) {
        await client.query('ALTER TABLE dev.dynamic_suggestions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP');
      }

      if (!existingSugCols.includes('embedding')) {
        try {
          await client.query('ALTER TABLE dev.dynamic_suggestions ADD COLUMN embedding vector(3072)');
        } catch (e: unknown) {
          console.warn('Could not add embedding column to dynamic_suggestions. pgvector might not be enabled.');
        }
      } else {
        // Check dimension and update if necessary
        try {
          const dimResult = await client.query(`
            SELECT atttypmod 
            FROM pg_attribute 
            WHERE attrelid = 'dev.dynamic_suggestions'::regclass 
            AND attname = 'embedding'
          `);
          if (dimResult.rows.length > 0 && dimResult.rows[0].atttypmod !== 3072) {
            console.log('INFO: Updating dynamic_suggestions.embedding dimension to 3072...');
            // If there's data, we might need to null it out or handle it, but for now we'll try direct alter
            await client.query('ALTER TABLE dev.dynamic_suggestions ALTER COLUMN embedding TYPE vector(3072)');
          }
        } catch (e: unknown) {
          console.warn('Could not update embedding dimension:', e);
        }
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
      } catch (e: unknown) {
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
        } catch (fallbackError: unknown) {
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

      // ============ ALIASES COLUMN MIGRATION ============
      // Check if aliases column exists in bank_offers table
      try {
        const aliasesCheckResult = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'dev' AND table_name = 'bank_offers' AND column_name = 'aliases'
        `);

        if (aliasesCheckResult.rows.length === 0) {
          console.log('INFO: Adding aliases column to dev.bank_offers...');
          // Add aliases column as TEXT array
          await client.query(`
            ALTER TABLE dev.bank_offers 
            ADD COLUMN aliases TEXT[] DEFAULT ARRAY[]::TEXT[]
          `);
          console.log('SUCCESS: aliases column added to dev.bank_offers');

          // Initialize aliases for existing banks
          console.log('INFO: Initializing aliases for banks...');
          
          // HDFC Bank
          await client.query(`
            UPDATE dev.bank_offers 
            SET aliases = ARRAY['HDFC Bank', 'HDFC', 'hdfc', 'Hdfc', 'HDFC Bank Ltd', 'HDFC Ltd']
            WHERE bank_name = 'HDFC Bank'
          `);

          // ICICI Bank
          await client.query(`
            UPDATE dev.bank_offers 
            SET aliases = ARRAY['ICICI Bank', 'ICICI', 'icici', 'Icici', 'ICICI Bank Ltd', 'ICICI Ltd']
            WHERE bank_name = 'ICICI Bank'
          `);

          // SBI (State Bank of India)
          await client.query(`
            UPDATE dev.bank_offers 
            SET aliases = ARRAY['SBI', 'sbi', 'State Bank of India', 'State Bank', 'SBI Bank', 'SBI Ltd']
            WHERE bank_name = 'SBI'
          `);

          console.log('SUCCESS: Aliases initialized for HDFC Bank, ICICI Bank, and SBI');
        } else {
          console.log('INFO: aliases column already exists in dev.bank_offers');
          
          // Check if aliases are empty/null and populate if needed
          const emptyAliasesResult = await client.query(`
            SELECT COUNT(*) FROM dev.bank_offers 
            WHERE aliases IS NULL OR aliases = ARRAY[]::TEXT[]
          `);
          
          const emptyCount = parseInt(emptyAliasesResult.rows[0].count);
          if (emptyCount > 0) {
            console.log(`INFO: Found ${emptyCount} banks with empty aliases. Populating...`);
            
            // HDFC Bank
            await client.query(`
              UPDATE dev.bank_offers 
              SET aliases = ARRAY['HDFC Bank', 'HDFC', 'hdfc', 'Hdfc', 'HDFC Bank Ltd', 'HDFC Ltd']
              WHERE bank_name = 'HDFC Bank' AND (aliases IS NULL OR aliases = ARRAY[]::TEXT[])
            `);

            // ICICI Bank
            await client.query(`
              UPDATE dev.bank_offers 
              SET aliases = ARRAY['ICICI Bank', 'ICICI', 'icici', 'Icici', 'ICICI Bank Ltd', 'ICICI Ltd']
              WHERE bank_name = 'ICICI Bank' AND (aliases IS NULL OR aliases = ARRAY[]::TEXT[])
            `);

            // SBI
            await client.query(`
              UPDATE dev.bank_offers 
              SET aliases = ARRAY['SBI', 'sbi', 'State Bank of India', 'State Bank', 'SBI Bank', 'SBI Ltd']
              WHERE bank_name = 'SBI' AND (aliases IS NULL OR aliases = ARRAY[]::TEXT[])
            `);

            console.log('SUCCESS: Aliases populated for banks with empty values');
          }
        }
      } catch (aliasError: unknown) {
        console.error('ERROR: Failed to create/initialize aliases column:', aliasError);
        throw aliasError;
      }
      // ============ END ALIASES MIGRATION ============

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
  } catch (err: unknown) {
    const errorStack = err instanceof Error ? err.stack : String(err);
    console.error('CRITICAL: Database initialization failed!', errorStack);
  }
};
