import express from 'express';
import { dashboard } from '../controllers/shipmentAnalyticsController';

const router = express.Router();
router.get('/', dashboard);

export default router;
