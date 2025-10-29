import express from 'express';
import { getAnalytics, getRangeWiseAnalytics, getFulfillmentAnalytics, getLoadOverTime, getRevenueAnalytics } from '../controllers/analyticsController';

const router = express.Router();

router.get('/', getAnalytics);
router.get('/range-wise', getRangeWiseAnalytics);
router.get('/fulfillment', getFulfillmentAnalytics);
router.get('/load-over-time', getLoadOverTime);
router.get('/revenue', getRevenueAnalytics);

export default router;

