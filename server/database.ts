import sqlite3 from 'sqlite3'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Use persistent data directory in Docker, fallback to local for development
const dataDir = process.env.NODE_ENV === 'production' ? '/app/data' : __dirname
const dbPath = join(dataDir, 'transcendence.db')

export const db = new sqlite3.Database(dbPath)

// Initialize database tables
export function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          logged_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err)
          reject(err)
        } else {
          console.log(`✅ Database initialized successfully at: ${dbPath}`)
          resolve()
        }
      })
    })
  })
}

// Insert a new user name
export function insertUser(name: string): Promise<{ id: number, name: string, logged_at: string }> {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT INTO users (name) VALUES (?)')

    stmt.run([name], function(err) {
      if (err) {
        reject(err)
      } else {
        // Get the inserted user
        db.get(
          'SELECT id, name, logged_at FROM users WHERE id = ?',
          [this.lastID],
          (err, row: any) => {
            if (err) {
              reject(err)
            } else {
              resolve(row)
            }
          }
        )
      }
    })

    stmt.finalize()
  })
}

// Get all users
export function getAllUsers(): Promise<Array<{ id: number, name: string, logged_at: string }>> {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM users ORDER BY logged_at DESC', [], (err, rows: any[]) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows)
      }
    })
  })
}