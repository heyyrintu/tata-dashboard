import express from 'express';
import {
  processEmails,
  getEmailStatus,
  startEmailService,
  stopEmailService
} from '../controllers/emailController';
import { authenticate } from '../middleware/auth';
import { validate, validateEmailProcess } from '../middleware/validation';

const router = express.Router();

// Apply authentication middleware to all email routes
router.use(authenticate);

// Manual email processing endpoint
router.post('/process', validate(validateEmailProcess), processEmails);

// Get email service status
router.get('/status', getEmailStatus);

// Start email service
router.post('/start', startEmailService);

// Stop email service
router.post('/stop', stopEmailService);

export default router;

