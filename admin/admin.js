/* Admin dashboard: login card + inquiries table.
 * Served from /admin/ with same-origin Netlify Functions.
 * Endpoints (same-origin):
 *   GET  /.netlify/functions/login      -> { ok, authenticated }
 *   POST /.netlify/functions/login      -> { ok, authenticated }
 *   POST /.netlify/functions/logout     -> { ok }
 *   GET  /.netlify/functions/inquiries  -> { ok, items: [...] }
 *   POST /.netlify/functions/user-management -> account updates
 */
(function () {
  'use strict';

  let API = {
    login:     '/.netlify/functions/login',
    logout:    '/.netlify/functions/logout',
    inquiries: '/.netlify/functions/inquiries',
    users:     '/.netlify/functions/user-management',
    pricing:   '/.netlify/functions/pricing',
  };
  const PHP_API = {
    login: '/api/login.php',
    logout: '/api/logout.php',
    inquiries: '/api/inquiries.php',
    users: '/api/user-management.php',
    pricing: '/.netlify/functions/pricing',
  };
  const HOME = '../index.html';
  const logoMark = `<span class="logo" aria-hidden="true"><svg viewBox="0 0 38 38" focusable="false"><rect width="38" height="38" rx="10" fill="#CC0000"/><path d="M10 1h18" stroke="#FFFFFF" stroke-opacity=".22" stroke-linecap="round"/><path d="M9 28V10h4.3l11.4 11.3V10H29v18h-4.3L13.3 16.7V28Z" fill="#FFFFFF"/><path d="M15 10h2.4l2.8 2.8h-2.4Z" fill="#CC0000"/></svg></span>`;

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
    if (!iso) return 'Not available';
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
          <a class="brand" href="${HOME}">${logoMark}<span><b>NExBMS</b><small>NEXUM GLOBAL SOLUTIONS</small></span></a>
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
            <a class="brand" href="${HOME}" style="margin-bottom:8px">${logoMark}<span><b>NExBMS</b><small>NEXUM GLOBAL SOLUTIONS</small></span></a>
            <h1 id="panelTitle">Inquiries</h1>
            <div class="sub" id="panelSub">Messages submitted via the Contact Us form.</div>
          </div>
          <div class="admin-actions">
            <button class="btn btn-ghost sm" id="refreshBtn" type="button">Refresh</button>
            <button class="btn btn-ghost sm" id="changePasswordBtn" type="button">Change Password</button>
            <button class="btn btn-ghost sm" id="addUserBtn" type="button">Add New User</button>
            <button class="btn btn-ghost sm" id="logoutBtn" type="button">Logout</button>
          </div>
        </div>
        <div class="admin-tabs" role="tablist" aria-label="Admin sections">
          <button class="admin-tab active" type="button" role="tab" aria-selected="true" data-tab="inquiries">Inquiries</button>
          <button class="admin-tab" type="button" role="tab" aria-selected="false" data-tab="pricing">Pricing</button>
        </div>
        <div class="admin-notice" id="dashboardStatus" role="status" aria-live="polite"></div>

        <div class="admin-panel" id="panel-inquiries" role="tabpanel">
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
        </div>

        <div class="admin-panel" id="panel-pricing" role="tabpanel" hidden>
          <div class="table-card">
            <div class="pricing-card-head">
              <h2>Pricing amounts</h2>
              <p>Edit the numeric price shown on each pricing page card. Other card content is managed in the HTML.</p>
            </div>
            <div class="table-meta" id="priceMeta"><span class="spinner"></span>Loading&hellip;</div>
            <div class="table-scroll">
              <table class="price-table" id="priceTable" hidden>
                <thead><tr>
                  <th>Card</th><th>Current amount</th><th>Default</th><th>Save</th>
                </tr></thead>
                <tbody id="priceBody"></tbody>
              </table>
            </div>
            <div class="empty" id="priceEmpty" hidden>No pricing cards configured.</div>
          </div>
        </div>
        <dialog class="admin-dialog" id="passwordDialog" aria-labelledby="passwordDialogTitle">
          <form id="passwordForm">
            <h2 id="passwordDialogTitle">Change Password</h2>
            <div class="field"><label for="currentPassword">Current Password</label><input id="currentPassword" type="password" autocomplete="current-password" required></div>
            <div class="field"><label for="newPassword">New Password</label><input id="newPassword" type="password" autocomplete="new-password" minlength="12" required></div>
            <div class="field"><label for="confirmPassword">Confirm New Password</label><input id="confirmPassword" type="password" autocomplete="new-password" minlength="12" required></div>
            <div class="form-status" id="passwordStatus" role="alert"></div>
            <div class="dialog-actions"><button class="btn btn-ghost" type="button" data-close-dialog>Cancel</button><button class="btn btn-primary" type="submit">Save Password</button></div>
          </form>
        </dialog>
        <dialog class="admin-dialog" id="userDialog" aria-labelledby="userDialogTitle">
          <form id="userForm">
            <h2 id="userDialogTitle">Add New User</h2>
            <div class="field"><label for="newUsername">New Username</label><input id="newUsername" autocomplete="off" minlength="3" maxlength="64" pattern="[A-Za-z0-9_.-]+" required></div>
            <div class="field"><label for="userPassword">Password</label><input id="userPassword" type="password" autocomplete="new-password" minlength="12" required></div>
            <div class="form-status" id="userStatus" role="alert"></div>
            <div class="dialog-actions"><button class="btn btn-ghost" type="button" data-close-dialog>Cancel</button><button class="btn btn-primary" type="submit">Add User</button></div>
          </form>
        </dialog>
      </div>`;
    const r = $('refreshBtn');
    const l = $('logoutBtn');
    if (r) r.addEventListener('click', refreshActiveTab);
    if (l) l.addEventListener('click', onLogout);
    appEl.querySelectorAll('.admin-tab').forEach(btn => {
      btn.addEventListener('click', () => setActiveTab(btn.dataset.tab));
    });
    $('priceBody').addEventListener('click', onPricingSaveClick);
    $('priceBody').addEventListener('input', onPricingInput);
    $('inqBody').addEventListener('click', event => {
      const button = event.target.closest('.message-toggle');
      if (!button) return;
      const cell = button.closest('.cell-msg');
      const preview = cell.querySelector('.message-preview');
      const full = cell.querySelector('.message-full');
      const expanded = button.getAttribute('aria-expanded') === 'true';
      preview.hidden = !expanded;
      full.hidden = expanded;
      button.setAttribute('aria-expanded', String(!expanded));
      button.textContent = expanded ? 'View more' : 'Show less';
    });
    $('changePasswordBtn').addEventListener('click', () => openDialog('passwordDialog'));
    $('addUserBtn').addEventListener('click', () => openDialog('userDialog'));
    $('passwordForm').addEventListener('submit', changePassword);
    $('userForm').addEventListener('submit', addUser);
    appEl.querySelectorAll('[data-close-dialog]').forEach(button => {
      button.addEventListener('click', () => button.closest('dialog').close());
    });
    activeTab = 'inquiries';
    loadInquiries();
  }

  let activeTab = 'inquiries';
  const PANEL_META = {
    inquiries: { title: 'Inquiries', sub: 'Messages submitted via the Contact Us form.' },
    pricing:   { title: 'Pricing',   sub: 'Live amounts shown on NExBMS pricing cards.' },
  };

  function setActiveTab(name) {
    if (!PANEL_META[name]) return;
    activeTab = name;
    appEl.querySelectorAll('.admin-tab').forEach(btn => {
      const on = btn.dataset.tab === name;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    appEl.querySelectorAll('.admin-panel').forEach(p => {
      p.hidden = p.id !== 'panel-' + name;
    });
    const meta = PANEL_META[name];
    const t = $('panelTitle'); if (t) t.textContent = meta.title;
    const s = $('panelSub');   if (s) s.textContent = meta.sub;
    dashboardStatus('', '');
    if (name === 'pricing') loadPricing();
  }

  function refreshActiveTab() {
    if (activeTab === 'pricing') loadPricing();
    else loadInquiries();
  }

  function openDialog(id) {
    const dialog = $(id);
    if (!dialog) return;
    dialog.querySelector('form').reset();
    const status = dialog.querySelector('.form-status');
    status.textContent = '';
    status.dataset.kind = '';
    dialog.showModal();
  }

  function dashboardStatus(kind, message) {
    const status = $('dashboardStatus');
    if (!status) return;
    status.dataset.kind = kind;
    status.textContent = message;
  }

  async function submitUserAction(form, payload, statusId, successMessage) {
    const button = form.querySelector('button[type="submit"]');
    const status = $(statusId);
    if (button.disabled) return;
    button.disabled = true;
    status.textContent = '';
    status.dataset.kind = '';
    try {
      const response = await fetch(API.users, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) { renderLogin('Session expired. Please sign in again.'); return; }
      if (!response.ok || !result.ok) throw new Error(result.detail || `Request failed (${response.status})`);
      form.reset();
      form.closest('dialog').close();
      dashboardStatus('ok', successMessage);
    } catch (error) {
      status.dataset.kind = 'err';
      status.textContent = error.message || 'Request failed. Please try again.';
    } finally {
      button.disabled = false;
    }
  }

  function changePassword(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const current = $('currentPassword').value;
    const next = $('newPassword').value;
    const confirm = $('confirmPassword').value;
    if (next !== confirm) {
      const status = $('passwordStatus');
      status.dataset.kind = 'err';
      status.textContent = 'New passwords do not match.';
      return;
    }
    submitUserAction(form, {
      action: 'change-password', current_password: current, new_password: next,
    }, 'passwordStatus', 'Password changed successfully.');
  }

  function addUser(event) {
    event.preventDefault();
    const form = event.currentTarget;
    submitUserAction(form, {
      action: 'add-user', username: $('newUsername').value.trim(), password: $('userPassword').value,
    }, 'userStatus', 'User added successfully.');
  }

  async function checkAuth() {
    try {
      let r = await fetch(API.login, { credentials: 'same-origin' });
      if (r.status === 404) {
        API = PHP_API;
        r = await fetch(API.login, { credentials: 'same-origin' });
      }
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
    tbody.innerHTML = items.map(it => {
      const message = String(it.message || '');
      const characters = Array.from(message);
      const isLong = characters.length > 60;
      const preview = isLong ? `${characters.slice(0, 60).join('')}...` : message;
      return `
      <tr>
        <td class="cell-date">${escapeHtml(formatDate(it.created_at))}</td>
        <td>${escapeHtml(it.full_name)}</td>
        <td class="cell-email">${it.email ? `<a href="mailto:${escapeAttr(it.email)}">${escapeHtml(it.email)}</a>` : ''}</td>
        <td class="cell-phone">${it.phone ? `<a href="tel:${escapeAttr(it.phone)}">${escapeHtml(it.phone)}</a>` : ''}</td>
        <td>${escapeHtml(it.subject)}</td>
        <td class="cell-msg">
          <div class="message-text message-preview">${escapeHtml(preview)}</div>
          ${isLong ? `<div class="message-text message-full" hidden>${escapeHtml(message)}</div>
          <button class="message-toggle" type="button" aria-expanded="false">View more</button>` : ''}
        </td>
      </tr>`;
    }).join('');
    table.hidden = false;
  }

  function formatPKR(amount) {
    const n = Number(amount);
    if (!Number.isFinite(n)) return String(amount);
    try { return n.toLocaleString('en-PK'); }
    catch (e) { return String(Math.round(n)); }
  }

  async function loadPricing() {
    const meta  = $('priceMeta');
    const table = $('priceTable');
    const empty = $('priceEmpty');
    const body  = $('priceBody');
    if (!meta || !table || !empty || !body) return;
    meta.dataset.kind = '';
    meta.innerHTML = '<span class="spinner"></span>Loading&hellip;';
    table.hidden = true;
    empty.hidden = true;
    try {
      const r = await fetch(API.pricing, { credentials: 'same-origin' });
      if (r.status === 401) { renderLogin('Session expired. Please sign in again.'); return; }
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.detail || `Failed to load (${r.status})`);
      renderPricing(j.items || []);
    } catch (err) {
      meta.dataset.kind = 'err';
      meta.textContent = (err && err.message) || 'Failed to load pricing.';
    }
  }

  function renderPricing(items) {
    const meta  = $('priceMeta');
    const table = $('priceTable');
    const empty = $('priceEmpty');
    const body  = $('priceBody');
    if (!meta || !table || !empty || !body) return;
    if (!items.length) {
      meta.textContent = '0 pricing cards';
      empty.hidden = false;
      return;
    }
    meta.textContent = `${items.length} pricing card${items.length === 1 ? '' : 's'}`;
    body.innerHTML = items.map(it => {
      const current = Number(it.currentAmount);
      const def     = Number(it.defaultAmount);
      const isDefault = current === def;
      return `
        <tr data-row-id="${escapeAttr(it.id)}" data-default="${def}" data-current="${current}">
          <td class="price-card-name">${escapeHtml(it.cardName)}</td>
          <td>
            <span class="price-input-wrap">
              <span class="currency">Rs</span>
              <input class="price-input" type="number" inputmode="numeric" min="0" step="1"
                     value="${current}" data-price-input aria-label="Current amount for ${escapeAttr(it.cardName)}">
            </span>
            <span class="price-row-status" data-price-status></span>
          </td>
          <td>
            <span class="price-default">
              <span>Rs ${escapeHtml(formatPKR(def))}</span>
              ${isDefault ? '<span class="in-use">(in use)</span>' : ''}
            </span>
          </td>
          <td>
            <button class="btn btn-primary sm price-save" type="button" data-price-save>Save</button>
          </td>
        </tr>`;
    }).join('');
    table.hidden = false;
  }

  function onPricingInput(event) {
    const input = event.target.closest('[data-price-input]');
    if (!input) return;
    const row    = input.closest('tr');
    const save   = row && row.querySelector('[data-price-save]');
    const status = row && row.querySelector('[data-price-status]');
    if (!row || !save) return;
    const current = Number(row.dataset.current);
    const next    = Number(input.value);
    const changed = Number.isFinite(next) && next !== current;
    input.classList.toggle('dirty', changed);
    save.classList.remove('saved');
    save.textContent = 'Save';
    if (status) { status.dataset.kind = ''; status.textContent = ''; }
  }

  async function onPricingSaveClick(event) {
    const btn = event.target.closest('[data-price-save]');
    if (!btn) return;
    const row    = btn.closest('tr');
    const input  = row && row.querySelector('[data-price-input]');
    const status = row && row.querySelector('[data-price-status]');
    if (!row || !input) return;
    const id     = row.dataset.rowId;
    const amount = Number(input.value);
    if (!Number.isFinite(amount) || amount < 0) {
      if (status) { status.dataset.kind = 'err'; status.textContent = 'Enter a non-negative number.'; }
      return;
    }
    btn.disabled = true;
    btn.classList.add('saving');
    btn.classList.remove('saved');
    btn.textContent = 'Saving…';
    if (status) { status.dataset.kind = ''; status.textContent = ''; }
    try {
      const r = await fetch(API.pricing, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ id, amount }),
      });
      if (r.status === 401) { renderLogin('Session expired. Please sign in again.'); return; }
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.detail || `Save failed (${r.status})`);

      const saved = j.item && Number(j.item.currentAmount);
      const def   = Number(row.dataset.default);
      row.dataset.current = String(saved);
      input.value = String(saved);
      input.classList.remove('dirty');
      btn.classList.remove('saving');
      btn.classList.add('saved');
      btn.textContent = 'Saved ✓';
      // Refresh the "(in use)" badge next to the default column.
      const defCell = row.querySelector('.price-default');
      if (defCell) {
        defCell.innerHTML = `<span>Rs ${escapeHtml(formatPKR(def))}</span>${
          saved === def ? '<span class="in-use">(in use)</span>' : ''
        }`;
      }
      setTimeout(() => {
        btn.classList.remove('saved');
        btn.textContent = 'Save';
      }, 1800);
    } catch (err) {
      btn.classList.remove('saving');
      btn.textContent = 'Save';
      if (status) { status.dataset.kind = 'err'; status.textContent = (err && err.message) || 'Save failed.'; }
    } finally {
      btn.disabled = false;
    }
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
