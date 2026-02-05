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

  function render(list){
    tbody.innerHTML = '';
    if(!Array.isArray(list) || list.length===0){
      tbody.innerHTML = '<tr><td colspan="5" class="text-muted">Không có sản phẩm</td></tr>';
      return;
    }
    list.forEach(p=>{
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

  try{
    showSpinner(true);
    const res=await fetch(API);
    if(!res.ok) throw new Error(res.status+' '+res.statusText);
    products=await res.json();
    render(products);
  }catch(err){
    tbody.innerHTML=`<tr><td colspan="5" class="text-danger">Error: ${escapeHtml(err.message)}</td></tr>`;
  }finally{
    showSpinner(false);
  }

  searchInput.addEventListener('input', e=>{
    const q = (e.target.value || '').trim().toLowerCase();
    if(!q) return render(products);
    const filtered = products.filter(p=> (p.title||'').toLowerCase().includes(q));
    render(filtered);
  });
})();
