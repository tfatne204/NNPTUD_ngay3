(async ()=>{
  const API='https://api.escuelajs.co/api/v1/products';
  const tbody=document.querySelector('#products-table tbody');
  const spinner=document.getElementById('spinner');
  const searchInput=document.getElementById('search');
  const itemsPerPageSelect=document.getElementById('items-per-page');
  const prevBtn=document.getElementById('prev-btn');
  const nextBtn=document.getElementById('next-btn');
  const pageNumbersContainer=document.getElementById('page-numbers');
  const pageInfo=document.getElementById('page-info');
  const exportCsvBtn=document.getElementById('export-csv');
  const createBtn=document.getElementById('create-btn');
  const productModal=new bootstrap.Modal(document.getElementById('productModal'));
  const createModal=new bootstrap.Modal(document.getElementById('createModal'));
  const editBtn=document.getElementById('editBtn');
  const saveBtn=document.getElementById('saveBtn');
  const cancelEditBtn=document.getElementById('cancelEditBtn');
  const submitCreateBtn=document.getElementById('submitCreateBtn');
  
  let products=[];
  let currentPage=1;
  let itemsPerPage=10;
  let filteredProducts=[];
  let sortField=null;
  let sortAsc=true;
  let currentProduct=null;
  let isEditMode=false;

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  function renderImages(imgs){
    if(!imgs || imgs.length===0) return '';
    return imgs.slice(0,3).map(u=>`<img src="${u}" class="product-img"/>`).join('');
  }

  function showSpinner(on){ spinner.style.display = on ? 'flex' : 'none'; }

  function renderPage(list){
    tbody.innerHTML = '';
    if(!Array.isArray(list) || list.length===0){
      tbody.innerHTML = '<tr><td colspan="5" class="text-muted">Không có sản phẩm</td></tr>';
      return;
    }
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = list.slice(start, end);
    
    pageData.forEach(p=>{
      const tr=document.createElement('tr');
      tr.className = 'product-row';
      const cat = (p.category && (p.category.name || p.category)) ? (p.category.name || p.category) : '';
      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${escapeHtml(p.title)}</td>
        <td><span class="badge bg-success price-badge">$${Number(p.price).toFixed(2)}</span></td>
        <td>${escapeHtml(cat)}</td>
        <td>${renderImages(p.images)}</td>
      `;
      const desc = (p.description || '').toString();
      if(desc) {
        tr.setAttribute('data-bs-toggle', 'tooltip');
        tr.setAttribute('data-bs-placement', 'top');
        tr.setAttribute('title', desc);
      }
      // click to show modal
      tr.addEventListener('click', () => showProductDetail(p));
      tbody.appendChild(tr);
    })
    initTooltips();
  }
  
  function updatePagination(list){
    const totalPages = Math.ceil(list.length / itemsPerPage);
    currentPage = Math.max(1, Math.min(currentPage, totalPages));
    
    pageInfo.textContent = `Trang ${currentPage} / ${totalPages}` + (list.length > 0 ? ` (${list.length} sản phẩm)` : '');
    
    renderPage(list);
    
    prevBtn.classList.toggle('disabled', currentPage===1);
    nextBtn.classList.toggle('disabled', currentPage===totalPages);
    
    pageNumbersContainer.innerHTML = '';
    const maxPageBtns = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPageBtns/2));
    let endPage = Math.min(totalPages, startPage + maxPageBtns - 1);
    if(endPage - startPage + 1 < maxPageBtns) startPage = Math.max(1, endPage - maxPageBtns + 1);
    
    for(let i=startPage; i<=endPage; i++){
      const li = document.createElement('li');
      li.className = 'page-item' + (i===currentPage ? ' active' : '');
      li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
      li.querySelector('a').addEventListener('click', e=>{
        e.preventDefault();
        currentPage = i;
        updatePagination(list);
      });
      pageNumbersContainer.appendChild(li);
    }
    updateSortIndicators();
  }
  
  function updateSortIndicators(){
    document.querySelectorAll('.sort-indicator').forEach(s => s.textContent = '');
    if(sortField){
      const indicator = document.querySelector(`[data-sort-field="${sortField}"] .sort-indicator`);
      if(indicator) indicator.textContent = sortAsc ? ' ↑' : ' ↓';
    }
  }
  
  function sortList(list, field){
    if(sortField === field){
      sortAsc = !sortAsc;
    }else{
      sortField = field;
      sortAsc = true;
    }
    const sorted = [...list].sort((a, b) => {
      let valA = field === 'price' ? Number(a[field]) || 0 : (a[field] || '').toString().toLowerCase();
      let valB = field === 'price' ? Number(b[field]) || 0 : (b[field] || '').toString().toLowerCase();
      const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }

  function initTooltips(){
    if(typeof bootstrap === 'undefined') return;
    const rows = tbody.querySelectorAll('tr[data-bs-toggle="tooltip"]');
    rows.forEach(r=>{
      // avoid double-init
      if(r._tooltip) return;
      try{ r._tooltip = new bootstrap.Tooltip(r, {container: 'body'}); }catch(e){}
    })
  }

  // helper to get current search query
  function getQuery(){ return (searchInput.value || '').trim().toLowerCase(); }

  function applyFilter(){
    const q = getQuery();
    filteredProducts = q ? products.filter(p => (p.title||'').toLowerCase().includes(q)) : products;
    currentPage = 1;
    updatePagination(filteredProducts);
  }

  async function fetchAndUpdate(){
    try{
      showSpinner(true);
      const res = await fetch(API);
      if(!res.ok) throw new Error(res.status+' '+res.statusText);
      products = await res.json();
      applyFilter();
    }catch(err){
      tbody.innerHTML = `<tr><td colspan="5" class="text-danger">Error: ${escapeHtml(err.message)}</td></tr>`;
    }finally{
      showSpinner(false);
    }
  }

  // initial load
  await fetchAndUpdate();
  // auto-refresh every 60 seconds (updates products and reapplies current search)
  setInterval(fetchAndUpdate, 60000);

  searchInput.addEventListener('input', applyFilter);
  
  itemsPerPageSelect.addEventListener('change', e=>{
    itemsPerPage = parseInt(e.target.value, 10);
    currentPage = 1;
    updatePagination(filteredProducts);
  });
  
  prevBtn.addEventListener('click', e=>{
    e.preventDefault();
    if(currentPage > 1){
      currentPage--;
      updatePagination(filteredProducts);
    }
  });
  
  nextBtn.addEventListener('click', e=>{
    e.preventDefault();
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if(currentPage < totalPages){
      currentPage++;
      updatePagination(filteredProducts);
    }
  });

  // attach sort handlers
  document.querySelectorAll('.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.getAttribute('data-sort-field');
      filteredProducts = sortList(filteredProducts, field);
      currentPage = 1;
      updatePagination(filteredProducts);
    });
  });

  // export CSV handler
  exportCsvBtn.addEventListener('click', () => {
    if(!filteredProducts || filteredProducts.length === 0){
      alert('Không có dữ liệu để xuất');
      return;
    }
    const headers = ['ID', 'Title', 'Price', 'Category', 'Description'];
    const rows = filteredProducts.map(p => [
      p.id,
      `"${(p.title || '').replace(/"/g, '""')}"`,
      Number(p.price).toFixed(2),
      `"${(p.category?.name || p.category || '').replace(/"/g, '""')}"`,
      `"${(p.description || '').replace(/"/g, '""')}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `products_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // product detail modal handlers
  function showProductDetail(product){
    currentProduct = {...product};
    isEditMode = false;
    document.getElementById('productId').textContent = product.id;
    document.getElementById('productTitleText').textContent = product.title;
    document.getElementById('productPriceText').textContent = `$${Number(product.price).toFixed(2)}`;
    document.getElementById('productCategoryText').textContent = product.category?.name || product.category || '';
    document.getElementById('productDescriptionText').textContent = product.description || 'N/A';
    const img = document.getElementById('productImage');
    img.src = (product.images && product.images[0]) || 'https://via.placeholder.com/200';
    switchViewMode();
    productModal.show();
  }

  function switchViewMode(){
    const viewMode = document.getElementById('viewMode');
    const editMode = document.getElementById('editMode');
    const editStatus = document.getElementById('editStatus');
    editStatus.textContent = '';
    
    if(isEditMode){
      viewMode.style.display = 'none';
      editMode.style.display = 'block';
      editBtn.style.display = 'none';
      saveBtn.style.display = 'inline-block';
      cancelEditBtn.style.display = 'inline-block';
      document.getElementById('editTitle').value = currentProduct.title;
      document.getElementById('editPrice').value = currentProduct.price;
      document.getElementById('editDescription').value = currentProduct.description || '';
    }else{
      viewMode.style.display = 'block';
      editMode.style.display = 'none';
      editBtn.style.display = 'inline-block';
      saveBtn.style.display = 'none';
      cancelEditBtn.style.display = 'none';
    }
  }

  editBtn.addEventListener('click', () => {
    isEditMode = true;
    switchViewMode();
  });

  cancelEditBtn.addEventListener('click', () => {
    isEditMode = false;
    switchViewMode();
  });

  saveBtn.addEventListener('click', async () => {
    const editStatus = document.getElementById('editStatus');
    editStatus.textContent = 'Đang lưu...';
    
    const updatedData = {
      title: document.getElementById('editTitle').value,
      price: Number(document.getElementById('editPrice').value),
      description: document.getElementById('editDescription').value
    };

    try{
      const res = await fetch(`${API}/${currentProduct.id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(updatedData)
      });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      Object.assign(currentProduct, updated);
      editStatus.textContent = '✓ Lưu thành công!';
      setTimeout(() => {
        isEditMode = false;
        switchViewMode();
        showProductDetail(currentProduct);
        applyFilter();
      }, 1000);
    }catch(err){
      editStatus.textContent = `❌ Lỗi: ${err.message}`;
    }
  });

  // create product modal handler
  createBtn.addEventListener('click', () => {
    document.getElementById('createForm').reset();
    document.getElementById('createStatus').textContent = '';
    createModal.show();
  });

  submitCreateBtn.addEventListener('click', async () => {
    const createStatus = document.getElementById('createStatus');
    createStatus.textContent = 'Đang tạo...';
    
    const newProduct = {
      title: document.getElementById('createTitle').value,
      price: Number(document.getElementById('createPrice').value),
      categoryId: Number(document.getElementById('createCategory').value),
      description: document.getElementById('createDescription').value || '',
      images: document.getElementById('createImage').value ? [document.getElementById('createImage').value] : []
    };

    try{
      const res = await fetch(API, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(newProduct)
      });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = await res.json();
      createStatus.textContent = '✓ Tạo thành công!';
      setTimeout(() => {
        createModal.hide();
        applyFilter();
      }, 1000);
    }catch(err){
      createStatus.textContent = `❌ Lỗi: ${err.message}`;
    }
  });
})();
