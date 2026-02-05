(async ()=>{
  const API='https://api.escuelajs.co/api/v1/products';
  const tbody=document.querySelector('#products-table tbody');
  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }
  function renderImages(imgs){
    if(!imgs || imgs.length===0) return '';
    return imgs.slice(0,3).map(u=>`<img src="${u}" style="height:60px;margin-right:6px;border-radius:4px;object-fit:cover"/>`).join('');
  }
  try{
    const res=await fetch(API);
    if(!res.ok) throw new Error(res.status+' '+res.statusText);
    const products=await res.json();
    if(!Array.isArray(products) || products.length===0){
      tbody.innerHTML='<tr><td colspan="5" class="text-muted">No products found</td></tr>';
      return;
    }
    products.forEach(p=>{
      const tr=document.createElement('tr');
      const cat = (p.category && (p.category.name || p.category)) ? (p.category.name || p.category) : '';
      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${escapeHtml(p.title)}</td>
        <td>$${Number(p.price).toFixed(2)}</td>
        <td>${escapeHtml(cat)}</td>
        <td>${renderImages(p.images)}</td>
      `;
      tbody.appendChild(tr);
    })
  }catch(err){
    tbody.innerHTML=`<tr><td colspan="5" class="text-danger">Error: ${escapeHtml(err.message)}</td></tr>`;
  }
})();
