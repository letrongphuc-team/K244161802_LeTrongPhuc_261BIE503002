'use strict';
/* Tiện ích dùng chung: DOM, fetch XML/JSON, localStorage, modal */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = n => '$' + Number(n).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v === null ? d : v; } catch { return d; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
};
async function loadText(u) {
  const r = await fetch(u);
  if (!r.ok) throw new Error('Không tải được ' + u + ' (' + r.status + ')');
  return r.text();
}
/* Mô hình DOM: DOMParser đọc XML */
async function loadXML(u) {
  const d = new DOMParser().parseFromString(await loadText(u), 'text/xml');
  if (d.getElementsByTagName('parsererror').length) throw new Error('File XML lỗi: ' + u);
  return d;
}
async function loadJSON(u) { return JSON.parse(await loadText(u)); }
const txt = (el, tag) => { const n = el.getElementsByTagName(tag)[0]; return n ? n.textContent.trim() : ''; };
function parseProducts(doc) {
  return [...doc.getElementsByTagName('product')].map(e => ({
    id: +e.getAttribute('id'), title: txt(e, 'title'), price: +txt(e, 'price'), category: txt(e, 'category'),
    description: txt(e, 'description'), image: txt(e, 'image'),
    colors: [...e.getElementsByTagName('color')].map(c => c.textContent),
    sizes: [...e.getElementsByTagName('size')].map(c => c.textContent),
    stock: +txt(e, 'stock'), rate: +txt(e, 'rate'), count: +txt(e, 'count')
  }));
}
/* Ảnh sản phẩm: thử URL gốc -> đổi đuôi (.jpg <-> t.png, fakestoreapi đã đổi định dạng) -> ảnh thay thế tự vẽ */
const altImg = u => /t\.png$/i.test(u) ? u.replace(/t\.png$/i, '.jpg') : u.replace(/\.(jpe?g|png)$/i, 't.png');
function placeholder(name) {
  const w = String(name || '?').split(/\s+/).filter(Boolean), ini = ((w[0] || '?')[0] + (w[1] ? w[1][0] : '')).toUpperCase();
  let h = 0; for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="hsl(${h},70%,90%)"/><circle cx="150" cy="150" r="82" fill="hsl(${h},60%,75%)"/><text x="150" y="168" font-size="56" font-weight="700" text-anchor="middle" fill="hsl(${h},50%,30%)" font-family="Arial">${ini}</text></svg>`);
}
function imgFallback(i) {
  if (!i.dataset.tried) { i.dataset.tried = '1'; i.src = altImg(i.src); return; }
  i.onerror = null; i.src = placeholder(i.alt);
}
const stars = n => { const r = Math.round(n); return '★'.repeat(r) + '☆'.repeat(5 - r); };
function toast(msg, ms = 2600) {
  $$('.toast').forEach(x => x.remove());
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}
function showError(e) {
  console.error(e);
  const d = document.createElement('div'); d.className = 'banner-err';
  d.innerHTML = '<b>Lỗi tải dữ liệu:</b> ' + esc(e.message) + '<br>Hãy chạy web bằng <b>Live Server</b> (VS Code) hoặc GitHub Pages, không mở trực tiếp file:// vì trình duyệt chặn fetch.';
  document.body.prepend(d);
}
function openModal(html) { $('#modalBody').innerHTML = html; $('#modal').hidden = false; }
function closeModal() { $('#modal').hidden = true; $('#modalBody').innerHTML = ''; }
document.addEventListener('DOMContentLoaded', () => {
  const m = $('#modal'); if (!m) return;
  m.addEventListener('click', e => { if (e.target === m || e.target.classList.contains('modal-close')) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
});
