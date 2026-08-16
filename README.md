# AvocadoPOS - Retail POS & Inventory Management System

**AvocadoPOS** is a full-stack Point of Sale (POS) and Inventory Management system built with **Node.js, Express.js, SQLite3, HTML5, CSS3, Bootstrap 5, and Vanilla JavaScript**.

It features real-time database persistence for product management, stock tracking, POS checkout with automatic inventory deduction, image file uploads, and live dashboard analytics.

---

## 🚀 Quick Start Guide: How to Run from Source Code

Follow these simple steps to run **AvocadoPOS** on any computer:

### Prerequisites
- **Node.js** (v16 or higher recommended). Download from [nodejs.org](https://nodejs.org/).
- **npm** (included automatically with Node.js).
- A modern web browser (Google Chrome, Mozilla Firefox, Apple Safari, or Microsoft Edge).

---

### Step-by-Step Setup

1. **Extract or Clone the Repository**:
   ```bash
   git clone https://github.com/smrghimire/AvocadoPOS.git
   cd AvocadoPOS
   ```

2. **Install Dependencies**:
   Install the required Node.js backend packages (`express`, `sqlite3`, `cors`, `multer`):
   ```bash
   npm install
   ```

3. **Start the Application Server**:
   ```bash
   npm start
   ```
   *Or directly via Node:*
   ```bash
   node server.js
   ```

4. **Access the Application**:
   Open your browser and visit:
   ```
   http://localhost:8000
   ```
   *(On first run, SQLite will automatically create `database.sqlite` and seed initial categories, brands, customers, and starter products).*

---

## ✨ Features & Core Capabilities

- 🥑 **Product Management (`add-product.html` / `products.html`)**:
  - Add new products with custom name, SKU, price, cost price, quantity, category, brand, and description.
  - Upload product images saved directly to the server's `uploads/` directory.
  - Delete products with real-time database removal.
  - Low-stock warning indicators when quantity falls below alert threshold.

- 🛒 **Point of Sale (POS Terminal) (`pos.html`)**:
  - Interactive grid displaying live inventory from SQLite.
  - Add items to cart, adjust quantities, calculate subtotals and totals.
  - Complete checkout with real-time **stock deduction** in the database.

- 📊 **Dashboard & Metrics (`index.html`)**:
  - Live summary statistics for total sales revenue, completed orders, product count, and low-stock items.

- 📁 **Database Persistence (`database.sqlite`)**:
  - Embedded SQLite relational database storing `products`, `categories`, `brands`, `customers`, `suppliers`, `orders`, and `order_items`.

---

## 🔌 REST API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/products` | Returns all products with category and brand details |
| `GET` | `/api/products/:id` | Returns single product details |
| `POST` | `/api/products` | Creates a new product and saves into SQLite |
| `PUT` | `/api/products/:id` | Updates an existing product |
| `DELETE` | `/api/products/:id` | Deletes a product |
| `POST` | `/api/upload` | Uploads product image file to `/uploads` |
| `GET` | `/api/categories` | Returns all categories |
| `POST` | `/api/categories` | Creates a new category |
| `GET` | `/api/brands` | Returns all brands |
| `GET` | `/api/customers` | Returns all customers |
| `POST` | `/api/orders` | POS Checkout: creates order & **deducts product stock** |
| `GET` | `/api/dashboard/stats` | Summary statistics (revenue, sales, low stock count) |

---

## 📁 Directory Structure Overview

```
.
├── server.js                  # Express.js REST API Server & SQLite Migration/Seeder
├── package.json               # Project Dependencies & Run Scripts
├── database.sqlite            # SQLite Database (Auto-created on launch)
├── uploads/                   # Uploaded Product Images Directory
├── index.html                 # Main Dashboard Overview
├── pos.html                   # Point of Sale (POS) Interface
├── products.html              # Product Inventory Catalog
├── add-product.html           # Product Creation Form
├── assets/
│   ├── js/
│   │   └── api.js             # Front-End API Bridge & Dynamic Controllers
│   ├── css/                   # Stylesheets & Bootstrap 5
│   └── img/                   # Branding & Logo Assets
└── README.md                  # Project Documentation
```

---

## 🛠️ Environment Configuration (Optional)

By default, the server runs on port `8000`. You can specify a custom port by setting the `PORT` environment variable:

```bash
PORT=3000 npm start
```

---

## 📝 License

Distributed under the **MIT License**. Created for **AvocadoPOS**.
