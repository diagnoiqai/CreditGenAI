import { Request, Response } from 'express';
import { pool } from '../config/db.ts';

export const getProfile = async (req: Request, res: Response) => {
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
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { 
      uid, email, display_name, monthly_income, employment_type, 
      company_type, company_name, work_experience, total_experience,
      city, existing_emis, age, cibil_score, 
      loan_amount_required, loan_type, mobile, gender, marital_status, role, permissions
    } = req.body;

    const query = `
      INSERT INTO dev.users (
        uid, email, display_name, monthly_income, employment_type, 
        company_type, company_name, work_experience, total_experience,
        city, existing_emis, age, cibil_score, 
        loan_amount_required, loan_type, mobile, gender, marital_status, role, permissions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      ON CONFLICT (uid) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, dev.users.email),
        display_name = COALESCE(EXCLUDED.display_name, dev.users.display_name),
        monthly_income = COALESCE(EXCLUDED.monthly_income, dev.users.monthly_income),
        employment_type = COALESCE(EXCLUDED.employment_type, dev.users.employment_type),
        company_type = COALESCE(EXCLUDED.company_type, dev.users.company_type),
        company_name = COALESCE(EXCLUDED.company_name, dev.users.company_name),
        work_experience = COALESCE(EXCLUDED.work_experience, dev.users.work_experience),
        total_experience = COALESCE(EXCLUDED.total_experience, dev.users.total_experience),
        city = COALESCE(EXCLUDED.city, dev.users.city),
        existing_emis = COALESCE(EXCLUDED.existing_emis, dev.users.existing_emis),
        age = COALESCE(EXCLUDED.age, dev.users.age),
        cibil_score = COALESCE(EXCLUDED.cibil_score, dev.users.cibil_score),
        loan_amount_required = COALESCE(EXCLUDED.loan_amount_required, dev.users.loan_amount_required),
        loan_type = COALESCE(EXCLUDED.loan_type, dev.users.loan_type),
        mobile = COALESCE(EXCLUDED.mobile, dev.users.mobile),
        gender = COALESCE(EXCLUDED.gender, dev.users.gender),
        marital_status = COALESCE(EXCLUDED.marital_status, dev.users.marital_status),
        role = COALESCE(EXCLUDED.role, dev.users.role),
        permissions = COALESCE(EXCLUDED.permissions, dev.users.permissions)
      RETURNING *
    `;

    const result = await pool.query(query, [
      uid, email, display_name, monthly_income, employment_type, 
      company_type, company_name, work_experience, total_experience,
      city, existing_emis, age, cibil_score, 
      loan_amount_required, loan_type, mobile, gender, marital_status, role || 'user', 
      JSON.stringify(permissions || [])
    ]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error("DB Error:", error);
    res.status(500).json({ error: "Database error" });
  }
};
