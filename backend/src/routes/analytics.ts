import express from 'express';
import { getAnalytics } from '../controllers/analyticsController';

const router = express.Router();

router.get('/', getAnalytics);

export default router;

