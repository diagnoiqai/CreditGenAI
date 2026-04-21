import { Request, Response } from 'express';
import { pool } from '../config/db.ts';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const query = `
      SELECT 
        u.*,
        s.company_type, s.company_name, s.work_experience, s.total_experience, s.monthly_income,
        se.itr_filed, se.annual_income_itr, se.annual_income_ideal, se.years_of_business
      FROM dev.users u
      LEFT JOIN dev.user_salaried_details s ON u.uid = s.uid
      LEFT JOIN dev.user_self_employed_details se ON u.uid = se.uid
      WHERE u.uid = $1::text
    `;
    const result = await pool.query(query, [uid]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("DB Error (getProfile):", error);
    res.status(500).json({ error: "Database error" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { 
      uid, email, display_name, monthly_income, employment_type, 
      company_type, company_name, work_experience, total_experience,
      city, existing_emis, age, cibil_score, 
      loan_amount_required, loan_type, mobile, phone, gender, marital_status, role, permissions,
      form_completed, itr_filed, annual_income_itr, annual_income_ideal, years_of_business
    } = req.body;

    await client.query('BEGIN');

    // 1. Update Core Identity Table
    const coreQuery = `
      INSERT INTO dev.users (
        uid, email, display_name, phone, gender, marital_status, age, city,
        auth_method, user_type, role, permissions, form_completed, employment_type,
        loan_amount_required, loan_type, existing_emis, cibil_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT (uid) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, dev.users.email),
        display_name = COALESCE(EXCLUDED.display_name, dev.users.display_name),
        phone = COALESCE(EXCLUDED.phone, dev.users.phone),
        gender = COALESCE(EXCLUDED.gender, dev.users.gender),
        marital_status = COALESCE(EXCLUDED.marital_status, dev.users.marital_status),
        age = COALESCE(EXCLUDED.age, dev.users.age),
        city = COALESCE(EXCLUDED.city, dev.users.city),
        role = COALESCE(EXCLUDED.role, dev.users.role),
        permissions = COALESCE(EXCLUDED.permissions, dev.users.permissions),
        form_completed = COALESCE(EXCLUDED.form_completed, dev.users.form_completed),
        employment_type = COALESCE(EXCLUDED.employment_type, dev.users.employment_type),
        loan_amount_required = COALESCE(EXCLUDED.loan_amount_required, dev.users.loan_amount_required),
        loan_type = COALESCE(EXCLUDED.loan_type, dev.users.loan_type),
        existing_emis = COALESCE(EXCLUDED.existing_emis, dev.users.existing_emis),
        cibil_score = COALESCE(EXCLUDED.cibil_score, dev.users.cibil_score)
      RETURNING *
    `;

    await client.query(coreQuery, [
      uid, email, display_name, mobile || phone, gender, marital_status, age, city || null,
      'phone_otp', 'phone_verified', role || 'user', JSON.stringify(permissions || []),
      form_completed || false, employment_type || null, loan_amount_required || null,
      loan_type || null, existing_emis || null, cibil_score || null
    ]);

    // 2. Update Extension Tables based on Employment Type
    if (employment_type === 'Salaried') {
      const salariedQuery = `
        INSERT INTO dev.user_salaried_details (
          uid, company_type, company_name, work_experience, total_experience, monthly_income
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (uid) DO UPDATE SET
          company_type = EXCLUDED.company_type,
          company_name = EXCLUDED.company_name,
          work_experience = EXCLUDED.work_experience,
          total_experience = EXCLUDED.total_experience,
          monthly_income = EXCLUDED.monthly_income,
          updated_at = CURRENT_TIMESTAMP
      `;
      await client.query(salariedQuery, [
        uid, company_type || null, company_name || null, work_experience || null, 
        total_experience || null, monthly_income || null
      ]);
      // Cleanup other extension if it exists
      await client.query('DELETE FROM dev.user_self_employed_details WHERE uid = $1', [uid]);
    } else if (employment_type === 'Self-employed') {
      const selfEmployedQuery = `
        INSERT INTO dev.user_self_employed_details (
          uid, itr_filed, annual_income_itr, annual_income_ideal, years_of_business
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (uid) DO UPDATE SET
          itr_filed = EXCLUDED.itr_filed,
          annual_income_itr = EXCLUDED.annual_income_itr,
          annual_income_ideal = EXCLUDED.annual_income_ideal,
          years_of_business = EXCLUDED.years_of_business,
          updated_at = CURRENT_TIMESTAMP
      `;
      await client.query(selfEmployedQuery, [
        uid, itr_filed || null, annual_income_itr || null, 
        annual_income_ideal || null, years_of_business || null
      ]);
      // Cleanup other extension if it exists
      await client.query('DELETE FROM dev.user_salaried_details WHERE uid = $1', [uid]);
    }

    await client.query('COMMIT');

    // Return the joined profile
    const finalQuery = `
      SELECT 
        u.*,
        s.company_type, s.company_name, s.work_experience, s.total_experience, s.monthly_income,
        se.itr_filed, se.annual_income_itr, se.annual_income_ideal, se.years_of_business
      FROM dev.users u
      LEFT JOIN dev.user_salaried_details s ON u.uid = s.uid
      LEFT JOIN dev.user_self_employed_details se ON u.uid = se.uid
      WHERE u.uid = $1::text
    `;
    const finalResult = await client.query(finalQuery, [uid]);
    res.json(finalResult.rows[0]);

  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error("DB Transaction Error (updateProfile):", error);
    res.status(500).json({ error: "Database error" });
  } finally {
    client.release();
  }
};
