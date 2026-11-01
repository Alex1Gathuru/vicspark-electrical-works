# VICSpark Electrical Works Website

Responsive, mobile-first website and simple online shop for **VICSpark Electrical Works, Malindi**.
Plain HTML, CSS and JavaScript. No framework. Orders are confirmed over WhatsApp.

## How it works

```
db/schema.sql ─┐                                   ┌─> index.html + js/shop.js
               ├─> scripts/build_catalog.py ─────> data/products.json ──> (cart, search, checkout)
db/seed.sql  ──┘   (validates, exports JSON)        └─ published to GitHub Pages by CI
```

- **`db/schema.sql`**: relational schema (`categories`, `products`, plus `orders` and `order_items` for a future backend, and a `v_catalog` view). Money is whole KES. Constraints block bad data (price must be above 0, stock is `in`/`low`/`out`, foreign keys enforced).
- **`db/seed.sql`**: the product catalog (33 products in 7 categories). This is the source of truth.
- **`scripts/build_catalog.py`**: builds an in-memory SQLite database from the two files, validates it, and writes `data/products.json`. Python standard library only.
- **`js/shop.js`**: loads `data/products.json`, then renders category tabs, search, product cards, cart drawer and checkout.
- **GitHub Pages is static hosting**, so the live site reads the exported JSON, not a running database. That keeps hosting free and fast, with no server to secure.

## Changing prices, stock or products

1. Edit the row in `db/seed.sql` (e.g. change `150` to `180`, or set `'in'` to `'out'`).
2. Regenerate the catalog:
   ```bash
   python3 scripts/build_catalog.py
   ```
3. Commit **both** `db/seed.sql` and `data/products.json`, push a branch, open a PR, merge.

CI fails the build if the SQL is invalid or if `data/products.json` was not regenerated, so the live shop can never drift from the database.

To add a product, copy a row, give it a unique SKU (`A-Z`, `0-9`, `-`), a `category_id` from the categories list, and a price. To add a photo, put it in `assets/` and set `image_url` to `assets/your-file.jpg`.

## Run locally

```bash
python3 scripts/build_catalog.py     # builds data/products.json
python3 -m http.server 8000          # then open http://localhost:8000
```

Open it through a local server (not by double-clicking `index.html`), because the browser blocks loading the JSON from `file://`.

Optional: inspect the database with `python3 scripts/build_catalog.py --keep-db build/vicspark.db`, then `sqlite3 build/vicspark.db`.

## Deployment (GitHub Actions to GitHub Pages)

`.github/workflows/deploy.yml`:

- **Pull requests to `main`**: validates the database, checks the JSON is current, syntax-checks the JavaScript. Nothing is deployed.
- **Push to `main`**: runs the same checks, assembles only the website files (`index.html`, `css/`, `js/`, `assets/`, `data/`) and deploys them. `db/`, `scripts/` and docs are not published.

## Scaling path

| Stage | When | What changes |
|---|---|---|
| 1. Now | Dozens to a few hundred products, orders via WhatsApp | Static site built from SQL (this repo) |
| 2. Live backend | You want live stock, stored orders, or M-Pesa payments | Run `db/schema.sql` on managed PostgreSQL (e.g. Supabase or Neon), add a small API, write to `orders` / `order_items` (already modeled) |
| 3. Growth | Many products, staff users | Admin dashboard on top of the same tables |

The schema uses portable SQL (text keys, no vendor-specific auto-increment), so moving from SQLite to PostgreSQL is mostly a matter of running the same files.

## Security notes

- No secrets, credentials or API keys are stored in this repo.
- Product data is HTML-escaped before it is rendered; saved carts are validated against the catalog on load.
- The deploy workflow only publishes the website folder and only deploys from `main`.
- Prices shown on the site are for convenience. The business confirms final price and stock on WhatsApp before any sale.

## Business details

- Business: VICSpark Electrical Works, Malindi, Kenya
- Services: Sales, Installation, Repairs
- Phone/WhatsApp: 0791 495 748
