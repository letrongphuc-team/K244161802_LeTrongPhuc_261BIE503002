'use strict';
/* Câu 2-5: Danh sách sản phẩm, Skeleton, Event Delegation, XML reviews */
let PRODUCTS = [], CUSTOMERS = [], REVIEWS = [];
const RATING = {};                       // product_id -> {avg, n}
const grid = $('#productGrid');

function showSkeleton(n = 8) {           // Câu 3: skeleton trước khi dữ liệu tải về
  grid.innerHTML = Array(n).fill(`<article class="card skeleton" aria-hidden="true"><div class="thumb"></div>
    <div class="info"><div class="sk"></div><div class="sk w60"></div><div class="sk w40"></div><div class="sk btn-sk"></div></div></article>`).join('');
}
function cardHTML(p) {
  const v = (p.colors[0] || '') + '|' + (p.sizes[0] || '');
  const chips = (arr, group) => arr.length
    ? `<div class="chips" data-group="${group}">${arr.map((x, i) => `<button type="button" class="chip${i ? '' : ' active'}" data-action="pick-${group}" data-value="${esc(x)}">${esc(x)}</button>`).join('')}</div>` : '';
  return `<article class="card" data-pid="${p.id}">
    <div class="thumb"><img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy" onerror="imgFallback(this)"></div>
    <div class="info">
      <h3 title="${esc(p.title)}">${esc(p.title)}</h3>
      <p class="cat">${esc(p.category)}</p>
      <p class="price">${money(p.price)} <span class="stock">· Còn ${p.stock}</span></p>
      ${chips(p.colors, 'color')}${chips(p.sizes, 'size')}
      <button type="button" class="btn-link" data-action="rating" data-id="${p.id}">Rating Detail</button>
      <div class="actions">
        <button type="button" class="btn primary" data-action="add" data-id="${p.id}" data-variant="${esc(v)}">Thêm vào giỏ hàng</button>
        <button type="button" class="btn" data-action="quick" data-id="${p.id}" data-variant="${esc(v)}">Xem nhanh</button>
      </div></div></article>`;
}
function render(list) {
  if (!list.length) {
    grid.innerHTML = '<p class="empty">Không có sản phẩm phù hợp.</p>';
  } else {
    const cards = list.map(cardHTML);
    const bannerIndex = Math.min(4, cards.length);
    cards.splice(bannerIndex, 0, `<div class="promo-banner" role="region" aria-label="Ưu đãi đặc biệt">
      <div class="promo-banner-copy">
        <span class="promo-kicker">MINISHOP PICKS · ƯU ĐÃI CÓ HẠN</span>
        <h2>Món xinh hôm nay,<br>niềm vui cả tuần</h2>
        <p>Chọn ngay sản phẩm bạn thích và tận hưởng ưu đãi đến 30%.</p>
        <a class="promo-cta" href="#productGrid">Khám phá sản phẩm <span aria-hidden="true">→</span></a>
      </div>
      <div class="promo-banner-mark" aria-hidden="true"><span>30</span><small>% OFF</small></div>
    </div>`);
    grid.innerHTML = cards.join('');
  }
  $('#resultInfo').textContent = `Hiển thị ${list.length} / ${PRODUCTS.length} sản phẩm`;
  applyRatings();
}

/* Câu 5: đọc reviews.xml bằng DOMParser, tính điểm trung bình theo product_id */
function computeRatings(doc) {
  const sum = {};
  for (const r of doc.getElementsByTagName('review')) {
    const pid = txt(r, 'product_id'), s = +txt(r, 'rating');
    (sum[pid] = sum[pid] || {t: 0, n: 0}); sum[pid].t += s; sum[pid].n++;
    REVIEWS.push({id: r.getAttribute('id'), pid: +pid, cid: txt(r, 'customer_id'), rating: s, comment: txt(r, 'comment'), date: txt(r, 'date')});
  }
  for (const pid in sum) RATING[pid] = {avg: sum[pid].t / sum[pid].n, n: sum[pid].n};
}
function applyRatings() {                // tạo thẻ <span> sao trung bình, chèn lên ảnh
  $$('.card[data-pid]', grid).forEach(card => {
    const r = RATING[card.dataset.pid]; if (!r) return;
    const thumb = $('.thumb', card);
    $('.stars', thumb)?.remove();
    const span = document.createElement('span');
    span.className = 'stars';
    span.innerHTML = `${stars(r.avg)}<em>${r.avg.toFixed(1)} (${r.n})</em>`;
    thumb.insertBefore(span, thumb.firstChild);
  });
}
function showRatingDetail(id) {
  const p = PRODUCTS.find(x => x.id === id), list = REVIEWS.filter(r => r.pid === id), r = RATING[id];
  const name = cid => (CUSTOMERS.find(c => c.id === cid) || {name: cid}).name;
  openModal(`<h3>Rating Detail – ${esc(p.title)}</h3>
    <p><b>${r ? r.avg.toFixed(2) : '–'}</b> ${r ? stars(r.avg) : ''} (${list.length} khách hàng đánh giá)</p>
    <table class="tbl"><thead><tr><th>Khách hàng</th><th>Số sao</th><th>Nhận xét</th><th>Ngày</th></tr></thead><tbody>
    ${list.map(x => `<tr><td>${esc(name(x.cid))}</td><td style="color:#d97706">${stars(x.rating)}</td><td>${esc(x.comment)}</td><td>${x.date}</td></tr>`).join('') || '<tr><td colspan="4">Chưa có đánh giá</td></tr>'}</tbody></table>`);
}

