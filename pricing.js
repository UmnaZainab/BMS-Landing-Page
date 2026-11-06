/* Pricing page: premium interactive modular builder. Renders into #plans,
   tracks a cart, and carries the selection to the demo page on checkout.
   Loaded BEFORE common.js so its .reveal cards get the shared reveal observer. */
(function () {
  const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
  const money = n => `Rs ${n.toLocaleString('en-PK')}`;

  // Centralized module prices update the cards and live total automatically.
  const modules = [
    { name: 'Employee Management', tag: 'Core Module', tagClass: 'core', price: 5000, items: ['Employee profiles and account controls', 'Role-based access', 'Employment and reporting details'] },
    { name: 'HR Management', tag: 'Popular Add-on', tagClass: '', price: 15000, items: ['Employee management workflows', 'Leave review and balances', 'Asset and equipment requests'] },
    { name: 'Attendance & Leave', tag: 'High Impact', tagClass: 'impact', price: 8000, items: ['Check-in and check-out', 'Attendance records and late tracking', 'Leave requests and balances'] },
    { name: 'Finance & Payroll', tag: 'Popular Add-on', tagClass: '', price: 10000, items: ['Salary and deduction management', 'Monthly payroll summaries', 'CSV exports and PDF payslips'] },
    { name: 'Projects & Tasks', tag: 'High Impact', tagClass: 'impact', price: 12000, items: ['Projects and task assignment', 'Progress, status and due dates', 'Operational announcements'] }
  ];
  const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  const icons = {
    'Employee Management': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
    'HR Management': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    'Attendance & Leave': '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    'Finance & Payroll': '<path d="M20 7V5a2 2 0 0 0-2-2H6a3 3 0 0 0 0 6h14v9a2 2 0 0 1-2 2H6a3 3 0 0 1-3-3V6"/><path d="M16 13h2"/>',
    'Projects & Tasks': '<path d="M9 11h8M9 16h8M9 6h8"/><path d="m4 6 1 1 2-2M4 11l1 1 2-2M4 16l1 1 2-2"/>'
  };

  $('#plans').innerHTML = `<div class="mod-grid">${modules.map(m => `<article class="mod-card reveal" data-mod="${m.name}"><span class="mod-badge">${check}</span><span class="mod-ic">${svg(icons[m.name])}</span><div class="mod-head"><h4>${m.name}</h4><span class="mod-tag ${m.tagClass}">${m.tag}</span></div><div class="mod-price">${money(m.price)}<em>/ mo</em></div><ul class="mod-feats">${m.items.map(it => `<li>${it}</li>`).join('')}</ul><button class="mod-btn" type="button" data-mod-btn="${m.name}">Add to Plan</button></article>`).join('')}</div>
    <div class="cart-bar reveal"><div class="cart-info"><span class="cart-count-pill" id="cartCount">0 selected</span><span id="cartTotal">Total: Rs 0 / mo</span></div><button class="cart-checkout" type="button" id="cartCheckout">Continue with Selected Plan <span>→</span></button></div>`;

  const selected = new Set();
  function updateCart() {
    const chosen = modules.filter(m => selected.has(m.name)), total = chosen.reduce((s, m) => s + m.price, 0);
    const c = $('#cartCount');
    c.textContent = `${selected.size} selected`;
    c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
    $('#cartTotal').textContent = `Total: ${money(total)} / mo`;
  }
  $$('[data-mod-btn]').forEach(b => { b.addEventListener('click', () => {
    const name = b.dataset.modBtn, card = b.closest('.mod-card');
    if (selected.has(name)) { selected.delete(name); b.classList.remove('added'); b.textContent = 'Add to Plan'; card.classList.remove('selected'); }
    else { selected.add(name); b.classList.add('added'); b.innerHTML = 'Added to Plan <span>✓</span>'; card.classList.add('selected'); }
    updateCart();
  }); });
  updateCart();

  $('#cartCheckout').addEventListener('click', () => {
    const names = modules.filter(m => selected.has(m.name)).map(m => m.name);
    try { localStorage.setItem('nexum-cart', JSON.stringify(names)); } catch (e) {}
    location.href = 'demo.html';
  });
})();
