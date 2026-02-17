import express from 'express';
import { getDashboard } from '../controllers/dashboardController';

const router = express.Router();
router.get('/', getDashboard);

export default router;
