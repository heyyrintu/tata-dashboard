import express from 'express';
import { getAnalytics, getRangeWiseAnalytics } from '../controllers/analyticsController';

const router = express.Router();

router.get('/', getAnalytics);
router.get('/range-wise', getRangeWiseAnalytics);

export default router;

