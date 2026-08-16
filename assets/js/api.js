/**
 * AvocadoPOS - Front-End API Bridge & Dynamic Renderer
 */

const API = {
  baseUrl: '',

  async request(endpoint, options = {}) {
    try {
      const response = await fetch(this.baseUrl + endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }
      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  // Toast notification
  showToast(message, type = 'success') {
    let container = document.getElementById('avocado-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'avocado-toast-container';
      container.className = 'position-fixed bottom-0 end-0 p-3';
      container.style.zIndex = '9999';
      document.body.appendChild(container);
    }

    const toastId = 'toast_' + Date.now();
    const bgClass = type === 'success' ? 'bg-success text-white' : 'bg-danger text-white';
    
    const toastHtml = `
      <div id="${toastId}" class="toast align-items-center ${bgClass} border-0 show mb-2" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body fw-bold fs-14">
            <i class="ti ${type === 'success' ? 'ti-check' : 'ti-alert-circle'} me-2"></i> ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHtml);
    setTimeout(() => {
      const el = document.getElementById(toastId);
      if (el) el.remove();
    }, 4000);
  },

  // Products
  async getProducts() { return this.request('/api/products'); },
  async getProduct(id) { return this.request(`/api/products/${id}`); },
  async createProduct(data) {
    return this.request('/api/products', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async updateProduct(id, data) {
    return this.request(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  async deleteProduct(id) {
    return this.request(`/api/products/${id}`, { method: 'DELETE' });
  },

  // File Upload
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(this.baseUrl + '/api/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
  },

  // Categories & Brands
  async getCategories() { return this.request('/api/categories'); },
  async createCategory(data) {
    return this.request('/api/categories', { method: 'POST', body: JSON.stringify(data) });
  },
  async getBrands() { return this.request('/api/brands'); },
  async createBrand(data) {
    return this.request('/api/brands', { method: 'POST', body: JSON.stringify(data) });
  },

  // Customers & Orders
  async getCustomers() { return this.request('/api/customers'); },
  async createOrder(data) {
    return this.request('/api/orders', { method: 'POST', body: JSON.stringify(data) });
  },
  async getStats() { return this.request('/api/dashboard/stats'); }
};

// Page Initializer Handlers
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;

  if (currentPath.includes('add-product.html')) {
    initAddProductPage();
  } else if (currentPath.includes('products.html') || currentPath.includes('product-list.html')) {
    initProductsListPage();
  } else if (currentPath.includes('pos.html')) {
    initPOSPage();
  } else if (currentPath.includes('index.html') || currentPath.includes('admin-dashboard.html')) {
    initDashboardPage();
  }
});

/** Add Product Page Controller **/
async function initAddProductPage() {
  console.log('Initializing Add Product Form Controller...');

  // Populate Categories & Brands
  try {
    const categories = await API.getCategories();
    const catSelects = document.querySelectorAll('select[name="category_id"], .category-select');
    catSelects.forEach(select => {
      select.innerHTML = '<option value="">Select Category</option>';
      categories.forEach(c => {
        select.insertAdjacentHTML('beforeend', `<option value="${c.id}">${c.name}</option>`);
      });
    });

    const brands = await API.getBrands();
    const brandSelects = document.querySelectorAll('select[name="brand_id"], .brand-select');
    brandSelects.forEach(select => {
      select.innerHTML = '<option value="">Select Brand</option>';
      brands.forEach(b => {
        select.insertAdjacentHTML('beforeend', `<option value="${b.id}">${b.name}</option>`);
      });
    });
  } catch (err) {
    console.error('Failed to load form options:', err);
  }

  // Find Submit / Save Product Buttons
  const saveButtons = Array.from(document.querySelectorAll('a, button')).filter(el => {
    const text = el.textContent.trim().toLowerCase();
    return text === 'save product' || text === 'submit' || text === 'save';
  });

  saveButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      btn.classList.add('disabled');
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

      try {
        // Collect Form Fields
        const nameInput = document.querySelector('input[name="name"], input[placeholder*="Product Name"], .product-name-input');
        const skuInput = document.querySelector('input[name="sku"], input[placeholder*="SKU"], .sku-input');
        const priceInput = document.querySelector('input[name="price"], input[placeholder*="Price"], .price-input');
        const costInput = document.querySelector('input[name="cost_price"], input[placeholder*="Cost"], .cost-input');
        const qtyInput = document.querySelector('input[name="quantity"], input[placeholder*="Quantity"], .qty-input');
        const minQtyInput = document.querySelector('input[name="min_quantity"], input[placeholder*="Min"], .min-qty-input');
        const catInput = document.querySelector('select[name="category_id"], .category-select');
        const brandInput = document.querySelector('select[name="brand_id"], .brand-select');
        const descInput = document.querySelector('textarea, .description-input');
        const imageFileInput = document.querySelector('input[type="file"]');

        const name = nameInput ? nameInput.value.trim() : '';
        if (!name) {
          API.showToast('Please enter a product name', 'danger');
          btn.classList.remove('disabled');
          btn.textContent = 'Save Product';
          return;
        }

        let imageUrl = 'assets/img/products/product1.jpg';
        if (imageFileInput && imageFileInput.files && imageFileInput.files[0]) {
          try {
            imageUrl = await API.uploadImage(imageFileInput.files[0]);
          } catch (uploadErr) {
            console.warn('Image upload failed, using default image', uploadErr);
          }
        }

        const productData = {
          name: name,
          sku: skuInput && skuInput.value.trim() ? skuInput.value.trim() : `AVO-${Math.floor(1000 + Math.random() * 9000)}`,
          category_id: catInput && catInput.value ? parseInt(catInput.value) : 1,
          brand_id: brandInput && brandInput.value ? parseInt(brandInput.value) : 1,
          price: priceInput && parseFloat(priceInput.value) ? parseFloat(priceInput.value) : 9.99,
          cost_price: costInput && parseFloat(costInput.value) ? parseFloat(costInput.value) : 4.50,
          quantity: qtyInput && parseInt(qtyInput.value) ? parseInt(qtyInput.value) : 50,
          min_quantity: minQtyInput && parseInt(minQtyInput.value) ? parseInt(minQtyInput.value) : 5,
          unit: 'pc',
          description: descInput ? descInput.value.trim() : '',
          image_url: imageUrl
        };

        await API.createProduct(productData);
        API.showToast('Product added successfully!');

        setTimeout(() => {
          window.location.href = 'products.html';
        }, 1200);

      } catch (err) {
        API.showToast(err.message || 'Failed to save product', 'danger');
        btn.classList.remove('disabled');
        btn.textContent = 'Save Product';
      }
    });
  });
}

/** Products List Page Controller **/
async function initProductsListPage() {
  console.log('Initializing Products List Controller...');
  try {
    const products = await API.getProducts();
    const tableBody = document.querySelector('.table tbody, datatable tbody');

    if (!tableBody) return;

    if (products.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No products found. Click "Add Product" to create one.</td></tr>';
      return;
    }

    let rowsHtml = '';
    products.forEach(p => {
      const stockBadge = p.quantity <= p.min_quantity
        ? `<span class="badge bg-danger-transparent text-danger">${p.quantity} (Low Stock)</span>`
        : `<span class="badge bg-success-transparent text-success">${p.quantity} In Stock</span>`;

      rowsHtml += `
        <tr data-product-id="${p.id}">
          <td>
            <div class="product-info d-flex align-items-center">
              <a href="product-details.html" class="product-img me-2">
                <img src="${p.image_url}" alt="product" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px;">
              </a>
              <div>
                <h6 class="fw-bold mb-0"><a href="product-details.html">${p.name}</a></h6>
                <small class="text-muted">SKU: ${p.sku || 'N/A'}</small>
              </div>
            </div>
          </td>
          <td>${p.category_name || 'General'}</td>
          <td>${p.brand_name || 'AvocadoPOS'}</td>
          <td class="fw-bold text-success">$${parseFloat(p.price).toFixed(2)}</td>
          <td>$${parseFloat(p.cost_price || 0).toFixed(2)}</td>
          <td>${stockBadge}</td>
          <td>
            <div class="action-icon d-inline-flex">
              <a href="edit-product.html?id=${p.id}" class="me-2 p-2 text-primary" title="Edit"><i class="ti ti-edit fs-18"></i></a>
              <a href="javascript:void(0);" class="delete-btn p-2 text-danger" data-id="${p.id}" title="Delete"><i class="ti ti-trash fs-18"></i></a>
            </div>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = rowsHtml;

    // Attach Delete Action Handlers
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const prodId = btn.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this product?')) {
          try {
            await API.deleteProduct(prodId);
            API.showToast('Product deleted successfully');
            btn.closest('tr').remove();
          } catch (err) {
            API.showToast('Failed to delete product', 'danger');
          }
        }
      });
    });

  } catch (err) {
    console.error('Failed to load products list:', err);
  }
}

