-- VICSpark Electrical Works: catalog + orders schema.
-- Portable SQL: built with SQLite in CI, written to also run on PostgreSQL.
-- Natural text keys (no AUTOINCREMENT) keep it portable. Money is whole KES (INTEGER).

CREATE TABLE categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  icon        TEXT NOT NULL DEFAULT '📦',
  sort_order  INTEGER NOT NULL DEFAULT 100
);

CREATE TABLE products (
  sku           TEXT PRIMARY KEY,
  category_id   TEXT NOT NULL REFERENCES categories(id),
  name          TEXT NOT NULL,
  description   TEXT,
  price_kes     INTEGER NOT NULL CHECK (price_kes > 0),
  stock_status  TEXT NOT NULL DEFAULT 'in' CHECK (stock_status IN ('in', 'low', 'out')),
  image_url     TEXT,
  is_active     INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  sort_order    INTEGER NOT NULL DEFAULT 100,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (category_id, name)
);

CREATE INDEX idx_products_category ON products (category_id, sort_order);
CREATE INDEX idx_products_active   ON products (is_active);

-- Phase 2 tables (used once a live backend exists; the static site does not write to them).
CREATE TABLE orders (
  id              TEXT PRIMARY KEY,
  customer_name   TEXT NOT NULL,
  customer_phone  TEXT NOT NULL,
  fulfilment      TEXT NOT NULL CHECK (fulfilment IN ('pickup', 'delivery')),
  notes           TEXT,
  subtotal_kes    INTEGER NOT NULL CHECK (subtotal_kes >= 0),
  status          TEXT NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new', 'confirmed', 'paid', 'fulfilled', 'cancelled')),
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  order_id        TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sku             TEXT NOT NULL REFERENCES products(sku),
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_kes  INTEGER NOT NULL CHECK (unit_price_kes > 0),  -- price snapshot at order time
  PRIMARY KEY (order_id, sku)
);

CREATE INDEX idx_orders_status_created ON orders (status, created_at);

CREATE VIEW v_catalog AS
SELECT p.sku, p.name, p.description, p.price_kes, p.stock_status, p.image_url,
       c.id AS category_id, c.name AS category_name, c.icon AS category_icon,
       c.sort_order AS category_sort, p.sort_order AS product_sort
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.is_active = 1;
