import { getDb, saveDb } from "./connection.js";

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
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON system_logs(timestamp)`,
  );
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

  db.run(
    `CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON risk_alerts(user_id)`,
  );
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_alerts_created ON risk_alerts(created_at)`,
  );

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

  db.run(`
    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_id TEXT,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      risk_score REAL NOT NULL,
      ml_prediction REAL NOT NULL,
      feature_vector TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      admin_decision TEXT,
      admin_notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      resolved_at TEXT,
      blocked_until TEXT
    )
  `);
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status)`,
  );
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_incidents_user_id ON incidents(user_id)`,
  );
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents(created_at)`,
  );

  db.run(`
    CREATE TABLE IF NOT EXISTS feedback_labels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL REFERENCES incidents(id),
      feature_vector TEXT NOT NULL,
      label INTEGER NOT NULL,
      decided_by TEXT NOT NULL,
      decided_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_feedback_incident_id ON feedback_labels(incident_id)`,
  );

  db.run(`
    CREATE TABLE IF NOT EXISTS user_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      blocked_at TEXT NOT NULL DEFAULT (datetime('now')),
      blocked_until TEXT,
      reason TEXT,
      incident_id INTEGER REFERENCES incidents(id),
      unblocked_by TEXT,
      unblocked_at TEXT,
      status TEXT NOT NULL DEFAULT 'active'
    )
  `);
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_user_blocks_user_id ON user_blocks(user_id)`,
  );
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_user_blocks_status ON user_blocks(status)`,
  );

  db.run(`
    CREATE TABLE IF NOT EXISTS risk_predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      risk_score REAL NOT NULL,
      log_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_risk_predictions_user_id ON risk_predictions(user_id)`,
  );
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_risk_predictions_created ON risk_predictions(created_at)`,
  );

  db.run(`
    CREATE TABLE IF NOT EXISTS session_invalidations (
      user_id TEXT PRIMARY KEY,
      invalidated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  saveDb();
}
