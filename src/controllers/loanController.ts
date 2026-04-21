import { Request, Response } from 'express';
import { pool } from '../config/db.ts';
import { sendEmail } from '../services/emailService.ts';
import { sendWhatsAppMessage } from '../services/whatsappService.ts';

export const getApplications = async (req: Request, res: Response) => {
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
    res.json(result.rows.map((row: any) => ({
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
      attachments: row.attachments,
      userPhone: row.user_phone
    })));
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("DB Error:", errMsg);
    res.status(500).json({ error: "Database error" });
  }
};

export const applyForLoan = async (req: Request, res: Response) => {
  const { profile, bankOffer } = req.body;

  if (!profile || !bankOffer) {
    return res.status(400).json({ error: "Missing profile or bank offer data" });
  }

  try {
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
      "INSERT INTO dev.applications (uid, user_name, user_email, user_phone, bank_id, bank_name, loan_type, loan_amount, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id",
      [profile.uid, profile.displayName, profile.email, profile.mobile || profile.phone, String(bankOffer.id), bankOffer.bankName, bankOffer.loanType, profile.loanAmountRequired, 'Pending']
    );
    
    await pool.query(
      'INSERT INTO dev.application_history (application_id, status, sub_status, status_notes) VALUES ($1::text, $2, $3, $4)',
      [result.rows[0].id, 'Pending', 'Application Submitted', 'User submitted the application through CreditGenAI.']
    );
    
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
      await sendEmail({
        to: bankOffer.contactEmail || 'bank-representative@example.com',
        subject: `New Loan Application - ${profile.displayName}`,
        text: emailContent,
      });
    } catch (emailError: unknown) {
      const emailMsg = emailError instanceof Error ? emailError.message : String(emailError);
      console.error("FAILED TO SEND EMAIL:", emailMsg);
    }

    if (profile.mobile) {
      try {
        await sendWhatsAppMessage(
          profile.mobile,
          `Hi ${profile.displayName}, we received your application for ${bankOffer.bankName}. To proceed further, please send PAN, AADHAR, Last 3 month payslips, and last 6 months bank statement as attachments here.`
        );
      } catch (waError: unknown) {
        const waMsg = waError instanceof Error ? waError.message : String(waError);
        console.error("FAILED TO SEND INITIAL WHATSAPP:", waMsg);
      }
    }

    res.json({ 
      success: true, 
      message: `Application details sent to ${bankOffer.bankName} representative (${bankOffer.contactPerson}).` 
    });

  } catch (dbError: unknown) {
    const dbMsg = dbError instanceof Error ? dbError.message : String(dbError);
    console.error("Failed to save application to DB:", dbMsg);
    return res.status(500).json({ success: false, message: 'Failed to process application in database. Please try again.' });
  }
};

export const getBankOffers = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM dev.bank_offers ORDER BY bank_name ASC');
    res.json(result.rows);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(errMsg);
    res.status(500).json({ error: "Failed to fetch bank offers" });
  }
};

