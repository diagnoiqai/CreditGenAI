import { Router } from 'express';
import multer from 'multer';
import { pool } from '../config/db.ts';
import { sendEmail } from '../services/emailService.ts';
import { sendWhatsAppMessage } from '../services/whatsappService.ts';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Admin: Bank Offers
router.get('/bank-offers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM dev.bank_offers ORDER BY bank_name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bank offers' });
  }
});

router.post('/bank-offers', async (req, res) => {
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
          repayment_policy = $16, preclosure_charges = $17, terms_conditions = $18,
          min_age = $19, max_age = $20, min_net_salary_tier1 = $21, min_net_salary_tier2 = $22,
          employment_type = $23, min_work_experience = $24, salary_mode = $25,
          foir_cap = $26, prepayment_charges = $27, foreclosure_charges = $28,
          time_to_disbursal = $29, documents_required = $30, stamp_duty_fee = $31,
          emi_bounce_charges = $32, multiplier = $33, policy_vector = $34::vector
        WHERE id = $35::uuid`,
        [
          offer.bankName, offer.loanType, offer.minAmount, offer.maxAmount,
          offer.minInterestRate, offer.maxInterestRate, offer.processingFee,
          offer.minTenure, offer.maxTenure, offer.minCibilScore,
          offer.interestRateBelow750, offer.maxAmountPercentBelow750,
          offer.contactPerson, offer.contactPhone, offer.contactEmail,
          offer.repaymentPolicy, offer.preclosureCharges, offer.termsConditions,
          offer.minAge, offer.maxAge, offer.minNetSalaryTier1, offer.minNetSalaryTier2,
          offer.employmentType, offer.minWorkExperience, offer.salaryMode,
          offer.foirCap, offer.prepaymentCharges, offer.foreclosureCharges,
          offer.timeToDisbursal, offer.documentsRequired, offer.stampDutyFee,
          offer.emiBounceCharges, offer.multiplier,
          offer.policyVector ? `[${offer.policyVector.join(',')}]` : null,
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
          repayment_policy, preclosure_charges, terms_conditions,
          min_age, max_age, min_net_salary_tier1, min_net_salary_tier2,
          employment_type, min_work_experience, salary_mode,
          foir_cap, prepayment_charges, foreclosure_charges,
          time_to_disbursal, documents_required, stamp_duty_fee,
          emi_bounce_charges, multiplier, policy_vector
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34::vector) RETURNING id`,
        [
          offer.bankName, offer.loanType, offer.minAmount, offer.maxAmount,
          offer.minInterestRate, offer.maxInterestRate, offer.processingFee,
          offer.minTenure, offer.maxTenure, offer.minCibilScore,
          offer.interestRateBelow750, offer.maxAmountPercentBelow750,
          offer.contactPerson, offer.contactPhone, offer.contactEmail,
          offer.repaymentPolicy, offer.preclosureCharges, offer.termsConditions,
          offer.minAge, offer.maxAge, offer.minNetSalaryTier1, offer.minNetSalaryTier2,
          offer.employmentType, offer.minWorkExperience, offer.salaryMode,
          offer.foirCap, offer.prepaymentCharges, offer.foreclosureCharges,
          offer.timeToDisbursal, offer.documentsRequired, offer.stampDutyFee,
          offer.emiBounceCharges, offer.multiplier,
          offer.policyVector ? `[${offer.policyVector.join(',')}]` : null
        ]
      );
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save bank offer' });
  }
});

router.delete('/bank-offers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM dev.bank_offers WHERE id = $1::uuid', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete bank offer' });
  }
});

