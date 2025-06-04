import sqlite3 from 'sqlite3'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcrypt'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Use persistent data directory in Docker, fallback to local for development
const dataDir = process.env.NODE_ENV === 'production' ? '/app/data' : __dirname
const dbPath = join(dataDir, 'transcendence.db')

export const db = new sqlite3.Database(dbPath)

//Initialize database - user name cannot be the same.
export function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
		  password_hash TEXT NOT NULL,
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

// Ajoute l'user a la DB et hash le MDP
export async function insertUser(name: string, password: string): Promise<{ id: number, name: string, password: string, logged_at: string }> {

	try {
		const passwordHash = await bcrypt.hash(password, 12); // *args2 = niveau d'encryption

		return new Promise((resolve, reject) => {
		const statement = db.prepare('INSERT INTO users (name, password_hash) VALUES (?, ?)')

		statement.run([name, passwordHash], function(err) {
		if (err) {
			reject(err)
		} else {
			db.get(
			'SELECT id, name, password_hash, logged_at FROM users WHERE id = ?',
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
		statement.finalize()
	})
	} catch (error) {
		throw new Error('Failed to hash password')
	}
}

// Recupere tout de la table USER.
export function getAllUsers(): Promise<Array<{ id: number, name: string, password: string, logged_at: string }>> {
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