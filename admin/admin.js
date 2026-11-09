/* Admin dashboard: login card + inquiries table.
 * Served from /admin/ with same-origin Netlify Functions.
 * Endpoints (same-origin):
 *   GET  /.netlify/functions/login      -> { ok, authenticated }
 *   POST /.netlify/functions/login      -> { ok, authenticated }
 *   POST /.netlify/functions/logout     -> { ok }
 *   GET  /.netlify/functions/inquiries  -> { ok, items: [...] }
 */
(function () {
  'use strict';

  const API = {
    login:     '/.netlify/functions/login',
    logout:    '/.netlify/functions/logout',
    inquiries: '/.netlify/functions/inquiries',
  };
  const HOME = '../index.html';

  let appEl = null;
  let loginInFlight = false;

  function $(id) { return document.getElementById(id); }

  function setStatus(kind, text) {
    const s = $('status');
    if (!s) return;
    s.dataset.kind = kind || '';
    s.textContent  = text || '';
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[m]));
  }
  function escapeAttr(s) { return escapeHtml(s).replace(/`/g, '&#96;'); }

  function formatDate(iso) {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
      });
    } catch (e) { return iso; }
  }

  function renderLogin(err) {
    if (!appEl) return;
    appEl.innerHTML = `
      <section class="login-shell">
        <form class="login-card" id="loginForm" novalidate>
          <a class="brand" href="${HOME}"><span class="dot"></span>NExBMS</a>
          <h1>Admin sign in</h1>
          <p class="sub">Access the inquiries dashboard.</p>
          <div class="field">
            <label for="user">Username</label>
            <input id="user" name="user" autocomplete="username" required autofocus>
          </div>
          <div class="field">
            <label for="pass">Password</label>
            <input id="pass" name="pass" type="password" autocomplete="current-password" required>
          </div>
          <button class="btn btn-primary" type="submit" id="loginBtn">Sign in <span>&rarr;</span></button>
          <div class="form-status" id="status" role="status" data-kind="${err ? 'err' : ''}">${err ? escapeHtml(err) : ''}</div>
        </form>
      </section>`;
    const form = $('loginForm');
    const btn  = $('loginBtn');
    if (form) form.addEventListener('submit', doLogin);
    if (btn)  btn.addEventListener('click', doLogin);
  }

  function renderDashboard() {
    if (!appEl) return;
    appEl.innerHTML = `
      <div class="admin-wrap">
        <div class="admin-head">
          <div>
            <a class="brand" href="${HOME}" style="margin-bottom:8px"><span class="dot"></span>NExBMS</a>
            <h1>Inquiries</h1>
            <div class="sub">Messages submitted via the Contact Us form.</div>
          </div>
          <div class="admin-actions">
            <button class="btn btn-ghost sm" id="refreshBtn" type="button">Refresh</button>
            <button class="btn btn-ghost sm" id="logoutBtn" type="button">Logout</button>
          </div>
        </div>
        <div class="table-card">
          <div class="table-meta" id="tableMeta"><span class="spinner"></span>Loading&hellip;</div>
          <div class="table-scroll">
            <table class="inq-table" id="inqTable" hidden>
              <thead><tr>
                <th>Date</th><th>Full Name</th><th>Email</th><th>Phone</th><th>Subject</th><th>Message</th>
              </tr></thead>
              <tbody id="inqBody"></tbody>
            </table>
          </div>
          <div class="empty" id="emptyState" hidden>No inquiries yet.</div>
        </div>
      </div>`;
    const r = $('refreshBtn');
    const l = $('logoutBtn');
    if (r) r.addEventListener('click', loadInquiries);
    if (l) l.addEventListener('click', onLogout);
    loadInquiries();
  }

  async function checkAuth() {
    try {
      const r = await fetch(API.login, { credentials: 'same-origin' });
      if (!r.ok) return false;
      const j = await r.json().catch(() => ({}));
      return !!j.authenticated;
    } catch (e) { return false; }
  }

  async function doLogin(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (loginInFlight) return;

    const userInp = $('user');
    const passInp = $('pass');
    const btn     = $('loginBtn');
    if (!userInp || !passInp || !btn) return;

    const user = (userInp.value || '').trim();
    const pass = passInp.value || '';
    if (!user || !pass) {
      setStatus('err', 'Enter both username and password.');
      return;
    }

    loginInFlight = true;
    btn.disabled = true;
    const prev = btn.innerHTML;
    btn.innerHTML = 'Signing in&hellip;';
    setStatus('', '');

    try {
      const r = await fetch(API.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ user, pass }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.detail || `Login failed (${r.status})`);
      renderDashboard();
    } catch (err) {
      setStatus('err', (err && err.message) || 'Sign in failed.');
      const btnNow = $('loginBtn');
      if (btnNow) { btnNow.disabled = false; btnNow.innerHTML = prev; }
    } finally {
      loginInFlight = false;
    }
  }

  async function onLogout() {
    try {
      await fetch(API.logout, { method: 'POST', credentials: 'same-origin' });
    } catch (e) { /* ignore */ }
    renderLogin();
  }

  async function loadInquiries() {
    const meta  = $('tableMeta');
    const table = $('inqTable');
    const empty = $('emptyState');
    if (!meta || !table || !empty) return;
    meta.dataset.kind = '';
    meta.innerHTML = '<span class="spinner"></span>Loading&hellip;';
    table.hidden = true;
    empty.hidden = true;

    try {
      const r = await fetch(API.inquiries, { credentials: 'same-origin' });
      if (r.status === 401) { renderLogin('Session expired. Please sign in again.'); return; }
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.detail || `Failed to load (${r.status})`);
      renderRows(j.items || []);
    } catch (err) {
      meta.dataset.kind = 'err';
      meta.textContent = (err && err.message) || 'Failed to load inquiries.';
    }
  }

  function renderRows(items) {
    const meta  = $('tableMeta');
    const table = $('inqTable');
    const empty = $('emptyState');
    const tbody = $('inqBody');
    if (!meta || !table || !empty || !tbody) return;
    if (!items.length) {
      meta.textContent = '0 inquiries';
      empty.hidden = false;
      return;
    }
    meta.textContent = `${items.length} inquir${items.length === 1 ? 'y' : 'ies'} · newest first`;
    tbody.innerHTML = items.map(it => `
      <tr>
        <td class="cell-date">${escapeHtml(formatDate(it.created_at))}</td>
        <td>${escapeHtml(it.full_name)}</td>
        <td class="cell-email">${it.email ? `<a href="mailto:${escapeAttr(it.email)}">${escapeHtml(it.email)}</a>` : ''}</td>
        <td class="cell-phone">${it.phone ? `<a href="tel:${escapeAttr(it.phone)}">${escapeHtml(it.phone)}</a>` : ''}</td>
        <td>${escapeHtml(it.subject)}</td>
        <td class="cell-msg">${escapeHtml(it.message)}</td>
      </tr>`).join('');
    table.hidden = false;
  }

  async function init() {
    appEl = $('app');
    if (!appEl) {
      console.error('[admin] #app element not found');
      return;
    }
    window.addEventListener('error', ev => {
      console.error('[admin] window error:', ev.message, ev.filename, ev.lineno);
    });
    window.addEventListener('unhandledrejection', ev => {
      console.error('[admin] unhandled rejection:', ev.reason);
    });
    const ok = await checkAuth();
    if (ok) renderDashboard(); else renderLogin();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
