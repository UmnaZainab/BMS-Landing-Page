const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('long inquiry messages expand and collapse without errors', async () => {
  const elements = {};
  const element = id => (elements[id] = {
    hidden: false,
    dataset: {},
    innerHTML: '',
    textContent: '',
    listeners: {},
    addEventListener(type, listener) { this.listeners[type] = listener; },
    querySelectorAll() { return []; },
  });
  for (const id of [
    'app', 'refreshBtn', 'logoutBtn', 'changePasswordBtn', 'addUserBtn',
    'passwordForm', 'userForm', 'inqBody', 'tableMeta', 'inqTable', 'emptyState',
  ]) element(id);

  let onReady;
  const message = `${'A'.repeat(60)}\nSecond line <script>alert(1)</script>`;
  const context = {
    console,
    window: { addEventListener() {} },
    document: {
      readyState: 'loading',
      getElementById: id => elements[id],
      addEventListener(type, listener) { if (type === 'DOMContentLoaded') onReady = listener; },
    },
    fetch: async url => ({
      ok: true,
      status: 200,
      json: async () => url.endsWith('/login')
        ? { ok: true, authenticated: true }
        : { ok: true, items: [{ message, full_name: 'Ada', email: '', phone: '', subject: '' }] },
    }),
  };
  const source = fs.readFileSync(path.join(__dirname, '..', 'admin', 'admin.js'), 'utf8');
  vm.runInNewContext(source, context);
  onReady();
  await new Promise(resolve => setImmediate(resolve));

  const markup = elements.inqBody.innerHTML;
  assert.match(markup, /A{60}\.\.\./);
  assert.match(markup, /class="message-text message-full" hidden/);
  assert.match(markup, /Second line &lt;script&gt;alert\(1\)&lt;\/script&gt;/);

  const preview = { hidden: false };
  const full = { hidden: true };
  const cell = { querySelector: selector => selector === '.message-preview' ? preview : full };
  const button = {
    textContent: 'View more',
    attributes: { 'aria-expanded': 'false' },
    getAttribute(name) { return this.attributes[name]; },
    setAttribute(name, value) { this.attributes[name] = value; },
    closest: selector => selector === '.cell-msg' ? cell : null,
  };
  const event = { target: { closest: selector => selector === '.message-toggle' ? button : null } };
  const click = elements.inqBody.listeners.click;
  assert.equal(typeof click, 'function');

  click(event);
  assert.equal(preview.hidden, true);
  assert.equal(full.hidden, false);
  assert.equal(button.textContent, 'Show less');
  assert.equal(button.getAttribute('aria-expanded'), 'true');

  click(event);
  assert.equal(preview.hidden, false);
  assert.equal(full.hidden, true);
  assert.equal(button.textContent, 'View more');
  assert.equal(button.getAttribute('aria-expanded'), 'false');
});
