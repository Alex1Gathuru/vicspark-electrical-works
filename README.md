# VICSpark Electrical Works Website

A responsive, mobile-first website for **VICSpark Electrical Works, Malindi**, built with:

- HTML5
- CSS3
- Vanilla JavaScript
- No framework or build step
- WhatsApp-based service request **and** e-commerce checkout flow

## E-commerce features (new)

- **Product catalog** (`js/shop.js`) — 8 example products across 4 categories (cables, breakers, switches/sockets, lighting), each with price, stock flag and icon. Edit the `PRODUCTS` array to add real items, prices and stock status.
- **Category filter tabs** above the shop grid.
- **Quantity stepper + Add to Cart** on every product card.
- **Persistent cart** — stored in the customer's browser via `localStorage`, survives page reloads.
- **Cart drawer** — slide-in panel with item list, quantity editing, remove, and running subtotal.
- **Checkout modal** — collects name, phone, delivery/pickup preference and notes, then builds an itemized order message and opens WhatsApp to confirm the sale (same no-backend pattern as the original quote form).
- **Toast notifications** for cart actions.

This keeps the "no backend" starter-site philosophy: no database, no payment gateway, no server. All order confirmation and payment happens over WhatsApp, same as the original quote request flow. See "Production recommendations" below for what to add if the business outgrows this.

## Run locally

Open `index.html` directly in a browser, or run a local server:

```bash
cd vicspark-website
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Business details used

- Business: VICSpark Electrical Works
- Services: Sales • Installation • Repairs
- Phone/WhatsApp: 0791 495 748
- Location: Malindi, Kenya

## Form behavior

- The quote form (`#quoteForm`) does not require a backend. JavaScript converts the submitted details into a pre-filled WhatsApp message sent to the business number.
- The checkout form (`#checkoutForm`) works the same way: it reads the current cart, builds an itemized message with subtotal, opens WhatsApp with it pre-filled, then clears the cart.

## Editing products

Open `js/shop.js` and edit the `PRODUCTS` array:

```js
{ id: 'led-9w', name: 'LED Bulb 9W', category: 'lighting', price: 200, icon: '💡', stock: 'in' }
```

- `category` must match one of the ids in `CATEGORIES` (`cables`, `breakers`, `switches`, `lighting`), or add a new category entry.
- `stock` accepts `'in'`, `'low'`, or `'out'` (out-of-stock items are dimmed and disabled).
- `WHATSAPP_NUMBER` and `CURRENCY` are set near the top of the same file.

## Production recommendations

1. Replace the poster image with optimized WebP/AVIF brand assets where possible.
2. Add a real domain and HTTPS.
3. Add a backend/API if orders/enquiries need to be stored in a database instead of only sent via WhatsApp (also enables real payment collection, e.g. M-Pesa STK push).
4. Add Google Business Profile, analytics and Search Console after launch.
5. Add real product photos to replace the placeholder emoji icons in `js/shop.js`.
6. Add an email address once the business has a dedicated mailbox.
7. Consider a small CMS or admin dashboard (or just editing `PRODUCTS` in `js/shop.js` directly) when products/prices/stock need frequent updates.
8. If order volume grows, replace the WhatsApp-only checkout with a real payment gateway (M-Pesa Daraja API, Stripe, etc.) and order database.
