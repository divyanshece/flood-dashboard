import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SQLite database path
// For local dev: uses the symlink in project root
// For production (Render): uses SQLITE_DB_PATH env var pointing to /data/flood_hyderabad.db
const dbPath = process.env.SQLITE_DB_PATH || path.join(__dirname, '../../../flood_hyderabad.db');

console.log('Database path:', dbPath);

export const db: DatabaseType = new Database(dbPath, { readonly: true });

// Test connection
try {
  const result = db.prepare("SELECT COUNT(*) as count FROM event_attributes").get() as { count: number };
  console.log(`Database connected. Total events: ${result.count}`);
} catch (error) {
  console.error('Database connection error:', error);
}
