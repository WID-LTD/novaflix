import { runHourlyJobs, runWebhookRetryJob, runPayoutStatusJob } from './watchService.js';

// Parse a cron field into the set of values it allows.
//  - '*'          => null (matches every value)
//  - '*/N'        => stepped values {0, N, 2N, ...} up to max
//  - number       => single value
function parseCronField(value, max) {
  if (value === '*' || value == null) return null;
  if (typeof value === 'string' && value.startsWith('*/')) {
    const step = parseInt(value.slice(2), 10) || 1;
    const out = [];
    for (let i = 0; i <= max; i += step) out.push(i);
    return out;
  }
  return [Number(value)];
}

// Milliseconds between `from` and the next matching cron tick.
function nextCronDelay(minute, hour, day, month, dayOfWeek, from = new Date()) {
  const minField = parseCronField(minute, 59);
  const hourField = parseCronField(hour, 23);
  const domField = parseCronField(day, 31);
  const monthField = parseCronField(month, 12);
  const dowField = parseCronField(dayOfWeek, 6);
  const domAndDowRestricted = domField && dowField;

  // Clamp to the next minute boundary, always strictly after `from`.
  let t = new Date(from.getTime());
  t.setSeconds(0, 0);
  t = new Date(t.getTime() + 60000);

  // Cap at ~1 year of minute steps so a misconfigured pattern can't loop forever.
  for (let i = 0; i < 525949; i++) {
    const armsMinute = !minField || minField.includes(t.getMinutes());
    const armsHour = !hourField || hourField.includes(t.getHours());
    const armsMonth = !monthField || monthField.includes(t.getMonth() + 1);
    let armsDay;
    if (domAndDowRestricted) {
      // Standard cron: day matches if EITHER dom or dow matches.
      armsDay = domField.includes(t.getDate()) || dowField.includes(t.getDay());
    } else {
      armsDay = (!domField || domField.includes(t.getDate())) &&
                (!dowField || dowField.includes(t.getDay()));
    }
    if (armsMinute && armsHour && armsMonth && armsDay) {
      return t.getTime() - from.getTime();
    }
    t = new Date(t.getTime() + 60000);
  }
  throw new Error('cron schedule has no matching time within one year');
}

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
    const next = () => {
      // Compute the delay to the NEXT occurrence from right now; a long-running
      // job that overruns simply reschedules one period later (no double-fire).
      const delay = Math.max(nextCronDelay(minute, hour, day, month, dayOfWeek), 1000);
      const at = new Date(Date.now() + delay).toISOString();
      console.log(`[cron] Scheduled ${name} (next run ${at})`);
      job.timer = setTimeout(run, delay);
    };

    const run = async () => {
      if (job.running) {
        console.log(`[cron] Job ${name} still running from previous tick — skipping`);
        next();
        return;
      }
      job.running = true;
      console.log(`[cron] Running ${name}...`);
      try {
        await fn();
      } catch (err) {
        console.error(`[cron] Job ${name} error:`, err.message);
      } finally {
        job.running = false;
        next();
      }
    };

    const job = { name, running: false, timer: null, fn };
    this.jobs.set(name, job);
    next();
  }

  stop() {
    for (const [name, job] of this.jobs) {
      clearTimeout(job.timer);
      console.log(`[cron] Stopped ${name}`);
    }
    this.jobs.clear();
  }
}

export const cronScheduler = new CronScheduler();