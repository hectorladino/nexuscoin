// Utilidades simples
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => [...ctx.querySelectorAll(sel)];

// Cargar productos
async function loadProducts(){
  const res = await fetch('data/productos.json');
  return res.json();
}

// Render de productos destacados
async function renderFeatured(){
  const root = $('#featured');
  if(!root) return;
  const data = await loadProducts();
  const destacados = data.filter(p => p.destacado);
  root.innerHTML = destacados.map(p => cardProducto(p)).join('');
}

// Render listado con filtros
async function renderListado(){
  const root = $('#listado');
  if(!root) return;
  const data = await loadProducts();
  const q = $('#q');
  const cat = $('#cat');
  const draw = () => {
    const term = (q.value || '').toLowerCase();
    const c = cat.value;
    const items = data.filter(p =>
      (!c || p.categoria === c) &&
      (p.nombre.toLowerCase().includes(term) || p.descripcion.toLowerCase().includes(term))
    );
    root.innerHTML = items.map(p => cardProducto(p, true)).join('');
  };
  q.addEventListener('input', draw);
  cat.addEventListener('change', draw);
  draw();
}

// Tarjeta de producto
function cardProducto(p, showBtn=false){
  return `
  <article class="card product">
    <img alt="${p.nombre}" src="${p.imagen || 'assets/placeholder.svg'}">
    <h4>${p.nombre}</h4>
    <div class="muted">${p.descripcion}</div>
    <div class="price">$${num(p.precio_unit).toLocaleString('es-CO')} <span class="muted small">/${p.unidad}</span></div>
    ${showBtn ? `<button class="btn" onclick='addToQuote(${JSON.stringify(p)})'>Agregar a cotización</button>` : ''}
  </article>`;
}

function num(v){ return Number(v ?? 0); }

// Cotización rápida (home)
async function setupQuickQuote(){
  const btn = $('#btnCotizar');
  if(!btn) return;
  // Tabs
  $$('.tab').forEach(t => t.addEventListener('click', () => {
    $$('.tab').forEach(x => x.classList.remove('active'));
    $$('.pane').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    $(t.dataset.target).classList.add('active');
  }));

  const data = await loadProducts();
  const byId = Object.fromEntries(data.map(p => [p.id, p]));
  btn.addEventListener('click', () => {
    const active = $('.tab.active').textContent.trim();
    let total = 0;
    let detalle = [];
    if(active === 'Bloques'){
      const id = $('#qq-bloque').value;
      const und = num($('#qq-unidades').value);
      total = und * byId[id].precio_unit;
      detalle.push(`${und} × ${byId[id].nombre}`);
    } else if(active === 'Materiales'){
      const id = $('#qq-material').value;
      const cant = num($('#qq-cant-mat').value);
      const km = num($('#qq-km').value);
      const mat = byId[id];
      const transporte = calcularTransporte(km);
      total = cant * mat.precio_unit + transporte;
      detalle.push(`${cant} × ${mat.nombre}`, `Transporte: $${num(transporte).toLocaleString('es-CO')}`);
    } else {
      // Obra
      const area = num($('#qq-area').value);
      // Base muy simple por metro cuadrado (mano de obra de referencia)
      total = area * 320000;
      detalle.push(`${area} m² de construcción tipo ${$('#qq-obra').value}`);
    }
    saveQuote({fuente:'Rápida', detalle, total});
    alert(`Cotización guardada. Total estimado: $${num(total).toLocaleString('es-CO')}`);
    window.location.href = 'cotizador.html';
  });
}

// Cotizador de muros
async function setupCotizador(){
  const btn = $('#btnCalcular');
  if(!btn) return;
  const data = await loadProducts();
  const byId = Object.fromEntries(data.map(p => [p.id, p]));

  btn.addEventListener('click', () => {
    const tipo = $('#tipoBloque').value;
    const area = num($('#areaMuro').value);
    const desperdicio = num($('#desperdicio').value);
    const km = num($('#km').value);

    // Cálculo: bloques/m2 según tamaño
    const factores = { 'bloque_12_40_20': 12.5, 'bloque_10_40_20': 12.5 * (0.20/0.20) }; // aproximado
    let bloques_m2 = factores[tipo] || 12.5;
    let unidades = Math.ceil(area * bloques_m2 * (1 + desperdicio/100));

    const bloque = byId[tipo];
    const precioBloques = unidades * bloque.precio_unit;

    // Mortero: 0.02 m3/m2, Cemento (50kg) ~ 7 sacos por m3 mortero (aprox)
    const mortero_m3 = area * 0.02;
    const sacos_cemento = Math.ceil(mortero_m3 * 7);
    const precioCemento = sacos_cemento * byId['cemento_50kg'].precio_unit;

    // Arena: 1 m3 por mortero (aprox)
    const arena_m3 = Math.ceil(mortero_m3);
    const precioArena = arena_m3 * byId['arena_m3'].precio_unit;

    // Transporte
    const transporte = calcularTransporte(km);

    const total = precioBloques + precioCemento + precioArena + transporte;
    const resumen = $('#resumen');
    resumen.innerHTML = `
      <p><strong>Bloques:</strong> ${unidades} × ${bloque.nombre} — $${num(precioBloques).toLocaleString('es-CO')}</p>
      <p><strong>Cemento (50kg):</strong> ${sacos_cemento} sacos — $${num(precioCemento).toLocaleString('es-CO')}</p>
      <p><strong>Arena:</strong> ${arena_m3} m³ — $${num(arena_m3).toLocaleString('es-CO')}</p>
      <p><strong>Transporte:</strong> $${num(transporte).toLocaleString('es-CO')} <span class="muted">(base + por km)</span></p>
      <hr/>
      <p><strong>Total estimado:</strong> $${num(total).toLocaleString('es-CO')}</p>
    `;

    $('#btnGuardar').onclick = () => {
      saveQuote({
        fuente:'Cotizador',
        detalle:[
          `${unidades} × ${bloque.nombre}`,
          `${sacos_cemento} sacos de cemento`,
          `${arena_m3} m³ de arena`,
          `Transporte ${km} km`
        ],
        total
      });
      alert('Cotización guardada');
      drawHistorial();
    };
  });
}

