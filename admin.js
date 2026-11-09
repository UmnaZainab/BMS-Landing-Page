/* Admin dashboard: login card + inquiries table.
 * Depends on same-origin PHP endpoints:
 *   GET  api/login.php      -> { ok, authenticated }
 *   POST api/login.php      -> { ok, authenticated }
 *   POST api/logout.php     -> { ok }
 *   GET  api/inquiries.php  -> { ok, items: [...] }
 */
(function () {
  const app = document.getElementById('app');

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, m => ({
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
    } catch { return iso; }
  }

  function renderLogin(err) {
    app.innerHTML = `
      <section class="login-shell">
        <form class="login-card" id="loginForm" novalidate>
          <a class="brand" href="index.html"><span class="dot"></span>NExBMS</a>
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
          <button class="btn btn-primary" type="submit" id="loginBtn">Sign in <span>→</span></button>
          <div class="form-status" id="status" role="status" data-kind="${err ? 'err' : ''}">${err ? escapeHtml(err) : ''}</div>
        </form>
      </section>`;
    document.getElementById('loginForm').addEventListener('submit', onLoginSubmit);
  }

  function renderDashboard() {
    app.innerHTML = `
      <div class="admin-wrap">
        <div class="admin-head">
          <div>
            <a class="brand" href="index.html" style="margin-bottom:8px"><span class="dot"></span>NExBMS</a>
            <h1>Inquiries</h1>
            <div class="sub">Messages submitted via the Contact Us form.</div>
          </div>
          <div class="admin-actions">
            <button class="btn btn-ghost sm" id="refreshBtn" type="button">Refresh</button>
            <button class="btn btn-ghost sm" id="logoutBtn" type="button">Logout</button>
          </div>
        </div>
        <div class="table-card">
          <div class="table-meta" id="tableMeta"><span class="spinner"></span>Loading…</div>
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
    document.getElementById('refreshBtn').addEventListener('click', loadInquiries);
    document.getElementById('logoutBtn').addEventListener('click', onLogout);
    loadInquiries();
  }

  async function checkAuth() {
    try {
      const r = await fetch('api/login.php', { credentials: 'same-origin' });
      const j = await r.json();
      return !!j.authenticated;
    } catch { return false; }
  }

  async function onLoginSubmit(e) {
    e.preventDefault();
    const btn    = document.getElementById('loginBtn');
    const status = document.getElementById('status');
    const user   = document.getElementById('user').value.trim();
    const pass   = document.getElementById('pass').value;
    if (!user || !pass) {
      status.dataset.kind = 'err';
      status.textContent = 'Enter both username and password.';
      return;
    }
    btn.disabled = true;
    const prev = btn.innerHTML;
    btn.innerHTML = 'Signing in…';
    status.dataset.kind = '';
    status.textContent = '';
    try {
      const r = await fetch('api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ user, pass }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.detail || `Login failed (${r.status})`);
      renderDashboard();
    } catch (err) {
      status.dataset.kind = 'err';
      status.textContent = err.message || 'Sign in failed.';
      btn.disabled = false;
      btn.innerHTML = prev;
    }
  }

  async function onLogout() {
    try {
      await fetch('api/logout.php', { method: 'POST', credentials: 'same-origin' });
    } catch { /* ignore */ }
    renderLogin();
  }

  async function loadInquiries() {
    const meta  = document.getElementById('tableMeta');
    const table = document.getElementById('inqTable');
    const empty = document.getElementById('emptyState');
    meta.dataset.kind = '';
    meta.innerHTML = '<span class="spinner"></span>Loading…';
    table.hidden = true;
    empty.hidden = true;

    try {
      const r = await fetch('api/inquiries.php', { credentials: 'same-origin' });
      if (r.status === 401) { renderLogin('Session expired. Please sign in again.'); return; }
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.detail || `Failed to load (${r.status})`);
      renderRows(j.items || []);
    } catch (err) {
      meta.dataset.kind = 'err';
      meta.textContent = err.message || 'Failed to load inquiries.';
    }
  }

  function renderRows(items) {
    const meta  = document.getElementById('tableMeta');
    const table = document.getElementById('inqTable');
    const empty = document.getElementById('emptyState');
    const tbody = document.getElementById('inqBody');
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

  (async function init() {
    const ok = await checkAuth();
    if (ok) renderDashboard(); else renderLogin();
  })();
})();
