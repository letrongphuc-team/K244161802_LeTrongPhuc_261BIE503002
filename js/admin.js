'use strict';
/* Câu 8: Admin – đăng nhập, quản lý đơn hàng, thống kê */
let EMP = [], CUS = [], PRODS = [], ORDERS = [];
const total = o => o.items.reduce((s, i) => s + i.price * i.quantity, 0);
const empName = id => (EMP.find(e => e.id === id) || {name: id === 'WEB' ? 'Website (tự động)' : id}).name;
const cusName = o => o.customer ? o.customer.name : (CUS.find(c => c.id === o.customer_id) || {name: o.customer_id}).name;
const prodName = id => (PRODS.find(p => p.id === +id) || {title: 'SP #' + id}).title;
const catOf = id => (PRODS.find(p => p.id === +id) || {category: '?'}).category;

async function loadData() {
  const [ed, cd, pd, ca] = await Promise.all([loadJSON('data/employees.json'), loadJSON('data/customers.json'), loadXML('data/products.xml'), loadXML('data/carts.xml')]);
  EMP = ed.employees; CUS = cd.customers; PRODS = parseProducts(pd);
  const xml = [...ca.getElementsByTagName('cart')].map(c => ({
    id: c.getAttribute('id'), date: c.getAttribute('date'), employee_id: c.getAttribute('employee_id'), customer_id: c.getAttribute('customer_id'), source: 'XML',
    items: [...c.getElementsByTagName('item')].map(i => ({product_id: +i.getAttribute('product_id'), quantity: +i.getAttribute('quantity'), color: i.getAttribute('color'), size: i.getAttribute('size'), price: +i.getAttribute('price')}))}));
  ORDERS = xml.concat(LS.get('orders', []));      // đơn mẫu (XML) + đơn phát sinh từ website (localStorage)
}
function renderOrders(q = '') {
  const kw = q.toLowerCase();
  const rows = ORDERS.filter(o => !kw || o.id.toLowerCase().includes(kw) || cusName(o).toLowerCase().includes(kw))
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(o => `<tr><td><b>${o.id}</b></td><td>${o.date}</td><td>${esc(empName(o.employee_id))}</td><td>${esc(cusName(o))}</td><td>${o.source === 'Web' ? 'Website' : 'Hóa đơn mẫu'}</td>
      <td class="r">${o.items.reduce((s, i) => s + i.quantity, 0)}</td><td class="r">${money(total(o))}</td><td><button class="btn" data-detail="${o.id}">Chi tiết</button></td></tr>`).join('');
  $('#tab-orders').innerHTML = `<div class="toolbar"><h3 style="margin:0">Danh sách đơn hàng (${ORDERS.length})</h3><input id="oq" type="search" placeholder="Tìm mã HĐ / tên khách…" value="${esc(q)}"></div>
    <table class="tbl"><thead><tr><th>Mã HĐ</th><th>Ngày tạo</th><th>Nhân viên</th><th>Khách hàng</th><th>Nguồn</th><th class="r">SL</th><th class="r">Tổng tiền</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="8">Không có đơn hàng</td></tr>'}</tbody></table>`;
  const inp = $('#oq'); inp.focus(); inp.setSelectionRange(q.length, q.length);
  inp.addEventListener('input', () => renderOrders(inp.value));
}
function renderStats() {
  const rev = ORDERS.reduce((s, o) => s + total(o), 0), qty = ORDERS.reduce((s, o) => s + o.items.reduce((a, i) => a + i.quantity, 0), 0);
  const byDate = {}; ORDERS.forEach(o => byDate[o.date] = (byDate[o.date] || 0) + total(o));
  const byCat = {}; ORDERS.forEach(o => o.items.forEach(i => byCat[catOf(i.product_id)] = (byCat[catOf(i.product_id)] || 0) + i.price * i.quantity));
  const byEmp = {}; ORDERS.forEach(o => { const n = empName(o.employee_id); byEmp[n] = (byEmp[n] || 0) + total(o); });
  const bars = obj => { const mx = Math.max(...Object.values(obj), 1); return Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<tr><td>${esc(k)}</td><td style="width:45%"><div class="bar"><span style="width:${v / mx * 100}%"></span></div></td><td class="r">${money(v)}</td></tr>`).join(''); };
  $('#tab-stats').innerHTML = `<div class="stat-cards">
    <div class="stat"><b id="stOrders">${ORDERS.length}</b><span>Tổng số đơn hàng</span></div>
    <div class="stat"><b id="stRev">${money(rev)}</b><span>Tổng doanh thu</span></div>
    <div class="stat"><b>${qty}</b><span>Sản phẩm đã bán</span></div>
    <div class="stat"><b>${money(ORDERS.length ? rev / ORDERS.length : 0)}</b><span>Giá trị đơn trung bình</span></div></div>
    <div class="panel"><h3 style="margin-top:0">Doanh thu theo ngày</h3><table class="tbl"><tbody>${bars(byDate)}</tbody></table></div><br>
    <div class="panel"><h3 style="margin-top:0">Doanh thu theo danh mục</h3><table class="tbl"><tbody>${bars(byCat)}</tbody></table></div><br>
    <div class="panel"><h3 style="margin-top:0">Doanh thu theo nhân viên</h3><table class="tbl"><tbody>${bars(byEmp)}</tbody></table></div>`;
}
function renderProducts() {
  const m = {};
  ORDERS.forEach(o => o.items.forEach(i => { const x = m[i.product_id] = m[i.product_id] || {q: 0, r: 0}; x.q += i.quantity; x.r += i.quantity * i.price; }));
  const arr = Object.entries(m).sort((a, b) => b[1].q - a[1].q), mx = arr.length ? arr[0][1].q : 1;
  $('#tab-products').innerHTML = `<h3 style="margin-top:0">Sản phẩm được bán (${arr.length} / ${PRODS.length} sản phẩm)</h3><table class="tbl"><thead><tr><th>#</th><th>Sản phẩm</th><th>Danh mục</th><th>Đã bán</th><th></th><th class="r">Doanh thu</th></tr></thead><tbody>
    ${arr.map(([id, x], k) => `<tr><td>${k + 1}</td><td>${esc(prodName(id))}</td><td>${esc(catOf(id))}</td><td><b>${x.q}</b></td><td style="width:20%"><div class="bar"><span style="width:${x.q / mx * 100}%"></span></div></td><td class="r">${money(x.r)}</td></tr>`).join('')}</tbody></table>`;
}
function showDetail(id) {
  const o = ORDERS.find(x => x.id === id);
  openModal(`<h3>Chi tiết hóa đơn ${o.id}</h3><p>Ngày: <b>${o.date}</b> · Nhân viên: <b>${esc(empName(o.employee_id))}</b> · Khách hàng: <b>${esc(cusName(o))}</b></p>
    ${o.customer ? `<p class="hint">${esc(o.customer.phone)} · ${esc(o.customer.email)} · ${esc(o.customer.address)}</p>` : ''}
    <table class="tbl"><thead><tr><th>Sản phẩm</th><th>Màu/Size</th><th class="r">Đơn giá</th><th class="r">SL</th><th class="r">Thành tiền</th></tr></thead><tbody>
    ${o.items.map(i => `<tr><td>${esc(prodName(i.product_id))}</td><td>${esc(i.color)}${i.size ? ' / ' + esc(i.size) : ''}</td><td class="r">${money(i.price)}</td><td class="r">${i.quantity}</td><td class="r">${money(i.price * i.quantity)}</td></tr>`).join('')}
    </tbody><tfoot><tr><th colspan="4" class="r">Tổng cộng</th><th class="r">${money(total(o))}</th></tr></tfoot></table>`);
}
function showTab(name) {
  $$('#tabs .btn').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
  ['orders', 'stats', 'products'].forEach(t => $('#tab-' + t).hidden = t !== name);
  ({orders: () => renderOrders(), stats: renderStats, products: renderProducts})[name]();
}
async function enterDashboard(user) {
  $('#loginView').hidden = true; $('#dashView').hidden = false; $('#logoutBtn').hidden = false;
  $('#who').textContent = `👤 ${user.name} (${user.role})`; $('#who').style.color = '#fff';
  try { await loadData(); showTab('orders'); } catch (e) { showError(e); }
}
$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const u = $('#u').value.trim(), p = $('#pw').value;
  if (!u || !p) { $('#loginMsg').textContent = 'Vui lòng nhập đủ tên đăng nhập và mật khẩu'; return; }
  try {
    const list = (await loadJSON('data/employees.json')).employees;
    const user = list.find(x => x.username === u && x.password === p);
    if (!user) { $('#loginMsg').textContent = '✘ Sai tên đăng nhập hoặc mật khẩu'; return; }
    sessionStorage.setItem('admin_user', JSON.stringify(user)); enterDashboard(user);
  } catch (err) { showError(err); }
});
$('#tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) showTab(b.dataset.tab); });
$('#tab-orders').addEventListener('click', e => { const b = e.target.closest('[data-detail]'); if (b) showDetail(b.dataset.detail); });
$('#logoutBtn').addEventListener('click', () => { sessionStorage.removeItem('admin_user'); location.reload(); });
const saved = sessionStorage.getItem('admin_user'); if (saved) enterDashboard(JSON.parse(saved));
