/**
 * AvocadoPOS - Front-End API Bridge & Dynamic Controllers
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

  if (currentPath.includes('add-product.html')) {
    initAddProductPage();
  } else if (currentPath.includes('edit-product.html')) {
    initEditProductPage();
  } else if (currentPath.includes('product-details.html')) {
    initProductDetailsPage();
  } else if (currentPath.includes('qrcode.html')) {
    initQRCodePage();
  } else if (currentPath.includes('barcode.html')) {
    initBarcodePage();
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

// Setup SKU Generator Button Handler
function setupSKUGenerator() {
  const genButtons = document.querySelectorAll('.btn-primaryadd, .generate-sku-btn');
  genButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const skuInput = document.querySelector('input[name="sku"], .sku-input, input[placeholder*="SKU"]');
      if (skuInput) {
        const randomCode = 'AVO-' + Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase();
        skuInput.value = randomCode;
        skuInput.classList.remove('is-invalid', 'border-danger');
        const feedback = skuInput.parentNode.querySelector('.invalid-feedback-custom');
        if (feedback) feedback.remove();
        API.showToast(`Auto-generated SKU: ${randomCode}`);
      }
    });
  });
}

// Setup Barcode Generator Button Handler
function setupBarcodeGenerator() {
  const barcodeButtons = document.querySelectorAll('.generate-barcode-btn');
  barcodeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const barcodeInput = document.querySelector('input[name="barcode"], .barcode-input, input[placeholder*="barcode"]');
      if (barcodeInput) {
        const randomBarcode = '890' + Math.floor(100000000 + Math.random() * 900000000).toString();
        barcodeInput.value = randomBarcode;
        barcodeInput.classList.remove('is-invalid', 'border-danger');
        const feedback = barcodeInput.parentNode.querySelector('.invalid-feedback-custom');
        if (feedback) feedback.remove();
        API.showToast(`Auto-generated Item Barcode: ${randomBarcode}`);
      }
    });
  });
}

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

  // Clear previous errors
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

  // 1. Product Name Validation
  if (!nameInput || !nameInput.value.trim()) {
    addFieldError(nameInput, 'Product Name is required *');
  }

  // 2. SKU Validation
  if (skuInput && !skuInput.value.trim()) {
    skuInput.value = 'AVO-' + Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase();
  }

  // 3. Category Validation
  if (!catInput || !catInput.value) {
    addFieldError(catInput, 'Please select a Category *');
  }

  // 4. Brand Validation
  if (!brandInput || !brandInput.value) {
    addFieldError(brandInput, 'Please select a Brand *');
  }

  // 5. Price Validation
  if (!priceInput || !priceInput.value.trim() || isNaN(parseFloat(priceInput.value)) || parseFloat(priceInput.value) <= 0) {
    addFieldError(priceInput, 'Please enter a valid Price greater than 0 *');
  }

  // 6. Quantity Validation
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

  // Setup SKU & Barcode Auto Generators
  setupSKUGenerator();
  setupBarcodeGenerator();
  setupSubcategoryDropdown();

  // Populate Categories & Brands Dropdowns
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

  // Find Save / Submit Product Buttons
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
    console.log('Editing Product Data:', product);

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

/** QR Code Print Page Controller **/
async function initQRCodePage() {
  console.log('Initializing Print QR Code Controller...');
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
            <td>
              <input type="number" class="form-control form-control-sm w-75" value="${p.quantity || 1}" min="1">
            </td>
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

    const printActionBtns = document.querySelectorAll('a[data-bs-target="#prints-barcode"], .search-barcode-button a, button:contains("Print")');
    printActionBtns.forEach(btn => {
      btn.addEventListener('click', () => { window.print(); });
    });

  } catch (err) {
    console.error('Failed to initialize QR code page:', err);
  }
}

/** Barcode Print Page Controller **/
async function initBarcodePage() {
  console.log('Initializing Print Barcode Controller...');
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
            <td>
              <input type="number" class="form-control form-control-sm w-75" value="${p.quantity || 1}" min="1">
            </td>
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
  console.log('Initializing Product Details Controller...');
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id') || 1;

  try {
    const product = await API.getProduct(productId);
    console.log('Product Details Loaded:', product);

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

    const imgEls = document.querySelectorAll('.slider-product img, .product-details-img');
    imgEls.forEach(img => {
      img.src = product.image_url;
      img.alt = product.name;
    });

  } catch (err) {
    console.error('Failed to load product details:', err);
  }
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

  function updateClock() {
    const clockEl = document.getElementById('os-digital-clock');
    if (!clockEl) return;
    const now = new Date();
    clockEl.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' ' + now.toLocaleTimeString();
  }
  updateClock();
  setInterval(updateClock, 1000);

  const spotlightInput = document.getElementById('os-spotlight-input');
  if (spotlightInput) {
    spotlightInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      const tiles = document.querySelectorAll('.os-app-tile');
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

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        spotlightInput.focus();
      }
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

  } catch (err) {
    console.error('Failed to load OS Launchpad stats:', err);
  }
}
