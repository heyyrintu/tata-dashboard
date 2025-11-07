import express from 'express';
import { getAnalytics, getRangeWiseAnalytics, getFulfillmentAnalytics, getLoadOverTime, getRevenueAnalytics, getMonthOnMonthAnalytics, exportMissingIndents } from '../controllers/analyticsController';

const router = express.Router();

router.get('/', getAnalytics);
router.get('/range-wise', getRangeWiseAnalytics);
router.get('/fulfillment', getFulfillmentAnalytics);
router.get('/fulfillment/export-missing', exportMissingIndents);
router.get('/load-over-time', getLoadOverTime);
router.get('/revenue', getRevenueAnalytics);

// Test route first to verify routing works
router.get('/test-month-route', (req, res) => {
  res.json({ message: 'Test route works!', functionExists: typeof getMonthOnMonthAnalytics !== 'undefined' });
});

// Verify the function exists before registering
console.log('Checking getMonthOnMonthAnalytics:', {
  exists: typeof getMonthOnMonthAnalytics !== 'undefined',
  type: typeof getMonthOnMonthAnalytics,
  isFunction: typeof getMonthOnMonthAnalytics === 'function'
});

try {
  if (typeof getMonthOnMonthAnalytics === 'function') {
    router.get('/month-on-month', getMonthOnMonthAnalytics);
    console.log('✓ Month-on-month route registered successfully at /api/analytics/month-on-month');
  } else {
    console.error('✗ ERROR: getMonthOnMonthAnalytics is not a function!', typeof getMonthOnMonthAnalytics);
  }
} catch (error) {
  console.error('✗ ERROR registering month-on-month route:', error);
}

// Debug: Log registered routes
console.log('Analytics routes registered:', {
  '/': 'getAnalytics',
  '/range-wise': 'getRangeWiseAnalytics',
  '/fulfillment': 'getFulfillmentAnalytics',
  '/load-over-time': 'getLoadOverTime',
  '/revenue': 'getRevenueAnalytics',
  '/month-on-month': typeof getMonthOnMonthAnalytics === 'function' ? 'getMonthOnMonthAnalytics ✓' : 'MISSING ✗'
});

export default router;

