import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { tmdbSyncService } from '../services/tmdbSyncService.js';
import { refreshBaselineVPM } from '../services/ppmService.js';
import { scrapeBankCodes } from '../services/bankService.js';

const router = Router();

// All cron routes require admin access
router.use(authMiddleware, adminMiddleware);

// Manual trigger TMDB full sync
router.post('/tmdb/sync-full', async (req, res) => {
  try {
    const pages = parseInt(req.body.pages, 10) || 20;
    // Run in background
    tmdbSyncService.syncAllPeople(pages).catch(err => 
      console.error('[Cron] Manual TMDB sync failed:', err.message)
    );
    res.json({ success: true, message: `TMDB full sync started for ${pages} pages` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manual trigger TMDB incremental sync
router.post('/tmdb/sync-incremental', async (req, res) => {
  try {
    await tmdbSyncService.incrementalSync();
    res.json({ success: true, message: 'TMDB incremental sync completed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manual trigger baseline VPM refresh
router.post('/ppm/refresh-baseline', async (req, res) => {
  try {
    await refreshBaselineVPM();
    res.json({ success: true, message: 'Baseline VPM refreshed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manual trigger bank codes refresh
router.post('/banks/refresh', async (req, res) => {
  try {
    await scrapeBankCodes();
    res.json({ success: true, message: 'Bank codes refreshed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger TMDB sync for specific person
router.post('/tmdb/sync-person', async (req, res) => {
  try {
    const { tmdbPersonId } = req.body;
    if (!tmdbPersonId) return res.status(400).json({ error: 'tmdbPersonId required' });
    
    const { tmdbSyncService } = await import('../services/tmdbSyncService.js');
    await tmdbSyncService.syncPerson(tmdbPersonId);
    
    res.json({ success: true, message: `TMDB sync completed for person ${tmdbPersonId}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get sync status
router.get('/status', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      status: 'ok',
      message: 'Cron jobs running'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;