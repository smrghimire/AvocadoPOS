/**
 * AvocadoPOS - Front-End API Bridge & Dynamic Controllers
 */

const API = {
  baseUrl: '',

  async request(endpoint, options = {}) {
    try {
      let currentUser = null;
      try { currentUser = JSON.parse(localStorage.getItem('avocado_user') || 'null'); } catch(e){}

      const headers = {
        'Content-Type': 'application/json',
        'x-org-id': currentUser ? currentUser.org_id : 1,
        'x-user-role': currentUser ? currentUser.role : (localStorage.getItem('avocado_role') || 'Super Admin'),
        ...options.headers
      };

      const response = await fetch(this.baseUrl + endpoint, {
        headers,
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
      <div id="${toastId}" class="toast align-items-center ${bgClass} border-0 show mb-2 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body fw-bold fs-14">
            <i class="ti ${type === 'success' ? 'ti-check' : 'ti-alert-circle'} me-2 fs-16"></i> ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHtml);
    setTimeout(() => {
      const el = document.getElementById(toastId);
      if (el) el.remove();
    }, 4500);
  },

  // Products API
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

  // File Upload API
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

  // Categories & Brands API
  async getCategories() { return this.request('/api/categories'); },
  async createCategory(data) {
    return this.request('/api/categories', { method: 'POST', body: JSON.stringify(data) });
  },
  async getBrands() { return this.request('/api/brands'); },
  async createBrand(data) {
    return this.request('/api/brands', { method: 'POST', body: JSON.stringify(data) });
  },

  // Customers & Orders API
  async getCustomers() { return this.request('/api/customers'); },
  async createOrder(data) {
    return this.request('/api/orders', { method: 'POST', body: JSON.stringify(data) });
  },
  async getStats() { return this.request('/api/dashboard/stats'); }
};

// Page Initializer Handlers
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;

  // Always initialize Digital Clock & Launchpad stats if element exists
  if (document.getElementById('os-digital-clock')) {
    initDashboardPage();
  }

  if (currentPath.includes('signin') || currentPath.includes('login')) {
    initLoginPage();
  } else if (currentPath.includes('add-product.html')) {
    initAddProductPage();
  } else if (currentPath.includes('edit-product.html')) {
    initEditProductPage();
  } else if (currentPath.includes('product-details.html')) {
    initProductDetailsPage();
  } else if (currentPath.includes('qrcode.html')) {
    initQRCodePage();
  } else if (currentPath.includes('barcode.html')) {
    initBarcodePage();
  } else if (currentPath.includes('users.html') || currentPath.includes('roles-permissions.html')) {
    initUsersPage();
  } else if (currentPath.includes('products.html') || currentPath.includes('product-list.html')) {
    initProductsListPage();
  } else if (currentPath.includes('pos.html')) {
    initPOSPage();
  } else if (currentPath === '/' || currentPath === '' || currentPath.includes('index.html') || currentPath.includes('admin-dashboard.html')) {
    if (!document.getElementById('os-digital-clock')) {
      initDashboardPage();
    }
  }
});

/** Sign In Login Page Controller **/
function initLoginPage() {
  console.log('Initializing Sign In Login Controller...');

  document.querySelectorAll('.demo-login-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const email = btn.getAttribute('data-email');
      const pass = btn.getAttribute('data-pass');
      const emailInput = document.getElementById('login-email-input') || document.querySelector('input[type="email"], input[type="text"]');
      const passInput = document.getElementById('login-password-input') || document.querySelector('input[type="password"]');
      if (emailInput) emailInput.value = email;
      if (passInput) passInput.value = pass;
    });
  });

  const loginForm = document.querySelector('form') || document.getElementById('login-submit-btn')?.closest('form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = document.getElementById('login-email-input') || document.querySelector('input[type="email"], input[type="text"]');
      const passInput = document.getElementById('login-password-input') || document.querySelector('input[type="password"]');

      if (!emailInput || !emailInput.value.trim() || !passInput || !passInput.value) {
        API.showToast('Please enter your email address and password', 'danger');
        return;
      }

      try {
        const res = await API.request('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: emailInput.value.trim(),
            password: passInput.value
          })
        });

        API.showToast(`Login successful! Welcome ${res.user.name} (${res.user.role})`);

        localStorage.setItem('avocado_user', JSON.stringify(res.user));
        localStorage.setItem('avocado_role', res.user.role);

        setTimeout(() => {
          if (res.user.role === 'Super Admin') {
            window.location.href = 'superadmin-dashboard.html';
          } else {
            window.location.href = 'index.html';
          }
        }, 800);

      } catch (err) {
        API.showToast(err.message || 'Invalid email or password', 'danger');
      }
    });
  }
}

// Global Delegated Click Handler for SKU & Barcode Generation
document.addEventListener('click', (e) => {
  const skuBtn = e.target.closest('#generate-sku-btn, .generate-sku-btn');
  if (skuBtn) {
    e.preventDefault();
    const skuInput = document.querySelector('input[name="sku"], .sku-input, input[placeholder*="SKU"], input[placeholder*="Auto-generated"]');
    if (skuInput) {
      const code = 'AVO-' + Math.floor(1000 + Math.random() * 9000).toString();
      skuInput.value = code;
      skuInput.classList.remove('is-invalid', 'border-danger');
      const feedback = skuInput.parentNode.querySelector('.invalid-feedback-custom');
      if (feedback) feedback.remove();
      API.showToast(`Auto-generated SKU: ${code}`);
    }
    return;
  }

  const barcodeBtn = e.target.closest('#generate-barcode-btn, .generate-barcode-btn');
  if (barcodeBtn) {
    e.preventDefault();
    const barcodeInput = document.querySelector('input[name="barcode"], .barcode-input, input[placeholder*="barcode"], input[placeholder*="Barcode"]');
    if (barcodeInput) {
      const barcode = '890' + Math.floor(100000000 + Math.random() * 900000000).toString();
      barcodeInput.value = barcode;
      barcodeInput.classList.remove('is-invalid', 'border-danger');
      const feedback = barcodeInput.parentNode.querySelector('.invalid-feedback-custom');
      if (feedback) feedback.remove();
      API.showToast(`Auto-generated Item Barcode: ${barcode}`);
    }
    return;
  }
});

// Setup SKU Generator Button Handler
function setupSKUGenerator() {}

// Setup Barcode Generator Button Handler
function setupBarcodeGenerator() {}

// Setup Dynamic Subcategory Dropdown Handler
function setupSubcategoryDropdown() {
  const catSelects = document.querySelectorAll('select[name="category_id"], .category-select');
  catSelects.forEach(catSelect => {
    catSelect.addEventListener('change', () => {
      const subCatSelects = document.querySelectorAll('select.form-select');
      const subCatSelect = subCatSelects.length > 1 ? subCatSelects[1] : null;
      if (!subCatSelect) return;

      const subcatMap = {
        '1': ['Fresh Produce', 'Organic Fruits', 'Vegetables', 'Leafy Greens'],
        '2': ['Dairy & Eggs', 'Snacks & Chips', 'Oils & Condiments', 'Beverages'],
        '3': ['Laptops & Computers', 'Accessories', 'Audio & Video', 'Smartphones']
      };

      const selectedCat = catSelect.value;
      const options = subcatMap[selectedCat] || ['General', 'Standard', 'Premium', 'Wholesale'];
      
      subCatSelect.innerHTML = '<option value="">Select Sub Category</option>';
      options.forEach(sub => {
        subCatSelect.insertAdjacentHTML('beforeend', `<option value="${sub}">${sub}</option>`);
      });
    });
  });
}

