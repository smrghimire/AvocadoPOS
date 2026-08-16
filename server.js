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

async function initDatabase() {
  try {
    // Enable foreign keys
    await dbRun('PRAGMA foreign_keys = ON');

    // Categories
    await dbRun(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        name TEXT NOT NULL,
        logo_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products
    await dbRun(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        company TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Users
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Admin',
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Orders
    await dbRun(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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

    console.log('Database tables initialized successfully.');
    await seedInitialData();
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

async function seedInitialData() {
  const catCount = await dbGet('SELECT COUNT(*) as count FROM categories');
  if (catCount.count === 0) {
    await dbRun("INSERT INTO categories (name, code, description) VALUES ('Fruits & Vegetables', 'CAT-001', 'Fresh organic fruits and veggies')");
    await dbRun("INSERT INTO categories (name, code, description) VALUES ('Beverages', 'CAT-002', 'Cold and hot drinks')");
    await dbRun("INSERT INTO categories (name, code, description) VALUES ('Bakery', 'CAT-003', 'Fresh bread and bakery goods')");
    await dbRun("INSERT INTO categories (name, code, description) VALUES ('Groceries', 'CAT-004', 'Daily essentials')");
  }

  const brandCount = await dbGet('SELECT COUNT(*) as count FROM brands');
  if (brandCount.count === 0) {
    await dbRun("INSERT INTO brands (name) VALUES ('AvocadoFresh')");
    await dbRun("INSERT INTO brands (name) VALUES ('Organic Harvest')");
    await dbRun("INSERT INTO brands (name) VALUES ('Pure Nature')");
  }

  const custCount = await dbGet('SELECT COUNT(*) as count FROM customers');
  if (custCount.count === 0) {
    await dbRun("INSERT INTO customers (name, email, phone, address) VALUES ('Walk-in Customer', 'walkin@avocadopos.local', '555-0000', 'Store Storefront')");
    await dbRun("INSERT INTO customers (name, email, phone, address) VALUES ('John Smith', 'john.smith@example.com', '555-0199', '123 Main St')");
    await dbRun("INSERT INTO customers (name, email, phone, address) VALUES ('Sarah Jenkins', 'sarah.j@example.com', '555-0244', '456 Market Rd')");
  }

  const prodCount = await dbGet('SELECT COUNT(*) as count FROM products');
  if (prodCount.count === 0) {
    await dbRun(`
      INSERT INTO products (name, sku, category_id, brand_id, price, cost_price, quantity, min_quantity, unit, description, image_url)
      VALUES ('Hass Avocado (Pack of 3)', 'AVO-001', 1, 1, 4.99, 2.50, 85, 10, 'pc', 'Fresh ripe Hass avocados', 'assets/img/products/product1.jpg')
    `);
    await dbRun(`
      INSERT INTO products (name, sku, category_id, brand_id, price, cost_price, quantity, min_quantity, unit, description, image_url)
      VALUES ('Organic Banana (Bunch)', 'BAN-002', 1, 2, 2.49, 1.20, 120, 15, 'bunch', 'Organic sweet yellow bananas', 'assets/img/products/product2.jpg')
    `);
    await dbRun(`
      INSERT INTO products (name, sku, category_id, brand_id, price, cost_price, quantity, min_quantity, unit, description, image_url)
      VALUES ('Fresh Orange Juice (1L)', 'JUICE-003', 2, 3, 3.99, 1.80, 45, 5, 'bottle', '100% Cold pressed fresh orange juice', 'assets/img/products/product3.jpg')
    `);
    await dbRun(`
      INSERT INTO products (name, sku, category_id, brand_id, price, cost_price, quantity, min_quantity, unit, description, image_url)
      VALUES ('Whole Grain Wheat Bread', 'BRD-004', 3, 2, 2.99, 1.00, 30, 5, 'loaf', 'Freshly baked whole grain loaf', 'assets/img/products/product4.jpg')
    `);
    console.log('Sample seed products created.');
  }

  const userCount = await dbGet('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    await dbRun(`
      INSERT INTO users (name, email, password, role, phone) VALUES 
      ('System Super Admin', 'admin@avocado.com', 'admin123', 'Super Admin', '+1 555-0100'),
      ('Inventory Manager', 'manager@avocado.com', 'manager123', 'Manager', '+1 555-0101'),
      ('Client Portal User', 'client@avocado.com', 'client123', 'Client', '+1 555-0102'),
      ('Inventory Staff Clerk', 'staff@avocado.com', 'staff123', 'Staff', '+1 555-0103')
    `);
    console.log('Sample user accounts created.');
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

    const user = await dbGet(
      'SELECT id, name, email, role, phone, created_at FROM users WHERE email = ? AND password = ?',
      [email.trim().toLowerCase(), password]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({ message: 'Login successful', user, token: 'jwt_token_demo_' + user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Users Endpoint
app.get('/api/users', async (req, res) => {
  try {
    const users = await dbAll('SELECT id, name, email, role, phone, created_at FROM users ORDER BY id ASC');
    res.json(users);
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
    const rows = await dbAll('SELECT * FROM categories ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });
    const result = await dbRun('INSERT INTO categories (name, code, description) VALUES (?, ?, ?)', [name, code || '', description || '']);
    const category = await dbGet('SELECT * FROM categories WHERE id = ?', [result.lastID]);
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Brands
app.get('/api/brands', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM brands ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/brands', async (req, res) => {
  try {
    const { name, logo_url } = req.body;
    if (!name) return res.status(400).json({ error: 'Brand name is required' });
    const result = await dbRun('INSERT INTO brands (name, logo_url) VALUES (?, ?)', [name, logo_url || '']);
    const brand = await dbGet('SELECT * FROM brands WHERE id = ?', [result.lastID]);
    res.status(201).json(brand);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customers
app.get('/api/customers', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM customers ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    if (!name) return res.status(400).json({ error: 'Customer name is required' });
    const result = await dbRun('INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)', [name, email || '', phone || '', address || '']);
    const customer = await dbGet('SELECT * FROM customers WHERE id = ?', [result.lastID]);
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Products CRUD
app.get('/api/products', async (req, res) => {
  try {
    const sql = `
      SELECT p.*, c.name as category_name, b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ORDER BY p.id DESC
    `;
    const rows = await dbAll(sql);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const row = await dbGet(`
      SELECT p.*, c.name as category_name, b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.id = ?
    `, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Product not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const {
      name, sku, category_id, brand_id, price, cost_price,
      quantity, min_quantity, unit, tax_rate, discount, description, image_url
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Product name is required' });

    // Generate unique SKU if omitted
    const generatedSku = sku || `SKU-${Date.now().toString().slice(-6)}`;

    const result = await dbRun(`
      INSERT INTO products (
        name, sku, category_id, brand_id, price, cost_price,
        quantity, min_quantity, unit, tax_rate, discount, description, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      generatedSku,
      category_id ? parseInt(category_id) : null,
      brand_id ? parseInt(brand_id) : null,
      parseFloat(price) || 0.0,
      parseFloat(cost_price) || 0.0,
      parseInt(quantity) || 0,
      parseInt(min_quantity) || 5,
      unit || 'pc',
      parseFloat(tax_rate) || 0.0,
      parseFloat(discount) || 0.0,
      description || '',
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
    const {
      name, sku, category_id, brand_id, price, cost_price,
      quantity, min_quantity, unit, tax_rate, discount, description, image_url
    } = req.body;

    const productId = req.params.id;
    const existing = await dbGet('SELECT * FROM products WHERE id = ?', [productId]);
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    await dbRun(`
      UPDATE products SET
        name = ?, sku = ?, category_id = ?, brand_id = ?, price = ?, cost_price = ?,
        quantity = ?, min_quantity = ?, unit = ?, tax_rate = ?, discount = ?,
        description = ?, image_url = ?
      WHERE id = ?
    `, [
      name !== undefined ? name : existing.name,
      sku !== undefined ? sku : existing.sku,
      category_id !== undefined ? category_id : existing.category_id,
      brand_id !== undefined ? brand_id : existing.brand_id,
      price !== undefined ? parseFloat(price) : existing.price,
      cost_price !== undefined ? parseFloat(cost_price) : existing.cost_price,
      quantity !== undefined ? parseInt(quantity) : existing.quantity,
      min_quantity !== undefined ? parseInt(min_quantity) : existing.min_quantity,
      unit !== undefined ? unit : existing.unit,
      tax_rate !== undefined ? parseFloat(tax_rate) : existing.tax_rate,
      discount !== undefined ? parseFloat(discount) : existing.discount,
      description !== undefined ? description : existing.description,
      image_url !== undefined ? image_url : existing.image_url,
      productId
    ]);

    const updated = await dbGet('SELECT * FROM products WHERE id = ?', [productId]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const result = await dbRun('DELETE FROM products WHERE id = ?', [productId]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully', id: productId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Orders (POS Checkout & Sales)
app.get('/api/orders', async (req, res) => {
  try {
    const sql = `
      SELECT o.*, c.name as customer_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.id DESC
    `;
    const orders = await dbAll(sql);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { customer_id, items, total_amount, discount_amount, tax_amount, payment_method } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    // Insert Order
    const orderRes = await dbRun(`
      INSERT INTO orders (order_number, customer_id, total_amount, discount_amount, tax_amount, payment_method)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      orderNumber,
      customer_id ? parseInt(customer_id) : 1,
      parseFloat(total_amount) || 0.0,
      parseFloat(discount_amount) || 0.0,
      parseFloat(tax_amount) || 0.0,
      payment_method || 'Cash'
    ]);

    const orderId = orderRes.lastID;

    // Insert Order Items and Update Stock Quantities
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

      // Deduct Stock Quantity
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

// Dashboard Summary Metrics API
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const revRow = await dbGet('SELECT SUM(total_amount) as total_revenue, COUNT(*) as order_count FROM orders');
    const prodRow = await dbGet('SELECT COUNT(*) as product_count FROM products');
    const lowStockRow = await dbGet('SELECT COUNT(*) as low_stock_count FROM products WHERE quantity <= min_quantity');
    const recentOrders = await dbAll(`
      SELECT o.*, c.name as customer_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.id DESC LIMIT 5
    `);
    const lowStockProducts = await dbAll(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.quantity <= p.min_quantity
      ORDER BY p.quantity ASC LIMIT 5
    `);

    res.json({
      total_revenue: revRow.total_revenue || 0.0,
      order_count: revRow.order_count || 0,
      product_count: prodRow.product_count || 0,
      low_stock_count: lowStockRow.low_stock_count || 0,
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
