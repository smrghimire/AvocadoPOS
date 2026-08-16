# Avocado Inventory - Enterprise Inventory Management System

**Avocado Inventory** is a full-stack, enterprise-grade Inventory Management System built with **Node.js, Express.js, SQLite3, HTML5, CSS3, Bootstrap 5, and Vanilla JavaScript**.

It provides complete lifecycle control over product inventory, stock levels, stock transfers, barcode generation, low-stock warnings, warehouse storage management, supplier procurement, and real-time inventory valuation analytics.

---

## 🚀 Quick Start Guide: How to Run from Source Code

### Prerequisites
- **Node.js** (v16 or higher). Download from [nodejs.org](https://nodejs.org/).
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
   ```bash
   npm install
   ```

3. **Start the Inventory Server**:
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

## ✨ Dedicated Inventory Management Modules

- 📦 **Products Catalog (`products.html`)**: View, search, filter, and delete inventory stock items with real-time database state.
- ➕ **Add New Product (`add-product.html`)**: Create new products with custom name, SKU, price, cost price, quantity, category, brand, and image file uploads.
- 🏷️ **Categories & Brands (`category-list.html` / `brand-list.html`)**: Manage product classifications and manufacturer brands.
- 📊 **Stock Control & Adjustments (`manage-stocks.html`)**: Handle stock audits, inventory adjustments, and warehouse transfers.
- ⚠️ **Stock Alerts & Expiries (`low-stocks.html`)**: Monitor products falling below safety thresholds and track product expiration dates.
- 🏢 **Warehouses & Stores (`warehouse.html`)**: Multi-location warehouse storage management.
- 🚚 **Suppliers & Purchase Orders (`suppliers.html`)**: Vendor directories, purchase returns, and procurement management.
- 📐 **Barcodes & Labels (`barcode.html`)**: Barcode and QR code generator for inventory scanning.
- 📈 **Inventory Valuation Reports (`inventory-report.html`)**: Comprehensive financial stock reports and stock movement analytics.

---

## 🔌 REST API Endpoints

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
| `GET` | `/api/suppliers` | Returns supplier records |
| `GET` | `/api/dashboard/stats` | Summary statistics (inventory valuation, product count, low stock count) |

---

## 📁 Directory Structure Overview

```
.
├── server.js                  # Express.js REST API Server & SQLite Migration/Seeder
├── package.json               # Project Dependencies & Run Scripts
├── database.sqlite            # SQLite Database (Auto-created on launch)
├── uploads/                   # Uploaded Product Images Directory
├── index.html                 # Modern OS Launchpad Landing Page
├── products.html              # Products Inventory Catalog
├── add-product.html           # Product Creation Form
├── manage-stocks.html         # Stock Control & Adjustments
├── low-stocks.html            # Low Stock & Expiry Alerts
├── warehouse.html             # Warehouse Storage Hubs
├── suppliers.html             # Supplier Procurement Directory
├── assets/
│   ├── js/
│   │   └── api.js             # Front-End API Bridge & Dynamic Controllers
│   ├── css/
│   │   └── os-launchpad.css   # OS Launchpad Glassmorphic Stylesheet
│   └── img/                   # Branding & Logo Assets
└── README.md                  # Project Documentation
```

---

## 📝 License

Distributed under the **MIT License**. Created for **Avocado Inventory**.
