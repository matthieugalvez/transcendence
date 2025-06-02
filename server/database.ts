import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create database connection
const dbPath = path.join(__dirname, 'transcendence.db')
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
          console.log('✅ Database initialized successfully')
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