// Visual Red Field Validation
function validateProductForm() {
  let isValid = true;

  document.querySelectorAll('.is-invalid, .border-danger').forEach(el => {
    el.classList.remove('is-invalid', 'border-danger');
  });
  document.querySelectorAll('.invalid-feedback-custom').forEach(el => {
    el.remove();
  });

  const addFieldError = (el, msg) => {
    if (!el) return;
    isValid = false;
    el.classList.add('is-invalid', 'border-danger');
    const errDiv = document.createElement('div');
    errDiv.className = 'invalid-feedback-custom text-danger fw-semibold fs-12 mt-1';
    errDiv.innerHTML = `<i class="ti ti-alert-circle me-1"></i> ${msg}`;
    if (el.parentNode) {
      el.parentNode.appendChild(errDiv);
    }
  };

  const nameInput = document.querySelector('input[name="name"], input[placeholder*="Product Name"], .product-name-input');
  const skuInput = document.querySelector('input[name="sku"], input[placeholder*="SKU"], .sku-input');
  const catInput = document.querySelector('select[name="category_id"], .category-select');
  const brandInput = document.querySelector('select[name="brand_id"], .brand-select');
  const priceInput = document.querySelector('input[name="price"], input[placeholder*="Price"], .price-input');
  const qtyInput = document.querySelector('input[name="quantity"], input[placeholder*="Quantity"], .qty-input');

  if (!nameInput || !nameInput.value.trim()) {
    addFieldError(nameInput, 'Product Name is required *');
  }

  if (skuInput && !skuInput.value.trim()) {
    skuInput.value = 'AVO-' + Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase();
  }

  if (!catInput || !catInput.value) {
    addFieldError(catInput, 'Please select a Category *');
  }

  if (!brandInput || !brandInput.value) {
    addFieldError(brandInput, 'Please select a Brand *');
  }

  if (!priceInput || !priceInput.value.trim() || isNaN(parseFloat(priceInput.value)) || parseFloat(priceInput.value) <= 0) {
    addFieldError(priceInput, 'Please enter a valid Price greater than 0 *');
  }

  if (!qtyInput || !qtyInput.value.trim() || isNaN(parseInt(qtyInput.value)) || parseInt(qtyInput.value) < 0) {
    addFieldError(qtyInput, 'Please enter a valid Quantity (0 or more) *');
  }

  if (!isValid) {
    API.showToast('Missing required fields! Please fill in all red highlighted fields.', 'danger');
  }

  return isValid;
}

/** Add Product Page Controller **/
async function initAddProductPage() {
  console.log('Initializing Add Product Form Controller...');

  setupSKUGenerator();
  setupBarcodeGenerator();
  setupSubcategoryDropdown();

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

  const saveButtons = Array.from(document.querySelectorAll('a, button')).filter(el => {
    const text = el.textContent.trim().toLowerCase();
    return text === 'save product' || text === 'submit' || text === 'save';
  });

  saveButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();

      if (!validateProductForm()) {
        return;
      }

      btn.classList.add('disabled');
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

      try {
        const nameInput = document.querySelector('input[name="name"], input[placeholder*="Product Name"], .product-name-input');
        const skuInput = document.querySelector('input[name="sku"], input[placeholder*="SKU"], .sku-input');
        const priceInput = document.querySelector('input[name="price"], input[placeholder*="Price"], .price-input');
        const costInput = document.querySelector('input[name="cost_price"], input[placeholder*="Cost"], .cost-input');
        const qtyInput = document.querySelector('input[name="quantity"], input[placeholder*="Quantity"], .qty-input');
        const minQtyInput = document.querySelector('input[name="min_quantity"], input[placeholder*="Min"], .min-qty-input');
        const catInput = document.querySelector('select[name="category_id"], .category-select');
        const brandInput = document.querySelector('select[name="brand_id"], .brand-select');
        const descInput = document.querySelector('textarea[name="description"], textarea, .description-input');
        const imageFileInput = document.querySelector('input[type="file"]');

        let imageUrl = 'assets/img/products/product1.jpg';
        if (imageFileInput && imageFileInput.files && imageFileInput.files[0]) {
          try {
            imageUrl = await API.uploadImage(imageFileInput.files[0]);
          } catch (uploadErr) {
            console.warn('Image upload failed, using default image', uploadErr);
          }
        }

        const productData = {
          name: nameInput.value.trim(),
          sku: skuInput.value.trim(),
          category_id: parseInt(catInput.value),
          brand_id: parseInt(brandInput.value),
          price: parseFloat(priceInput.value),
          cost_price: costInput && parseFloat(costInput.value) ? parseFloat(costInput.value) : (parseFloat(priceInput.value) * 0.5),
          quantity: parseInt(qtyInput.value),
          min_quantity: minQtyInput && parseInt(minQtyInput.value) ? parseInt(minQtyInput.value) : 5,
          unit: 'pc',
          description: descInput ? descInput.value.trim() : '',
          image_url: imageUrl
        };

        await API.createProduct(productData);
        API.showToast('Product added successfully!');

        setTimeout(() => {
          window.location.href = 'products.html';
        }, 1000);

      } catch (err) {
        API.showToast(err.message || 'Failed to save product', 'danger');
        btn.classList.remove('disabled');
        btn.textContent = 'Save Product';
      }
    });
  });
}