// Transporte: base + km * tarifa
function calcularTransporte(km){
  const base = 80000;
  const tarifa_km = 4000;
  return base + km * tarifa_km;
}

// Guardar/leer cotizaciones
function saveQuote(obj){
  const items = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
  const id = Date.now();
  items.unshift({id, fecha: new Date().toISOString(), ...obj});
  localStorage.setItem('cotizaciones', JSON.stringify(items));
}

function drawHistorial(){
  const root = $('#historial');
  if(!root) return;
  const items = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
  root.innerHTML = items.map(it => `
    <article class="card history-card">
      <h4>Cotización #${it.id}</h4>
      <div class="meta">${new Date(it.fecha).toLocaleString('es-CO')}</div>
      <ul class="links">
        ${it.detalle.map(d => `<li>${d}</li>`).join('')}
      </ul>
      <p><strong>Total:</strong> $${num(it.total).toLocaleString('es-CO')}</p>
    </article>
  `).join('');
}

// Contacto -> mailto
function setupContact(){
  const f = $('#contactForm');
  if(!f) return;
  f.addEventListener('submit', e => {
    e.preventDefault();
    const nombre = $('#c-nombre').value;
    const email = $('#c-email').value;
    const tel = $('#c-tel').value;
    const msg = $('#c-msg').value;
    const body = encodeURIComponent(`Nombre: ${nombre}%0ACorreo: ${email}%0ATeléfono: ${tel}%0A%0A${msg}`);
    window.location.href = `mailto:ventas@nexusconstrucciones.co?subject=Cotización desde la web&body=${body}`;
  });
}

// Agenda (localStorage)
function setupAgenda(){
  const f = $('#apptForm');
  const list = $('#appts');
  if(!f) return;
  f.addEventListener('submit', e => {
    e.preventDefault();
    const appt = {
      id: Date.now(),
      nombre: $('#a-nombre').value,
      dir: $('#a-dir').value,
      ciudad: $('#a-ciudad').value,
      fecha: $('#a-fecha').value,
      hora: $('#a-hora').value,
      obs: $('#a-obs').value
    };
    const items = JSON.parse(localStorage.getItem('citas') || '[]');
    items.unshift(appt);
    localStorage.setItem('citas', JSON.stringify(items));
    f.reset();
    drawAppts();
  });
  function drawAppts(){
    const items = JSON.parse(localStorage.getItem('citas') || '[]');
    list.innerHTML = items.map(a => `
      <article class="card">
        <h4>${a.nombre} — ${a.ciudad}</h4>
        <div class="meta">${a.fecha} · ${a.hora}</div>
        <div class="muted">${a.dir}</div>
        <p>${a.obs || ''}</p>
      </article>
    `).join('');
  }
  drawAppts();
}

// Add to Quote (from products)
function addToQuote(p){
  saveQuote({fuente:'Productos', detalle:[p.nombre], total:p.precio_unit});
  alert('Producto agregado a cotización');
}

// Inicialización por página
document.addEventListener('DOMContentLoaded', () => {
  renderFeatured();
  renderListado();
  setupQuickQuote();
  setupCotizador();
  setupContact();
  setupAgenda();
  setupModal();
});

// Modal logic
function setupModal() {
  const modal = $('#spec-modal');
  if (!modal) return;

  const openButtons = $$('.js-open-modal');
  const closeButtons = $$('.modal-close, .modal-close-btn');

  openButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      modal.style.display = 'block';
      setTimeout(() => {
        if (typeof init3DViewer === 'function') {
          init3DViewer();
        }
      }, 10);
    });
  });

  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
}