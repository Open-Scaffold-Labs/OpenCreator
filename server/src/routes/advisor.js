// Format & Length Advisor — pre-publish checks with channel-personalized
// length guidance, degrading gracefully to 2026 baselines when history
// is thin (per implementation plan §6 Phase 2).
const express = require('express');

module.exports = (pool, authMiddleware) => {
  const router = express.Router();

  function check(name, status, message) {
    return { name, status, message }; // status: pass | warn | fail
  }

  // Channel-personalized length stats from published videos of this type
  async function lengthHistory(userId, contentType) {
    const r = await pool.query(
      `SELECT duration_seconds, view_count FROM oc_content
       WHERE user_id = $1 AND content_type = $2 AND status = 'published'
         AND duration_seconds IS NOT NULL AND view_count IS NOT NULL AND view_count > 10`,
      [userId, contentType]
    );
    if (r.rows.length < 5) return null; // not enough signal — use baselines
    // Views-weighted average duration of what performs
    const totalViews = r.rows.reduce((a, x) => a + Number(x.view_count), 0);
    const weighted = r.rows.reduce((a, x) => a + x.duration_seconds * Number(x.view_count), 0) / totalViews;
    return { sampleSize: r.rows.length, weightedDuration: Math.round(weighted) };
  }

  function lengthAdvice(contentType, targetDuration, history) {
    if (contentType === 'short') {
      const base = 'Shorts baseline: 15–60s is the sweet spot (15–30s for quick hits). Longer ≠ better — completion rate drives the Shorts feed.';
      if (history) {
        return `${base} Your channel: Shorts around ${history.weightedDuration}s have earned the most views (${history.sampleSize} published Shorts analyzed).`;
      }
      return `${base} Not enough channel history yet to personalize — this tightens up as you publish.`;
    }
    if (contentType === 'live') {
      return 'Livestreams: consistency beats duration. Schedule the same slot each week and let the format set the length.';
    }
    const base = 'Long-form baseline: as long as it needs to be, no longer. The 2026 algorithm rewards retention relative to length — a tight 5 minutes at 70% retention beats a padded 20 at 30%.';
    if (history) {
      const m = Math.round(history.weightedDuration / 60);
      return `${base} Your channel: videos around ${m} min have earned the most views (${history.sampleSize} published videos analyzed).`;
    }
    return `${base} Not enough channel history yet to personalize — this tightens up as you publish.`;
  }

  // GET /api/advisor/:contentId — pre-publish check
  router.get('/:contentId', authMiddleware, async (req, res) => {
    try {
      const cRes = await pool.query(
        `SELECT c.*, s.day_of_week AS series_day, s.target_duration_seconds
         FROM oc_content c
         LEFT JOIN oc_series s ON c.series_id = s.id
         WHERE c.id = $1 AND c.user_id = $2`,
        [req.params.contentId, req.user.id]
      );
      if (!cRes.rows.length) return res.status(404).json({ error: 'Content not found' });
      const item = cRes.rows[0];
      const b = item.brief || {};
      const checks = [];

      // Packaging
      const t = item.title || '';
      if (!t) checks.push(check('Title', 'fail', 'No title yet'));
      else if (t.length > 100) checks.push(check('Title', 'fail', `Title is ${t.length} chars — YouTube caps at 100`));
      else if (t.length > 70) checks.push(check('Title', 'warn', `Title is ${t.length} chars — under ~70 avoids truncation in search/suggested`));
      else checks.push(check('Title', 'pass', `${t.length} chars`));

      const d = item.description || '';
      if (d.length < 50) checks.push(check('Description', 'warn', 'Very short or missing — the first 2 lines carry the click'));
      else checks.push(check('Description', 'pass', `${d.length} chars`));

      const tagCount = (item.tags || '').split(',').map(x => x.trim()).filter(Boolean).length;
      if (tagCount === 0) checks.push(check('Tags', 'warn', 'No tags set'));
      else if (tagCount > 20) checks.push(check('Tags', 'warn', `${tagCount} tags — specific beats many; aim for 5–15`));
      else checks.push(check('Tags', 'pass', `${tagCount} tags`));

      // Retention plan
      if (!b.hook || !b.hook.trim()) {
        checks.push(check('Hook', 'fail', 'No first-30-seconds hook in the brief — the retention curve is decided there'));
      } else {
        checks.push(check('Hook', 'pass', 'Hook drafted'));
      }

      const beats = Array.isArray(b.outline) ? b.outline.length : 0;
      if (item.content_type !== 'short' && beats < 4) {
        checks.push(check('Outline', 'warn', beats === 0 ? 'No beat outline yet' : `Only ${beats} beats — most long-form holds retention with 6–10`));
      } else {
        checks.push(check('Outline', 'pass', `${beats} beats`));
      }

      if (!b.promise || !b.promise.trim()) {
        checks.push(check('Promise', 'warn', 'No viewer promise defined — packaging and hook should pay off the same promise'));
      } else {
        checks.push(check('Promise', 'pass', 'Defined'));
      }

      // Scheduling
      if (!item.scheduled_date) {
        checks.push(check('Schedule', 'warn', 'No scheduled date — cadence gaps count against you'));
      } else if (item.series_day !== null && item.series_day !== undefined) {
        const day = new Date(item.scheduled_date).getDay();
        checks.push(day === item.series_day
          ? check('Schedule', 'pass', 'On the series’ preferred day')
          : check('Schedule', 'warn', 'Scheduled off the series’ preferred publish day'));
      } else {
        checks.push(check('Schedule', 'pass', new Date(item.scheduled_date).toLocaleDateString('en-US')));
      }

      // Length guidance
      const history = await lengthHistory(req.user.id, item.content_type);
      const advice = lengthAdvice(item.content_type, item.target_duration_seconds, history);

      const score = checks.reduce((a, c) => a + (c.status === 'pass' ? 1 : 0), 0);
      res.json({
        contentId: item.id,
        title: item.title,
        contentType: item.content_type,
        checks,
        score: `${score}/${checks.length}`,
        readiness: checks.some(c => c.status === 'fail') ? 'not-ready'
          : checks.some(c => c.status === 'warn') ? 'almost'
          : 'ready',
        lengthAdvice: advice,
        personalized: !!history
      });
    } catch (e) {
      console.error('Advisor error:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};
