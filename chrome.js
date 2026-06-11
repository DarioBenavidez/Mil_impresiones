// chrome.js v5 — cart drawer, producto detail links, light mode permanente
(function () {
  const CURRENT = document.body.dataset.page || 'home';

  // ─── CART ENGINE (localStorage) ──────────────────────────────────────────
  window.Cart = {
    KEY: 'mili_cart',
    get: function () {
      try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); } catch (_) { return []; }
    },
    save: function (items) {
      localStorage.setItem(this.KEY, JSON.stringify(items));
      this.updateBadge();
      this.updateDrawer();
    },
    add: function (product) {
      var items = this.get();
      var ex = items.find(function (i) { return i.id === product.id; });
      if (ex) { ex.qty += 1; } else { items.push(Object.assign({}, product, { qty: 1 })); }
      this.save(items);
      this.showToast(product.name);
    },
    remove: function (id) {
      this.save(this.get().filter(function (i) { return i.id !== id; }));
    },
    setQty: function (id, qty) {
      var items = this.get();
      var item = items.find(function (i) { return i.id === id; });
      if (item) { item.qty = Math.max(0, qty); }
      this.save(items.filter(function (i) { return i.qty > 0; }));
    },
    clear: function () { localStorage.removeItem(this.KEY); this.updateBadge(); this.updateDrawer(); },
    count: function () { return this.get().reduce(function (s, i) { return s + i.qty; }, 0); },
    total: function () { return this.get().reduce(function (s, i) { return s + i.price * i.qty; }, 0); },
    updateBadge: function () {
      var n = this.count();
      document.querySelectorAll('.cart-badge').forEach(function (b) {
        b.textContent = n;
        b.style.display = n > 0 ? 'flex' : 'none';
      });
    },
    updateDrawer: function () {
      var drawer = document.getElementById('cartDrawer');
      if (drawer) renderCartDrawerContent();
    },
    showToast: function (name) {
      var old = document.getElementById('cartToast');
      if (old) old.remove();
      var t = document.createElement('div');
      t.id = 'cartToast';
      t.className = 'cart-toast';
      t.innerHTML = '✓ <b>' + name + '</b> agregado &nbsp;<button onclick="Cart.openDrawer()" style="background:none;border:none;cursor:pointer;color:var(--m);font-weight:600;font-family:inherit;font-size:inherit;padding:0">Ver carrito →</button>';
      document.body.appendChild(t);
      setTimeout(function () { t.classList.add('show'); }, 10);
      setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 3500);
    },
    openDrawer: function () {
      var overlay = document.getElementById('cartOverlay');
      var drawer = document.getElementById('cartDrawer');
      if (overlay && drawer) {
        renderCartDrawerContent();
        overlay.classList.add('open');
        drawer.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    },
    closeDrawer: function () {
      var overlay = document.getElementById('cartOverlay');
      var drawer = document.getElementById('cartDrawer');
      if (overlay && drawer) {
        overlay.classList.remove('open');
        drawer.classList.remove('open');
        document.body.style.overflow = '';
      }
    }
  };

  function renderCartDrawerContent() {
    var body = document.getElementById('cartDrawerBody');
    var footer = document.getElementById('cartDrawerFooter');
    if (!body) return;
    var items = Cart.get();
    if (!items.length) {
      body.innerHTML = '<div class="drawer-empty"><div class="drawer-empty-icon">🛒</div><p>Tu carrito está vacío.</p><a href="/shop" class="btn btn-primary" style="margin-top:16px;display:inline-flex" onclick="Cart.closeDrawer()">Ver productos</a></div>';
      if (footer) footer.style.display = 'none';
      return;
    }
    if (footer) footer.style.display = 'flex';
    body.innerHTML = items.map(function (item, idx) {
      var thumbBg = {m:'linear-gradient(135deg,#EC008C,#BB006F)',c:'linear-gradient(135deg,#00AEEF,#0088CC)',y:'linear-gradient(135deg,#F5D800,#D4B800)',k:'linear-gradient(135deg,#333,#111)'}[item.color||'m'] || 'linear-gradient(135deg,#EC008C,#BB006F)';
      return '<div class="drawer-item" data-id="' + item.id + '">'
        + '<div class="drawer-item-thumb" style="background:' + thumbBg + '">' + (item.icon || '📦') + '</div>'
        + '<div class="drawer-item-info">'
        + '<span class="drawer-item-name">' + item.name + '</span>'
        + '<span class="drawer-item-unit">' + item.unit + '</span>'
        + '<div class="drawer-qty-row">'
        + '<div class="drawer-qty">'
        + '<button class="drawer-qty-btn" data-action="dec" data-idx="' + idx + '">−</button>'
        + '<span class="drawer-qty-num">' + item.qty + '</span>'
        + '<button class="drawer-qty-btn" data-action="inc" data-idx="' + idx + '">+</button>'
        + '</div>'
        + '<span class="drawer-item-price">$' + (item.price * item.qty).toLocaleString('es-AR') + '</span>'
        + '</div>'
        + '</div>'
        + '<button class="drawer-item-remove" data-id="' + item.id + '">✕</button>'
        + '</div>';
    }).join('');

    // Total
    var totalEl = document.getElementById('cartDrawerTotal');
    if (totalEl) totalEl.textContent = '$' + Cart.total().toLocaleString('es-AR');

    // Qty buttons
    body.querySelectorAll('.drawer-qty-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var items2 = Cart.get();
        var i = parseInt(btn.dataset.idx);
        if (btn.dataset.action === 'inc') { items2[i].qty++; }
        else { items2[i].qty = Math.max(0, items2[i].qty - 1); }
        Cart.save(items2.filter(function (x) { return x.qty > 0; }));
      });
    });

    // Remove buttons
    body.querySelectorAll('.drawer-item-remove').forEach(function (btn) {
      btn.addEventListener('click', function () { Cart.remove(btn.dataset.id); });
    });
  }

  // ─── LOGO ────────────────────────────────────────────────────────────────
  const logoMark = (lightSrc) => `
    <picture class="logo-mark" aria-hidden="true">
      <img src="${lightSrc || '/assets/logo-icon-tight.png'}" alt="" height="30">
    </picture>`;

  // ─── NAV ─────────────────────────────────────────────────────────────────
  const buildNav = (cfg) => `
  <nav class="nav" id="nav">
    <div class="nav-inner">
      <a href="/" class="nav-logo" aria-label="1000 Impresiones">
        ${logoMark(cfg.logoLight)}
        <span>Impresiones</span>
      </a>

      <div class="nav-links">

        <!-- TIENDA con dropdown -->
        <div class="nav-item has-dropdown" id="navTienda">
          <a href="/shop" class="nav-link${CURRENT === 'shop' ? ' active' : ''}" data-link="shop">
            Tienda
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="margin-left:4px;transition:transform .2s"><polyline points="6 9 12 15 18 9"/></svg>
          </a>
          <div class="nav-dropdown mega-menu" id="tiendaDropdown">
            <div class="mega-left" id="megaLeft"></div>
            <div class="mega-right" id="megaRight"></div>
          </div>
        </div>

        <!-- NOSOTROS & CONTACTO -->
        <a href="/nosotros" class="nav-link${CURRENT === 'nosotros' ? ' active' : ''}" data-link="nosotros">
          Nosotros & Contacto
        </a>

      </div><!-- /nav-links -->

      <!-- SEARCH BAR -->
      <div class="nav-search" id="navSearch">
        <svg class="nav-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" class="nav-search-input" id="navSearchInput" placeholder="Buscar productos..." autocomplete="off" aria-label="Buscar productos">
        <div class="nav-search-results" id="navSearchResults"></div>
      </div>

      <div class="nav-actions">
        <!-- CARRITO (abre drawer) -->
        <button class="nav-cart-btn" aria-label="Carrito de compras" id="navCartBtn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          <span class="cart-badge" id="cartBadge" style="display:none">0</span>
        </button>

        <!-- COTIZACIÓN -->
        <a href="/contacto" class="btn btn-primary btn-pill">Pedí tu cotización</a>

        <!-- HAMBURGER -->
        <button class="mobile-menu-btn" aria-label="Menú" id="mobileMenuBtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>

    </div>
  </nav>`;

  // ─── CART DRAWER HTML ─────────────────────────────────────────────────────
  const cartDrawerHTML = `
  <div class="cart-overlay" id="cartOverlay"></div>
  <div class="cart-drawer" id="cartDrawer" role="dialog" aria-label="Carrito de compras">
    <div class="cart-drawer-header">
      <span class="cart-drawer-title">Tu carrito</span>
      <button class="cart-drawer-close" id="cartDrawerClose" aria-label="Cerrar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="cart-drawer-body" id="cartDrawerBody"></div>
    <div class="cart-drawer-footer" id="cartDrawerFooter" style="display:none">
      <div class="drawer-total-row">
        <span class="drawer-total-label">Total estimado</span>
        <span class="drawer-total-amount" id="cartDrawerTotal">$0</span>
      </div>
      <p class="drawer-total-note">* Precio orientativo. Se confirma por WhatsApp.</p>
      <a href="/carrito" class="drawer-checkout-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Ir al checkout
      </a>
      <button class="drawer-wa-btn" id="drawerWaBtn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.559 4.122 1.533 5.856L0 24l6.341-1.516A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.857 0-3.599-.487-5.112-1.338l-.368-.216-3.765.9.95-3.668-.235-.384A10 10 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
        Consultar por WhatsApp
      </button>
    </div>
  </div>`;

  // ─── FOOTER ───────────────────────────────────────────────────────────────
  const footerHTML = `
  <footer class="footer">
    <div class="footer-inner">
      <div class="cmyk-bar" style="margin-bottom:var(--s7)"><span class="c"></span><span class="m"></span><span class="y"></span><span class="k"></span></div>
      <div class="footer-top">
        <div class="footer-brand">
          <img src="/assets/logo-icon-dark.png" alt="1000 Impresiones" style="height:48px;width:auto;margin-bottom:var(--s4)">
          <p>Soluciones creativas en diseño e impresión.</p>
          <p style="color:#ffffff66;font-size:13px;line-height:1.6;margin-top:var(--s4)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="display:inline;vertical-align:middle;margin-right:4px"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Ana María Janer 345, C1437 CABA<br>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="display:inline;vertical-align:middle;margin-right:4px"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Cafferata 2911, B1768 Villa Madero, GBA
          </p>
        </div>
        <div class="footer-col">
          <h4>Tienda</h4>
          <ul>
            <li><a href="/shop?cat=impresion">Impresión Digital</a></li>
            <li><a href="/shop?cat=diseno">Diseño Gráfico</a></li>
            <li><a href="/shop?cat=packaging">Packaging</a></li>
            <li><a href="/shop?cat=giganto">Gigantografías</a></li>
            <li><a href="/shop?cat=merch">Merchandising</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Empresa</h4>
          <ul>
            <li><a href="/nosotros">Nosotros</a></li>
            <li><a href="/trabajos">Portfolio</a></li>
            <li><a href="/contacto">Contacto</a></li>
            <li><a href="/carrito">Carrito</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Contacto</h4>
          <ul>
            <li><a href="mailto:ventas@milimpresiones.com">ventas@milimpresiones.com</a></li>
            <li><a href="https://wa.me/5491136365889" target="_blank">WhatsApp</a></li>
            <li><a href="https://www.instagram.com/1000_impresiones" target="_blank">Instagram</a></li>
            <li style="color:#ffffff99;font-size:13px;margin-top:8px">milimpresiones.com</li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <div>© 2026 1000 Impresiones · Todos los derechos reservados</div>
        <div style="display:flex;gap:16px">
          <a href="#" style="color:#ffffff99">Términos</a>
          <a href="#" style="color:#ffffff99">Privacidad</a>
        </div>
      </div>
    </div>
  </footer>`;

  // ─── WHATSAPP FLOAT ───────────────────────────────────────────────────────
  const waHTML = `
  <a href="https://wa.me/5491136365889" target="_blank" class="wa-float" aria-label="Escribinos por WhatsApp">
    <span class="wa-icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/></svg>
    </span>
    <span class="wa-float-text">Escribinos</span>
  </a>`;

  // ─── INIT ─────────────────────────────────────────────────────────────────
  function init(cfg) {
    cfg = cfg || {};

    document.documentElement.dataset.theme = 'light';
    document.documentElement.style.colorScheme = 'light';

    if (cfg.fontDisplay) document.documentElement.style.setProperty('--font-display', `'${cfg.fontDisplay}', ui-sans-serif, system-ui, sans-serif`);
    if (cfg.fontBody)    document.documentElement.style.setProperty('--font-body',    `'${cfg.fontBody}', ui-sans-serif, system-ui, sans-serif`);

    // Inject nav + cart drawer + footer + wa
    document.body.insertAdjacentHTML('afterbegin', buildNav(cfg));
    document.body.insertAdjacentHTML('beforeend', cartDrawerHTML);
    document.body.insertAdjacentHTML('beforeend', footerHTML);
    document.body.insertAdjacentHTML('beforeend', waHTML);

    // Init cart badge
    Cart.updateBadge();

    // ── NAV SCROLL ──
    var nav = document.getElementById('nav');
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ── CART DRAWER ──
    var cartBtn    = document.getElementById('navCartBtn');
    var cartClose  = document.getElementById('cartDrawerClose');
    var cartOverlay= document.getElementById('cartOverlay');
    var drawerWaBtn= document.getElementById('drawerWaBtn');

    if (cartBtn) cartBtn.addEventListener('click', function () { Cart.openDrawer(); });
    if (cartClose) cartClose.addEventListener('click', function () { Cart.closeDrawer(); });
    if (cartOverlay) cartOverlay.addEventListener('click', function () { Cart.closeDrawer(); });
    if (drawerWaBtn) {
      drawerWaBtn.addEventListener('click', function () {
        var items = Cart.get();
        var msg = 'Hola! Quiero consultar sobre mi pedido:\n\n'
          + items.map(function(i){ return '• ' + i.name + ' ×' + i.qty + ' → $' + (i.price*i.qty).toLocaleString('es-AR'); }).join('\n')
          + '\n\nTotal: $' + Cart.total().toLocaleString('es-AR');
        window.open('https://wa.me/5491136365889?text=' + encodeURIComponent(msg), '_blank');
      });
    }

    // ── TIENDA DROPDOWN ──
    var tiendaItem = document.getElementById('navTienda');
    var dropdown   = document.getElementById('tiendaDropdown');
    if (tiendaItem && dropdown) {
      var closeTimer;
      tiendaItem.addEventListener('mouseenter', function () {
        clearTimeout(closeTimer);
        dropdown.classList.add('open');
        tiendaItem.querySelector('svg').style.transform = 'rotate(180deg)';
      });
      tiendaItem.addEventListener('mouseleave', function () {
        closeTimer = setTimeout(function () {
          dropdown.classList.remove('open');
          tiendaItem.querySelector('svg').style.transform = '';
        }, 180);
      });
      dropdown.addEventListener('mouseenter', function () { clearTimeout(closeTimer); });
      dropdown.addEventListener('mouseleave', function () {
        closeTimer = setTimeout(function () {
          dropdown.classList.remove('open');
          tiendaItem.querySelector('svg').style.transform = '';
        }, 180);
      });
      tiendaItem.querySelector('.nav-link').addEventListener('click', function (e) {
        if (window.innerWidth < 860) {
          e.preventDefault();
          dropdown.classList.toggle('open');
        }
      });

      bindMegaHover();
    }

    // ── MOBILE DRAWER ──
    var mobileMenuBtn = document.getElementById('mobileMenuBtn');
    var mobileDrawer = document.createElement('div');
    mobileDrawer.className = 'mobile-drawer';
    mobileDrawer.innerHTML = [
      { href: '/shop',            label: 'Tienda',              key: 'shop'     },
      { href: '/shop?cat=impresion', label: '· Impresión',     key: ''         },
      { href: '/shop?cat=diseno',    label: '· Diseño',        key: ''         },
      { href: '/shop?cat=packaging', label: '· Packaging',     key: ''         },
      { href: '/shop?cat=giganto',   label: '· Gigantografías',key: ''         },
      { href: '/shop?cat=merch',     label: '· Merchandising', key: ''         },
      { href: '/nosotros',       label: 'Nosotros & Contacto', key: 'nosotros' },
      { href: '/carrito',        label: '🛒 Carrito',          key: 'carrito'  },
    ].map(function (l) {
      var sub = l.label.startsWith('·');
      return '<a href="' + l.href + '" class="' + (sub ? 'drawer-sub' : '') + (l.key === CURRENT ? ' active' : '') + '">' + l.label + '</a>';
    }).join('');
    document.body.appendChild(mobileDrawer);

    var toggleMobileDrawer = function (open) {
      mobileDrawer.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      if (mobileMenuBtn) {
        mobileMenuBtn.querySelector('svg').innerHTML = open
          ? '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'
          : '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>';
      }
    };
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', function () { toggleMobileDrawer(!mobileDrawer.classList.contains('open')); });
      mobileDrawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { toggleMobileDrawer(false); }); });
    }

    // ── SEARCH ──
    var searchInput   = document.getElementById('navSearchInput');
    var searchResults = document.getElementById('navSearchResults');
    var searchData    = null;

    function loadSearchData(cb) {
      if (searchData) { cb(searchData); return; }
      fetch('/content/productos.json').then(function(r){ return r.ok ? r.json() : null; })
        .catch(function(){ return null; })
        .then(function(d){ searchData = d && d.products ? d.products : []; cb(searchData); });
    }

    function renderSearchResults(results) {
      if (!results.length) {
        searchResults.innerHTML = '<div class="sr-empty">Sin resultados</div>';
        searchResults.classList.add('open');
        return;
      }
      searchResults.innerHTML = results.slice(0, 6).map(function(p) {
        return '<a class="sr-item" href="/shop/producto?id=' + encodeURIComponent(p.id || p.name) + '">'
          + '<span class="sr-dot" style="background:var(--' + (p.color||'m') + ')"></span>'
          + '<span class="sr-name">' + p.name + '</span>'
          + '<span class="sr-price">$' + (p.price||0).toLocaleString('es-AR') + '</span>'
          + '</a>';
      }).join('');
      searchResults.classList.add('open');
    }

    if (searchInput) {
      searchInput.addEventListener('focus', function() { loadSearchData(function(){}); });
      searchInput.addEventListener('input', function() {
        var q = searchInput.value.trim().toLowerCase();
        if (!q) { searchResults.classList.remove('open'); return; }
        loadSearchData(function(data) {
          var res = data.filter(function(p) {
            return p.name.toLowerCase().includes(q) || (p.category||'').toLowerCase().includes(q) || (p.cat||'').toLowerCase().includes(q);
          });
          renderSearchResults(res);
        });
      });
      document.addEventListener('click', function(e) {
        if (!document.getElementById('navSearch').contains(e.target)) {
          searchResults.classList.remove('open');
        }
      });
    }

    // ── SCROLL REVEAL ──
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
    window.__reObserveReveal = function () {
      document.querySelectorAll('.reveal:not(.in)').forEach(function (el) { io.observe(el); });
    };
  }

  // ── MEGA MENU BUILDER ──────────────────────────────────────────────────────
  var CHEV = '<svg class="mega-chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 6 15 12 9 18"/></svg>';

  function buildMegaMenu(categories) {
    var left  = document.getElementById('megaLeft');
    var right = document.getElementById('megaRight');
    if (!left || !right) return;
    left.innerHTML = categories.map(function(cat, i) {
      return '<a class="mega-cat-row' + (i === 0 ? ' active' : '') + '" data-panel="panel-' + cat.key + '" href="/shop?cat=' + cat.key + '">'
        + '<span class="mega-cat-icon">' + cat.icon + '</span>'
        + '<span class="mega-cat-label">' + cat.label + '</span>'
        + CHEV + '</a>';
    }).join('') + '<div class="mega-footer-link"><a href="/shop">Ver toda la tienda →</a></div>';
    right.innerHTML = categories.map(function(cat, i) {
      return '<div class="mega-panel' + (i === 0 ? ' active' : '') + '" id="panel-' + cat.key + '">'
        + '<a href="/shop?cat=' + cat.key + '" class="mega-panel-title">' + cat.label + ' →</a>'
        + (cat.subs || []).map(function(sub) {
            return '<a href="/shop?cat=' + cat.key + '" class="mega-sub">' + sub + '</a>';
          }).join('')
        + '</div>';
    }).join('');
    bindMegaHover();
  }

  function bindMegaHover() {
    var dd = document.getElementById('tiendaDropdown');
    if (!dd) return;
    dd.querySelectorAll('.mega-cat-row').forEach(function(row) {
      row.addEventListener('mouseenter', function() {
        dd.querySelectorAll('.mega-cat-row').forEach(function(r) { r.classList.remove('active'); });
        dd.querySelectorAll('.mega-panel').forEach(function(p) { p.classList.remove('active'); });
        row.classList.add('active');
        var panel = document.getElementById(row.dataset.panel);
        if (panel) panel.classList.add('active');
      });
    });
  }

  // Bootstrap — lee directo de GitHub via /api/content (sin delay de redeploy)
  Promise.all([
    fetch('/api/content?file=config-visual.json').then(function(r) { return r.ok ? r.json() : {}; }).catch(function() { return {}; }),
    fetch('/api/content?file=menu-categorias.json').then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; })
  ]).then(function(results) {
    init(results[0]);
    if (results[1] && results[1].categories) {
      buildMegaMenu(results[1].categories);
    }
  });

})();