/** Edit Product Page Controller **/
async function initEditProductPage() {
  console.log('Initializing Edit Product Controller...');

  setupSKUGenerator();
  setupBarcodeGenerator();
  setupSubcategoryDropdown();

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    API.showToast('No product ID specified', 'danger');
    setTimeout(() => { window.location.href = 'products.html'; }, 1500);
    return;
  }

  try {
    const categories = await API.getCategories();
    const catSelect = document.querySelector('select[name="category_id"], .category-select');
    if (catSelect) {
      catSelect.innerHTML = '<option value="">Select Category</option>';
      categories.forEach(c => {
        catSelect.insertAdjacentHTML('beforeend', `<option value="${c.id}">${c.name}</option>`);
      });
    }

    const brands = await API.getBrands();
    const brandSelect = document.querySelector('select[name="brand_id"], .brand-select');
    if (brandSelect) {
      brandSelect.innerHTML = '<option value="">Select Brand</option>';
      brands.forEach(b => {
        brandSelect.insertAdjacentHTML('beforeend', `<option value="${b.id}">${b.name}</option>`);
      });
    }

    const product = await API.getProduct(productId);

    const nameInput = document.querySelector('input[name="name"], input[placeholder*="Product Name"], .product-name-input');
    const skuInput = document.querySelector('input[name="sku"], input[placeholder*="SKU"], .sku-input');
    const priceInput = document.querySelector('input[name="price"], input[placeholder*="Price"], .price-input');
    const costInput = document.querySelector('input[name="cost_price"], input[placeholder*="Cost"], .cost-input');
    const qtyInput = document.querySelector('input[name="quantity"], input[placeholder*="Quantity"], .qty-input');
    const minQtyInput = document.querySelector('input[name="min_quantity"], input[placeholder*="Min"], .min-qty-input');
    const descInput = document.querySelector('textarea[name="description"], textarea, .description-input');

    if (nameInput) nameInput.value = product.name || '';
    if (skuInput) skuInput.value = product.sku || '';
    if (priceInput) priceInput.value = product.price || '';
    if (costInput) costInput.value = product.cost_price || '';
    if (qtyInput) qtyInput.value = product.quantity || '';
    if (minQtyInput) minQtyInput.value = product.min_quantity || '';
    if (descInput) descInput.value = product.description || '';
    if (catSelect && product.category_id) catSelect.value = product.category_id;
    if (brandSelect && product.brand_id) brandSelect.value = product.brand_id;

    const saveButtons = Array.from(document.querySelectorAll('a, button')).filter(el => {
      const text = el.textContent.trim().toLowerCase();
      return text === 'save product' || text === 'submit' || text === 'save' || text === 'save changes' || text === 'update';
    });

    saveButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();

        if (!validateProductForm()) {
          return;
        }

        btn.classList.add('disabled');
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';

        try {
          const imageFileInput = document.querySelector('input[type="file"]');
          let imageUrl = product.image_url;
          if (imageFileInput && imageFileInput.files && imageFileInput.files[0]) {
            try {
              imageUrl = await API.uploadImage(imageFileInput.files[0]);
            } catch (uploadErr) {
              console.warn('Image upload failed during edit', uploadErr);
            }
          }

          const updatedData = {
            name: nameInput.value.trim(),
            sku: skuInput.value.trim(),
            category_id: parseInt(catSelect.value),
            brand_id: parseInt(brandSelect.value),
            price: parseFloat(priceInput.value),
            cost_price: costInput && parseFloat(costInput.value) ? parseFloat(costInput.value) : product.cost_price,
            quantity: parseInt(qtyInput.value),
            min_quantity: minQtyInput && parseInt(minQtyInput.value) ? parseInt(minQtyInput.value) : product.min_quantity,
            description: descInput ? descInput.value.trim() : product.description,
            image_url: imageUrl
          };

          await API.updateProduct(productId, updatedData);
          API.showToast('Product updated successfully!');

          setTimeout(() => {
            window.location.href = 'products.html';
          }, 1000);

        } catch (err) {
          API.showToast(err.message || 'Failed to update product', 'danger');
          btn.classList.remove('disabled');
          btn.textContent = 'Save Product';
        }
      });
    });

  } catch (err) {
    console.error('Failed to load product for editing:', err);
    API.showToast('Failed to load product details', 'danger');
  }
}

