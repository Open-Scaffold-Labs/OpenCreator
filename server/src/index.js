const path = require('path');
// Load .env from server/ regardless of the process working directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Resolve openscaffold-core relative to THIS file's location (not cwd)
const CORE_WEBSITE = path.join(__dirname, '..', '..', '..', 'openscaffold-core', 'src', 'server', 'website');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/openfirehouse'
});

const app = express();
const PORT = process.env.PORT || 3012;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// openscaffold-core is optional: present in local Open Scaffold ecosystem
// installs, absent in standalone/cloud deployments (website builder off).
let coreWebsite = null;
try {
  coreWebsite = require(CORE_WEBSITE);
  console.log('openscaffold-core found — website builder enabled');
} catch (e) {
  console.log('openscaffold-core not found — website builder disabled (standalone mode)');
}

// Middleware
app.use(express.json());
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:5180', 'http://localhost:5180'],
  credentials: true
}));
app.use(cookieParser());

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Database schema initialization
async function initializeDatabase() {
  try {
    console.log('Initializing OpenCreator database schema...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS oc_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        "passwordHash" VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        initials VARCHAR(10),
        role VARCHAR(50) DEFAULT 'creator',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS oc_channels (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES oc_users(id),
        channel_name VARCHAR(255) NOT NULL,
        channel_id VARCHAR(100),
        subscriber_count INTEGER DEFAULT 0,
        total_views BIGINT DEFAULT 0,
        video_count INTEGER DEFAULT 0,
        description TEXT,
        thumbnail_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS oc_pipeline_stages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES oc_users(id),
        name VARCHAR(100) NOT NULL,
        sort_order INTEGER DEFAULT 0,
        color VARCHAR(20) DEFAULT '#4F46E5',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS oc_content (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES oc_users(id),
        channel_id INTEGER REFERENCES oc_channels(id),
        title VARCHAR(500) NOT NULL,
        content_type VARCHAR(50) DEFAULT 'video',
        stage_id INTEGER REFERENCES oc_pipeline_stages(id),
        description TEXT,
        script TEXT,
        tags TEXT,
        thumbnail_url TEXT,
        youtube_url TEXT,
        youtube_video_id VARCHAR(50),
        status VARCHAR(50) DEFAULT 'draft',
        scheduled_date TIMESTAMP,
        published_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS oc_tasks (
        id SERIAL PRIMARY KEY,
        content_id INTEGER REFERENCES oc_content(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES oc_users(id),
        assigned_to INTEGER REFERENCES oc_users(id),
        title VARCHAR(500) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        due_date TIMESTAMP,
        completed_at TIMESTAMP,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS oc_revenue (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES oc_users(id),
        content_id INTEGER REFERENCES oc_content(id),
        source VARCHAR(100) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        period_start DATE,
        period_end DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS oc_expenses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES oc_users(id),
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        vendor VARCHAR(255),
        description TEXT,
        receipt_url TEXT,
        expense_date DATE DEFAULT CURRENT_DATE,
        tax_deductible BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS oc_brands (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES oc_users(id),
        name VARCHAR(255) NOT NULL,
        contact_name VARCHAR(255),
        contact_email VARCHAR(255),
        website TEXT,
        industry VARCHAR(100),
        notes TEXT,
        status VARCHAR(50) DEFAULT 'prospect',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS oc_deals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES oc_users(id),
        brand_id INTEGER REFERENCES oc_brands(id),
        content_id INTEGER REFERENCES oc_content(id),
        deal_type VARCHAR(100),
        amount DECIMAL(12,2),
        status VARCHAR(50) DEFAULT 'proposed',
        proposed_date DATE,
        deadline DATE,
        deliverables TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS oc_analytics_snapshots (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES oc_users(id),
        channel_id INTEGER REFERENCES oc_channels(id),
        snapshot_date DATE DEFAULT CURRENT_DATE,
        subscribers INTEGER,
        total_views BIGINT,
        watch_hours DECIMAL(12,2),
        avg_view_duration DECIMAL(8,2),
        revenue_estimate DECIMAL(12,2),
        top_video_id VARCHAR(50),
        data_json JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS oc_team_members (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES oc_users(id),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        role VARCHAR(100),
        rate_type VARCHAR(50) DEFAULT 'per_video',
        rate_amount DECIMAL(12,2),
        status VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS oc_equipment (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES oc_users(id),
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        purchase_date DATE,
        purchase_price DECIMAL(12,2),
        current_value DECIMAL(12,2),
        warranty_expires DATE,
        serial_number VARCHAR(255),
        notes TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS oc_calendar_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES oc_users(id),
        content_id INTEGER REFERENCES oc_content(id),
        title VARCHAR(500) NOT NULL,
        event_type VARCHAR(50) DEFAULT 'upload',
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP,
        all_day BOOLEAN DEFAULT false,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS oc_contracts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES oc_users(id),
        brand_id INTEGER REFERENCES oc_brands(id),
        deal_id INTEGER REFERENCES oc_deals(id),
        title VARCHAR(500),
        contract_type VARCHAR(100),
        start_date DATE,
        end_date DATE,
        terms TEXT,
        file_url TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // --- YouTube integration (feature/youtube-connect) ---
    await pool.query(`
      ALTER TABLE oc_channels
        ADD COLUMN IF NOT EXISTS access_token TEXT,
        ADD COLUMN IF NOT EXISTS refresh_token TEXT,
        ADD COLUMN IF NOT EXISTS token_expiry TIMESTAMP,
        ADD COLUMN IF NOT EXISTS uploads_playlist_id VARCHAR(100),
        ADD COLUMN IF NOT EXISTS connected BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;
    `);

    await pool.query(`
      ALTER TABLE oc_content
        ADD COLUMN IF NOT EXISTS view_count BIGINT,
        ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
    `);

    // --- Series / Show Calendar (feature/show-calendar) ---
    await pool.query(`
      CREATE TABLE IF NOT EXISTS oc_series (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES oc_users(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        content_type VARCHAR(50) DEFAULT 'video',
        cadence_per_week NUMERIC(4,2) DEFAULT 1,
        day_of_week INTEGER,
        title_template VARCHAR(500),
        description_template TEXT,
        tags_template TEXT,
        target_duration_seconds INTEGER,
        next_episode_number INTEGER DEFAULT 1,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      ALTER TABLE oc_content
        ADD COLUMN IF NOT EXISTS series_id INTEGER REFERENCES oc_series(id),
        ADD COLUMN IF NOT EXISTS episode_number INTEGER,
        ADD COLUMN IF NOT EXISTS brief JSONB DEFAULT '{}';
    `);

    // --- AI settings (feature/ai-drafting) ---
    await pool.query(`
      CREATE TABLE IF NOT EXISTS oc_ai_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES oc_users(id),
        provider VARCHAR(50) DEFAULT 'anthropic',
        model VARCHAR(100),
        api_key TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS oc_api_quota (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES oc_users(id),
        usage_date DATE DEFAULT CURRENT_DATE,
        units INTEGER DEFAULT 0,
        UNIQUE(user_id, usage_date)
      );
    `);

    // Website builder tables (shared module from openscaffold-core, optional)
    if (coreWebsite) {
      await coreWebsite.createWebsiteSchema(pool, 'oc_');
    }

    console.log(`Database schema initialized successfully${coreWebsite ? ' (including website builder)' : ''}`);
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : username.substring(0, 2).toUpperCase();

    const result = await pool.query(
      `INSERT INTO oc_users (username, email, "passwordHash", name, initials, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, name, initials, role`,
      [username, email, passwordHash, name || null, initials, 'creator']
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    // Seed default pipeline stages for new user
    const defaultStages = [
      'Idea', 'Research', 'Scripting', 'Filming', 'Editing',
      'Thumbnail & Title', 'Review', 'Scheduled', 'Published', 'Analyzing'
    ];

    for (let i = 0; i < defaultStages.length; i++) {
      await pool.query(
        `INSERT INTO oc_pipeline_stages (user_id, name, sort_order, color)
         VALUES ($1, $2, $3, $4)`,
        [user.id, defaultStages[i], i, '#4F46E5']
      );
    }

    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const loginId = username || email;

    if (!loginId || !password) {
      return res.status(400).json({ error: 'Missing username/email or password' });
    }

    const result = await pool.query(
      `SELECT id, username, email, "passwordHash", name, role FROM oc_users WHERE username = $1 OR email = $1`,
      [loginId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user.id, username: user.username, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, name, role FROM oc_users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mount route handlers
const contentRoutes = require('./routes/content')(pool, authMiddleware);
const pipelineRoutes = require('./routes/pipeline')(pool, authMiddleware);
const financeRoutes = require('./routes/finance')(pool, authMiddleware);
const brandsRoutes = require('./routes/brands')(pool, authMiddleware);
const analyticsRoutes = require('./routes/analytics')(pool, authMiddleware);
const teamRoutes = require('./routes/team')(pool, authMiddleware);
const equipmentRoutes = require('./routes/equipment')(pool, authMiddleware);
const calendarRoutes = require('./routes/calendar')(pool, authMiddleware);
const youtubeRoutes = require('./routes/youtube')(pool, authMiddleware, JWT_SECRET);
const seriesRoutes = require('./routes/series')(pool, authMiddleware);
const aiRoutes = require('./routes/ai')(pool, authMiddleware);
const advisorRoutes = require('./routes/advisor')(pool, authMiddleware);

app.use('/api/content', contentRoutes);
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/revenue', financeRoutes.revenueRouter);
app.use('/api/expenses', financeRoutes.expenseRouter);
app.use('/api/finance', financeRoutes.financeRouter);
app.use('/api/brands', brandsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/advisor', advisorRoutes);

// Website builder (shared module from openscaffold-core, optional)
if (coreWebsite) {
  app.use('/api/website', coreWebsite.createWebsiteRoutes(pool, authMiddleware, 'oc_'));
  // Public-facing website (server-rendered HTML, no auth required)
  app.use('/site', coreWebsite.createPublicSiteRouter(pool, 'oc_'));
} else {
  app.use('/api/website', (req, res) => res.status(501).json({ error: 'Website builder requires the Open Scaffold ecosystem (openscaffold-core)' }));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Open Creator', port: PORT });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Nightly channel sync — refreshes stats and records analytics snapshots
// for every connected channel (runs 1 min after boot, then every 24h)
async function nightlySync() {
  try {
    const ytSvc = require('./services/youtube');
    const channels = await pool.query(`SELECT * FROM oc_channels WHERE connected = true`);
    for (const channel of channels.rows) {
      try {
        const auth = ytSvc.clientForChannel(pool, channel);
        const info = await ytSvc.fetchMyChannel(auth);
        if (!info) continue;
        await pool.query(
          `UPDATE oc_channels SET channel_name = $1, subscriber_count = $2,
             total_views = $3, video_count = $4, last_synced_at = NOW(), updated_at = NOW()
           WHERE id = $5`,
          [info.title, info.subscribers, info.views, info.videoCount, channel.id]
        );
        await pool.query(
          `INSERT INTO oc_analytics_snapshots (user_id, channel_id, subscribers, total_views, data_json)
           VALUES ($1, $2, $3, $4, $5)`,
          [channel.user_id, channel.id, info.subscribers, info.views,
           JSON.stringify({ videoCount: info.videoCount, source: 'nightly' })]
        );
        await ytSvc.logQuota(pool, channel.user_id, ytSvc.QUOTA.channelsList);
        console.log(`Nightly sync: ${info.title} ok`);
      } catch (e) {
        console.error(`Nightly sync failed for channel ${channel.id}:`, e.message);
      }
    }
  } catch (e) {
    console.error('Nightly sync error:', e.message);
  }
}

// Initialize and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Open Creator server running on port ${PORT}`);
  });
  setTimeout(nightlySync, 60 * 1000);
  setInterval(nightlySync, 24 * 60 * 60 * 1000);
}).catch(err => {
  console.error('Database init warning:', err.message);
  // Start server anyway — DB may connect later
  app.listen(PORT, () => {
    console.log(`Open Creator server running on port ${PORT} (DB pending)`);
  });
});

module.exports = app;