// Admin: Leads
router.get('/leads', async (req, res) => {
  const limit = req.query.limit || 100;
  try {
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
        COALESCE(a.user_name, u.display_name) as user_name, 
        COALESCE(a.user_email, u.email) as user_email, 
        COALESCE(a.user_mobile, u.mobile) as user_mobile, 
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
      id: row.id || `user-${row.uid}`,
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

router.patch('/leads/:id/status', async (req, res) => {
  const { status, rejectionReason, subStatus, statusNotes, updatedBy } = req.body;
  const leadId = req.params.id;
  
  try {
    let applicationId: any;
    
    if (leadId.startsWith('user-')) {
      const uid = leadId.replace('user-', '');
      const userResult = await pool.query('SELECT * FROM dev.users WHERE uid = $1::text', [uid]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const user = userResult.rows[0];
      const insertResult = await pool.query(
        `INSERT INTO dev.applications 
         (uid, user_name, user_email, user_mobile, loan_type, loan_amount, status, sub_status, status_notes, rejection_reason, bank_id, bank_name) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
         RETURNING id`,
        [
          uid, user.display_name || null, user.email || null, user.mobile || null, 
          user.loan_type || 'Personal Loan', user.loan_amount_required || 0, 
          status, subStatus || null, statusNotes || null, rejectionReason || null,
          'manual', 'Manual Entry'
        ]
      );
      applicationId = insertResult.rows[0].id;
    } else {
      applicationId = leadId;
      await pool.query(
        'UPDATE dev.applications SET status = $1, rejection_reason = $2, sub_status = $3, status_notes = $4 WHERE id = $5::text',
        [status, rejectionReason, subStatus, statusNotes, applicationId]
      );
    }
    
    await pool.query(
      'INSERT INTO dev.application_history (application_id, status, sub_status, status_notes, rejection_reason, updated_by) VALUES ($1::text, $2, $3, $4, $5, $6)',
      [applicationId, status, subStatus, statusNotes, rejectionReason, updatedBy]
    );

    // Notifications
    const appResult = await pool.query('SELECT * FROM dev.applications WHERE id = $1::text', [applicationId]);
    if (appResult.rows.length > 0) {
      const app = appResult.rows[0];
      
      // WhatsApp
      if (app.user_mobile) {
        let messageBody = `Hello ${app.user_name},\n\nYour loan application for ${app.bank_name || 'your chosen bank'} has been updated.\n\nNew Status: *${status}*\n${subStatus ? `Update: ${subStatus}` : ''}\n\nYou can check more details in your dashboard.`;
        if (status === 'Rejected') {
          const reason = rejectionReason || statusNotes || 'internal bank policies';
          messageBody = `Hello ${app.user_name},\n\nWe regret to inform you that your loan application for ${app.bank_name || 'your chosen bank'} could not be approved at this time.\n\n*Reason:* ${reason}\n\nDon't worry! You can visit your dashboard to explore other loan options that might be a better fit for your profile.`;
        }
        await sendWhatsAppMessage(app.user_mobile, messageBody);
      }

      // Email
      if (app.user_email) {
        let emailSubject = `Application Status Updated - ${app.bank_name || 'CreditGenAI'}`;
        let emailText = `Hello ${app.user_name},\n\nYour loan application for ${app.bank_name || 'your chosen bank'} has been updated to: ${status}.\n\n${subStatus ? `Update: ${subStatus}\n` : ''}${statusNotes ? `Notes: ${statusNotes}\n` : ''}\nYou can check more details in your dashboard.`;
        if (status === 'Rejected') {
          emailSubject = `Update regarding your loan application - ${app.bank_name || 'CreditGenAI'}`;
          const reason = rejectionReason || statusNotes || 'internal bank policies';
          emailText = `Hello ${app.user_name},\n\nWe regret to inform you that your loan application for ${app.bank_name || 'your chosen bank'} could not be approved at this time.\n\nReason: ${reason}\n\nDon't worry! You can visit your dashboard to explore other loan options that might be a better fit for your profile.\n\nBest regards,\nCreditGenAI Team`;
        }
        await sendEmail({
          to: app.user_email,
          subject: emailSubject,
          text: emailText
        });
      }
    }

    res.json({ success: true, applicationId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update lead status' });
  }
});

router.get('/leads/:id/history', async (req, res) => {
  const leadId = req.params.id;
  try {
    if (leadId.startsWith('user-')) return res.json([]);
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
router.get('/users', async (req, res) => {
  const limit = req.query.limit || 200;
  try {
    const result = await pool.query('SELECT * FROM dev.users LIMIT $1::integer', [limit]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.patch('/users/:uid/role', async (req, res) => {
  const { role, permissions } = req.body;
  try {
    await pool.query('UPDATE dev.users SET role = $1, permissions = $2 WHERE uid = $3::text', [role, permissions, req.params.uid]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

router.patch('/users/:uid/permissions', async (req, res) => {
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
router.get('/staff-invites', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM dev.staff_invites ORDER BY created_at DESC');
    res.json(result.rows.map(row => ({
      id: row.id, email: row.email, role: row.role, permissions: row.permissions,
      invitedBy: row.invited_by, timestamp: row.created_at
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch staff invites' });
  }
});

router.post('/staff-invites', async (req, res) => {
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

router.delete('/staff-invites/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM dev.staff_invites WHERE id = $1::uuid', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete staff invite' });
  }
});

router.post('/test-email', async (req, res) => {
  const { to } = req.body;
  try {
    const result = await sendEmail({
      to: to || process.env.SMTP_USER,
      subject: 'CreditGenAI - SMTP Test Connection',
      text: 'This is a test email to verify your SMTP configuration. If you received this, your email service is working correctly!'
    });
    res.json({ success: true, messageId: result.messageId });
  } catch (err: any) {
    console.error('SMTP TEST ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin: Analytics
router.get('/analytics', async (req, res) => {
  try {
    const leadsResult = await pool.query('SELECT status, COUNT(*) FROM dev.applications GROUP BY status');
    const usersResult = await pool.query('SELECT COUNT(*) FROM dev.users WHERE role = \'user\' OR role IS NULL');
    const banksResult = await pool.query('SELECT COUNT(*) FROM dev.bank_offers');
    
    const leadsByStatus: Record<string, number> = {};
    leadsResult.rows.forEach(row => {
      leadsByStatus[row.status] = parseInt(row.count);
    });

    const totalLeads = Object.values(leadsByStatus).reduce((a, b) => a + b, 0);
    const approvedLeads = leadsByStatus['Approved'] || 0;
    const conversionRate = totalLeads > 0 ? Math.round((approvedLeads / totalLeads) * 100) : 0;

    res.json({
      totalLeads,
      totalUsers: parseInt(usersResult.rows[0].count),
      totalBanks: parseInt(banksResult.rows[0].count),
      conversionRate,
      leadsByStatus
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Admin: System Status
router.get('/status', async (req, res) => {
  try {
    const dbCheck = await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      database: dbCheck.rows.length > 0 ? 'connected' : 'error',
      pool: {
        total: pool.totalCount,
        idle: pool.idleCount,
        active: pool.waitingCount
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// Admin: Token Usage
router.get('/usage/debug', async (req, res) => {
  try {
    const cols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'dev' AND table_name = 'token_usage'
    `);
    res.json(cols.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Token Usage
router.get('/usage', async (req, res) => {
  try {
    const dailyUsage = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        SUM(input_tokens) as total_input,
        SUM(output_tokens) as total_output,
        COUNT(*) as total_requests
      FROM dev.token_usage
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) DESC
      LIMIT 30
    `);

    const userUsage = await pool.query(`
      SELECT 
        u.display_name,
        u.email,
        t.uid,
        SUM(t.input_tokens) as total_input,
        SUM(t.output_tokens) as total_output,
        COUNT(*) as total_requests
      FROM dev.token_usage t
      JOIN dev.users u ON t.uid = u.uid
      GROUP BY t.uid, u.display_name, u.email
      ORDER BY SUM(t.input_tokens) + SUM(t.output_tokens) DESC
      LIMIT 50
    `);

    res.json({
      daily: dailyUsage.rows,
      users: userUsage.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch token usage' });
  }
});

// Admin: Suggestions Upload
router.post('/suggestions/upload', async (req, res) => {
  const { suggestions } = req.body;

  if (!suggestions || !Array.isArray(suggestions)) {
    return res.status(400).json({ error: 'Invalid suggestions data' });
  }

  try {
    for (const item of suggestions) {
      const { label, embedding } = item;
      const vectorStr = `[${embedding.join(',')}]`;
      
      await pool.query(
        `INSERT INTO dev.dynamic_suggestions (label, embedding) 
         VALUES ($1, $2::vector) 
         ON CONFLICT (label) DO UPDATE SET embedding = $2::vector, updated_at = CURRENT_TIMESTAMP`,
        [label, vectorStr]
      );
    }

    res.json({ success: true, count: suggestions.length });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to process suggestions' });
  }
});

export default router;