/** Users & Roles Controller **/
async function initUsersPage() {
  console.log('Initializing Users & Roles Controller...');
  try {
    const users = await API.request('/api/users');
    const tableBody = document.querySelector('.table tbody, datatable tbody');
    if (!tableBody) return;

    let html = '';
    users.forEach(u => {
      const roleBadge = u.role === 'Super Admin'
        ? '<span class="badge bg-danger-transparent text-danger fw-bold"><i class="ti ti-crown me-1"></i> Super Admin</span>'
        : u.role === 'Admin'
        ? '<span class="badge bg-primary-transparent text-primary fw-bold">Admin</span>'
        : u.role === 'Manager'
        ? '<span class="badge bg-success-transparent text-success fw-bold">Manager</span>'
        : '<span class="badge bg-secondary-transparent text-secondary fw-bold">Staff</span>';

      html += `
        <tr data-user-id="${u.id}">
          <td>
            <div class="d-flex align-items-center">
              <span class="avatar avatar-md me-2 bg-success-transparent text-success rounded-circle fw-bold d-flex align-items-center justify-content-center" style="width:36px; height:36px;">
                ${u.name ? u.name.charAt(0).toUpperCase() : 'U'}
              </span>
              <div>
                <h6 class="fw-bold mb-0">${u.name}</h6>
                <small class="text-muted">${u.org_name || 'Avocado POS'}</small>
              </div>
            </div>
          </td>
          <td>${u.phone || '+1 555-0199'}</td>
          <td><code>${u.email}</code></td>
          <td>${roleBadge}</td>
          <td><span class="badge bg-success">Active</span></td>
          <td class="text-center">
            <button type="button" class="btn btn-sm text-danger delete-user-btn" data-id="${u.id}" title="Delete User">
              <i class="ti ti-trash fs-16"></i>
            </button>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;

    document.querySelectorAll('.delete-user-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const userId = btn.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this user?')) {
          try {
            await API.request(`/api/users/${userId}`, { method: 'DELETE' });
            API.showToast('User deleted successfully!');
            btn.closest('tr').remove();
          } catch (err) {
            API.showToast('Failed to delete user', 'danger');
          }
        }
      });
    });

  } catch (err) {
    console.error('Failed to load users list:', err);
  }
}

/** QR Code Print Controller **/
async function initQRCodePage() {
  try {
    const products = await API.getProducts();
    const tableBody = document.querySelector('.qrcode-table table tbody, table tbody');
    const searchInput = document.querySelector('.search-form input[placeholder*="Search"]');

    function renderTable(items) {
      if (!tableBody) return;
      if (items.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No products found matching search.</td></tr>';
        return;
      }
      let html = '';
      items.forEach(p => {
        html += `
          <tr data-product-id="${p.id}">
            <td>
              <div class="d-flex align-items-center">
                <a href="javascript:void(0);" class="avatar avatar-md me-2">
                  <img src="${p.image_url}" alt="${p.name}" style="width:40px; height:40px; object-fit:cover; border-radius:6px;">
                </a>
                <span class="fw-bold">${p.name}</span>
              </div>
            </td>
            <td>${p.sku || 'N/A'}</td>
            <td><code>${p.sku || 'AVO-00' + p.id}</code></td>
            <td>REF-${1000 + p.id}</td>
            <td><input type="number" class="form-control form-control-sm w-75" value="${p.quantity || 1}" min="1"></td>
            <td class="text-center">
              <button type="button" class="btn btn-sm btn-outline-success print-trigger-btn">
                <i class="ti ti-qrcode me-1"></i> Print QR Code
              </button>
            </td>
          </tr>
        `;
      });
      tableBody.innerHTML = html;

      document.querySelectorAll('.print-trigger-btn').forEach(btn => {
        btn.addEventListener('click', () => { window.print(); });
      });
    }

    renderTable(products);

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        const filtered = products.filter(p => 
          (p.name && p.name.toLowerCase().includes(term)) || 
          (p.sku && p.sku.toLowerCase().includes(term))
        );
        renderTable(filtered);
      });
    }

  } catch (err) {
    console.error('Failed to initialize QR code page:', err);
  }
}

/** Barcode Print Controller **/
async function initBarcodePage() {
  try {
    const products = await API.getProducts();
    const tableBody = document.querySelector('.barcode-content-list table tbody, table tbody');
    const searchInput = document.querySelector('.search-form input[placeholder*="Search"]');

    function renderTable(items) {
      if (!tableBody) return;
      if (items.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No products found matching search.</td></tr>';
        return;
      }
      let html = '';
      items.forEach(p => {
        html += `
          <tr data-product-id="${p.id}">
            <td>
              <div class="d-flex align-items-center">
                <a href="javascript:void(0);" class="avatar avatar-md me-2">
                  <img src="${p.image_url}" alt="${p.name}" style="width:40px; height:40px; object-fit:cover; border-radius:6px;">
                </a>
                <span class="fw-bold">${p.name}</span>
              </div>
            </td>
            <td>${p.sku || 'N/A'}</td>
            <td><code>8901234567${p.id}</code></td>
            <td><input type="number" class="form-control form-control-sm w-75" value="${p.quantity || 1}" min="1"></td>
            <td class="text-center">
              <button type="button" class="btn btn-sm btn-outline-primary print-trigger-btn">
                <i class="ti ti-barcode me-1"></i> Print Barcode
              </button>
            </td>
          </tr>
        `;
      });
      tableBody.innerHTML = html;

      document.querySelectorAll('.print-trigger-btn').forEach(btn => {
        btn.addEventListener('click', () => { window.print(); });
      });
    }

    renderTable(products);

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        const filtered = products.filter(p => 
          (p.name && p.name.toLowerCase().includes(term)) || 
          (p.sku && p.sku.toLowerCase().includes(term))
        );
        renderTable(filtered);
      });
    }

  } catch (err) {
    console.error('Failed to initialize Barcode page:', err);
  }
}

/** Product Details Page Controller **/
async function initProductDetailsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id') || 1;

  try {
    const product = await API.getProduct(productId);

    document.querySelectorAll('.productdetails ul.product-bar li').forEach(li => {
      const h4 = li.querySelector('h4');
      const h6 = li.querySelector('h6');
      if (!h4 || !h6) return;
      const label = h4.textContent.trim().toLowerCase();

      if (label === 'product') h6.textContent = product.name;
      else if (label === 'category') h6.textContent = product.category_name || 'General';
      else if (label === 'brand') h6.textContent = product.brand_name || 'AvocadoPOS';
      else if (label === 'sku') h6.textContent = product.sku || 'N/A';
      else if (label === 'price') h6.textContent = `$${parseFloat(product.price).toFixed(2)}`;
      else if (label === 'quantity') h6.textContent = product.quantity;
      else if (label === 'minimum qty') h6.textContent = product.min_quantity;
      else if (label === 'description') h6.textContent = product.description || 'No description provided.';
    });

    document.querySelectorAll('.slider-product img, .product-details-img').forEach(img => {
      img.src = product.image_url;
      img.alt = product.name;
    });

  } catch (err) {
    console.error('Failed to load product details:', err);
  }
}

/** Products List Page Controller **/
async function initProductsListPage() {
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
              <a href="product-details.html?id=${p.id}" class="product-img me-2">
                <img src="${p.image_url}" alt="product" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px;">
              </a>
              <div>
                <h6 class="fw-bold mb-0"><a href="product-details.html?id=${p.id}">${p.name}</a></h6>
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
              <a href="product-details.html?id=${p.id}" class="me-2 p-2 text-info" title="View Details"><i class="ti ti-eye fs-18"></i></a>
              <a href="edit-product.html?id=${p.id}" class="me-2 p-2 text-primary" title="Edit"><i class="ti ti-edit fs-18"></i></a>
              <a href="javascript:void(0);" class="delete-btn p-2 text-danger" data-id="${p.id}" title="Delete"><i class="ti ti-trash fs-18"></i></a>
            </div>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = rowsHtml;

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

      document.querySelectorAll('.add-to-cart-btn').forEach(card => {
        card.addEventListener('click', () => {
          const product = JSON.parse(card.getAttribute('data-product'));
          addToCart(product);
        });
      });
    }

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
          initPOSPage();
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

/** Dashboard & OS Launchpad Controller **/
async function initDashboardPage() {
  console.log('Initializing OS Launchpad Dashboard Controller...');

  // Clock
  function updateClock() {
    const clockEl = document.getElementById('os-digital-clock');
    if (!clockEl) return;
    const now = new Date();
    clockEl.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' ' + now.toLocaleTimeString();
  }
  updateClock();
  setInterval(updateClock, 1000);

  // Role Scope & Permissions Controller
  function applyRoleScope(role, userName, orgName) {
    const statusBadge = document.getElementById('current-role-badge');
    const noticeEl = document.getElementById('role-scope-notice');
    const userTitle = document.getElementById('current-user-name');
    const heroTitle = document.getElementById('hero-welcome-title');
    const heroDesc = document.getElementById('hero-welcome-desc');
    const heroAddBtn = document.getElementById('hero-add-product-btn');
    const superBtn = document.getElementById('superadmin-top-btn');
    const orgSwitcherWrapper = document.getElementById('superadmin-org-switcher-wrapper');

    if (userTitle && userName) userTitle.textContent = userName;

    if (role === 'Super Admin') {
      if (statusBadge) statusBadge.innerHTML = '<span class="os-status-dot bg-danger"></span> 👑 Platform Super Admin';
      if (noticeEl) noticeEl.textContent = 'Showing all platform governance & tenant modules for Super Admin';
      if (userTitle) userTitle.textContent = userName || 'System Super Admin';
      if (heroTitle) heroTitle.textContent = 'Super Admin Control Panel 👑';
      if (heroDesc) heroDesc.textContent = 'Platform level access to all organizations, users, and module controls.';
      if (superBtn) superBtn.classList.remove('d-none');
      if (orgSwitcherWrapper) {
        orgSwitcherWrapper.classList.remove('d-none');
        orgSwitcherWrapper.classList.add('d-flex');
      }
    } else {
      if (superBtn) superBtn.classList.add('d-none');
      if (orgSwitcherWrapper) {
        orgSwitcherWrapper.classList.remove('d-flex');
        orgSwitcherWrapper.classList.add('d-none');
      }

      if (role === 'Admin') {
        if (statusBadge) statusBadge.innerHTML = `<span class="os-status-dot bg-success"></span> 🛡️ Org Admin (${orgName || 'Tenant Org'})`;
        if (noticeEl) noticeEl.textContent = `Showing all 12 management modules for ${orgName || 'Tenant Org'}`;
        if (heroTitle) heroTitle.textContent = `Welcome to ${orgName || 'Avocado Inventory'} 👋`;
        if (heroDesc) heroDesc.textContent = 'Enterprise Inventory Management & Stock Control System.';
      } else if (role === 'Manager') {
        if (statusBadge) statusBadge.innerHTML = `<span class="os-status-dot bg-info"></span> 👔 Inventory Manager (${orgName || 'Tenant Org'})`;
        if (noticeEl) noticeEl.textContent = `Showing 9 operational modules for ${orgName || 'Tenant Org'} (User Mgmt & Settings Hidden)`;
        if (heroTitle) heroTitle.textContent = 'Inventory Operations Workspace 👔';
        if (heroDesc) heroDesc.textContent = 'Operational stock adjustments, catalog management, and supplier procurement.';
      } else if (role === 'Staff') {
        if (statusBadge) statusBadge.innerHTML = `<span class="os-status-dot bg-secondary"></span> 📦 Stock Staff (${orgName || 'Tenant Org'})`;
        if (noticeEl) noticeEl.textContent = `Showing 4 task modules for ${orgName || 'Tenant Org'}`;
        if (heroTitle) heroTitle.textContent = 'Stock Staff Task Portal 📦';
        if (heroDesc) heroDesc.textContent = 'Quick access to stock counts, barcode generators, and inventory lookups.';
      }
    }

    // Calculate Multi-Tier Effective User Modules
    let effectiveModules = [];
    if (role === 'Super Admin') {
      effectiveModules = ['*'];
    } else {
      let orgModules = [];
      try {
        orgModules = typeof (user && user.enabled_modules) === 'string' 
          ? JSON.parse(user.enabled_modules) 
          : ((user && user.enabled_modules) || ["products","add_product","categories","brands","stocks","alerts","warehouses","suppliers","barcodes","reports","admin_panel","settings"]);
      } catch(e){}

      if (role === 'Admin') {
        effectiveModules = orgModules;
      } else {
        let userPerms = [];
        try {
          userPerms = typeof (user && user.permissions) === 'string' 
            ? JSON.parse(user.permissions) 
            : ((user && user.permissions) || []);
        } catch(e){}
        // Intersection of org enabled modules and user delegated permissions
        effectiveModules = userPerms.filter(m => orgModules.includes(m));
      }
    }

    // Filter App Tiles on Launchpad
    document.querySelectorAll('.os-app-tile').forEach(tile => {
      const modKey = tile.getAttribute('data-module-key');
      const scope = tile.getAttribute('data-role-scope');
      const isSuperOnly = tile.classList.contains('role-superadmin-only');

      if (role === 'Super Admin') {
        tile.classList.remove('d-none');
        tile.style.display = 'flex';
      } else if (isSuperOnly || scope === 'superadmin') {
        tile.classList.add('d-none');
        tile.style.setProperty('display', 'none', 'important');
      } else if (effectiveModules.includes('*') || (modKey && effectiveModules.includes(modKey))) {
        tile.classList.remove('d-none');
        tile.style.display = 'flex';
      } else {
        tile.classList.add('d-none');
        tile.style.setProperty('display', 'none', 'important');
      }
    });

    if (heroAddBtn) {
      if (!effectiveModules.includes('*') && !effectiveModules.includes('add_product')) heroAddBtn.style.display = 'none';
      else heroAddBtn.style.display = 'inline-flex';
    }
  }

  // Retrieve real logged in user session or default
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('avocado_user') || 'null');
  } catch(e){}

  const role = user ? user.role : (localStorage.getItem('avocado_role') || 'Super Admin');
  const userName = user ? user.name : 'System Super Admin';
  const orgName = user ? (user.org_name || 'Avocado Global') : 'Platform Global';

  applyRoleScope(role, userName, orgName);

  // Super Admin Organization Context Switcher Handler
  const orgSelect = document.getElementById('superadmin-org-select');
  if (orgSelect && role === 'Super Admin') {
    const savedOrg = localStorage.getItem('avocado_selected_org_id') || 'all';
    orgSelect.value = savedOrg;

    orgSelect.addEventListener('change', async (e) => {
      const selectedVal = e.target.value;
      localStorage.setItem('avocado_selected_org_id', selectedVal);
      
      // Update session user org_id for fetch requests
      if (user) {
        user.org_id = selectedVal === 'all' ? null : parseInt(selectedVal);
        localStorage.setItem('avocado_user', JSON.stringify(user));
      }

      API.showToast(`Switched view context to ${orgSelect.options[orgSelect.selectedIndex].text}`);
      
      // Reload stats for selected organization context
      try {
        const stats = await API.getStats();
        const revenueEls = document.querySelectorAll('.total-revenue-val');
        revenueEls.forEach(el => el.textContent = `$${parseFloat(stats.total_revenue).toFixed(2)}`);

        const orderEls = document.querySelectorAll('.order-count-val');
        orderEls.forEach(el => el.textContent = stats.order_count);

        const prodEls = document.querySelectorAll('.product-count-val');
        prodEls.forEach(el => el.textContent = stats.product_count);

        const lowStockEls = document.querySelectorAll('.low-stock-count-val');
        lowStockEls.forEach(el => el.textContent = stats.low_stock_count);
      } catch (err) {
        console.error('Failed to update stats on org switch:', err);
      }
    });
  }

  // Spotlight Search Filter
  const spotlightInput = document.getElementById('os-spotlight-input');
  if (spotlightInput) {
    spotlightInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      const tiles = document.querySelectorAll('.os-app-tile:not(.d-none)');
      tiles.forEach(tile => {
        const keywords = tile.getAttribute('data-app-name') || '';
        const title = tile.querySelector('.os-app-title')?.textContent || '';
        if (keywords.toLowerCase().includes(term) || title.toLowerCase().includes(term)) {
          tile.style.display = 'flex';
        } else {
          tile.style.display = 'none';
        }
      });
    });
  }

  try {
    const stats = await API.getStats();
    const revenueEls = document.querySelectorAll('.total-revenue-val');
    revenueEls.forEach(el => el.textContent = `$${parseFloat(stats.total_revenue).toFixed(2)}`);

    const orderEls = document.querySelectorAll('.order-count-val');
    orderEls.forEach(el => el.textContent = stats.order_count);

    const prodEls = document.querySelectorAll('.product-count-val');
    prodEls.forEach(el => el.textContent = stats.product_count);

    const lowStockEls = document.querySelectorAll('.low-stock-count-val');
    lowStockEls.forEach(el => el.textContent = stats.low_stock_count);

// Universal Header Store Dropdown Controller (Strict Super Admin Isolation)
function setupHeaderStoreDropdown() {
  const storeDropdowns = document.querySelectorAll('.select-store-dropdown');
  if (!storeDropdowns.length) return;

  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem('avocado_user') || 'null');
  } catch (e) {}

  const role = currentUser ? currentUser.role : (localStorage.getItem('avocado_role') || 'Super Admin');
  const orgName = currentUser ? (currentUser.org_name || 'Avocado Global') : 'Platform Global';

  storeDropdowns.forEach(dropdown => {
    if (role !== 'Super Admin') {
      // STRICT ISOLATION: Hide store dropdown completely for non-Super Admin users (Org Admin, Manager, Staff)
      dropdown.style.setProperty('display', 'none', 'important');
      dropdown.classList.add('d-none');

      // Replace with static organization badge if user-info container exists nearby
      const parentNav = dropdown.parentElement;
      if (parentNav && !parentNav.querySelector('.org-static-badge')) {
        const badge = document.createElement('li');
        badge.className = 'nav-item d-none d-md-flex align-items-center me-3 org-static-badge';
        badge.innerHTML = `<span class="badge bg-success bg-opacity-25 text-success px-3 py-2 rounded-pill fs-12 border border-success-subtle"><i class="ti ti-building me-1"></i> ${orgName}</span>`;
        parentNav.insertBefore(badge, dropdown);
      }
    } else {
      // SUPER ADMIN ONLY: Unhide and populate real organization context switcher
      dropdown.style.setProperty('display', 'block', 'important');
      dropdown.classList.remove('d-none');

      const nameEl = dropdown.querySelector('.user-name');
      const savedOrgName = localStorage.getItem('avocado_selected_org_name') || 'Global View (All Orgs)';
      if (nameEl) {
        nameEl.textContent = savedOrgName;
      }

      const menu = dropdown.querySelector('.dropdown-menu');
      if (menu) {
        menu.innerHTML = `
          <a href="javascript:void(0);" class="dropdown-item org-select-item" data-org-id="all" data-org-name="Global View (All Orgs)">
            <img src="assets/img/store/store-01.png" alt="Store Logo" class="img-fluid"> 🌐 All Organizations (Global View)
          </a>
          <a href="javascript:void(0);" class="dropdown-item org-select-item" data-org-id="1" data-org-name="Avocado Global Enterprise">
            <img src="assets/img/store/store-01.png" alt="Store Logo" class="img-fluid"> 🏢 Avocado Global Enterprise
          </a>
          <a href="javascript:void(0);" class="dropdown-item org-select-item" data-org-id="2" data-org-name="FreshMart Retail Group">
            <img src="assets/img/store/store-02.png" alt="Store Logo" class="img-fluid"> 🏬 FreshMart Retail Group
          </a>
          <a href="javascript:void(0);" class="dropdown-item org-select-item" data-org-id="3" data-org-name="GreenGrocery Supply Co">
            <img src="assets/img/store/store-03.png" alt="Store Logo" class="img-fluid"> 🍏 GreenGrocery Supply Co
          </a>
        `;

        menu.querySelectorAll('.org-select-item').forEach(item => {
          item.addEventListener('click', (e) => {
            e.preventDefault();
            const orgId = item.getAttribute('data-org-id');
            const targetOrgName = item.getAttribute('data-org-name');

            localStorage.setItem('avocado_selected_org_id', orgId);
            localStorage.setItem('avocado_selected_org_name', targetOrgName);

            if (currentUser) {
              currentUser.org_id = orgId === 'all' ? null : parseInt(orgId);
              localStorage.setItem('avocado_user', JSON.stringify(currentUser));
            }

            API.showToast(`Switched view context to ${targetOrgName}`);
            setTimeout(() => {
              window.location.reload();
            }, 500);
          });
        });
      }
    }
  });
}

/** User Management Controller for Org Admins & Super Admins **/
async function initUserManagementPage() {
  const userTableBody = document.querySelector('table tbody, .table-responsive tbody, #users-table-body');
  if (!userTableBody) return;

  console.log('Initializing User Management Controller...');

  let currentUser = null;
  try { currentUser = JSON.parse(localStorage.getItem('avocado_user') || 'null'); } catch(e){}
  const role = currentUser ? currentUser.role : (localStorage.getItem('avocado_role') || 'Admin');

  // Parse org allowed modules (Set by Super Admin)
  let orgModules = [];
  try {
    orgModules = typeof (currentUser && currentUser.enabled_modules) === 'string' 
      ? JSON.parse(currentUser.enabled_modules) 
      : ((currentUser && currentUser.enabled_modules) || ["products","add_product","categories","brands","stocks","alerts","warehouses","suppliers","barcodes","reports","admin_panel","settings"]);
  } catch(e){}

  async function loadUsers() {
    try {
      const users = await API.request('/api/users');
      let html = '';

      users.forEach(u => {
        let permList = [];
        try { permList = typeof u.permissions === 'string' ? JSON.parse(u.permissions) : (u.permissions || []); } catch(e){}
        const badgeColor = u.role === 'Super Admin' ? 'bg-danger' : (u.role === 'Admin' ? 'bg-success' : (u.role === 'Manager' ? 'bg-info' : 'bg-secondary'));
        
        html += `
          <tr>
            <td>
              <div class="d-flex align-items-center">
                <div class="avatar avatar-md me-2">
                  <img src="assets/img/users/user-01.jpg" alt="User" class="rounded-circle border border-2 border-success" style="width: 38px; height: 38px; object-fit: cover;">
                </div>
                <div>
                  <h6 class="fw-bold mb-0">${u.name}</h6>
                  <small class="text-white-50">${u.email}</small>
                </div>
              </div>
            </td>
            <td><span class="badge ${badgeColor} px-3 py-1 fs-12">${u.role}</span></td>
            <td><span class="badge bg-dark border border-white-20 text-white px-2 py-1 fs-12">${u.org_name || 'Tenant Org'}</span></td>
            <td>${u.phone || 'N/A'}</td>
            <td>
              <div class="d-flex flex-wrap gap-1" style="max-width: 250px;">
                ${permList.includes('*') ? '<span class="badge bg-danger fs-11">Full Access</span>' : permList.map(p => `<span class="badge bg-dark border border-success-subtle text-success fs-11">${p}</span>`).join('')}
              </div>
            </td>
            <td><span class="badge bg-success-transparent text-success">${u.status || 'Active'}</span></td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-danger delete-user-btn" data-id="${u.id}">
                <i class="ti ti-trash"></i> Delete
              </button>
            </td>
          </tr>
        `;
      });

      userTableBody.innerHTML = html || '<tr><td colspan="7" class="text-center py-4 text-white-50">No team members found</td></tr>';

      // Attach Delete Handlers
      userTableBody.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('Are you sure you want to remove this employee account?')) {
            await API.request(`/api/users/${btn.getAttribute('data-id')}`, { method: 'DELETE' });
            API.showToast('User account deleted successfully');
            loadUsers();
          }
        });
      });

    } catch (err) {
      console.error('Failed to load users:', err);
    }
  }

  await loadUsers();
}

/** Products Catalog List Controller & Real-Time Filter Engine **/
async function initProductsListPage() {
  console.log('Initializing Products Catalog Controller & Realtime Filters...');

  const tableBody = document.querySelector('table.datatable tbody, table tbody');
  if (!tableBody) return;

  try {
    const products = await API.getProducts();
    let currentSearch = '';
    let currentCategory = '';
    let currentBrand = '';
    let currentSort = 'recent';

    function renderProducts(items) {
      if (!items || items.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="10" class="text-center py-4 text-muted"><i class="ti ti-box-off fs-24 d-block mb-1 text-danger"></i>No products found matching active filters</td></tr>';
        return;
      }

      let html = '';
      items.forEach(p => {
        html += `
          <tr data-product-id="${p.id}">
            <td>
              <label class="checkboxs">
                <input type="checkbox" value="${p.id}">
                <span class="checkmarks"></span>
              </label>
            </td>
            <td><code class="text-success fw-bold">${p.sku || 'N/A'}</code></td>
            <td>
              <div class="d-flex align-items-center">
                <a href="product-details.html?id=${p.id}" class="avatar avatar-md me-2">
                  <img src="${p.image_url}" alt="${p.name}" style="width:40px; height:40px; object-fit:cover; border-radius:6px;">
                </a>
                <a href="product-details.html?id=${p.id}" class="fw-bold text-dark text-decoration-none">${p.name}</a>
              </div>
            </td>
            <td><span class="badge bg-light text-dark border">${p.category_name || 'General'}</span></td>
            <td><span class="badge bg-light text-primary border">${p.brand_name || 'Standard'}</span></td>
            <td class="fw-bold text-success">$${parseFloat(p.price).toFixed(2)}</td>
            <td>${p.unit || 'pc'}</td>
            <td><span class="badge ${p.quantity <= p.min_quantity ? 'bg-danger' : 'bg-success'} fs-12">${p.quantity}</span></td>
            <td><span class="fs-12 text-muted">System</span></td>
            <td class="action-table-data">
              <div class="edit-delete-action d-flex gap-2">
                <a class="me-2 edit-icon p-2" href="product-details.html?id=${p.id}" title="View Details">
                  <i class="ti ti-eye"></i>
                </a>
                <a class="me-2 p-2" href="edit-product.html?id=${p.id}" title="Edit Product">
                  <i class="ti ti-edit"></i>
                </a>
                <button type="button" class="btn btn-sm text-danger p-2 border-0 bg-transparent delete-prod-btn" data-id="${p.id}" title="Delete Product">
                  <i class="ti ti-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      });

      tableBody.innerHTML = html;

      tableBody.querySelectorAll('.delete-prod-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          const pId = btn.getAttribute('data-id');
          if (confirm('Are you sure you want to delete this product?')) {
            try {
              await API.deleteProduct(pId);
              API.showToast('Product deleted successfully');
              initProductsListPage();
            } catch (err) {
              API.showToast('Failed to delete product', 'danger');
            }
          }
        });
      });
    }

    function applyFilters() {
      let filtered = [...products];

      if (currentSearch) {
        filtered = filtered.filter(p => 
          (p.name && p.name.toLowerCase().includes(currentSearch)) || 
          (p.sku && p.sku.toLowerCase().includes(currentSearch)) ||
          (p.category_name && p.category_name.toLowerCase().includes(currentSearch)) ||
          (p.brand_name && p.brand_name.toLowerCase().includes(currentSearch))
        );
      }

      if (currentCategory && currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category_name && p.category_name.toLowerCase() === currentCategory.toLowerCase());
      }

      if (currentBrand && currentBrand !== 'all') {
        filtered = filtered.filter(p => p.brand_name && p.brand_name.toLowerCase() === currentBrand.toLowerCase());
      }

      if (currentSort === 'asc') {
        filtered.sort((a, b) => a.price - b.price);
      } else if (currentSort === 'desc') {
        filtered.sort((a, b) => b.price - a.price);
      } else if (currentSort === 'name_asc') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
      } else if (currentSort === 'name_desc') {
        filtered.sort((a, b) => b.name.localeCompare(a.name));
      } else {
        filtered.sort((a, b) => b.id - a.id);
      }

      renderProducts(filtered);
    }

    // Initial render
    applyFilters();

    // Attach Search Input Handlers
    const searchInputs = document.querySelectorAll('.table-top input, input[placeholder*="Search"], input[type="search"], .search-set input');
    searchInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase().trim();
        applyFilters();
      });
    });

    // Attach Category, Brand, and Sort Dropdown Handlers
    document.querySelectorAll('.dropdown-menu .dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const text = item.textContent.trim();
        const parentBtn = item.closest('.dropdown')?.querySelector('.dropdown-toggle');
        
        if (parentBtn) {
          const btnText = parentBtn.textContent.trim().toLowerCase();

          if (btnText.includes('category')) {
            currentCategory = text.toLowerCase() === 'all' ? '' : text;
            parentBtn.innerHTML = `<i class="ti ti-filter me-1"></i> Category: ${text}`;
            applyFilters();
          } else if (btnText.includes('brand')) {
            currentBrand = text.toLowerCase() === 'all' ? '' : text;
            parentBtn.innerHTML = `<i class="ti ti-tags me-1"></i> Brand: ${text}`;
            applyFilters();
          } else if (btnText.includes('sort')) {
            if (text.toLowerCase().includes('ascending') || text.toLowerCase().includes('low')) currentSort = 'asc';
            else if (text.toLowerCase().includes('descending') || text.toLowerCase().includes('high')) currentSort = 'desc';
            else currentSort = 'recent';

            parentBtn.innerHTML = `<i class="ti ti-arrows-sort me-1"></i> Sort: ${text}`;
            applyFilters();
          }
        }
      });
    });

  } catch (err) {
    console.error('Failed to load products list:', err);
  }
}

