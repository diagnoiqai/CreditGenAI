import { Router } from 'express';
import { pool } from '../config/db.ts';

const router = Router();

// Log AI Token Usage
router.post("/log-usage", async (req, res) => {
  try {
    const { uid, inputTokens, outputTokens, model } = req.body;
    await pool.query(
      "INSERT INTO dev.token_usage (uid, input_tokens, output_tokens, model) VALUES ($1, $2, $3, $4)",
      [uid, inputTokens, outputTokens, model]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error logging token usage:", error);
    res.status(500).json({ error: "Failed to log usage" });
  }
});

// Dynamic Suggestions
router.get("/suggestions", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM dev.dynamic_suggestions ORDER BY usage_count DESC, last_used DESC LIMIT 10');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

router.post("/suggestions/record", async (req, res) => {
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

// Get Chat History
router.get("/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    
    if (!uid || uid === 'undefined' || uid === 'null') {
      return res.json({ messages: [] });
    }
    
    const result = await pool.query("SELECT * FROM dev.chat_sessions WHERE uid = $1::text", [uid]);
    
    if (result.rows.length > 0) {
      const session = result.rows[0];
      const messages = Array.isArray(session.messages) ? session.messages : [];
      
      // Filter messages older than 24 hours
      const now = new Date();
      const filteredMessages = messages.filter((msg: any) => {
        const msgTime = new Date(msg.timestamp);
        const diffHours = (now.getTime() - msgTime.getTime()) / (1000 * 60 * 60);
        return diffHours <= 24;
      });

      // If messages were filtered, we could update the DB here, 
      // but returning the filtered list is enough for the user's requirement.
      return res.json({ ...session, messages: filteredMessages });
    }
    
    res.json({ messages: [] });
  } catch (error) {
    console.error("DB Error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// Save Chat History
router.post("/", async (req, res) => {
  try {
    const { uid, messages } = req.body;
    
    if (!uid) {
      console.warn("⚠️ Chat Save Attempted without UID");
      return res.status(400).json({ error: "User ID (uid) is required to save chat history." });
    }
    
    // Filter messages older than 24 hours before saving
    const now = new Date();
    const filteredMessages = (messages || []).filter((msg: any) => {
      const msgTime = new Date(msg.timestamp);
      const diffHours = (now.getTime() - msgTime.getTime()) / (1000 * 60 * 60);
      return diffHours <= 24;
    });

    const query = `
      INSERT INTO dev.chat_sessions (uid, messages, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (uid) DO UPDATE SET
        messages = EXCLUDED.messages,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await pool.query(query, [uid, JSON.stringify(filteredMessages)]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("DB Error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
