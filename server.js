const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 8000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(__dirname));

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${name}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// SQLite Database Setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at', dbPath);
    initDatabase();
  }
});

// Helper for promise-based db queries
const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    if (err) reject(err);
    else resolve(this);
  });
});

const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

// Extract org_id from request headers
function getReqOrgId(req) {
  const headerOrgId = req.headers['x-org-id'];
  const userRole = req.headers['x-user-role'];
  if (userRole === 'Super Admin') return null; // Super admin sees all orgs
  return headerOrgId ? parseInt(headerOrgId) : null;
}

async function initDatabase() {
  try {
    await dbRun('PRAGMA foreign_keys = ON');

    // Organizations Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS organizations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'Active',
        enabled_modules TEXT DEFAULT '["products","add_product","categories","brands","stocks","alerts","warehouses","suppliers","barcodes","reports","admin_panel","settings"]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Users Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Admin',
        phone TEXT,
        status TEXT DEFAULT 'Active',
        permissions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Categories
    await dbRun(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        org_id INTEGER DEFAULT 1 REFERENCES organizations(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        code TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Brands
    await dbRun(`
      CREATE TABLE IF NOT EXISTS brands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        org_id INTEGER DEFAULT 1 REFERENCES organizations(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        logo_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products
    await dbRun(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        org_id INTEGER DEFAULT 1 REFERENCES organizations(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        sku TEXT UNIQUE,
        category_id INTEGER,
        brand_id INTEGER,
        price REAL NOT NULL DEFAULT 0.0,
        cost_price REAL DEFAULT 0.0,
        quantity INTEGER NOT NULL DEFAULT 0,
        min_quantity INTEGER DEFAULT 5,
        unit TEXT DEFAULT 'pc',
        tax_rate REAL DEFAULT 0.0,
        discount REAL DEFAULT 0.0,
        description TEXT,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY(brand_id) REFERENCES brands(id) ON DELETE SET NULL
      )
    `);

    // Customers
    await dbRun(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        org_id INTEGER DEFAULT 1 REFERENCES organizations(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Suppliers
    await dbRun(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        org_id INTEGER DEFAULT 1 REFERENCES organizations(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        company TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Orders
    await dbRun(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        org_id INTEGER DEFAULT 1 REFERENCES organizations(id) ON DELETE CASCADE,
        order_number TEXT UNIQUE NOT NULL,
        customer_id INTEGER,
        total_amount REAL NOT NULL,
        discount_amount REAL DEFAULT 0.0,
        tax_amount REAL DEFAULT 0.0,
        payment_method TEXT DEFAULT 'Cash',
        status TEXT DEFAULT 'Completed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE SET NULL
      )
    `);

    // Order Items
    await dbRun(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER,
        product_name TEXT NOT NULL,
        unit_price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE SET NULL
      )
    `);

    console.log('Database tables initialized successfully with multi-tenant org_id columns.');
    await seedInitialData();

  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

async function seedInitialData() {
  const orgCount = await dbGet('SELECT COUNT(*) as count FROM organizations');
  if (orgCount.count === 0) {
    await dbRun(`
      INSERT INTO organizations (id, name, code, status, enabled_modules) VALUES 
      (1, 'Avocado Global Enterprise', 'ORG-001', 'Active', '["products","add_product","categories","brands","stocks","alerts","warehouses","suppliers","barcodes","reports","admin_panel","settings"]'),
      (2, 'FreshMart Retail Group', 'ORG-002', 'Active', '["products","add_product","categories","brands","stocks","alerts","warehouses","suppliers","barcodes","reports","admin_panel","settings"]'),
      (3, 'GreenGrocery Supply Co', 'ORG-003', 'Active', '["products","add_product","categories","brands","stocks","alerts","warehouses","suppliers","reports","settings"]')
    `);
    console.log('Sample organizations created.');
  }

  const userCount = await dbGet('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    await dbRun(`
      INSERT INTO users (org_id, name, email, password, role, phone, permissions) VALUES 
      (1, 'System Super Admin', 'admin@avocado.com', 'admin123', 'Super Admin', '+1 555-0100', '["*"]'),
      (1, 'Avocado Enterprise Admin', 'avocado.admin@avocado.com', 'admin123', 'Admin', '+1 555-0101', '["*"]'),
      (1, 'Avocado Enterprise Manager', 'avocado.manager@avocado.com', 'manager123', 'Manager', '+1 555-0102', '["products","add_product","stocks","alerts","barcodes"]'),
      (1, 'Avocado Enterprise Staff', 'avocado.staff@avocado.com', 'staff123', 'Staff', '+1 555-0103', '["products","barcodes"]'),
      (2, 'FreshMart Org Admin', 'freshmart.admin@avocado.com', 'admin123', 'Admin', '+1 555-0200', '["*"]'),
      (2, 'FreshMart Inventory Manager', 'freshmart.manager@avocado.com', 'manager123', 'Manager', '+1 555-0201', '["products","add_product","stocks","alerts","barcodes"]'),
      (2, 'FreshMart Stock Staff', 'freshmart.staff@avocado.com', 'staff123', 'Staff', '+1 555-0202', '["products","barcodes"]'),
      (3, 'GreenGrocery Org Admin', 'greengrocery.admin@avocado.com', 'admin123', 'Admin', '+1 555-0300', '["*"]'),
      (3, 'GreenGrocery Manager', 'greengrocery.manager@avocado.com', 'manager123', 'Manager', '+1 555-0301', '["products","add_product","stocks","alerts","barcodes"]'),
      (3, 'GreenGrocery Staff', 'greengrocery.staff@avocado.com', 'staff123', 'Staff', '+1 555-0302', '["products","barcodes"]')
    `);
    console.log('Full multi-tenant user accounts created.');
  }

  const catCount = await dbGet('SELECT COUNT(*) as count FROM categories');
  if (catCount.count === 0) {
    await dbRun("INSERT INTO categories (org_id, name, code, description) VALUES (1, 'Fruits & Vegetables', 'CAT-001', 'Fresh organic fruits and veggies')");
    await dbRun("INSERT INTO categories (org_id, name, code, description) VALUES (1, 'Beverages', 'CAT-002', 'Cold and hot drinks')");
    await dbRun("INSERT INTO categories (org_id, name, code, description) VALUES (1, 'Bakery', 'CAT-003', 'Fresh bread and bakery goods')");
    await dbRun("INSERT INTO categories (org_id, name, code, description) VALUES (1, 'Groceries', 'CAT-004', 'Daily essentials')");
  }

  const brandCount = await dbGet('SELECT COUNT(*) as count FROM brands');
  if (brandCount.count === 0) {
    await dbRun("INSERT INTO brands (org_id, name) VALUES (1, 'AvocadoFresh')");
    await dbRun("INSERT INTO brands (org_id, name) VALUES (1, 'Organic Harvest')");
    await dbRun("INSERT INTO brands (org_id, name) VALUES (1, 'Pure Nature')");
  }

  const custCount = await dbGet('SELECT COUNT(*) as count FROM customers');
  if (custCount.count === 0) {
    await dbRun("INSERT INTO customers (org_id, name, email, phone, address) VALUES (1, 'Walk-in Customer', 'walkin@avocadopos.local', '555-0000', 'Store Storefront')");
    await dbRun("INSERT INTO customers (org_id, name, email, phone, address) VALUES (1, 'John Smith', 'john.smith@example.com', '555-0199', '123 Main St')");
    await dbRun("INSERT INTO customers (org_id, name, email, phone, address) VALUES (1, 'Sarah Jenkins', 'sarah.j@example.com', '555-0244', '456 Market Rd')");
  }

  const prodCount = await dbGet('SELECT COUNT(*) as count FROM products');
  if (prodCount.count === 0) {
    // Org 1 Products
    await dbRun(`
      INSERT INTO products (org_id, name, sku, category_id, brand_id, price, cost_price, quantity, min_quantity, unit, description, image_url)
      VALUES 
      (1, 'Hass Avocado (Pack of 3)', 'AVO-001', 1, 1, 4.99, 2.50, 85, 10, 'pc', 'Fresh ripe Hass avocados', 'assets/img/products/product1.jpg'),
      (1, 'Organic Banana (Bunch)', 'BAN-002', 1, 2, 2.49, 1.20, 120, 15, 'bunch', 'Organic sweet yellow bananas', 'assets/img/products/product2.jpg'),
      (1, 'Fresh Orange Juice (1L)', 'JUICE-003', 2, 3, 3.99, 1.80, 45, 5, 'bottle', '100% Cold pressed fresh orange juice', 'assets/img/products/product3.jpg'),
      (1, 'Whole Grain Wheat Bread', 'BRD-004', 3, 2, 2.99, 1.00, 30, 5, 'loaf', 'Freshly baked whole grain loaf', 'assets/img/products/product4.jpg')
    `);

    // Org 2 Products
    await dbRun(`
      INSERT INTO products (org_id, name, sku, category_id, brand_id, price, cost_price, quantity, min_quantity, unit, description, image_url)
      VALUES 
      (2, 'FreshMart Crisp Fuji Apples (1kg)', 'FM-101', 1, 1, 3.49, 1.50, 150, 20, 'kg', 'Fresh crisp Fuji apples', 'assets/img/products/product5.jpg'),
      (2, 'FreshMart Whole Cream Milk (2L)', 'FM-102', 2, 3, 4.29, 2.00, 95, 10, 'bottle', 'Farm fresh whole milk', 'assets/img/products/product6.jpg'),
      (2, 'FreshMart Artisanal Sourdough', 'FM-103', 3, 2, 4.99, 1.80, 40, 5, 'loaf', 'Artisanal sourdough bread', 'assets/img/products/product7.jpg'),
      (2, 'FreshMart Roasted Almonds (500g)', 'FM-104', 4, 1, 7.99, 3.50, 60, 10, 'pack', 'Crunchy roasted almonds', 'assets/img/products/product8.jpg')
    `);

    // Org 3 Products
    await dbRun(`
      INSERT INTO products (org_id, name, sku, category_id, brand_id, price, cost_price, quantity, min_quantity, unit, description, image_url)
      VALUES 
      (3, 'GreenGrocery Organic Kale (Bunch)', 'GG-201', 1, 2, 2.99, 1.00, 75, 10, 'bunch', 'Fresh organic kale greens', 'assets/img/products/product9.jpg'),
      (3, 'GreenGrocery Free Range Eggs (12pk)', 'GG-202', 4, 3, 5.49, 2.80, 110, 15, 'box', 'Grade A free range eggs', 'assets/img/products/product10.jpg'),
      (3, 'GreenGrocery Wildflower Honey (500g)', 'GG-203', 4, 2, 8.99, 4.00, 50, 8, 'jar', '100% Raw wildflower honey', 'assets/img/products/product11.jpg')
    `);

    console.log('Sample seed products created across organizations.');
  }
}

// --- API ENDPOINTS ---

// Auth Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await dbGet(`
      SELECT u.id, u.org_id, u.name, u.email, u.role, u.phone, u.permissions, o.name as org_name, o.code as org_code, o.enabled_modules
      FROM users u
      LEFT JOIN organizations o ON u.org_id = o.id
      WHERE LOWER(u.email) = ? AND u.password = ?
    `, [email.trim().toLowerCase(), password]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({ message: 'Login successful', user, token: 'jwt_token_demo_' + user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware to enforce strict Super Admin access on platform endpoints
function requireSuperAdmin(req, res, next) {
  const reqRole = req.headers['x-user-role'];
  // If x-user-role is explicitly sent and is not Super Admin, block access
  if (reqRole && reqRole !== 'Super Admin') {
    return res.status(403).json({ error: 'Access Denied: Super Admin privileges required for platform management' });
  }
  next();
}

// Organizations API Endpoints
app.get('/api/organizations', async (req, res) => {
  try {
    const orgs = await dbAll(`
      SELECT o.*, COUNT(u.id) as total_users,
             (SELECT name FROM users WHERE org_id = o.id AND role = 'Admin' LIMIT 1) as admin_name,
             (SELECT email FROM users WHERE org_id = o.id AND role = 'Admin' LIMIT 1) as admin_email
      FROM organizations o
      LEFT JOIN users u ON o.id = u.org_id
      GROUP BY o.id
      ORDER BY o.id ASC
    `);
    res.json(orgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/organizations', async (req, res) => {
  try {
    const { name, code, admin_name, admin_email, admin_password, enabled_modules } = req.body;
    if (!name || !code || !admin_email || !admin_password) {
      return res.status(400).json({ error: 'Organization name, code, admin email and password are required' });
    }

    const modulesJson = JSON.stringify(enabled_modules || ["products","add_product","categories","brands","stocks","alerts","warehouses","suppliers","barcodes","reports","admin_panel","settings"]);
    
    const result = await dbRun(
      'INSERT INTO organizations (name, code, enabled_modules) VALUES (?, ?, ?)',
      [name.trim(), code.trim().toUpperCase(), modulesJson]
    );
    const orgId = result.lastID;

    // Create Org Admin User
    await dbRun(
      'INSERT INTO users (org_id, name, email, password, role, permissions) VALUES (?, ?, ?, ?, ?, ?)',
      [orgId, admin_name || (name + ' Admin'), admin_email.trim().toLowerCase(), admin_password, 'Admin', '["*"]']
    );

    const createdOrg = await dbGet('SELECT * FROM organizations WHERE id = ?', [orgId]);
    res.status(201).json(createdOrg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/organizations/:id/modules', async (req, res) => {
  try {
    const orgId = req.params.id;
    const { enabled_modules, status } = req.body;
    
    const modulesJson = JSON.stringify(enabled_modules || []);
    await dbRun(
      'UPDATE organizations SET enabled_modules = ?, status = COALESCE(?, status) WHERE id = ?',
      [modulesJson, status, orgId]
    );

    const updated = await dbGet('SELECT * FROM organizations WHERE id = ?', [orgId]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/organizations/:id', async (req, res) => {
  try {
    const orgId = req.params.id;
    await dbRun('DELETE FROM users WHERE org_id = ?', [orgId]);
    await dbRun('DELETE FROM products WHERE org_id = ?', [orgId]);
    await dbRun('DELETE FROM organizations WHERE id = ?', [orgId]);
    res.json({ success: true, message: 'Organization and associated accounts deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Users & Roles API Endpoints
app.get('/api/users', async (req, res) => {
  try {
    const orgId = getReqOrgId(req);
    let sql = `
      SELECT u.id, u.org_id, u.name, u.email, u.role, u.phone, u.status, u.permissions, u.created_at, o.name as org_name
      FROM users u
      LEFT JOIN organizations o ON u.org_id = o.id
    `;
    let params = [];
    if (orgId) {
      sql += ' WHERE u.org_id = ?';
      params.push(orgId);
    }
    sql += ' ORDER BY u.id ASC';

    const users = await dbAll(sql, params);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const reqOrgId = getReqOrgId(req) || 2;
    const { org_id, name, email, password, role, phone, permissions } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password and role are required' });
    }

    const permJson = JSON.stringify(permissions || ["products","add_product"]);
    const result = await dbRun(
      'INSERT INTO users (org_id, name, email, password, role, phone, permissions) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [org_id || reqOrgId, name.trim(), email.trim().toLowerCase(), password, role, phone || '', permJson]
    );

    const newUser = await dbGet('SELECT id, org_id, name, email, role, phone, permissions, created_at FROM users WHERE id = ?', [result.lastID]);
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// File Upload Endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: imageUrl });
});

// Categories
app.get('/api/categories', async (req, res) => {
  try {
    const orgId = getReqOrgId(req);
    let sql = 'SELECT * FROM categories';
    let params = [];
    if (orgId) {
      sql += ' WHERE org_id = ? OR org_id IS NULL';
      params.push(orgId);
    }
    sql += ' ORDER BY id ASC';
    const categories = await dbAll(sql, params);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Brands
app.get('/api/brands', async (req, res) => {
  try {
    const orgId = getReqOrgId(req);
    let sql = 'SELECT * FROM brands';
    let params = [];
    if (orgId) {
      sql += ' WHERE org_id = ? OR org_id IS NULL';
      params.push(orgId);
    }
    sql += ' ORDER BY id ASC';
    const brands = await dbAll(sql, params);
    res.json(brands);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Products
app.get('/api/products', async (req, res) => {
  try {
    const orgId = getReqOrgId(req);
    let sql = `
      SELECT p.*, c.name as category_name, b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
    `;
    let params = [];
    if (orgId) {
      sql += ' WHERE p.org_id = ?';
      params.push(orgId);
    }
    sql += ' ORDER BY p.id DESC';

    const products = await dbAll(sql, params);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await dbGet(`
      SELECT p.*, c.name as category_name, b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.id = ?
    `, [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const reqOrgId = getReqOrgId(req) || 1;
    const { name, sku, category_id, brand_id, price, cost_price, quantity, min_quantity, unit, description, image_url } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Product name and price are required' });
    }

    const generatedSku = sku || `AVO-${Math.floor(1000 + Math.random() * 9000)}`;
    const result = await dbRun(`
      INSERT INTO products (org_id, name, sku, category_id, brand_id, price, cost_price, quantity, min_quantity, unit, description, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      reqOrgId,
      name.trim(),
      generatedSku,
      category_id || null,
      brand_id || null,
      parseFloat(price) || 0.0,
      parseFloat(cost_price) || 0.0,
      parseInt(quantity) || 0,
      parseInt(min_quantity) || 5,
      unit || 'pc',
      description || null,
      image_url || 'assets/img/products/product1.jpg'
    ]);

    const newProduct = await dbGet('SELECT * FROM products WHERE id = ?', [result.lastID]);
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, sku, category_id, brand_id, price, cost_price, quantity, min_quantity, unit, description, image_url } = req.body;

    await dbRun(`
      UPDATE products SET
        name = COALESCE(?, name),
        sku = COALESCE(?, sku),
        category_id = COALESCE(?, category_id),
        brand_id = COALESCE(?, brand_id),
        price = COALESCE(?, price),
        cost_price = COALESCE(?, cost_price),
        quantity = COALESCE(?, quantity),
        min_quantity = COALESCE(?, min_quantity),
        unit = COALESCE(?, unit),
        description = COALESCE(?, description),
        image_url = COALESCE(?, image_url)
      WHERE id = ?
    `, [
      name ? name.trim() : null,
      sku ? sku.trim() : null,
      category_id || null,
      brand_id || null,
      price !== undefined ? parseFloat(price) : null,
      cost_price !== undefined ? parseFloat(cost_price) : null,
      quantity !== undefined ? parseInt(quantity) : null,
      min_quantity !== undefined ? parseInt(min_quantity) : null,
      unit || null,
      description !== undefined ? description : null,
      image_url || null,
      productId
    ]);

    const updatedProduct = await dbGet('SELECT * FROM products WHERE id = ?', [productId]);
    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customers
app.get('/api/customers', async (req, res) => {
  try {
    const orgId = getReqOrgId(req);
    let sql = 'SELECT * FROM customers';
    let params = [];
    if (orgId) {
      sql += ' WHERE org_id = ? OR org_id IS NULL';
      params.push(orgId);
    }
    sql += ' ORDER BY id ASC';
    const customers = await dbAll(sql, params);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Suppliers
app.get('/api/suppliers', async (req, res) => {
  try {
    const orgId = getReqOrgId(req);
    let sql = 'SELECT * FROM suppliers';
    let params = [];
    if (orgId) {
      sql += ' WHERE org_id = ? OR org_id IS NULL';
      params.push(orgId);
    }
    sql += ' ORDER BY id ASC';
    const suppliers = await dbAll(sql, params);
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Orders & POS Checkout
app.post('/api/orders', async (req, res) => {
  try {
    const reqOrgId = getReqOrgId(req) || 1;
    const { customer_id, items, total_amount, payment_method } = req.body;
    if (!items || !items.length || total_amount === undefined) {
      return res.status(400).json({ error: 'Order items and total_amount are required' });
    }

    const orderNumber = `ORD-${Date.now()}`;
    const orderResult = await dbRun(`
      INSERT INTO orders (org_id, order_number, customer_id, total_amount, payment_method)
      VALUES (?, ?, ?, ?, ?)
    `, [reqOrgId, orderNumber, customer_id || 1, parseFloat(total_amount), payment_method || 'Cash']);

    const orderId = orderResult.lastID;

    for (const item of items) {
      await dbRun(`
        INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        orderId,
        item.product_id ? parseInt(item.product_id) : null,
        item.product_name || 'Item',
        parseFloat(item.unit_price) || 0.0,
        parseInt(item.quantity) || 1,
        parseFloat(item.subtotal) || 0.0
      ]);

      if (item.product_id) {
        await dbRun(`
          UPDATE products
          SET quantity = MAX(0, quantity - ?)
          WHERE id = ?
        `, [parseInt(item.quantity) || 1, parseInt(item.product_id)]);
      }
    }

    const createdOrder = await dbGet('SELECT * FROM orders WHERE id = ?', [orderId]);
    const createdItems = await dbAll('SELECT * FROM order_items WHERE order_id = ?', [orderId]);

    res.status(201).json({ ...createdOrder, items: createdItems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Super Admin Platform Statistics Endpoint
app.get('/api/superadmin/stats', async (req, res) => {
  try {
    const orgRow = await dbGet('SELECT COUNT(*) as total_orgs FROM organizations');
    const userRow = await dbGet('SELECT COUNT(*) as total_users FROM users');
    const prodRow = await dbGet('SELECT COUNT(*) as total_products FROM products');
    const valRow = await dbGet('SELECT SUM(price * quantity) as total_valuation FROM products');

    const orgs = await dbAll(`
      SELECT o.*, COUNT(u.id) as user_count
      FROM organizations o
      LEFT JOIN users u ON o.id = u.org_id
      GROUP BY o.id
    `);

    res.json({
      total_orgs: orgRow.total_orgs || 0,
      total_users: userRow.total_users || 0,
      total_products: prodRow.total_products || 0,
      total_valuation: valRow.total_valuation || 0.0,
      organizations: orgs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tenant Dashboard Summary Metrics API
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const orgId = getReqOrgId(req);

    let revSql = 'SELECT SUM(total_amount) as total_revenue, COUNT(*) as order_count FROM orders';
    let prodSql = 'SELECT COUNT(*) as product_count, SUM(price * quantity) as total_val FROM products';
    let lowStockSql = 'SELECT COUNT(*) as low_stock_count FROM products WHERE quantity <= min_quantity';
    let recOrderSql = `
      SELECT o.*, c.name as customer_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
    `;
    let lowStockProdSql = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.quantity <= p.min_quantity
    `;

    let params = [];
    if (orgId) {
      revSql += ' WHERE org_id = ?';
      prodSql += ' WHERE org_id = ?';
      lowStockSql += ' AND org_id = ?';
      recOrderSql += ' WHERE o.org_id = ?';
      lowStockProdSql += ' AND p.org_id = ?';
      params = [orgId];
    }

    recOrderSql += ' ORDER BY o.id DESC LIMIT 5';
    lowStockProdSql += ' ORDER BY p.quantity ASC LIMIT 5';

    const revRow = await dbGet(revSql, params);
    const prodRow = await dbGet(prodSql, params);
    const lowStockRow = await dbGet(lowStockSql, params);
    const recentOrders = await dbAll(recOrderSql, params);
    const lowStockProducts = await dbAll(lowStockProdSql, params);

    res.json({
      total_revenue: revRow && revRow.total_revenue ? revRow.total_revenue : (prodRow ? (prodRow.total_val || 0.0) : 0.0),
      order_count: revRow ? (revRow.order_count || 0) : 0,
      product_count: prodRow ? (prodRow.product_count || 0) : 0,
      low_stock_count: lowStockRow ? (lowStockRow.low_stock_count || 0) : 0,
      recent_orders: recentOrders,
      low_stock_products: lowStockProducts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback to index.html for SPA/HTML routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  const filePath = path.join(__dirname, req.path);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`AvocadoPOS server listening at http://127.0.0.1:${PORT}`);
});
