/* ============ VICSpark Shop: product catalog + cart + WhatsApp checkout ============
   No backend required. Cart state lives in localStorage on the customer's device.
   Prices are examples — edit the PRODUCTS array below with real prices/stock. */

const WHATSAPP_NUMBER = '254791495748';
const CURRENCY = 'KES';

const PRODUCTS = [
  { id: 'cbl-25', name: '2.5mm² Single Core Cable (100m roll)', category: 'cables', price: 3500, icon: '🔌', stock: 'in' },
  { id: 'cbl-40', name: '4.0mm² Single Core Cable (100m roll)', category: 'cables', price: 5200, icon: '🔌', stock: 'in' },
  { id: 'brk-1p', name: 'Single Pole MCB Breaker', category: 'breakers', price: 450, icon: '⚙', stock: 'in' },
  { id: 'brk-3p', name: '3-Phase MCB Breaker', category: 'breakers', price: 1800, icon: '⚙', stock: 'low' },
  { id: 'sw-1g', name: '1-Gang Wall Switch', category: 'switches', price: 250, icon: '◈', stock: 'in' },
  { id: 'sk-13a', name: '13A Wall Socket', category: 'switches', price: 350, icon: '◈', stock: 'in' },
  { id: 'led-9w', name: 'LED Bulb 9W', category: 'lighting', price: 200, icon: '💡', stock: 'in' },
  { id: 'led-12w', name: 'LED Bulb 12W', category: 'lighting', price: 280, icon: '💡', stock: 'in' }
];

const CATEGORIES = [
  { id: 'all', label: 'All Products' },
  { id: 'cables', label: 'Cables' },
  { id: 'breakers', label: 'Breakers & Protection' },
  { id: 'switches', label: 'Switches & Sockets' },
  { id: 'lighting', label: 'Lighting & Bulbs' }
];

const money = (n) => `${CURRENCY} ${n.toLocaleString('en-KE')}`;

/* ---------- Cart state ---------- */
function loadCart() {
  try {
    const raw = localStorage.getItem('vicspark-cart');
    return raw ? JSON.parse(raw) : {};
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

/* ---------- Rendering: product grid ---------- */
const grid = document.querySelector('#shopGrid');
const tabsWrap = document.querySelector('#filterTabs');
let activeCategory = 'all';

function renderTabs() {
  if (!tabsWrap) return;
  tabsWrap.innerHTML = CATEGORIES.map(
    (c) => `<button class="filter-tab${c.id === activeCategory ? ' active' : ''}" data-cat="${c.id}">${c.label}</button>`
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
  const items = PRODUCTS.filter((p) => activeCategory === 'all' || p.category === activeCategory);
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
      <div class="product-item${p.stock === 'out' ? ' out-of-stock' : ''}" data-id="${p.id}">
        <div class="product-illustration"><span style="font-size:52px">${p.icon}</span></div>
        ${stockFlag}
        <h3>${p.name}</h3>
        <div class="price-row">
          <span class="product-price">${money(p.price)}</span>
          <div class="qty-stepper">
            <button type="button" class="qty-minus" aria-label="Decrease quantity">−</button>
            <input type="text" class="qty-input" value="${qtyInCart > 0 ? qtyInCart : 1}" inputmode="numeric" aria-label="Quantity" />
            <button type="button" class="qty-plus" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <button type="button" class="add-to-cart" data-id="${p.id}">${qtyInCart > 0 ? `In cart (${qtyInCart}) · Add more` : 'Add to Cart'} <span>+</span></button>
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
        <div class="cart-item" data-id="${id}">
          <div class="cart-item-thumb">${p.icon}</div>
          <div>
            <p class="cart-item-name">${p.name}</p>
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

/* ---------- Init ---------- */
renderTabs();
renderProducts();
updateCartBadge();
