const path = require('path');
// Load .env for local development
require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
// Optional MySQL support
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const dbPath = path.join(__dirname, 'data', 'posts.db');

// Simple admin token (change before production)
const ADMIN_TOKEN = process.env.TWD_ADMIN_TOKEN || 'changeme';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Sessions
const session = require('express-session');
const bcrypt = require('bcryptjs');

app.use(session({
  secret: process.env.SESSION_SECRET || 'session-secret-change',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set to true behind TLS in production
}));

// Ensure data directory exists and DB initialized
const fs = require('fs');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const sanitizeHtml = require('sanitize-html');
// DB adapter that can use MySQL (if env provided) or SQLite fallback
let db = null;
let useMySQL = false;

async function initDb() {
  const mysqlHost = process.env.MYSQL_HOST || process.env.MYSQL_URL;
  if (mysqlHost) {
    // Use MySQL
    useMySQL = true;
    // Build MySQL connection config. Support socketPath for shared hosts.
    let mysqlUser = process.env.MYSQL_USER || process.env.MYSQL_USERNAME || undefined;
    if (mysqlUser && mysqlUser.includes('@')) {
      // some hosting panels show users as 'user@localhost' — strip host portion for client auth
      const parts = mysqlUser.split('@');
      console.warn('Detected MYSQL_USER containing @host, using username:', parts[0]);
      mysqlUser = parts[0];
    }

    const cfg = {
      host: process.env.MYSQL_HOST || undefined,
      user: mysqlUser,
      password: process.env.MYSQL_PASSWORD || undefined,
      database: process.env.MYSQL_DATABASE || undefined,
      charset: process.env.MYSQL_CHARSET || 'utf8mb4'
    };
    // If a socket path is provided (common on shared hosting), use socketPath instead of host/port
    if (process.env.MYSQL_SOCKET) {
      cfg.socketPath = process.env.MYSQL_SOCKET;
      // remove host if present to avoid TCP connect
      delete cfg.host;
      delete cfg.port;
    }
    try {
      const conn = await mysql.createConnection(cfg);
      console.log('Connected to MySQL');
      // Wrap a minimal adapter
      db = {
        run: async (sql, params) => {
          const [result] = await conn.execute(sql, params || []);
          return result;
        },
        get: async (sql, params) => {
          const [rows] = await conn.execute(sql, params || []);
          return rows[0];
        },
        all: async (sql, params) => {
          const [rows] = await conn.execute(sql, params || []);
          return rows;
        }
      };
      // Ensure tables exist (use slightly different SQL for MySQL)
      await db.run(`
        CREATE TABLE IF NOT EXISTS posts (
          id VARCHAR(255) PRIMARY KEY,
          title TEXT NOT NULL,
          date VARCHAR(255),
          excerpt TEXT,
          content LONGTEXT,
          image VARCHAR(1024)
        )
      `);
      await db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL
        )
      `);
    } catch (e) {
      console.error('Failed to connect to MySQL, falling back to SQLite', e && e.message ? e.message : e);
      useMySQL = false;
    }
  }

  if (!useMySQL) {
    db = new sqlite3.Database(dbPath);
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS posts (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          date TEXT,
          excerpt TEXT,
          content TEXT,
          image TEXT
        )
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL
        )
      `);
    });
  }

  // Bootstrap default admin user if none exist
  try {
    const row = await db.get('SELECT COUNT(*) AS c FROM users');
    const count = (row && (row.c || row['COUNT(*)'] || row['COUNT(*) AS c'])) || 0;
    if (Number(count) === 0) {
      const pw = bcrypt.hashSync(process.env.INIT_ADMIN_PASS || 'changeme', 10);
      if (useMySQL) {
        await db.run('INSERT INTO users(username,password) VALUES(?,?)', ['admin', pw]);
        console.log('Created default admin user (change password) [mysql]');
      } else {
        await new Promise((resolve, reject) => {
          db.run('INSERT INTO users(username,password) VALUES(?,?)', ['admin', pw], function (err) {
            if (err) return reject(err);
            resolve(this);
          });
        });
        console.log('Created default admin user (change password) [sqlite]');
      }
    }
  } catch (e) {
    // ignore unique constraint (another process created the user) or log other errors
    if (e && e.code === 'SQLITE_CONSTRAINT') {
      console.warn('Admin user already exists (constraint)');
    } else {
      console.error('Error bootstrapping admin user:', e && e.message ? e.message : e);
    }
  }
}

// initialize DB connection (async)
initDb();

function isAuthenticated(req) {
  if (req.session && req.session.user) return true;
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token && token === ADMIN_TOKEN) return true;
  return false;
}


