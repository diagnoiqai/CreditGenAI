import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Import modular components
import { pool } from "./src/config/db.ts";
import { initDb } from "./src/db/init.ts";
import { verifySmtp, transporter } from "./src/services/emailService.ts";
import { initTwilio } from "./src/services/whatsappService.ts";

// Import routes
import userRoutes from "./src/routes/userRoutes.ts";
import loanRoutes from "./src/routes/loanRoutes.ts";
import chatRoutes from "./src/routes/chatRoutes.ts";
import adminRoutes from "./src/routes/adminRoutes.ts";
import authRoutes from "./src/routes/authRoutes.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Initialize Database
  await initDb();
  
  // Initialize Services
  verifySmtp();
  initTwilio();
  
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- API ROUTES ---

  // Health Check
  app.get("/api/health", async (req, res) => {
    try {
      await pool.query('SELECT 1');
      
      let smtpStatus = "unknown";
      let smtpError = null;
      
      const isEmailDisabled = process.env.DISABLE_EMAIL === 'true' || !process.env.SMTP_USER;

      if (isEmailDisabled) {
        smtpStatus = "disabled";
      } else if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        smtpStatus = "not_configured";
      } else {
        try {
          await new Promise((resolve, reject) => {
            transporter.verify((error, success) => {
              if (error) reject(error);
              else resolve(success);
            });
          });
          smtpStatus = "connected";
        } catch (err: any) {
          smtpStatus = "error";
          smtpError = err.message;
        }
      }

      res.json({ 
        status: "ok", 
        database: "connected",
        smtp: {
          status: smtpStatus,
          error: smtpError,
          host: process.env.SMTP_HOST || "smtp.gmail.com"
        }
      });
    } catch (err: any) {
      res.status(500).json({ status: "error", database: "disconnected", message: err.message });
    }
  });

  // Register Modular Routes
  app.use("/api/user", userRoutes);
  app.use("/api/chat", chatRoutes); // Handles /api/chat, /api/chat/suggestions, /api/chat/suggestions/record
  app.use("/api", loanRoutes); // Handles /api/apply, /api/applications, /api/bank-offers, /api/policy-search, /api/whatsapp/webhook
  app.use("/api/admin", adminRoutes); // Handles /api/admin/*
  app.use("/api/auth", authRoutes); // Handles /api/auth/check-invite

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
