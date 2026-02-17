import prisma from '../lib/prisma';

class DashboardCacheService {
  private store = new Map<string, any>();

  set(key: string, data: any): void {
    this.store.set(key, data);
  }

  get(key: string): any | null {
    return this.store.get(key) ?? null;
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  invalidate(): void {
    this.store.clear();
    console.log('[CacheService] In-memory cache invalidated');
  }

  stats(): { size: number; keys: string[] } {
    return { size: this.store.size, keys: Array.from(this.store.keys()) };
  }

  /**
   * Load existing snapshots from DB into memory on server startup.
   * Ensures cache survives process restarts.
   */
  async warmUp(): Promise<void> {
    console.log('[CacheService] Starting warm-up from DB...');
    try {
      const snapshots = await prisma.dashboardSnapshot.findMany();
      for (const snapshot of snapshots) {
        this.store.set(snapshot.cacheKey, snapshot.data);
      }
      console.log(`[CacheService] Warm-up complete. Loaded ${snapshots.length} snapshots.`);
    } catch (err) {
      console.warn('[CacheService] Warm-up failed (non-fatal):', err);
    }
  }
}

export const dashboardCache = new DashboardCacheService();
export default dashboardCache;
