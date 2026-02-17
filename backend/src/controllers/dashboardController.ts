import { Request, Response } from 'express';
import dashboardCache from '../services/cacheService';
import { preComputeAll } from '../services/preComputeService';
import prisma from '../lib/prisma';

export const getDashboard = async (_req: Request, res: Response) => {
  try {
    // 1. Try in-memory cache (sub-millisecond)
    const cached = dashboardCache.get('all');
    if (cached) {
      return res.json({ success: true, cached: true, ...cached });
    }

    // 2. Try DB snapshot (handles process restart)
    const dbSnapshot = await prisma.dashboardSnapshot.findUnique({
      where: { cacheKey: 'all' },
    });
    if (dbSnapshot) {
      dashboardCache.set('all', dbSnapshot.data);
      return res.json({ success: true, cached: true, ...(dbSnapshot.data as object) });
    }

    // 3. Cold start: compute live
    console.log('[getDashboard] No snapshot found - computing live...');
    await preComputeAll();
    const freshData = dashboardCache.get('all');

    if (!freshData) {
      return res.status(503).json({ success: false, error: 'No data available. Please upload an Excel file.' });
    }

    return res.json({ success: true, cached: false, ...freshData });
  } catch (error) {
    console.error('[getDashboard] ERROR:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
    });
  }
};
