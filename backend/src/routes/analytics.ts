import express from 'express';
import { getAnalytics, getRangeWiseAnalytics, getFulfillmentAnalytics, getLoadOverTime } from '../controllers/analyticsController';

const router = express.Router();

router.get('/', getAnalytics);
router.get('/range-wise', getRangeWiseAnalytics);
router.get('/fulfillment', getFulfillmentAnalytics);
router.get('/load-over-time', getLoadOverTime);

export default router;

