'use strict';
/* Câu 6: Quản lý state giỏ hàng bằng đối tượng JS */
const Cart = {
  items: LS.get('cart_items', []),
  total: 0,
  add(p, color, size) {
    const it = this.items.find(i => i.id === p.id && i.color === color && i.size === size);
    if (it) {                       // đã có cùng màu/size -> tăng số lượng
      if (it.quantity >= p.stock) return toast('Đã đạt số lượng tồn kho tối đa (' + p.stock + ')');
      it.quantity++;
    } else {                        // chưa có -> thêm mới
      this.items.push({id: p.id, title: p.title, price: p.price, image: p.image, color, size, stock: p.stock, quantity: 1});
    }
    this.recalc();
  },
  change(idx, d) {
    const it = this.items[idx]; if (!it) return;
    it.quantity += d;
    if (it.quantity > it.stock) it.quantity = it.stock;
    if (it.quantity <= 0) this.items.splice(idx, 1);
    this.recalc();
  },
  remove(idx) { this.items.splice(idx, 1); this.recalc(); },
  clear() { this.items = []; this.recalc(); },
  count() { return this.items.reduce((s, i) => s + i.quantity, 0); },
  recalc() {                        // tự động tính lại tổng tiền
    this.total = this.items.reduce((s, i) => s + i.price * i.quantity, 0);
    LS.set('cart_items', this.items);
    this.render();
  },
  render() {                        // render bảng Mini-cart (position:absolute; z-index)
    const box = $('#miniCart'); if (!box) return;
    $('#cartCount').textContent = this.count();
    if (!this.items.length) { box.innerHTML = '<h4>Giỏ hàng</h4><p class="hint">Giỏ hàng đang trống.</p>'; return; }
    box.innerHTML = '<h4>Giỏ hàng (Mini-cart)</h4><table><thead><tr><th>Sản phẩm</th><th>Màu/Size</th><th>SL</th><th class="r">Thành tiền</th><th></th></tr></thead><tbody>' +
      this.items.map((i, k) => `<tr><td>${esc(i.title.slice(0, 28))}…</td><td>${esc(i.color)}${i.size ? ' / ' + esc(i.size) : ''}</td>
      <td class="qty"><button data-act="dec" data-i="${k}">−</button><span>${i.quantity}</span><button data-act="inc" data-i="${k}">+</button></td>
      <td class="r">${money(i.price * i.quantity)}</td><td><button class="btn-link" data-act="del" data-i="${k}">Xóa</button></td></tr>`).join('') +
      `</tbody></table><div class="mini-total"><span>Tổng tiền: <span id="cartTotal">${money(this.total)}</span></span>
      <span><button class="btn" data-act="clear">Xóa hết</button> <button class="btn primary" id="checkoutBtn" data-act="checkout">Thanh toán</button></span></div>`;
  }
};
document.addEventListener('DOMContentLoaded', () => {
  const box = $('#miniCart');
  $('#cartBtn').addEventListener('click', () => { box.hidden = !box.hidden; });
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const i = +b.dataset.i;
    ({dec: () => Cart.change(i, -1), inc: () => Cart.change(i, 1), del: () => Cart.remove(i), clear: () => Cart.clear(),
      checkout: () => { box.hidden = true; openCheckout(); }})[b.dataset.act]();
  });
  Cart.recalc();
});
