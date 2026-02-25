import { getDb, saveDb } from './connection.js';

export async function initializeDatabase(): Promise<void> {
  const db = await getDb();

  db.run(`
    CREATE TABLE IF NOT EXISTS system_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_id TEXT NOT NULL,
      access_level TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      module TEXT,
      device TEXT,
      browser TEXT,
      ip_address TEXT,
      geo_latitude REAL,
      geo_longitude REAL,
      geo_city TEXT,
      geo_state TEXT,
      geo_country TEXT,
      network_type TEXT,
      network_speed TEXT,
      network_latency REAL DEFAULT 0,
      session_start_time TEXT,
      session_login_attempts INTEGER DEFAULT 0,
      session_last_activity TEXT,
      session_inactivity_time REAL DEFAULT 0,
      result TEXT NOT NULL DEFAULT 'success',
      interaction_type TEXT,
      element_id TEXT,
      element_class TEXT,
      element_text TEXT,
      element_type TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_logs_user_id ON system_logs(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON system_logs(timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_logs_action ON system_logs(action)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_logs_module ON system_logs(module)`);

  db.run(`
    CREATE TABLE IF NOT EXISTS risk_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_id TEXT REFERENCES system_logs(id),
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      risk_score REAL NOT NULL,
      alert_type TEXT NOT NULL,
      description TEXT NOT NULL,
      model_version TEXT,
      is_ml_detection INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON risk_alerts(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_alerts_created ON risk_alerts(created_at)`);

  db.run(`
    CREATE TABLE IF NOT EXISTS training_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_version TEXT NOT NULL,
      accuracy REAL,
      precision_score REAL,
      recall_score REAL,
      f1_score REAL,
      auc_roc REAL,
      loss REAL,
      val_accuracy REAL,
      val_loss REAL,
      epochs INTEGER,
      dataset_size INTEGER,
      training_time_ms INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS feature_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feature_name TEXT NOT NULL,
      min_val REAL,
      max_val REAL,
      mean_val REAL,
      std_val REAL,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  saveDb();
}
