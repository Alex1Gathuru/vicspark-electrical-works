/* ============ VICSpark Shop: product catalog + cart + WhatsApp checkout ============
   No backend required. Cart state lives in localStorage on the customer's device.
   Products and prices come from the SQL catalog (db/seed.sql) via data/products.json. */

const WHATSAPP_NUMBER = '254791495748';
const CURRENCY = 'KES';

const CATALOG_URL = 'data/products.json'; // generated from db/schema.sql + db/seed.sql by scripts/build_catalog.py

let PRODUCTS = [];
let CATEGORIES = [{ id: 'all', label: 'All Products' }];

// Escape anything that goes into innerHTML.
const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const money = (n) => `${CURRENCY} ${n.toLocaleString('en-KE')}`;

/* ---------- Cart state ---------- */
function loadCart() {
  try {
    const raw = localStorage.getItem('vicspark-cart');
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
function saveCart(cart) {
  try {
    localStorage.setItem('vicspark-cart', JSON.stringify(cart));
  } catch {
    /* storage unavailable — cart just won't persist across reloads */
  }
}
let cart = loadCart(); // { productId: qty }

function cartCount() {
  return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
}
function cartTotal() {
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = PRODUCTS.find((x) => x.id === id);
    return p ? sum + p.price * qty : sum;
  }, 0);
}

// Drop saved items that no longer exist in the catalog (e.g. from an older version of the shop).
function pruneCart() {
  const known = new Set(PRODUCTS.map((p) => p.id));
  let changed = false;
  for (const id of Object.keys(cart)) {
    if (!known.has(id) || !(cart[id] > 0)) {
      delete cart[id];
      changed = true;
    }
  }
  if (changed) saveCart(cart);
}

/* ---------- Rendering: product grid ---------- */
const grid = document.querySelector('#shopGrid');
const tabsWrap = document.querySelector('#filterTabs');
let activeCategory = 'all';
let searchTerm = '';

function renderTabs() {
  if (!tabsWrap) return;
  tabsWrap.innerHTML = CATEGORIES.map(
    (c) => `<button class="filter-tab${c.id === activeCategory ? ' active' : ''}" data-cat="${esc(c.id)}">${esc(c.label)}</button>`
  ).join('');
  tabsWrap.querySelectorAll('.filter-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      renderTabs();
      renderProducts();
    });
  });
}

