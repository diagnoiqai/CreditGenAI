import { Router } from 'express';
import { pool } from '../config/db.ts';

const router = Router();

// Auth: Check Invite
router.get('/check-invite/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const result = await pool.query('SELECT * FROM dev.staff_invites WHERE email = $1::text', [email]);
    if (result.rows.length > 0) res.json(result.rows[0]);
    else res.status(404).json({ error: 'No invite found' });
  } catch (error) {
    console.error('DB Error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
