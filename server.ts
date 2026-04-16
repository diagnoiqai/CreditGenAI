import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

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


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'];

  // Configure CORS for production
  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || ALLOWED_ORIGINS.some(allowed => origin.includes(allowed))) {
        callback(null, true);
      } else if (NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('CORS policy: Origin not allowed'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };

  app.use(cors(corsOptions));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Initialize Database
  try {
    await initDb();
    console.log('[DB] Database initialized successfully');
  } catch (err: any) {
    console.error('[DB] Failed to initialize database:', err.message);
    process.exit(1);
  }

  // Initialize Services
  try {
    verifySmtp();
    console.log('[SMTP] Email service initialized');
  } catch (err: any) {
    console.warn('[SMTP] Email service warning:', err.message);
  }

  try {
    initTwilio();
    console.log('[TWILIO] WhatsApp service initialized');
  } catch (err: any) {
    console.warn('[TWILIO] WhatsApp service warning:', err.message);
  }

  // --- API ROUTES ---

  // Health Check
  app.get("/api/health", async (req, res) => {
    try {
      await pool.query('SELECT 1');
      
      let smtpStatus = "unknown";
      let smtpError = null;
      
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
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
  if (NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    // Serve static files with proper caching headers
    app.use(express.static(distPath, {
      maxAge: '1d',
      etag: false,
    }));
    // SPA fallback - serve index.html for all unmatched routes
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[ERROR]', err.message || err);
    const status = err.status || 500;
    const message = NODE_ENV === 'production' ? 'Internal Server Error' : err.message;
    res.status(status).json({ status: 'error', message });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📦 Environment: ${NODE_ENV}`);
    if (NODE_ENV === 'production') {
      console.log(`🔒 Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
    }
  });
}

console.log('[INFO] Starting server...');
startServer().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
