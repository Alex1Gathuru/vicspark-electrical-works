#!/usr/bin/env python3
"""Build data/products.json from db/schema.sql + db/seed.sql.

Uses an in-memory SQLite database (Python standard library only, no installs).
Validates the data, then exports the active catalog as deterministic JSON that the
static site loads. With --check, nothing is written: exits 1 if the committed JSON
is stale or the database fails validation (used in CI).
"""
import argparse
import json
import re
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCHEMA = ROOT / "db" / "schema.sql"
SEED = ROOT / "db" / "seed.sql"
OUT = ROOT / "data" / "products.json"

SKU_RE = re.compile(r"^[A-Z0-9-]+$")
IMAGE_RE = re.compile(r"^(assets/[\w./-]+|https://[^\s\"'<>]+)$")


def build_db(keep_path=None):
    if keep_path:
        Path(keep_path).unlink(missing_ok=True)
    conn = sqlite3.connect(keep_path or ":memory:")
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(SCHEMA.read_text(encoding="utf-8"))
    conn.executescript(SEED.read_text(encoding="utf-8"))
    conn.commit()
    return conn


def validate(conn):
    problems = []
    for row in conn.execute("PRAGMA foreign_key_check"):
        problems.append(f"foreign key violation: {tuple(row)}")
    rows = conn.execute("SELECT sku, name, image_url FROM products").fetchall()
    if not rows:
        problems.append("no products defined")
    seen = {}
    for r in rows:
        if not SKU_RE.match(r["sku"]):
            problems.append(f"invalid SKU (use A-Z, 0-9, '-'): {r['sku']!r}")
        if not r["name"].strip():
            problems.append(f"empty name for {r['sku']}")
        key = r["name"].strip().lower()
        if key in seen:
            problems.append(f"duplicate product name: {r['name']!r} ({seen[key]}, {r['sku']})")
        seen[key] = r["sku"]
        if r["image_url"] and not IMAGE_RE.match(r["image_url"]):
            problems.append(f"image_url for {r['sku']} must be assets/... or https://...")
    return problems


def export(conn):
    cats = conn.execute(
        """SELECT id, name, icon FROM categories
           WHERE id IN (SELECT category_id FROM products WHERE is_active = 1)
           ORDER BY sort_order, id"""
    ).fetchall()
    prods = conn.execute(
        """SELECT p.sku, p.category_id, p.name, p.description, p.price_kes, p.stock_status, p.image_url
           FROM products p JOIN categories c ON c.id = p.category_id
           WHERE p.is_active = 1
           ORDER BY c.sort_order, c.id, p.sort_order, p.sku"""
    ).fetchall()
    data = {
        "currency": "KES",
        "categories": [{"id": c["id"], "name": c["name"], "icon": c["icon"]} for c in cats],
        "products": [
            {
                "sku": p["sku"],
                "category": p["category_id"],
                "name": p["name"],
                "description": p["description"],
                "price": p["price_kes"],
                "stock": p["stock_status"],
                "image": p["image_url"],
            }
            for p in prods
        ],
    }
    return json.dumps(data, indent=2, ensure_ascii=False) + "\n"


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--check", action="store_true", help="validate and fail if data/products.json is stale")
    ap.add_argument("--keep-db", metavar="PATH", help="also write the SQLite database to PATH for inspection")
    args = ap.parse_args()

    try:
        conn = build_db(args.keep_db)
    except sqlite3.Error as exc:
        print(f"Database build failed (check db/schema.sql and db/seed.sql): {exc}")
        return 1
    problems = validate(conn)
    if problems:
        print("Catalog validation failed:", *problems, sep="\n  - ")
        return 1
    text = export(conn)
    n = text.count('"sku"')

    if args.check:
        current = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
        if current != text:
            print("data/products.json is out of date. Run: python3 scripts/build_catalog.py")
            return 1
        print(f"OK: {n} products validated, data/products.json is up to date.")
        return 0

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(text, encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)} ({n} products).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