/** Super Admin Dashboard Page Controller **/
async function initSuperAdminDashboardPage() {
  console.log('Initializing Super Admin Command Center Controller...');

  // Force Super Admin session context
  let currentUser = null;
  try { currentUser = JSON.parse(localStorage.getItem('avocado_user') || 'null'); } catch(e){}
  if (!currentUser || currentUser.role !== 'Super Admin') {
    const superUser = { id: 1, org_id: null, name: 'System Super Admin', email: 'admin@avocado.com', role: 'Super Admin', permissions: ['*'] };
    localStorage.setItem('avocado_user', JSON.stringify(superUser));
    localStorage.setItem('avocado_role', 'Super Admin');
  }

  // Load Stats
  try {
    const stats = await API.request('/api/superadmin/stats');
    const orgEl = document.getElementById('stat-total-orgs');
    const userEl = document.getElementById('stat-total-users');
    const prodEl = document.getElementById('stat-total-products');
    const valEl = document.getElementById('stat-total-valuation');

    if (orgEl) orgEl.textContent = stats.total_orgs || 0;
    if (userEl) userEl.textContent = stats.total_users || 0;
    if (prodEl) prodEl.textContent = stats.total_products || 0;
    if (valEl) valEl.textContent = `$${parseFloat(stats.total_valuation || 0).toFixed(2)}`;
  } catch (err) {
    console.error('Failed to load Super Admin stats in controller:', err);
  }

  // Load Organizations
  try {
    const orgs = await API.request('/api/organizations');

    // Populate user creation modal select dropdown
    const userOrgSelect = document.getElementById('user-org-select');
    if (userOrgSelect) {
      userOrgSelect.innerHTML = '<option value="">Select Organization</option>';
      orgs.forEach(o => {
        userOrgSelect.insertAdjacentHTML('beforeend', `<option value="${o.id}">${o.name} (${o.code})</option>`);
      });
    }

    // Render Orgs Table Body
    const orgsTableBody = document.getElementById('super-orgs-table-body');
    if (orgsTableBody) {
      let rowsHtml = '';
      orgs.forEach(o => {
        rowsHtml += `
          <tr>
            <td><code>#${o.id}</code></td>
            <td class="fw-bold text-white">${o.name}</td>
            <td><span class="badge bg-secondary">${o.code}</span></td>
            <td>${o.admin_name || '<span class="text-white-50">Not Set</span>'}</td>
            <td>${o.admin_email || '<span class="text-white-50">N/A</span>'}</td>
            <td><span class="badge bg-info">${o.total_users} Users</span></td>
            <td><span class="badge bg-success">${o.status}</span></td>
            <td class="text-center">
              <button class="btn btn-sm btn-outline-danger delete-org-btn me-1" data-id="${o.id}" data-name="${o.name}">
                <i class="ti ti-trash"></i> Delete
              </button>
            </td>
          </tr>
        `;
      });
      orgsTableBody.innerHTML = rowsHtml || '<tr><td colspan="8" class="text-center py-4 text-white-50">No organizations found</td></tr>';

      orgsTableBody.querySelectorAll('.delete-org-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const orgId = btn.getAttribute('data-id');
          const orgName = btn.getAttribute('data-name');
          if (confirm(`Are you sure you want to delete ${orgName} and all associated accounts?`)) {
            await API.request(`/api/organizations/${orgId}`, { method: 'DELETE' });
            API.showToast(`Organization ${orgName} deleted.`);
            initSuperAdminDashboardPage();
          }
        });
      });
    }

    // Render Module Matrix Cards
    const matrixContainer = document.getElementById('super-matrix-container');
    if (matrixContainer) {
      const allModules = [
        { key: 'products', title: 'Products Catalog', icon: 'ti-box', color: 'text-info' },
        { key: 'add_product', title: 'Add Product', icon: 'ti-circle-plus', color: 'text-warning' },
        { key: 'categories', title: 'Categories', icon: 'ti-category', color: 'text-success' },
        { key: 'brands', title: 'Brand List', icon: 'ti-tags', color: 'text-teal' },
        { key: 'stocks', title: 'Stock Adjustments', icon: 'ti-adjustments-horizontal', color: 'text-purple' },
        { key: 'alerts', title: 'Low Stock Alerts', icon: 'ti-alert-triangle', color: 'text-danger' },
        { key: 'warehouses', title: 'Warehouses', icon: 'ti-building-warehouse', color: 'text-secondary' },
        { key: 'suppliers', title: 'Suppliers & Purchases', icon: 'ti-truck', color: 'text-indigo' },
        { key: 'barcodes', title: 'Units & Barcodes', icon: 'ti-barcode', color: 'text-orange' },
        { key: 'reports', title: 'Inventory Reports', icon: 'ti-report-analytics', color: 'text-success' },
        { key: 'admin_panel', title: 'Executive Admin', icon: 'ti-shield', color: 'text-cyan' },
        { key: 'settings', title: 'System Settings', icon: 'ti-settings', color: 'text-white-50' }
      ];

      let matrixHtml = '';
      orgs.forEach(o => {
        let enabledList = [];
        try { enabledList = JSON.parse(o.enabled_modules || '[]'); } catch (e) {}

        matrixHtml += `
          <div class="col-lg-6" id="matrix-card-${o.id}">
            <div class="card os-glass-panel border-0 text-white h-100">
              <div class="card-header bg-transparent border-bottom border-white-10 d-flex justify-content-between align-items-center">
                <div>
                  <h5 class="fw-bold text-white mb-0"><i class="ti ti-building text-success me-2"></i>${o.name}</h5>
                  <small class="text-white-50">Code: ${o.code} | Admin: ${o.admin_email || 'N/A'}</small>
                </div>
                <span class="badge bg-success-transparent text-success border border-success px-3 py-1 rounded-pill">Active Tenant</span>
              </div>
              <div class="card-body">
                <h6 class="text-white-50 fs-13 mb-3 text-uppercase fw-semibold">Module Visibility Switches</h6>
                <div class="row g-3">
        `;

        allModules.forEach(m => {
          const isChecked = enabledList.includes(m.key) ? 'checked' : '';
          matrixHtml += `
            <div class="col-6 col-sm-4">
              <div class="p-2 rounded bg-black bg-opacity-25 border border-white-10 d-flex justify-content-between align-items-center">
                <span class="fs-13 d-flex align-items-center"><i class="ti ${m.icon} ${m.color} me-1 fs-16"></i> ${m.title}</span>
                <div class="form-check form-switch m-0">
                  <input class="form-check-input matrix-toggle-switch" type="checkbox" data-org-id="${o.id}" data-module-key="${m.key}" ${isChecked} style="cursor:pointer;">
                </div>
              </div>
            </div>
          `;
        });

        matrixHtml += `
                </div>
              </div>
            </div>
          </div>
        `;
      });

      matrixContainer.innerHTML = matrixHtml;

      matrixContainer.querySelectorAll('.matrix-toggle-switch').forEach(sw => {
        sw.addEventListener('change', async () => {
          const orgId = sw.getAttribute('data-org-id');
          const card = document.getElementById(`matrix-card-${orgId}`);
          const activeSwitches = card.querySelectorAll('.matrix-toggle-switch:checked');
          const newModules = Array.from(activeSwitches).map(s => s.getAttribute('data-module-key'));

          try {
            await API.request(`/api/organizations/${orgId}/modules`, {
              method: 'PUT',
              body: JSON.stringify({ enabled_modules: newModules })
            });
            API.showToast('Module visibility updated for Organization!');
          } catch (err) {
            API.showToast('Failed to update module visibility', 'danger');
          }
        });
      });
    }

  } catch (err) {
    console.error('Failed to load organizations in controller:', err);
  }

  // Load Users
  try {
    const users = await API.request('/api/users');
    const usersTableBody = document.getElementById('super-users-table-body');
    if (usersTableBody) {
      let html = '';
      users.forEach(u => {
        const roleBadge = u.role === 'Super Admin'
          ? '<span class="badge bg-danger-transparent text-danger fw-bold"><i class="ti ti-crown me-1"></i> Super Admin</span>'
          : u.role === 'Admin'
          ? '<span class="badge bg-primary-transparent text-primary fw-bold">Org Admin</span>'
          : u.role === 'Manager'
          ? '<span class="badge bg-success-transparent text-success fw-bold">Manager</span>'
          : '<span class="badge bg-secondary-transparent text-secondary fw-bold">Staff</span>';

        html += `
          <tr>
            <td><code>#${u.id}</code></td>
            <td class="fw-bold text-white">${u.name}</td>
            <td><code>${u.email}</code></td>
            <td>${roleBadge}</td>
            <td>${u.org_name || 'System Global'}</td>
            <td>${u.phone || '+1 555-0199'}</td>
            <td><span class="badge bg-success">Active</span></td>
            <td class="text-center">
              <button class="btn btn-sm btn-outline-danger delete-user-btn" data-id="${u.id}" data-name="${u.name}">
                <i class="ti ti-trash"></i> Delete
              </button>
            </td>
          </tr>
        `;
      });
      usersTableBody.innerHTML = html || '<tr><td colspan="8" class="text-center py-4 text-white-50">No users found</td></tr>';

      usersTableBody.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const userId = btn.getAttribute('data-id');
          const userName = btn.getAttribute('data-name');
          if (confirm(`Are you sure you want to delete user ${userName}?`)) {
            await API.request(`/api/users/${userId}`, { method: 'DELETE' });
            API.showToast(`User ${userName} deleted.`);
            initSuperAdminDashboardPage();
          }
        });
      });
    }
  } catch (err) {
    console.error('Failed to load users in controller:', err);
  }
}

// Standalone Global Digital Clock Controller
function startDigitalClock() {
  const updateClock = () => {
    const clockEls = document.querySelectorAll('#os-digital-clock, .os-clock-widget');
    if (!clockEls.length) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    clockEls.forEach(el => {
      el.innerHTML = `<i class="ti ti-clock me-1 text-success"></i> ${dateStr} ${timeStr}`;
    });
  };
  updateClock();
  setInterval(updateClock, 1000);
}

// Auto-run header store dropdown controller, clock & page initializers on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  startDigitalClock();
  setupHeaderStoreDropdown();
  if (window.location.pathname.includes('superadmin-dashboard.html')) {
    initSuperAdminDashboardPage();
  } else if (window.location.pathname.includes('users.html')) {
    initUserManagementPage();
  } else if (window.location.pathname.includes('products.html') || window.location.pathname.includes('product-list.html')) {
    initProductsListPage();
  }
});
