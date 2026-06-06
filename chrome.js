// chrome.js v4 — nav 3 ítems, carrito sin login, light mode permanente
(function () {
  const CURRENT = document.body.dataset.page || 'home';

  // ─── CART ENGINE (localStorage, sin login) ───────────────────────────────
  window.Cart = {
    KEY: 'mili_cart',
    get: function () {
      try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); } catch (_) { return []; }
    },
    save: function (items) {
      localStorage.setItem(this.KEY, JSON.stringify(items));
      this.updateBadge();
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
    clear: function () { localStorage.removeItem(this.KEY); this.updateBadge(); },
    count: function () { return this.get().reduce(function (s, i) { return s + i.qty; }, 0); },
    total: function () { return this.get().reduce(function (s, i) { return s + i.price * i.qty; }, 0); },
    updateBadge: function () {
      var n = this.count();
      document.querySelectorAll('.cart-badge').forEach(function (b) {
        b.textContent = n;
        b.style.display = n > 0 ? 'flex' : 'none';
      });
    },
    showToast: function (name) {
      var old = document.getElementById('cartToast');
      if (old) old.remove();
      var t = document.createElement('div');
      t.id = 'cartToast';
      t.className = 'cart-toast';
      t.innerHTML = '✓ <b>' + name + '</b> agregado al carrito &nbsp;<a href="/carrito">Ver carrito →</a>';
      document.body.appendChild(t);
      setTimeout(function () { t.classList.add('show'); }, 10);
      setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 3500);
    }
  };

  // ─── LOGO ────────────────────────────────────────────────────────────────
  const logoMark = (lightSrc) => `
    <picture class="logo-mark" aria-hidden="true">
      <img src="${lightSrc || 'assets/logo-icon-tight.png'}" alt="" height="30">
    </picture>`;

  // ─── NAV (3 ítems: Tienda dropdown | Nosotros & Contacto | Carrito) ──────
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
          <a href="/" class="nav-link${CURRENT === 'home' ? ' active' : ''}" data-link="home">
            Tienda
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="margin-left:4px;transition:transform .2s"><polyline points="6 9 12 15 18 9"/></svg>
          </a>
          <div class="nav-dropdown" id="tiendaDropdown">
            <div class="dropdown-grid">

              <div class="dropdown-col">
                <span class="dropdown-heading">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="8" height="10" rx="1"/><rect x="13" y="3" width="8" height="6" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/><rect x="3" y="17" width="8" height="4" rx="1"/></svg>
                  Impresión Digital
                </span>
                <a href="/?cat=impresion&sub=flyers">Flyers y volantes</a>
                <a href="/?cat=impresion&sub=tarjetas">Tarjetas personales</a>
                <a href="/?cat=impresion&sub=folletos">Folletos y trípticos</a>
                <a href="/?cat=impresion&sub=afiches">Afiches y carteles</a>
                <a href="/?cat=impresion&sub=sobres">Sobres y papelería</a>
              </div>

              <div class="dropdown-col">
                <span class="dropdown-heading">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  Diseño Gráfico
                </span>
                <a href="/?cat=diseno&sub=logo">Logo y marca</a>
                <a href="/?cat=diseno&sub=logotipo">Logotipo tipográfico</a>
                <a href="/?cat=diseno&sub=tarjetas-digitales">Tarjetas virtuales</a>
                <a href="/?cat=diseno&sub=invitaciones">Invitaciones digitales</a>
                <a href="/?cat=diseno&sub=social">Diseño para redes</a>
              </div>

              <div class="dropdown-col">
                <span class="dropdown-heading">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
                  Packaging
                </span>
                <a href="/?cat=packaging&sub=etiquetas">Etiquetas autoadhesivas</a>
                <a href="/?cat=packaging&sub=cajas">Cajas troqueladas</a>
                <a href="/?cat=packaging&sub=bolsas">Bolsas con logo</a>
                <a href="/?cat=packaging&sub=stickers">Stickers y sellos</a>
              </div>

              <div class="dropdown-col">
                <span class="dropdown-heading">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Más categorías
                </span>
                <a href="/?cat=giganto">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="margin-right:4px"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                  Gigantografías
                </a>
                <a href="/?cat=giganto&sub=banners">· Banners y lonas</a>
                <a href="/?cat=giganto&sub=vinilos">· Vinilos y adhesivos</a>
                <a href="/?cat=merch">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="margin-right:4px"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                  Merchandising
                </a>
                <a href="/?cat=merch&sub=remeras">· Remeras y ropa</a>
                <a href="/?cat=merch&sub=tazas">· Tazas y objetos</a>
              </div>

            </div>
            <div class="dropdown-footer">
              <a href="/servicios">Ver todos los servicios →</a>
            </div>
          </div>
        </div>

        <!-- NOSOTROS & CONTACTO -->
        <a href="/nosotros" class="nav-link${CURRENT === 'nosotros' ? ' active' : ''}" data-link="nosotros">
          Nosotros & Contacto
        </a>

      </div><!-- /nav-links -->

      <div class="nav-actions">
        <!-- CARRITO -->
        <a href="/carrito" class="nav-cart-btn" aria-label="Carrito de compras" id="navCartBtn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          <span class="cart-badge" id="cartBadge" style="display:none">0</span>
        </a>

        <!-- COTIZACIÓN -->
        <a href="/contacto" class="btn btn-primary btn-pill">Pedí tu cotización</a>

        <!-- HAMBURGER -->
        <button class="mobile-menu-btn" aria-label="Menú" id="mobileMenuBtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>

    </div>
  </nav>`;

  // ─── FOOTER ──────────────────────────────────────────────────────────────
  const footerHTML = `
  <footer class="footer">
    <div class="footer-inner">
      <div class="cmyk-bar" style="margin-bottom:var(--s7)"><span class="c"></span><span class="m"></span><span class="y"></span><span class="k"></span></div>
      <div class="footer-top">
        <div class="footer-brand">
          <img src="assets/logo-icon-dark.png" alt="1000 Impresiones" style="height:48px;width:auto;margin-bottom:var(--s4)">
          <p>Diseñamos, producimos y acompañamos.</p>
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
            <li><a href="/?cat=impresion">Impresión Digital</a></li>
            <li><a href="/?cat=diseno">Diseño Gráfico</a></li>
            <li><a href="/?cat=packaging">Packaging</a></li>
            <li><a href="/?cat=giganto">Gigantografías</a></li>
            <li><a href="/?cat=merch">Merchandising</a></li>
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

    // FORCE light mode permanently — no dark mode
    document.documentElement.dataset.theme = 'light';
    document.documentElement.style.colorScheme = 'light';

    // Apply font/color config if present
    if (cfg.fontDisplay) document.documentElement.style.setProperty('--font-display', `'${cfg.fontDisplay}', ui-sans-serif, system-ui, sans-serif`);
    if (cfg.fontBody)    document.documentElement.style.setProperty('--font-body',    `'${cfg.fontBody}', ui-sans-serif, system-ui, sans-serif`);

    // Inject nav + footer + wa
    document.body.insertAdjacentHTML('afterbegin', buildNav(cfg));
    document.body.insertAdjacentHTML('beforeend', footerHTML);
    document.body.insertAdjacentHTML('beforeend', waHTML);

    // Init cart badge
    Cart.updateBadge();

    // Nav scroll state
    var nav = document.getElementById('nav');
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

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
      // Click on mobile
      tiendaItem.querySelector('.nav-link').addEventListener('click', function (e) {
        if (window.innerWidth < 860) {
          e.preventDefault();
          dropdown.classList.toggle('open');
        }
      });
    }

    // ── MOBILE DRAWER ──
    var mobileMenuBtn = document.getElementById('mobileMenuBtn');
    var drawer = document.createElement('div');
    drawer.className = 'mobile-drawer';
    drawer.innerHTML = [
      { href: '/',          label: 'Tienda',              key: 'home'     },
      { href: '/?cat=impresion', label: '· Impresión Digital', key: ''   },
      { href: '/?cat=diseno',    label: '· Diseño Gráfico',    key: ''   },
      { href: '/?cat=packaging', label: '· Packaging',          key: ''  },
      { href: '/?cat=giganto',   label: '· Gigantografías',     key: ''  },
      { href: '/?cat=merch',     label: '· Merchandising',      key: ''  },
      { href: '/nosotros',  label: 'Nosotros & Contacto', key: 'nosotros' },
      { href: '/carrito',   label: '🛒 Carrito',          key: 'carrito'  },
    ].map(function (l) {
      var sub = l.label.startsWith('·');
      return '<a href="' + l.href + '" class="' + (sub ? 'drawer-sub' : '') + (l.key === CURRENT ? ' active' : '') + '">' + l.label + '</a>';
    }).join('');
    document.body.appendChild(drawer);

    var toggleDrawer = function (open) {
      drawer.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      if (mobileMenuBtn) {
        mobileMenuBtn.querySelector('svg').innerHTML = open
          ? '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'
          : '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>';
      }
    };
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', function () { toggleDrawer(!drawer.classList.contains('open')); });
      drawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { toggleDrawer(false); }); });
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

  // Bootstrap
  fetch('/content/config-visual.json')
    .then(function (r) { return r.ok ? r.json() : {}; })
    .catch(function () { return {}; })
    .then(function (cfg) { init(cfg); });

})();
