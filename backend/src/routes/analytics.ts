import express from 'express';
import { getAnalytics, getRangeWiseAnalytics, getFulfillmentAnalytics, getLoadOverTime, getRevenueAnalytics, getCostAnalytics, getProfitLossAnalytics, getMonthOnMonthAnalytics, exportMissingIndents } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';
import { validate, validateAnalyticsQuery } from '../middleware/validation';

const router = express.Router();

// Apply authentication middleware to all analytics routes
router.use(authenticate);

router.get('/', validate(validateAnalyticsQuery), getAnalytics);
router.get('/range-wise', validate(validateAnalyticsQuery), getRangeWiseAnalytics);
router.get('/fulfillment', validate(validateAnalyticsQuery), getFulfillmentAnalytics);
router.get('/fulfillment/export-missing', validate(validateAnalyticsQuery), exportMissingIndents);
router.get('/load-over-time', validate(validateAnalyticsQuery), getLoadOverTime);
router.get('/revenue', validate(validateAnalyticsQuery), getRevenueAnalytics);
router.get('/cost', validate(validateAnalyticsQuery), getCostAnalytics);
router.get('/profit-loss', validate(validateAnalyticsQuery), getProfitLossAnalytics);

// Month-on-month analytics route
if (typeof getMonthOnMonthAnalytics === 'function') {
  router.get('/month-on-month', validate(validateAnalyticsQuery), getMonthOnMonthAnalytics);
}

export default router;

