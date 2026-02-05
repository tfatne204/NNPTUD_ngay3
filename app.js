(async ()=>{
  const API='https://api.escuelajs.co/api/v1/products';
  const tbody=document.querySelector('#products-table tbody');
  const spinner=document.getElementById('spinner');
  const searchInput=document.getElementById('search');
  let products=[];

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  function renderImages(imgs){
    if(!imgs || imgs.length===0) return '';
    return imgs.slice(0,3).map(u=>`<img src="${u}" class="product-img"/>`).join('');
  }

  function showSpinner(on){ spinner.style.display = on ? 'flex' : 'none'; }

  let currentPage = 1;
  let perPage = 10;
  const perPageSelect = document.getElementById('perPage');
  const paginationNav = document.getElementById('pagination-nav');

  function getPageData(list){
    const start = (currentPage - 1) * perPage;
    return list.slice(start, start + perPage);
  }

  function renderPagination(total){
    paginationNav.innerHTML = '';
    if(total <= perPage) return; // no pagination needed
    
    const pages = Math.ceil(total / perPage);
    const ul = document.createElement('ul');
    ul.className = 'pagination pagination-sm mb-0';
    
    // prev button
    const prevLi = document.createElement('li');
    prevLi.className = 'page-item ' + (currentPage === 1 ? 'disabled' : '');
    prevLi.innerHTML = '<a class="page-link" href="#">Trước</a>';
    prevLi.addEventListener('click', e=>{
      e.preventDefault();
      if(currentPage > 1){
        currentPage--;
        applyFiltersAndRender();
      }
    });
    ul.appendChild(prevLi);
    
    // page numbers (show max 5 pages)
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(pages, currentPage + 2);
    if(start > 1){
      const li = document.createElement('li');
      li.className = 'page-item';
      li.innerHTML = '<a class="page-link" href="#">1</a>';
      li.addEventListener('click', e=>{
        e.preventDefault();
        currentPage = 1;
        applyFiltersAndRender();
      });
      ul.appendChild(li);
      if(start > 2){
        const li2 = document.createElement('li');
        li2.className = 'page-item disabled';
        li2.innerHTML = '<span class="page-link">...</span>';
        ul.appendChild(li2);
      }
    }
    for(let i=start; i<=end; i++){
      const li = document.createElement('li');
      li.className = 'page-item ' + (i === currentPage ? 'active' : '');
      li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
      li.addEventListener('click', e=>{
        e.preventDefault();
        currentPage = i;
        applyFiltersAndRender();
      });
      ul.appendChild(li);
    }
    if(end < pages){
      if(end < pages - 1){
        const li2 = document.createElement('li');
        li2.className = 'page-item disabled';
        li2.innerHTML = '<span class="page-link">...</span>';
        ul.appendChild(li2);
      }
      const li = document.createElement('li');
      li.className = 'page-item';
      li.innerHTML = `<a class="page-link" href="#">${pages}</a>`;
      li.addEventListener('click', e=>{
        e.preventDefault();
        currentPage = pages;
        applyFiltersAndRender();
      });
      ul.appendChild(li);
    }
    
    // next button
    const nextLi = document.createElement('li');
    nextLi.className = 'page-item ' + (currentPage === pages ? 'disabled' : '');
    nextLi.innerHTML = '<a class="page-link" href="#">Sau</a>';
    nextLi.addEventListener('click', e=>{
      e.preventDefault();
      if(currentPage < pages){
        currentPage++;
        applyFiltersAndRender();
      }
    });
    ul.appendChild(nextLi);
    
    paginationNav.appendChild(ul);
  }

  function render(list){
    tbody.innerHTML = '';
    if(!Array.isArray(list) || list.length===0){
      tbody.innerHTML = '<tr><td colspan="5" class="text-muted">Không có sản phẩm</td></tr>';
      renderPagination(0);
      return;
    }
    const pageData = getPageData(list);
    pageData.forEach(p=>{
      const tr=document.createElement('tr');
      const cat = (p.category && (p.category.name || p.category)) ? (p.category.name || p.category) : '';
      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${escapeHtml(p.title)}</td>
        <td><span class="badge bg-success price-badge">$${Number(p.price).toFixed(2)}</span></td>
        <td>${escapeHtml(cat)}</td>
        <td>${renderImages(p.images)}</td>
      `;
      // attach description as tooltip on the whole row
      const desc = (p.description || '').toString();
      if(desc) {
        tr.setAttribute('data-bs-toggle', 'tooltip');
        tr.setAttribute('data-bs-placement', 'top');
        tr.setAttribute('title', desc);
      }
      tbody.appendChild(tr);
    })
    renderPagination(list.length);
    initTooltips();
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

  function applyFiltersAndRender(){
    const q = getQuery();
    const filtered = q ? products.filter(p=> (p.title||'').toLowerCase().includes(q)) : products;
    render(filtered);
  }

  async function fetchAndUpdate(){
    try{
      showSpinner(true);
      const res = await fetch(API);
      if(!res.ok) throw new Error(res.status+' '+res.statusText);
      products = await res.json();
      currentPage = 1; // reset to first page on new data
      applyFiltersAndRender();
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

  searchInput.addEventListener('input', e=>{
    currentPage = 1; // reset page when searching
    applyFiltersAndRender();
  });

  perPageSelect.addEventListener('change', e=>{
    perPage = parseInt(e.target.value);
    currentPage = 1; // reset page when changing items per page
    applyFiltersAndRender();
  });
})();