/* Câu 4: Event Delegation – DUY NHẤT 1 listener trên container cha */
grid.addEventListener('click', e => {
  const t = e.target.closest('[data-action]');
  if (!t || !grid.contains(t)) return;
  const act = t.dataset.action, card = t.closest('.card');
  if (act === 'pick-color' || act === 'pick-size') {          // chọn biến thể -> cập nhật data-variant
    $$('.chip', t.parentElement).forEach(c => c.classList.toggle('active', c === t));
    const col = $('[data-group="color"] .chip.active', card)?.dataset.value || '';
    const siz = $('[data-group="size"] .chip.active', card)?.dataset.value || '';
    $$('[data-variant]', card).forEach(b => b.dataset.variant = col + '|' + siz);
    return;
  }
  const id = +t.dataset.id, variant = t.dataset.variant;        // trích xuất data-id, data-variant
  const p = PRODUCTS.find(x => x.id === id);
  const [color, size] = (variant || '|').split('|');
  if (act === 'add') {
    Cart.add(p, color, size);
    toast(`Đã thêm: data-id=${id}, data-variant="${variant}"`);
  } else if (act === 'quick') {
    openModal(`<h3>Xem nhanh</h3><div class="qv"><img src="${esc(p.image)}" alt="" onerror="imgFallback(this)"><div style="flex:1;min-width:200px">
      <h4>${esc(p.title)}</h4><p class="price">${money(p.price)}</p><p>${esc(p.description)}</p>
      <div class="kv" id="qvInfo">data-id = ${id}<br>data-variant = "${esc(variant)}"<br>Màu: ${esc(color)} | Size: ${esc(size || '—')}</div>
      <p class="hint">Tồn kho: ${p.stock}</p></div></div>`);
  } else if (act === 'rating') {
    showRatingDetail(id);
  }
});

/* Câu 2: Search form (validation HTML5) -> lọc */
function applyFilter() {
  const f = $('#searchForm'), kw = f.kw.value.trim().toLowerCase();
  const pmin = +f.pmin.value, pmax = +f.pmax.value, color = f.color.value, minR = +f.rating.value, cat = f.cat.value;
  render(PRODUCTS.filter(p => {
    const avg = RATING[p.id] ? RATING[p.id].avg : p.rate;
    return (!kw || p.title.toLowerCase().includes(kw)) && p.price >= pmin && p.price <= pmax &&
      (color === 'all' || p.colors.includes(color)) && avg >= minR && (cat === 'all' || p.category === cat);
  }));
}
$('#searchForm').addEventListener('submit', e => {
  e.preventDefault();
  if (+$('#pmin').value > +$('#pmax').value) { $('#pmin').setCustomValidity('Giá từ phải ≤ giá đến'); $('#pmin').reportValidity(); return; }
  $('#pmin').setCustomValidity('');
  applyFilter();
});
$('#resetBtn').addEventListener('click', () => setTimeout(() => render(PRODUCTS)));

(async function init() {
  showSkeleton();
  try {
    const [pd, rd, cs] = await Promise.all([loadXML('data/products.xml'), loadXML('data/reviews.xml'), loadJSON('data/customers.json'), sleep(1500)]);
    PRODUCTS = parseProducts(pd); CUSTOMERS = cs.customers; computeRatings(rd);
    $('#cat').innerHTML += [...new Set(PRODUCTS.map(p => p.category))].map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
    render(PRODUCTS);
  } catch (err) { grid.innerHTML = ''; $('#resultInfo').textContent = 'Không tải được dữ liệu.'; showError(err); }
})();
