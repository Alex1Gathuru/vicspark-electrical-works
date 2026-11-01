-- Product catalog source of truth. Prices are whole KES, per piece.
-- To change a price or stock status, edit the row below, commit, and CI republishes the shop.

INSERT INTO categories (id, name, icon, sort_order) VALUES
  ('bulbs',            'Bulbs',               '💡', 10),
  ('switches-sockets', 'Switches & Sockets',  '🔌', 20),
  ('holders-fittings', 'Holders & Fittings',  '🔩', 30),
  ('boxes-covers',     'Boxes & Covers',      '📦', 40),
  ('tube-lights',      'Tubes & LED Lights',  '🔦', 50),
  ('cords-accessories','Cords & Accessories', '🧰', 60),
  ('sensors-controls', 'Sensors & Controls',  '⚙',  70);

INSERT INTO products (sku, category_id, name, price_kes, stock_status, sort_order) VALUES
  -- Bulbs
  ('BLB-5W-PIN',     'bulbs', '5W Pin Bulb',      100, 'in', 10),
  ('BLB-7W-PIN',     'bulbs', '7W Pin Bulb',      150, 'in', 20),
  ('BLB-9W-PIN',     'bulbs', '9W Pin Bulb',      150, 'in', 30),
  ('BLB-9W-SCR',     'bulbs', '9W Screw Bulb',    150, 'in', 40),
  ('BLB-12W-PIN',    'bulbs', '12W Pin Bulb',     200, 'in', 50),
  ('BLB-12W-SCR',    'bulbs', '12W Screw Bulb',   250, 'in', 60),
  ('BLB-SENSOR',     'bulbs', 'Sensor Bulb',      350, 'in', 70),
  -- Switches & sockets
  ('SWT-1G',         'switches-sockets', '1 Gang Switch',        150, 'in', 10),
  ('SWT-2G',         'switches-sockets', '2 Gang Switch',        200, 'in', 20),
  ('SWT-3G',         'switches-sockets', '3 Gang Switch',        300, 'in', 30),
  ('SWT-4G',         'switches-sockets', '4 Gang Switch',        300, 'in', 40),
  ('SKT-13A-1',      'switches-sockets', '13A Single Socket',    200, 'in', 50),
  ('SKT-13A-2',      'switches-sockets', '13A Twin Socket',      350, 'in', 60),
  ('PLG-13A-TOP',    'switches-sockets', '13A Top Plug',         100, 'in', 70),
  -- Holders & fittings
  ('HLD-STRAIGHT',   'holders-fittings', 'Straight Holder',      100, 'in', 10),
  ('HLD-ANGLE',      'holders-fittings', 'Angle Lamp Holder',    150, 'in', 20),
  ('HLD-HANGING',    'holders-fittings', 'Hanging Holder',       100, 'in', 30),
  ('FIT-CEILING-ROSE','holders-fittings','Ceiling Rose',         200, 'in', 40),
  -- Boxes & covers
  ('BOX-PAT-1',      'boxes-covers', 'Single Pattress Box',       40, 'in', 10),
  ('BOX-PAT-2',      'boxes-covers', 'Twin Pattress Box',         50, 'in', 20),
  ('COV-ROUND',      'boxes-covers', 'Round Cover',               20, 'in', 30),
  ('COV-SQ-1',       'boxes-covers', 'Single Square Cover',       50, 'in', 40),
  ('COV-SQ-2',       'boxes-covers', 'Twin Square Cover',         70, 'in', 50),
  -- Tubes & LED lights
  ('LGT-LED-4FT-DP', 'tube-lights', '4ft Dust Proof LED Light',  500, 'in', 10),
  ('LGT-LED-2FT-DP', 'tube-lights', '2ft Dust Proof LED Light',  350, 'in', 20),
  ('LGT-TUBE-4FT',   'tube-lights', '4ft Tube Light',            250, 'in', 30),
  ('LGT-TUBE-2FT',   'tube-lights', '2ft Tube Light',            200, 'in', 40),
  -- Cords & accessories
  ('EXT-4W-POWER',   'cords-accessories', 'Extension Cord 4-Way (Power)', 500, 'in', 10),
  ('EXT-4W-ASTRA',   'cords-accessories', 'Extension Cord 4-Way (Astra)', 600, 'in', 20),
  ('ACC-FAN-CAP',    'cords-accessories', 'Fan Capacitor',       200, 'in', 30),
  ('ACC-TAPE',       'cords-accessories', 'Insulation Tape',     100, 'in', 40),
  -- Sensors & controls
  ('SNS-FLOAT',      'sensors-controls', 'Float Switch',        1000, 'in', 10),
  ('SNS-DAYNIGHT',   'sensors-controls', 'Day/Night Light Sensor', 1000, 'in', 20);
