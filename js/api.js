// Small helper to communicate with the server API and fall back to localStorage
(function () {
  const BASE = '/api';

  async function fetchJson(url, opts) {
    try {
      opts = opts || {};
      // send credentials for session support
      opts.credentials = 'same-origin';
      const res = await fetch(url, opts);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      // propagate error to caller; caller can decide to fall back
      throw e;
    }
  }

  window.TWD_API = {
    listPosts: async function () { return fetchJson(BASE + '/posts'); },
    getPost: async function (id) { return fetchJson(BASE + '/posts/' + encodeURIComponent(id)); },
    createPost: async function (post, token) {
      return fetchJson(BASE + '/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'x-admin-token': token } : {}) },
        body: JSON.stringify(post)
      });
    },
    deletePost: async function (id, token) {
      return fetchJson(BASE + '/posts/' + encodeURIComponent(id), {
        method: 'DELETE',
        headers: token ? { 'x-admin-token': token } : {}
      });
    }
  };
})();
