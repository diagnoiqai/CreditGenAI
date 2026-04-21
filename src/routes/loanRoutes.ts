import { Router } from 'express';
import * as loanController from '../controllers/loanController.ts';

const router = Router();

// Get Applications
router.get("/applications/:uid", loanController.getApplications);

// API Route for Loan Application (Email + DB)
router.post("/apply", loanController.applyForLoan);

// Public: Get Bank Offers
router.get("/bank-offers", loanController.getBankOffers);

// Policy Search (Vector)
router.post("/policy-search", loanController.searchPolicies);

// WhatsApp Webhook
router.post("/whatsapp/webhook", loanController.handleWhatsAppWebhook);

export default router;

