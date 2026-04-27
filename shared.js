// ═══════════════════════════════════════════════════════════
//  বুনন Admin — Shared JS
//  shared.js · Loaded by all pages after Firebase module
// ═══════════════════════════════════════════════════════════

// ── Global State ──
let products     = [];
let weavers      = [];
let testimonials = [];

// ── Helpers ──
function driveThumb(url) {
  if (!url) return '';
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w200` : '';
}

function escHtml(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ── Data Loaders ──
async function loadProducts() {
  try {
    const { collection, getDocs, query, orderBy } = window.__firebase;
    const q = query(collection(window.__db, 'products'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    try {
      const { collection, getDocs } = window.__firebase;
      const snap = await getDocs(collection(window.__db, 'products'));
      products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch { products = []; }
  }
}

async function loadWeavers() {
  try {
    const { collection, getDocs } = window.__firebase;
    const snap = await getDocs(collection(window.__db, 'weavers'));
    weavers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { weavers = []; }
}

async function loadTestimonials() {
  try {
    const { collection, getDocs } = window.__firebase;
    const snap = await getDocs(collection(window.__db, 'testimonials'));
    testimonials = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { testimonials = []; }
}

// ── Delete ──
window.confirmDelete = function(id, name, collection_name) {
  document.getElementById('confirmMsg').textContent = `"${name}" will be permanently removed.`;
  document.getElementById('confirmModal').classList.add('open');
  document.getElementById('confirmDeleteBtn').onclick = () => deleteItem(id, collection_name);
};

async function deleteItem(id, coll) {
  try {
    const { doc, deleteDoc } = window.__firebase;
    await deleteDoc(doc(window.__db, coll, id));
    document.getElementById('confirmModal').classList.remove('open');
    showToast('Item removed successfully.', 'info');
    if (coll === 'products')     { await loadProducts();     if(typeof renderProductsPage==='function') renderProductsPage(); }
    if (coll === 'weavers')      { await loadWeavers();      if(typeof renderWeaversPage==='function') renderWeaversPage(); }
    if (coll === 'testimonials') { await loadTestimonials(); if(typeof renderTestimonialsPage==='function') renderTestimonialsPage(); }
  } catch(e) { showToast('Error deleting: ' + e.message, 'error'); }
}

// ── Preview Panel ──
function showPreviewPanel(type, data) {
  document.getElementById('previewTitle').textContent =
    type === 'product' ? 'Product Preview' : type === 'weaver' ? 'Weaver Preview' : 'Testimonial Preview';

  let html = '';
  if (type === 'product') {
    const imgs = (data.driveLinks || (data.driveLink ? [data.driveLink] : [])).map(driveThumb).filter(Boolean);
    html = `
      ${imgs.length ? `<div class="preview-img-strip">${imgs.map(u=>`<img src="${u}" />`).join('')}</div>` : ''}
      ${data.id ? `<p style="margin-bottom:1rem;"><a class="preview-open-link" href="https://bunan-client.vercel.app/piece.html?id=${data.id}" target="_blank">Open on site &nearr;</a></p>` : ''}
      <div class="preview-field"><div class="preview-field-label">Product Name</div><div class="preview-field-value">${escHtml(data.name)}</div></div>
      ${data.nameBn ? `<div class="preview-field"><div class="preview-field-label">Bengali Name</div><div class="preview-field-value bengali">${escHtml(data.nameBn)}</div></div>` : ''}
      ${data.saleCode ? `<div class="preview-field"><div class="preview-field-label">Sale Code</div><div class="preview-field-value"><span class="td-code">${escHtml(data.saleCode)}</span></div></div>` : ''}
      ${data.tagline ? `<div class="preview-field"><div class="preview-field-label">Tagline</div><div class="preview-field-value serif" style="font-style:italic;">${escHtml(data.tagline)}</div></div>` : ''}
      <div class="preview-divider"></div>
      ${data.description ? `<div class="preview-field"><div class="preview-field-label">Description</div><div class="preview-field-value serif">${escHtml(data.description)}</div></div>` : ''}
      <div class="preview-divider"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.8rem;">
        ${data.category ? `<div class="preview-field"><div class="preview-field-label">Category</div><div class="preview-field-value">${escHtml(data.category)}</div></div>` : ''}
        ${data.fabric ? `<div class="preview-field"><div class="preview-field-label">Fabric</div><div class="preview-field-value">${escHtml(data.fabric)}</div></div>` : ''}
        ${data.karigari ? `<div class="preview-field"><div class="preview-field-label">Karigari</div><div class="preview-field-value">${escHtml(data.karigari)}</div></div>` : ''}
        ${data.origin ? `<div class="preview-field"><div class="preview-field-label">Origin</div><div class="preview-field-value">${escHtml(data.origin)}</div></div>` : ''}
      </div>
      ${data.weaverName ? `<div class="preview-divider"></div><div class="preview-field"><div class="preview-field-label">Weaver</div><div class="preview-field-value">${escHtml(data.weaverName)}${data.weaverVillage?', '+escHtml(data.weaverVillage):''}</div></div>` : ''}`;
  } else if (type === 'weaver') {
    const imgs = data.photoLinks || (data.photoLink ? [data.photoLink] : []);
    const thumbs = imgs.map(driveThumb).filter(Boolean);
    html = `
      ${thumbs.length ? `<div class="preview-img-strip">${thumbs.map(u=>`<img src="${u}" style="width:120px;height:160px;object-fit:cover;" />`).join('')}</div>` : ''}
      <div class="preview-field"><div class="preview-field-label">Name</div><div class="preview-field-value">${escHtml(data.name)}</div></div>
      ${data.nameBn ? `<div class="preview-field"><div class="preview-field-label">Bengali Name</div><div class="preview-field-value bengali">${escHtml(data.nameBn)}</div></div>` : ''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.8rem;">
        ${data.village ? `<div class="preview-field"><div class="preview-field-label">Village</div><div class="preview-field-value">${escHtml(data.village)}</div></div>` : ''}
        ${data.district ? `<div class="preview-field"><div class="preview-field-label">District</div><div class="preview-field-value">${escHtml(data.district)}</div></div>` : ''}
        ${data.state ? `<div class="preview-field"><div class="preview-field-label">State</div><div class="preview-field-value">${escHtml(data.state)}</div></div>` : ''}
        ${data.yearsWeaving ? `<div class="preview-field"><div class="preview-field-label">Years Weaving</div><div class="preview-field-value">${escHtml(data.yearsWeaving)}</div></div>` : ''}
      </div>
      ${data.expertise?.length ? `<div class="preview-field"><div class="preview-field-label">Expertise</div><div class="preview-field-value">${data.expertise.map(e=>`<span class="badge-sm badge-new" style="margin-right:0.3rem;">${escHtml(e)}</span>`).join('')}</div></div>` : ''}
      ${data.story ? `<div class="preview-divider"></div><div class="preview-field"><div class="preview-field-label">Story</div><div class="preview-field-value serif">${escHtml(data.story)}</div></div>` : ''}`;
  } else if (type === 'testimonial') {
    const stars = '★'.repeat(data.stars||5) + '☆'.repeat(5-(data.stars||5));
    html = `
      <div class="preview-field"><div class="preview-field-value" style="font-size:1rem;color:var(--gold);">${stars}</div></div>
      ${data.review ? `<div class="preview-field"><div class="preview-field-label">Review</div><div class="preview-field-value serif" style="font-style:italic;">"${escHtml(data.review)}"</div></div>` : ''}
      <div class="preview-divider"></div>
      <div class="preview-field"><div class="preview-field-label">Customer</div><div class="preview-field-value">${escHtml(data.name||'—')}</div></div>
      ${data.designation ? `<div class="preview-field"><div class="preview-field-label">Designation</div><div class="preview-field-value">${escHtml(data.designation)}</div></div>` : ''}
      ${data.location ? `<div class="preview-field"><div class="preview-field-label">Location</div><div class="preview-field-value">${escHtml(data.location)}</div></div>` : ''}
      ${data.productSaleCode ? `<div class="preview-divider"></div><div class="preview-field"><div class="preview-field-label">Product Code</div><div class="preview-field-value"><span class="td-code">${escHtml(data.productSaleCode)}</span></div></div>` : ''}`;
  }

  document.getElementById('previewBody').innerHTML = html;
  document.getElementById('previewOverlay').classList.add('open');
}

window.showPreviewPanel = showPreviewPanel;

window.closePreview = function() {
  document.getElementById('previewOverlay').classList.remove('open');
};

// ── Photo thumbnail helper ──
window.updatePhotoThumb = function(inp, thumbId) {
  const el = document.getElementById(thumbId);
  if (!el) return;
  const t = driveThumb(inp.value.trim());
  if (t) { el.src = t; el.classList.add('loaded'); }
  else { el.src = ''; el.classList.remove('loaded'); }
};

// ── Sidebar mobile toggle ──
window.toggleSidebar = function() {
  document.getElementById('adminApp').classList.toggle('sidebar-open');
};
window.closeSidebar = function() {
  document.getElementById('adminApp').classList.remove('sidebar-open');
};

// ── Auth ──
window.doLogin = async function() {
  const email = document.getElementById('authEmail').value.trim();
  const pass  = document.getElementById('authPass').value;
  const errEl = document.getElementById('authError');
  errEl.style.display = 'none';
  try {
    await window.__firebase.signInWithEmailAndPassword(window.__auth, email, pass);
  } catch(e) {
    errEl.style.display = 'block';
  }
};

window.doLogout = async function() {
  await window.__firebase.signOut(window.__auth);
};
