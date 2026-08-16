# AvocadoPOS - Retail POS & Inventory Management System

**AvocadoPOS** is a comprehensive, modern, responsive Point of Sale (POS) and Inventory Management web application. Designed for retail stores, warehouses, and multi-location businesses, it provides intuitive interfaces for managing products, tracking sales, handling invoices, managing stock levels, viewing detailed financial analytics, and managing employees.

---

## 🚀 How to Run the Software from Source Code

Since **AvocadoPOS** is built as a web application with static assets (HTML5, CSS3, JavaScript, Bootstrap 5), you can easily serve and run it locally on any computer.

### Prerequisites
- A modern web browser (**Google Chrome**, **Mozilla Firefox**, **Apple Safari**, or **Microsoft Edge**).
- Optional: **Python 3**, **Node.js**, or **PHP** installed on your system to run a local web server.

---

### Option 1: Using Python 3 (Recommended)

If you have Python 3 installed:

1. Open your terminal or command prompt in the project root directory:
   ```bash
   cd /path/to/invent
   ```
2. Start Python's built-in HTTP server:
   ```bash
   python3 -m http.server 8000
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

---

### Option 2: Using Node.js (`serve` or `http-server`)

If you have Node.js installed:

1. Open terminal in the project directory.
2. Run `serve` via `npx`:
   ```bash
   npx serve -l 8000 .
   ```
   *Alternatively, use `http-server`:*
   ```bash
   npx http-server -p 8000
   ```
3. Open your browser and visit:
   ```
   http://localhost:8000
   ```

---

### Option 3: Using PHP

If you have PHP installed:

1. Open terminal in the project root directory.
2. Run the PHP development server:
   ```bash
   php -S 127.0.0.1:8000
   ```
3. Open your browser and visit:
   ```
   http://127.0.0.1:8000
   ```

---

### Option 4: Direct File Access (No Server Required)

You can also run the application directly without a web server:
1. Locate `index.html` in the project folder.
2. Double-click `index.html` or drag and drop it into your web browser.

---

## ✨ Key Features & Modules

- 🛒 **Point of Sale (POS)**: Multiple POS layouts (`pos.html`, `pos-1.html` to `pos-5.html`) supporting item additions, cart modification, discounts, customer selection, and barcode scanning.
- 📦 **Inventory & Stock Management**: Product list (`products.html`), low-stock alerts, stock adjustments, stock transfers, brands, categories, sub-categories, and variant attributes.
- 📊 **Dashboards & Analytics**: Main Dashboard (`index.html`), Admin Dashboard (`admin-dashboard.html`), Sales Dashboard (`sales-dashboard.html`), and ApexCharts financial visualizations.
- 📄 **Invoicing & Sales**: Quotations, sales orders, invoice details, sales returns, purchase orders, purchase returns.
- 👥 **Customer & Supplier Management**: Comprehensive profiles for customers, suppliers, and billers with due tracking reports.
- 💼 **HR & Payroll**: Employee list, attendance tracking, leave requests, shift management, payroll/payslip generation, department & designation control.
- 💰 **Financial Reports**: Balance sheet, trial balance, profit & loss statement, cash flow statement, income/expense reports, tax reports.
- ⚙️ **System & General Settings**: Company settings, payment gateway integration, email/SMS templates, printer setup, barcode generation, roles & permissions.

---

## 📁 Directory Structure Overview

```
.
├── index.html                 # Main Dashboard Landing Page
├── pos.html                   # Interactive Point of Sale (POS) Interface
├── products.html              # Product Catalog & Inventory
├── admin-dashboard.html       # Executive Admin Overview
├── sales-dashboard.html       # Detailed Sales Metrics
├── customers.html             # Customer Database
├── suppliers.html             # Supplier Directory
├── invoice.html               # Invoice Generator & List
├── assets/                    # Project Assets
│   ├── css/                   # Stylesheets & Bootstrap
│   ├── js/                    # Core Scripts & Chart Initialization
│   ├── img/                   # Product Images, Logos, Icons
│   └── plugins/               # External Plugins (ApexCharts, Datatables, FontAwesome, etc.)
└── README.md                  # Project Documentation
```

---

## 🛠️ Tech Stack & Third-Party Libraries

- **Framework**: Bootstrap 5
- **Icons**: FontAwesome 6, Tabler Icons, Feather Icons
- **Charts**: ApexCharts, Chart.js, Flot, Morris
- **Data Grids**: DataTables, Bootstrap Select2, Flatpickr

---

## 📝 License & Credits

Designed & Developed by **AvocadoPOS**.
