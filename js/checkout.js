'use strict';
/* Câu 7: Form validation bằng Regex + giả lập gửi API thanh toán */
const RE = {
  fullname: /^\p{L}+(\s\p{L}+)+$/u,                                             // ít nhất 2 từ, chỉ chữ
  phone: /^(0|\+84)(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/,           // SĐT di động Việt Nam
  email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/   // email
};
const RULES = {
  fullname: {test: v => RE.fullname.test(v.trim()), bad: 'Họ tên gồm ít nhất 2 từ, không chứa số/ký tự đặc biệt'},
  phone: {test: v => RE.phone.test(v.trim()), bad: 'SĐT không hợp lệ (VD: 0912345678 hoặc +84912345678)'},
  email: {test: v => RE.email.test(v.trim()), bad: 'Email không hợp lệ (VD: ten@example.com)'},
  address: {test: v => v.trim().length >= 8, bad: 'Địa chỉ tối thiểu 8 ký tự'}
};
function checkField(input) {
  const r = RULES[input.name], msg = $(`.msg[data-for="${input.name}"]`);
  const ok = r.test(input.value);
  input.classList.toggle('ok', ok); input.classList.toggle('bad', !ok);
  msg.className = 'msg ' + (ok ? 'ok' : 'bad'); msg.textContent = ok ? '✔ Hợp lệ' : '✘ ' + r.bad;
  return ok;
}
let CUSTOMERS_CACHE = [];
async function openCheckout() {
  if (!Cart.items.length) return toast('Giỏ hàng đang trống');
  try { CUSTOMERS_CACHE = (await loadJSON('data/customers.json')).customers; } catch (e) { CUSTOMERS_CACHE = []; }
  openModal(`<h3>Thanh toán</h3><p class="hint">${Cart.count()} sản phẩm – Tổng: <b>${money(Cart.total)}</b></p>
  <form id="checkoutForm" novalidate>
    <div class="field"><label for="quick">Điền nhanh từ tài khoản khách hàng (tùy chọn)</label>
      <select id="quick"><option value="">-- Khách vãng lai --</option>${CUSTOMERS_CACHE.map(c => `<option value="${c.id}">${esc(c.name)} (${c.id})</option>`).join('')}</select></div>
    <div class="field"><label>Họ và tên</label><input name="fullname" autocomplete="off"><span class="msg" data-for="fullname"></span></div>
    <div class="field"><label>Số điện thoại</label><input name="phone" autocomplete="off" placeholder="0912345678"><span class="msg" data-for="phone"></span></div>
    <div class="field"><label>Email</label><input name="email" autocomplete="off" placeholder="ten@example.com"><span class="msg" data-for="email"></span></div>
    <div class="field"><label>Địa chỉ giao hàng</label><input name="address" autocomplete="off"><span class="msg" data-for="address"></span></div>
    <button class="btn primary block" type="submit" id="payBtn">Xác nhận thanh toán</button>
  </form>`);
  const f = $('#checkoutForm');
  $$('input', f).forEach(i => { ['keyup', 'input', 'blur'].forEach(ev => i.addEventListener(ev, () => checkField(i))); });   // kiểm tra ngay lập tức
  $('#quick').addEventListener('change', e => {
    const c = CUSTOMERS_CACHE.find(x => x.id === e.target.value); if (!c) return;
    f.fullname.value = c.name; f.phone.value = c.phone; f.email.value = c.email; f.address.value = c.address;
    $$('input', f).forEach(checkField);
  });
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const valid = $$('input', f).map(checkField).every(Boolean);   // kiểm tra tất cả, không dừng sớm
    if (!valid) return;
    $('#payBtn').disabled = true; $('#payBtn').textContent = 'Đang gửi API thanh toán (giả lập)...';
    await sleep(900);                                              // giả lập độ trễ API
    const orders = LS.get('orders', []);
    const order = {
      id: 'HD' + String(Date.now()).slice(-6), date: new Date().toISOString().slice(0, 10), source: 'Web',
      employee_id: 'WEB', customer_id: $('#quick').value || 'GUEST',
      customer: {name: f.fullname.value.trim(), phone: f.phone.value.trim(), email: f.email.value.trim(), address: f.address.value.trim()},
      items: Cart.items.map(i => ({product_id: i.id, title: i.title, quantity: i.quantity, color: i.color, size: i.size, price: i.price})),
      total: Cart.total, status: 'Đã thanh toán'
    };
    orders.push(order); LS.set('orders', orders);                  // lưu giả lập vào localStorage
    Cart.clear();
    $('#modalBody').innerHTML = `<div class="success"><div class="tick">✔</div><h3>Thanh toán thành công!</h3>
      <p>Mã đơn: <b id="orderId">${order.id}</b> – Tổng: <b>${money(order.total)}</b></p>
      <p class="hint">Dữ liệu đã lưu vào localStorage (key: <code>orders</code>).</p><button class="btn primary modal-close" style="position:static;font-size:1rem">Đóng</button></div>`;
  });
}