/** POS Page Controller **/
let posCart = [];

async function initPOSPage() {
  console.log('Initializing POS Controller...');
  try {
    const products = await API.getProducts();
    const productGrid = document.querySelector('.pos-products-grid, .product-list, .grid-view');

    if (productGrid) {
      let gridHtml = '';
      products.forEach(p => {
        gridHtml += `
          <div class="col-sm-6 col-md-4 col-lg-3 mb-3">
            <div class="card product-card h-100 shadow-sm border-0 cursor-pointer add-to-cart-btn" data-product='${JSON.stringify(p).replace(/'/g, "&apos;")}'>
              <div class="card-body text-center p-3">
                <img src="${p.image_url}" alt="${p.name}" class="img-fluid mb-2 rounded" style="height: 100px; object-fit: cover;">
                <h6 class="fs-14 fw-bold text-dark mb-1 text-truncate">${p.name}</h6>
                <div class="d-flex justify-content-between align-items-center mt-2">
                  <span class="fs-15 fw-bold text-success">$${parseFloat(p.price).toFixed(2)}</span>
                  <span class="badge bg-light text-muted">${p.quantity} left</span>
                </div>
              </div>
            </div>
          </div>
        `;
      });
      productGrid.innerHTML = gridHtml;

      // Add to Cart listener
      document.querySelectorAll('.add-to-cart-btn').forEach(card => {
        card.addEventListener('click', () => {
          const product = JSON.parse(card.getAttribute('data-product'));
          addToCart(product);
        });
      });
    }

    // Checkout / Pay button
    const checkoutBtn = document.querySelector('.btn-checkout, .pay-btn, button:contains("Pay"), .btn-primary:contains("Submit")');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', async () => {
        if (posCart.length === 0) {
          API.showToast('Cart is empty. Add products to checkout.', 'danger');
          return;
        }
        try {
          const total = posCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
          const orderData = {
            customer_id: 1,
            items: posCart.map(i => ({
              product_id: i.id,
              product_name: i.name,
              unit_price: i.price,
              quantity: i.qty,
              subtotal: i.price * i.qty
            })),
            total_amount: total,
            payment_method: 'Cash'
          };

          const order = await API.createOrder(orderData);
          API.showToast(`Order ${order.order_number} completed successfully!`);
          posCart = [];
          renderCart();
          initPOSPage(); // refresh stock counts
        } catch (err) {
          API.showToast('Checkout failed: ' + err.message, 'danger');
        }
      });
    }

  } catch (err) {
    console.error('POS Page Init Error:', err);
  }
}

