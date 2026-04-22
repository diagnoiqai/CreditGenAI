import { Router } from 'express';
import * as userController from '../controllers/userController.js';

const router = Router();

// Get User Profile
router.get("/:uid", userController.getProfile);

// Create/Update User Profile
router.post("/", userController.updateProfile);

export default router;