// API: list posts
app.get('/api/posts', async (req, res) => {
  try {
    let rows;
    if (useMySQL) {
      rows = await db.all('SELECT * FROM posts ORDER BY date DESC');
    } else {
      rows = await new Promise((resolve, reject) => db.all('SELECT * FROM posts ORDER BY date DESC', [], (err, r) => err ? reject(err) : resolve(r)));
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});

// API: get post
app.get('/api/posts/:id', async (req, res) => {
  try {
    let row;
    if (useMySQL) {
      row = await db.get('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    } else {
      row = await new Promise((resolve, reject) => db.get('SELECT * FROM posts WHERE id = ?', [req.params.id], (err, r) => err ? reject(err) : resolve(r)));
    }
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});

// API: create post (requires admin token)
app.post('/api/posts', async (req, res) => {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });
  try {
    let { id, title, date, excerpt, content, image } = req.body;
    if (!id || !title) return res.status(400).json({ error: 'id and title required' });
    // sanitize inputs: allow a safe subset of HTML in content
    content = sanitizeHtml(content || '', {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2']),
      allowedAttributes: {
        a: ['href', 'name', 'target'],
        img: ['src', 'alt']
      }
    });
    title = sanitizeHtml(title, { allowedTags: [], allowedAttributes: {} });
    excerpt = sanitizeHtml(excerpt || '', { allowedTags: [], allowedAttributes: {} });
    if (useMySQL) {
      await db.run('INSERT INTO posts(id,title,date,excerpt,content,image) VALUES(?,?,?,?,?,?)', [id, title, date, excerpt, content, image]);
    } else {
      await new Promise((resolve, reject) => db.run('INSERT INTO posts(id,title,date,excerpt,content,image) VALUES(?,?,?,?,?,?)', [id, title, date, excerpt, content, image], function (err) {
        if (err) return reject(err);
        resolve(this);
      }));
    }
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});

// API: delete post (requires admin token)
app.delete('/api/posts/:id', async (req, res) => {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });
  try {
    if (useMySQL) {
      const result = await db.run('DELETE FROM posts WHERE id = ?', [req.params.id]);
      // mysql2 returns affectedRows
      res.json({ deleted: result.affectedRows || 0 });
    } else {
      const info = await new Promise((resolve, reject) => db.run('DELETE FROM posts WHERE id = ?', [req.params.id], function (err) {
        if (err) return reject(err);
        resolve({ changes: this.changes });
      }));
      res.json({ deleted: info.changes });
    }
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});

// Auth: login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    let user;
    if (useMySQL) {
      user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    } else {
      user = await new Promise((resolve, reject) => db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => err ? reject(err) : resolve(row)));
    }
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
    // success
    req.session.user = { id: user.id, username: user.username };
    res.json({ id: user.id, username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});

// Auth: logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Failed to logout' });
    res.json({ ok: true });
  });
});

// Auth: current user
app.get('/api/me', (req, res) => {
  if (req.session && req.session.user) return res.json(req.session.user);
  res.status(401).json({ error: 'Not authenticated' });
});

// Auth: change password (session-only)
app.post('/api/change-password', async (req, res) => {
  try {
    if (!req.session || !req.session.user) return res.status(401).json({ error: 'Not authenticated' });
    const userId = req.session.user.id;
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'currentPassword and newPassword required' });
    let user;
    if (useMySQL) {
      user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    } else {
      user = await new Promise((resolve, reject) => db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => err ? reject(err) : resolve(row)));
    }
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!bcrypt.compareSync(currentPassword, user.password)) return res.status(401).json({ error: 'Current password incorrect' });
    const newHash = bcrypt.hashSync(newPassword, 10);
    if (useMySQL) {
      await db.run('UPDATE users SET password = ? WHERE id = ?', [newHash, userId]);
    } else {
      await new Promise((resolve, reject) => db.run('UPDATE users SET password = ? WHERE id = ?', [newHash, userId], function (err) {
        if (err) return reject(err);
        resolve(this);
      }));
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});

// Fallback
app.use((req, res) => {
  res.status(404).send('Not found');
});

// DB info endpoint for quick verification
app.get('/api/dbinfo', async (req, res) => {
  try {
    let backend = useMySQL ? 'mysql' : 'sqlite';
    let postsCount = 0;
    let usersCount = 0;
    if (useMySQL) {
      const pr = await db.get('SELECT COUNT(*) AS c FROM posts');
      const ur = await db.get('SELECT COUNT(*) AS c FROM users');
      postsCount = pr && (pr.c || pr['COUNT(*)']) ? (pr.c || pr['COUNT(*)']) : 0;
      usersCount = ur && (ur.c || ur['COUNT(*)']) ? (ur.c || ur['COUNT(*)']) : 0;
      res.json({ backend, postsCount: Number(postsCount), usersCount: Number(usersCount) });
    } else {
      const pr = await new Promise((resolve, reject) => db.get('SELECT COUNT(*) AS c FROM posts', [], (err, r) => err ? reject(err) : resolve(r)));
      const ur = await new Promise((resolve, reject) => db.get('SELECT COUNT(*) AS c FROM users', [], (err, r) => err ? reject(err) : resolve(r)));
      postsCount = pr && (pr.c || pr['COUNT(*)']) ? (pr.c || pr['COUNT(*)']) : 0;
      usersCount = ur && (ur.c || ur['COUNT(*)']) ? (ur.c || ur['COUNT(*)']) : 0;
      res.json({ backend, postsCount: Number(postsCount), usersCount: Number(usersCount), sqlitePath: dbPath });
    }
  } catch (e) {
    res.status(500).json({ error: e && e.message ? e.message : e });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
