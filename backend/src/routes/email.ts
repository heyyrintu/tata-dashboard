import express from 'express';
import {
  processEmails,
  getEmailStatus,
  startEmailService,
  stopEmailService
} from '../controllers/emailController';

const router = express.Router();

// Manual email processing endpoint
router.post('/process', processEmails);

// Get email service status
router.get('/status', getEmailStatus);

// Start email service
router.post('/start', startEmailService);

// Stop email service
router.post('/stop', stopEmailService);

export default router;

