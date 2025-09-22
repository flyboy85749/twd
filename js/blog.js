// Simple client-side blog using localStorage
(function () {
  const STORAGE_KEY = 'twd_posts_v1';

  async function fetchPostsApi() {
    if (!window.TWD_API) throw new Error('No API helper');
    return await window.TWD_API.listPosts();
  }

  function loadPosts() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse posts', e);
      return [];
    }
  }

  function savePosts(posts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }

  function formatDate(d) {
    const dt = new Date(d);
    if (isNaN(dt)) return '';
    return dt.toLocaleDateString();
  }

  function renderList(posts) {
    const container = document.getElementById('posts');
    container.innerHTML = '';
    if (!posts.length) {
      container.innerHTML = '<p>No posts yet. Visit the <a href="admin.html">Admin</a> to add one.</p>';
      return;
    }

    posts.slice().reverse().forEach(post => {
      const el = document.createElement('article');
      el.className = 'post-item';
      el.innerHTML = `
        ${post.image ? `<div class="post-img"><img src="${post.image}" alt=""></div>` : ''}
        <div class="post-body">
          <h2 class="post-title"><a href="blog.html#${post.id}">${escapeHtml(post.title)}</a></h2>
          <div class="post-meta">${formatDate(post.date)} · ${escapeHtml(post.excerpt || '')}</div>
          <p>${escapeHtml(truncate(stripHtml(post.content), 200))}</p>
        </div>
      `;
      container.appendChild(el);
    });
  }

  function renderSingle(post) {
    const container = document.getElementById('posts');
    container.innerHTML = '';
    if (!post) {
      container.innerHTML = '<p>Post not found. <a href="blog.html">Back to blog</a></p>';
      return;
    }
    const el = document.createElement('article');
    el.className = 'post-single';
    el.innerHTML = `
      ${post.image ? `<div class="post-img"><img src="${post.image}" alt=""></div>` : ''}
      <h1>${escapeHtml(post.title)}</h1>
      <div class="post-meta">${formatDate(post.date)}</div>
      <div class="post-content">${post.content}</div>
      <p><a href="blog.html">← Back to blog</a></p>
    `;
    container.appendChild(el);
  }

  function getPostById(posts, id) {
    return posts.find(p => String(p.id) === String(id));
  }

  async function onHashChange() {
    const id = location.hash && location.hash.slice(1);
    // Prefer API
    try {
      if (id) {
        const post = await window.TWD_API.getPost(id);
        renderSingle(post);
        return;
      }
      const posts = await fetchPostsApi();
      renderList(posts);
      return;
    } catch (e) {
      // API failed, fall back to localStorage
      const posts = loadPosts();
      if (id) {
        const post = getPostById(posts, id);
        renderSingle(post);
      } else {
        renderList(posts);
      }
    }
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function stripHtml(s) {
    return s ? s.replace(/<[^>]*>/g, '') : '';
  }

  function truncate(s, n) {
    if (!s) return '';
    return s.length > n ? s.slice(0, n) + '…' : s;
  }

  // Initial render
  window.addEventListener('hashchange', onHashChange);
  document.addEventListener('DOMContentLoaded', onHashChange);
})();
