import { Router } from 'express';
import { pool } from '../config/db.ts';
import { phoneAuthService } from '../services/phoneAuthService.ts';

const router = Router();

// Auth: Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    console.log(`[DEBUG] Received send-otp request for: ${phone}`);
    
    if (!phone) {
      console.warn('[DEBUG] Missing phone number in request body');
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const result = await phoneAuthService.initiateSendOTP(phone);
    console.log(`[DEBUG] phoneAuthService.initiateSendOTP result:`, result);
    
    if (result.success) {
      res.json(result);
    } else {
      console.warn(`[DEBUG] OTP initiation failed: ${result.message}`);
      res.status(400).json(result);
    }
  } catch (error: any) {
    console.error('[DEBUG] CRITICAL ERROR in send-otp route:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
});

// Auth: Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP are required' });

    const result = await phoneAuthService.verifyOTP(phone, otp);
    if (result.success) {
      // TODO: Generate actual JWT in Phase 4
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('verify-otp Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Auth: OTP Status
router.get('/otp-status/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const result = await phoneAuthService.getOTPStatus(phone);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
