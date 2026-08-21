import { runHourlyJobs, runWebhookRetryJob, runPayoutStatusJob } from './watchService.js';

class CronScheduler {
  constructor() {
    this.jobs = new Map();
  }

  start() {
    console.log('[cron] Starting scheduled jobs...');

    // Hourly: Baseline VPM refresh
    this.schedule('hourly-vpm', 0, '*', '*', '*', '*', runHourlyJobs);

    // Every 5 minutes: Webhook retry
    this.schedule('webhook-retry', '*/5', '*', '*', '*', '*', runWebhookRetryJob);

    // Every 10 minutes: Payout status check
    this.schedule('payout-status', '*/10', '*', '*', '*', '*', runPayoutStatusJob);

    console.log('[cron] All jobs scheduled');
  }

  schedule(name, minute, hour, day, month, dayOfWeek, fn) {
    // Simple interval-based scheduler (cron-like)
    let intervalMs;
    if (minute === '*/5') intervalMs = 5 * 60 * 1000;
    else if (minute === '*/10') intervalMs = 10 * 60 * 1000;
    else if (minute === 0 && hour === '*') intervalMs = 60 * 60 * 1000;
    else intervalMs = 60 * 60 * 1000;

    const interval = setInterval(async () => {
      try {
        await fn();
      } catch (err) {
        console.error(`[cron] Job ${name} error:`, err.message);
      }
    }, intervalMs);

    this.jobs.set(name, interval);
    console.log(`[cron] Scheduled ${name} every ${intervalMs / 1000}s`);
  }

  stop() {
    for (const [name, interval] of this.jobs) {
      clearInterval(interval);
      console.log(`[cron] Stopped ${name}`);
    }
    this.jobs.clear();
  }
}

export const cronScheduler = new CronScheduler();