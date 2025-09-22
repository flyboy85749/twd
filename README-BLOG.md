# Blog and Admin (client-side)

What I added

- `blog.html` — public blog listing and single-post view (client-side)
- `admin.html` — admin UI to create and delete posts
- `js/blog.js` — renders posts from localStorage and supports single-post view via URL hash
- `js/admin.js` — create/delete posts, stores them in localStorage
- `css/blog.css` — small styles for the blog and admin pages

How it works

- Posts are stored in browser localStorage under key `twd_posts_v1` as a JSON array.
- Admin creates posts (title, date, excerpt, content, image URL). Content may contain HTML — it's rendered as-is in single-post view.

Limitations & security

- This is a client-only solution. Posts are stored per-browser (localStorage). Not suitable for production multi-user blogs.
- Content is not sanitized on input (admin trusts user). If you plan to expose this publicly, implement server-side storage and proper sanitization.

Next steps (suggestions)

- Add server-side API (Node/Express or similar) with authentication to persist posts.
- Add Markdown support and sanitization.
- Add pagination and search.

Server setup (Express + SQLite)

I added a minimal Express + SQLite server to this project:

- `server.js` — small API exposing /api/posts endpoints and serving static files.
- `package.json` — lists dependencies (express, sqlite3, cors).

Quick start (on the server or local):

1. Install dependencies:

```bash
npm install
```

2. Set the admin token (important). On shared hosting you can set an environment variable named `TWD_ADMIN_TOKEN`. If not set, the default token is `changeme` (please change it):

```bash
export TWD_ADMIN_TOKEN="replace-with-secret"
node server.js
```

3. Visit `http://your-host/` and open `/admin.html` to create posts. Use the token to authenticate create/delete requests.

Notes about shared hosting

- Many shared hosts let you run a Node process; if yours supports it, upload the project, run `npm install`, set `TWD_ADMIN_TOKEN` in your environment/hosting control panel, and run `node server.js` (or run via a process manager).
- If your shared host does not allow Node processes, keep using the client-side localStorage approach (no server required) or move to a host that supports Node.

Rich Text Editor (Quill)

- The admin page now includes a Quill WYSIWYG editor. When you create posts via the admin UI, the HTML produced by Quill is saved.
- The server sanitizes incoming HTML using `sanitize-html` and only allows a safe subset of tags and attributes (images, headings, links). Still: review content and allow/deny tags according to your needs.

Session-based admin login

- A simple session-based login is available at `/login.html`. It sets a server session cookie on success.
- The server boots a default admin user if no users exist: username `admin` and password from env `INIT_ADMIN_PASS` or `changeme` by default. Change this immediately in production.
- To change the admin password, update the `users` table in `data/posts.db` (hash a new password with bcrypt) or I can add a password-change endpoint.

Change password endpoint

- A change-password page is available at `/change-password.html` for logged-in users. It POSTs to `/api/change-password` and updates the password after verifying the current password.