function addToCart(product) {
  const existing = posCart.find(item => item.id === product.id);
  if (existing) {
    if (existing.qty >= product.quantity) {
      API.showToast(`Only ${product.quantity} units available in stock.`, 'danger');
      return;
    }
    existing.qty++;
  } else {
    posCart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
  }
  API.showToast(`Added ${product.name} to cart`);
  renderCart();
}

function renderCart() {
  const cartContainer = document.querySelector('.cart-items, .order-list, .pos-cart-list');
  const subtotalEl = document.querySelector('.cart-subtotal, .subtotal-val');
  const totalEl = document.querySelector('.cart-total, .total-val');

  let total = 0;
  if (cartContainer) {
    let cartHtml = '';
    posCart.forEach((item, index) => {
      const itemSub = item.price * item.qty;
      total += itemSub;
      cartHtml += `
        <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
          <div>
            <h6 class="fs-13 fw-bold mb-0">${item.name}</h6>
            <small class="text-muted">$${item.price.toFixed(2)} x ${item.qty}</small>
          </div>
          <div class="fw-bold text-success">$${itemSub.toFixed(2)}</div>
        </div>
      `;
    });
    cartContainer.innerHTML = cartHtml || '<p class="text-muted text-center py-3">No items in cart</p>';
  }

  if (subtotalEl) subtotalEl.textContent = `$${total.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

/** Dashboard Controller **/
async function initDashboardPage() {
  console.log('Initializing Dashboard Controller...');
  try {
    const stats = await API.getStats();
    const revenueEls = document.querySelectorAll('.total-revenue-val, .total-sales-count');
    revenueEls.forEach(el => el.textContent = `$${parseFloat(stats.total_revenue).toFixed(2)}`);

    const orderEls = document.querySelectorAll('.order-count-val');
    orderEls.forEach(el => el.textContent = stats.order_count);

    const prodEls = document.querySelectorAll('.product-count-val');
    prodEls.forEach(el => el.textContent = stats.product_count);

    const lowStockEls = document.querySelectorAll('.low-stock-count-val');
    lowStockEls.forEach(el => el.textContent = stats.low_stock_count);

  } catch (err) {
    console.error('Failed to load dashboard stats:', err);
  }
}