export const searchPolicies = async (req: Request, res: Response) => {
  const { query } = req.body;
  try {
    // 1. Try exact bank name match first
    const exactMatch = await pool.query(`
      SELECT id, bank_name, loan_type, repayment_policy, preclosure_charges, terms_conditions, foreclosure_charges, 1.0 as similarity
      FROM dev.bank_offers
      WHERE bank_name ILIKE $1
      LIMIT 1
    `, [query]);

    if (exactMatch.rows.length > 0) {
      return res.json(exactMatch.rows);
    }

    // 2. Try matching bank name with words
    const words = query.split(/\s+/).filter((w: string) => w.length > 2);
    if (words.length > 0) {
      const bankNameMatch = await pool.query(`
        SELECT id, bank_name, loan_type, repayment_policy, preclosure_charges, terms_conditions, foreclosure_charges, 0.8 as similarity
        FROM dev.bank_offers
        WHERE ${words.map((_: string, i: number) => `bank_name ILIKE $${i + 1}`).join(' OR ')}
        LIMIT 3
      `, words.map((w: string) => `%${w}%`));

      if (bankNameMatch.rows.length > 0) {
        return res.json(bankNameMatch.rows);
      }
    }

    // 3. Fallback to broad search
    const searchTerms = words.map((w: string) => `%${w}%`);
    let results: any[] = [];
    
    if (searchTerms.length > 0) {
      const conditions = searchTerms.map((_: string, i: number) => `(bank_name ILIKE $${i + 1} OR repayment_policy ILIKE $${i + 1} OR preclosure_charges ILIKE $${i + 1} OR terms_conditions ILIKE $${i + 1} OR foreclosure_charges ILIKE $${i + 1})`).join(' OR ');
      const textResult = await pool.query(`
        SELECT id, bank_name, loan_type, repayment_policy, preclosure_charges, terms_conditions, foreclosure_charges, 0.5 as similarity
        FROM dev.bank_offers
        WHERE ${conditions}
        LIMIT 5
      `, searchTerms);
      results = textResult.rows;
    } else {
      const textResult = await pool.query(`
        SELECT id, bank_name, loan_type, repayment_policy, preclosure_charges, terms_conditions, foreclosure_charges, 0.5 as similarity
        FROM dev.bank_offers
        WHERE bank_name ILIKE $1 OR repayment_policy ILIKE $1 OR preclosure_charges ILIKE $1 OR terms_conditions ILIKE $1 OR foreclosure_charges ILIKE $1
        LIMIT 3
      `, [`%${query}%`]);
      results = textResult.rows;
    }
    
    res.json(results.slice(0, 5));
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Error searching policies:', errMsg);
    res.status(500).json({ error: 'Failed to search policies' });
  }
};

export const handleWhatsAppWebhook = async (req: Request, res: Response) => {
  const { From, Body, NumMedia, MessageSid } = req.body;
  const fromMobile = From.replace('whatsapp:', '');
  
  if (parseInt(NumMedia) > 0) {
    try {
      const userResult = await pool.query(
        "SELECT uid FROM dev.users WHERE phone LIKE $1::text OR phone = $2::text",
        [`%${fromMobile.slice(-10)}`, fromMobile]
      );

      if (userResult.rows.length > 0) {
        const uid = userResult.rows[0].uid;
        const appResult = await pool.query(
          "SELECT id FROM dev.applications WHERE uid = $1::text AND status = 'Pending' ORDER BY created_at DESC LIMIT 1",
          [uid]
        );

        if (appResult.rows.length > 0) {
          const appId = appResult.rows[0].id;

          for (let i = 0; i < parseInt(NumMedia); i++) {
            const mediaUrl = req.body[`MediaUrl${i}`];
            const contentType = req.body[`MediaContentType${i}`];
            const fileName = `whatsapp_media_${MessageSid}_${i}`;

            await pool.query(
              "INSERT INTO dev.application_attachments (application_id, file_url, file_name, file_type) VALUES ($1, $2, $3, $4)",
              [appId, mediaUrl, fileName, contentType]
            );
          }

          await pool.query(
            "UPDATE dev.applications SET status = 'Documents Received', sub_status = 'Documents Uploaded via WhatsApp' WHERE id = $1::text",
            [appId]
          );

          await pool.query(
            "INSERT INTO dev.application_history (application_id, status, sub_status, status_notes) VALUES ($1, $2, $3, $4)",
            [appId, 'Documents Received', 'Documents Uploaded via WhatsApp', `Received ${NumMedia} documents via WhatsApp.`]
          );
          
          await sendWhatsAppMessage(From, "Thank you! We have received your documents. Our team will review them and proceed with the CIBIL check shortly.");
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("ERROR PROCESSING WHATSAPP MEDIA:", errMsg);
    }
  }

  res.status(200).send('<Response></Response>');
};
