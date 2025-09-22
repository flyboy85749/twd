// Admin UI for creating posts (client-side localStorage)
(function () {
  const STORAGE_KEY = 'twd_posts_v1';

  function loadPosts() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch (e) { return []; }
  }
  function savePosts(posts) { localStorage.setItem(STORAGE_KEY, JSON.stringify(posts)); }

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  async function renderAdminList() {
    const list = document.getElementById('admin-posts');
    // Try API first
    try {
      const posts = await window.TWD_API.listPosts();
      if (!posts || !posts.length) { list.innerHTML = '<p>No posts yet.</p>'; return; }
      list.innerHTML = '';
      posts.slice().reverse().forEach(p => {
        const el = document.createElement('div');
        el.className = 'admin-post-item';
        el.innerHTML = `
          <h3>${escapeHtml(p.title)}</h3>
          <div class="post-meta">${p.date}</div>
          <div class="admin-actions">
            <a href="blog.html#${p.id}" target="_blank" class="btn btn-small">View</a>
            <button data-id="${p.id}" class="btn btn-small btn-ghost delete-post">Delete</button>
          </div>
        `;
        list.appendChild(el);
      });

      Array.from(document.querySelectorAll('.delete-post')).forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = btn.getAttribute('data-id');
          const token = document.getElementById('admin-token')?.value || null;
          try {
            await window.TWD_API.deletePost(id, token);
            renderAdminList();
          } catch (err) {
            // fallback: remove from localStorage
            const posts = loadPosts().filter(p => p.id !== id);
            savePosts(posts);
            renderAdminList();
          }
        });
      });

      return;
    } catch (err) {
      // fallback to localStorage
      const posts = loadPosts();
      if (!posts.length) { list.innerHTML = '<p>No posts yet.</p>'; return; }
      list.innerHTML = '';
      posts.slice().reverse().forEach(p => {
        const el = document.createElement('div');
        el.className = 'admin-post-item';
        el.innerHTML = `
          <h3>${escapeHtml(p.title)}</h3>
          <div class="post-meta">${p.date}</div>
          <div class="admin-actions">
            <a href="blog.html#${p.id}" target="_blank" class="btn btn-small">View</a>
            <button data-id="${p.id}" class="btn btn-small btn-ghost delete-post">Delete</button>
          </div>
        `;
        list.appendChild(el);
      });

      Array.from(document.querySelectorAll('.delete-post')).forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = btn.getAttribute('data-id');
          const posts = loadPosts().filter(p => p.id !== id);
          savePosts(posts);
          renderAdminList();
        });
      });
    }
  }

  function escapeHtml(s) {
    if (!s) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('post-form');
    const clearBtn = document.getElementById('clear-posts');
    // Initialize Quill RTE if available
    let quill = null;
    try {
      if (window.Quill) {
        quill = new Quill('#editor', { theme: 'snow' });
        // If there's a hidden textarea, keep it in sync when content changes
        quill.on('text-change', () => {
          const html = document.querySelector('#editor .ql-editor').innerHTML;
          const ta = document.getElementById('post-content');
          if (ta) ta.value = html;
        });
      }
    } catch (err) {
      quill = null;
    }

    renderAdminList();

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const title = document.getElementById('post-title').value.trim();
      const date = document.getElementById('post-date').value || new Date().toISOString();
      const excerpt = document.getElementById('post-excerpt').value.trim();
      // prefer Quill HTML content when available
      let content = '';
      if (quill) {
        content = document.querySelector('#editor .ql-editor').innerHTML.trim();
      } else {
        content = document.getElementById('post-content').value.trim();
      }
      const image = document.getElementById('post-image').value.trim();
      const token = document.getElementById('admin-token')?.value || null;
      if (!title) { alert('Title is required'); return; }
      const posts = loadPosts();
      const post = { id: uid(), title, date, excerpt, content, image };
      // Try to POST to API
      try {
        await window.TWD_API.createPost(post, token);
        form.reset();
        renderAdminList();
        alert('Post created on server — open the Blog to view it.');
        return;
      } catch (err) {
        // Fallback to localStorage
        posts.push(post);
        savePosts(posts);
        form.reset();
        renderAdminList();
        alert('Server unreachable — post saved locally.');
      }
    });

    clearBtn.addEventListener('click', async function () {
      if (!confirm('Remove ALL posts? This cannot be undone.')) return;
      const token = document.getElementById('admin-token')?.value || null;
      // Try server-side clear: delete each post via API
      try {
        const posts = await window.TWD_API.listPosts();
        for (const p of posts) {
          await window.TWD_API.deletePost(p.id, token);
        }
        alert('All posts deleted from server.');
        renderAdminList();
        return;
      } catch (err) {
        // fallback to clearing localStorage
        if (!confirm('Server clear failed or unavailable. Clear local posts instead?')) return;
        localStorage.removeItem(STORAGE_KEY);
        renderAdminList();
      }
    });
  });
})();