function renderProducts() {
  if (!grid) return;
  const items = PRODUCTS.filter(
    (p) => (activeCategory === 'all' || p.category === activeCategory) && p.name.toLowerCase().includes(searchTerm)
  );
  if (items.length === 0) {
    grid.innerHTML = '<p class="shop-empty">No products match your search. Try another word or category.</p>';
    return;
  }
  grid.innerHTML = items
    .map((p) => {
      const qtyInCart = cart[p.id] || 0;
      const stockFlag =
        p.stock === 'low'
          ? '<span class="stock-flag low">LOW STOCK</span>'
          : p.stock === 'out'
          ? '<span class="stock-flag" style="color:#c0392b;background:#fdecea">OUT OF STOCK</span>'
          : '<span class="stock-flag">IN STOCK</span>';
      return `
      <div class="product-item${p.stock === 'out' ? ' out-of-stock' : ''}" data-id="${esc(p.id)}">
        <div class="product-illustration">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" />` : `<span style="font-size:52px">${esc(p.icon)}</span>`}</div>
        ${stockFlag}
        <h3>${esc(p.name)}</h3>
        <div class="price-row">
          <span class="product-price">${money(p.price)}</span>
          <div class="qty-stepper">
            <button type="button" class="qty-minus" aria-label="Decrease quantity">−</button>
            <input type="text" class="qty-input" value="${qtyInCart > 0 ? qtyInCart : 1}" inputmode="numeric" aria-label="Quantity" />
            <button type="button" class="qty-plus" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <button type="button" class="add-to-cart" data-id="${esc(p.id)}">${qtyInCart > 0 ? `In cart (${qtyInCart}) · Add more` : 'Add to Cart'} <span>+</span></button>
      </div>`;
    })
    .join('');

  grid.querySelectorAll('.product-item').forEach((card) => {
    const id = card.dataset.id;
    const input = card.querySelector('.qty-input');
    card.querySelector('.qty-minus').addEventListener('click', () => {
      input.value = Math.max(1, (parseInt(input.value, 10) || 1) - 1);
    });
    card.querySelector('.qty-plus').addEventListener('click', () => {
      input.value = (parseInt(input.value, 10) || 1) + 1;
    });
    input.addEventListener('change', () => {
      const v = Math.max(1, parseInt(input.value, 10) || 1);
      input.value = v;
    });
    card.querySelector('.add-to-cart').addEventListener('click', (e) => {
      const qty = Math.max(1, parseInt(input.value, 10) || 1);
      addToCart(id, qty);
      const btn = e.currentTarget;
      btn.classList.add('added');
      btn.textContent = 'Added ✓';
      setTimeout(() => renderProducts(), 650);
    });
  });
}

function addToCart(id, qty) {
  cart[id] = (cart[id] || 0) + qty;
  saveCart(cart);
  updateCartBadge();
  showToast(`Added ${qty} × ${PRODUCTS.find((p) => p.id === id)?.name} to cart`);
}

/* ---------- Cart drawer ---------- */
const cartOverlay = document.querySelector('#cartOverlay');
const cartDrawer = document.querySelector('#cartDrawer');
const cartItemsWrap = document.querySelector('#cartItems');
const cartSubtotalEl = document.querySelector('#cartSubtotal');
const cartCountEls = document.querySelectorAll('.cart-count');

function updateCartBadge() {
  const count = cartCount();
  cartCountEls.forEach((el) => {
    el.textContent = count;
    el.hidden = count === 0;
  });
}

function renderCart() {
  if (!cartItemsWrap) return;
  const entries = Object.entries(cart).filter(([, qty]) => qty > 0);
  if (entries.length === 0) {
    cartItemsWrap.innerHTML = `<div class="cart-empty"><span>🛒</span>Your cart is empty.<br />Browse products and add something.</div>`;
  } else {
    cartItemsWrap.innerHTML = entries
      .map(([id, qty]) => {
        const p = PRODUCTS.find((x) => x.id === id);
        if (!p) return '';
        return `
        <div class="cart-item" data-id="${esc(id)}">
          <div class="cart-item-thumb">${esc(p.icon)}</div>
          <div>
            <p class="cart-item-name">${esc(p.name)}</p>
            <p class="cart-item-price">${money(p.price)} × ${qty} = <strong>${money(p.price * qty)}</strong></p>
          </div>
          <div class="cart-item-right">
            <div class="qty-stepper">
              <button type="button" class="cart-qty-minus" aria-label="Decrease quantity">−</button>
              <input type="text" class="cart-qty-input" value="${qty}" inputmode="numeric" aria-label="Quantity" />
              <button type="button" class="cart-qty-plus" aria-label="Increase quantity">+</button>
            </div>
            <button type="button" class="cart-item-remove">Remove</button>
          </div>
        </div>`;
      })
      .join('');

    cartItemsWrap.querySelectorAll('.cart-item').forEach((row) => {
      const id = row.dataset.id;
      const input = row.querySelector('.cart-qty-input');
      row.querySelector('.cart-qty-minus').addEventListener('click', () => {
        cart[id] = Math.max(1, (cart[id] || 1) - 1);
        saveCart(cart);
        renderCart();
        updateCartBadge();
      });
      row.querySelector('.cart-qty-plus').addEventListener('click', () => {
        cart[id] = (cart[id] || 1) + 1;
        saveCart(cart);
        renderCart();
        updateCartBadge();
      });
      input.addEventListener('change', () => {
        const v = Math.max(1, parseInt(input.value, 10) || 1);
        cart[id] = v;
        saveCart(cart);
        renderCart();
        updateCartBadge();
      });
      row.querySelector('.cart-item-remove').addEventListener('click', () => {
        delete cart[id];
        saveCart(cart);
        renderCart();
        updateCartBadge();
        renderProducts();
      });
    });
  }
  if (cartSubtotalEl) cartSubtotalEl.textContent = money(cartTotal());
}

function openCart() {
  renderCart();
  cartOverlay?.classList.add('open');
  cartDrawer?.classList.add('open');
}
function closeCart() {
  cartOverlay?.classList.remove('open');
  cartDrawer?.classList.remove('open');
}

document.querySelectorAll('.cart-trigger').forEach((btn) => btn.addEventListener('click', openCart));
document.querySelector('#cartClose')?.addEventListener('click', closeCart);
cartOverlay?.addEventListener('click', closeCart);
document.querySelector('#cartContinue')?.addEventListener('click', closeCart);

/* ---------- Checkout modal ---------- */
const checkoutOverlay = document.querySelector('#checkoutOverlay');
const checkoutForm = document.querySelector('#checkoutForm');

document.querySelector('#cartCheckoutBtn')?.addEventListener('click', () => {
  if (cartCount() === 0) {
    showToast('Your cart is empty — add a product first.');
    return;
  }
  closeCart();
  checkoutOverlay?.classList.add('open');
});
document.querySelector('#checkoutCancel')?.addEventListener('click', () => {
  checkoutOverlay?.classList.remove('open');
});
checkoutOverlay?.addEventListener('click', (e) => {
  if (e.target === checkoutOverlay) checkoutOverlay.classList.remove('open');
});

checkoutForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(checkoutForm);
  const lines = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const p = PRODUCTS.find((x) => x.id === id);
      return p ? `• ${p.name} × ${qty} — ${money(p.price * qty)}` : '';
    })
    .filter(Boolean);

  const message = [
    'Hello VICSpark Electrical Works,',
    '',
    'I would like to place an order:',
    ...lines,
    '',
    `Subtotal: ${money(cartTotal())}`,
    '',
    `Name: ${data.get('name')}`,
    `Phone: ${data.get('phone')}`,
    `Delivery/Pickup: ${data.get('fulfilment')}`,
    `Location/Notes: ${data.get('notes') || '-'}`
  ].join('\n');

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');

  cart = {};
  saveCart(cart);
  updateCartBadge();
  renderCart();
  renderProducts();
  checkoutOverlay?.classList.remove('open');
  checkoutForm.reset();
  showToast('Order sent via WhatsApp — thank you!');
});

/* ---------- Toast ---------- */
let toastTimer;
function showToast(text) {
  const toast = document.querySelector('#toast');
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

/* ---------- Search ---------- */
document.querySelector('#shopSearch')?.addEventListener('input', (e) => {
  searchTerm = e.target.value.trim().toLowerCase();
  renderProducts();
});

/* ---------- Init: load the catalog, then render ---------- */
async function init() {
  try {
    const res = await fetch(CATALOG_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const icons = Object.fromEntries(data.categories.map((c) => [c.id, c.icon]));
    CATEGORIES = [{ id: 'all', label: 'All Products' }, ...data.categories.map((c) => ({ id: c.id, label: c.name }))];
    PRODUCTS = data.products.map((p) => ({
      id: p.sku,
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
      image: p.image,
      icon: icons[p.category] || '📦'
    }));
  } catch (err) {
    console.error('Could not load the product catalog', err);
    if (grid) {
      grid.innerHTML = `<p class="shop-error">The product list could not be loaded. Please refresh, or <a href="https://wa.me/${WHATSAPP_NUMBER}" target="_blank" rel="noopener">WhatsApp us</a> to order.</p>`;
    }
    return;
  }
  pruneCart();
  renderTabs();
  renderProducts();
  updateCartBadge();
}
init();
