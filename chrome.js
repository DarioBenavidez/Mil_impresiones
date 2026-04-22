// Shared chrome: nav, footer, whatsapp float, tweaks, theme, scroll reveal
(function() {
  const CURRENT = document.body.dataset.page || 'home';

  // ---- Logo mark (uses custom logo if set in config-visual.json) ----
  const logoMark = (lightSrc, darkSrc) => `
    <picture class="logo-mark" aria-hidden="true">
      <img src="${lightSrc || 'assets/logo-icon-tight.png'}" alt="" class="logo-light" height="30">
      <img src="${darkSrc || 'assets/logo-icon-dark.png'}" alt="" class="logo-dark" height="30">
    </picture>`;

  // ---- Nav ----
  const buildNav = (cfg) => `
  <nav class="nav" id="nav">
    <div class="nav-inner">
      <a href="index.html" class="nav-logo" aria-label="1000 Impresiones">
        ${logoMark(cfg.logoLight, cfg.logoDark)}
        <span>Impresiones</span>
      </a>
      <div class="nav-links">
        <a href="index.html" data-link="home">Inicio</a>
        <a href="servicios.html" data-link="servicios">Servicios</a>
        <a href="trabajos.html" data-link="trabajos">Trabajos</a>
        <a href="nosotros.html" data-link="nosotros">Nosotros</a>
        <a href="contacto.html" data-link="contacto">Contacto</a>
      </div>
      <div class="nav-actions">
        <button class="theme-toggle" aria-label="Cambiar tema" id="themeToggle">
          <svg id="themeIcon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
        </button>
        <a href="contacto.html" class="btn btn-primary btn-pill">
          Pedí tu cotización
        </a>
        <button class="mobile-menu-btn" aria-label="Menú" id="mobileMenuBtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
    </div>
  </nav>`;

  // ---- Footer ----
  const footerHTML = `
  <footer class="footer">
    <div class="footer-inner">
      <div class="cmyk-bar" style="margin-bottom: var(--s7)"><span class="c"></span><span class="m"></span><span class="y"></span><span class="k"></span></div>
      <div class="footer-top">
        <div class="footer-brand">
          <img src="assets/logo-icon-dark.png" alt="1000 Impresiones" style="height:48px; width:auto; margin-bottom: var(--s4);">
          <p>Diseñamos, producimos y acompañamos.</p>
          <p style="color:#ffffff66; font-size:13px; line-height:1.6; margin-top: var(--s4);">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline; vertical-align:middle; margin-right:4px"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Ana María Janer 345, C1437 CABA<br>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline; vertical-align:middle; margin-right:4px"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Cafferata 2911, B1768 Villa Madero, GBA
          </p>
        </div>
        <div class="footer-col">
          <h4>Navegación</h4>
          <ul>
            <li><a href="index.html">Inicio</a></li>
            <li><a href="servicios.html">Servicios</a></li>
            <li><a href="trabajos.html">Trabajos</a></li>
            <li><a href="nosotros.html">Nosotros</a></li>
            <li><a href="contacto.html">Contacto</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Servicios</h4>
          <ul>
            <li><a href="servicios.html#impresion">Impresión digital</a></li>
            <li><a href="servicios.html#diseno">Diseño gráfico</a></li>
            <li><a href="servicios.html#packaging">Packaging</a></li>
            <li><a href="servicios.html#gigantografias">Gigantografías</a></li>
            <li><a href="servicios.html#merchandising">Merchandising / Souvenir</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Contacto</h4>
          <ul>
            <li><a href="mailto:ventas@milimpresiones.com">ventas@milimpresiones.com</a></li>
            <li><a href="https://wa.me/5491136365889" target="_blank">WhatsApp</a></li>
            <li><a href="https://www.instagram.com/1000_impresiones" target="_blank">Instagram</a></li>
            <li style="color:#ffffff99; font-size: 13px; margin-top: 8px;">milimpresiones.com</li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <div>© 2026 1000 Impresiones · Todos los derechos reservados</div>
        <div style="display:flex; gap:16px;">
          <a href="#" style="color:#ffffff99">Términos</a>
          <a href="#" style="color:#ffffff99">Privacidad</a>
        </div>
      </div>
    </div>
  </footer>`;

  // ---- WhatsApp float ----
  const waHTML = `
  <a href="https://wa.me/5491136365889" target="_blank" class="wa-float" aria-label="Escribinos por WhatsApp">
    <span class="wa-icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
      </svg>
    </span>
    <span class="wa-float-text">Escribinos</span>
  </a>`;

  // ---- Tweaks panel ----
  const tweaksHTML = `
  <div class="tweaks-panel" id="tweaksPanel">
    <h4>
      <span>Tweaks</span>
      <span style="display:inline-flex; gap:4px;"><span style="width:8px;height:8px;border-radius:50%;background:var(--c)"></span><span style="width:8px;height:8px;border-radius:50%;background:var(--m)"></span><span style="width:8px;height:8px;border-radius:50%;background:var(--y)"></span><span style="width:8px;height:8px;border-radius:50%;background:var(--ink)"></span></span>
    </h4>
    <div class="tweak-row">
      <div class="tweak-label">Color de acento</div>
      <div class="tweak-swatches" id="accentSwatches">
        <div class="tweak-swatch" data-accent="#EC008C" style="background:#EC008C"></div>
        <div class="tweak-swatch" data-accent="#00AEEF" style="background:#00AEEF"></div>
        <div class="tweak-swatch" data-accent="#FFE500" style="background:#FFE500"></div>
        <div class="tweak-swatch" data-accent="#111111" style="background:#111111"></div>
        <div class="tweak-swatch" data-accent="#FF6B35" style="background:#FF6B35"></div>
        <div class="tweak-swatch" data-accent="#7B2CBF" style="background:#7B2CBF"></div>
      </div>
    </div>
    <div class="tweak-row">
      <div class="tweak-label">Tipografía display</div>
      <div id="fontDisplayBtns">
        <button class="tweak-font-btn" data-font="'Space Grotesk'">Space Grotesk</button>
        <button class="tweak-font-btn" data-font="'Fraunces'">Fraunces</button>
        <button class="tweak-font-btn" data-font="'Bricolage Grotesque'">Bricolage</button>
        <button class="tweak-font-btn" data-font="'Archivo'">Archivo</button>
      </div>
    </div>
    <div class="tweak-row">
      <div class="tweak-label">Tipografía cuerpo</div>
      <div id="fontBodyBtns">
        <button class="tweak-font-btn" data-font="'DM Sans'">DM Sans</button>
        <button class="tweak-font-btn" data-font="'Inter'">Inter</button>
        <button class="tweak-font-btn" data-font="'IBM Plex Sans'">IBM Plex</button>
      </div>
    </div>
  </div>`;

  // ---- Apply visual config from JSON to CSS variables ----
  function applyVisualConfig(cfg) {
    if (!cfg) return;
    const r = document.documentElement;

    // Inline styles para variables que dark mode NO sobreescribe:
    // accent, CMYK primaries, fonts, container, radius
    if (cfg.accentColor) {
      r.style.setProperty('--accent', cfg.accentColor);
      r.style.setProperty('--m', cfg.accentColor);
    }
    if (cfg.cyanColor)   r.style.setProperty('--c', cfg.cyanColor);
    if (cfg.yellowColor) r.style.setProperty('--y', cfg.yellowColor);
    if (cfg.fontDisplay) {
      r.style.setProperty('--font-display', `'${cfg.fontDisplay}', ui-sans-serif, system-ui, sans-serif`);
    }
    if (cfg.fontBody) {
      r.style.setProperty('--font-body', `'${cfg.fontBody}', ui-sans-serif, system-ui, sans-serif`);
    }
    if (cfg.containerWidth) {
      r.style.setProperty('--container', cfg.containerWidth + 'px');
    }
    if (cfg.radiusBase !== undefined && cfg.radiusBase !== '') {
      const b = parseInt(cfg.radiusBase) || 18;
      r.style.setProperty('--radius-sm',  Math.round(b * 0.56) + 'px');
      r.style.setProperty('--radius',     b + 'px');
      r.style.setProperty('--radius-lg',  Math.round(b * 1.56) + 'px');
      r.style.setProperty('--radius-xl',  Math.round(b * 2.22) + 'px');
    }

    // Para colores de fondo y texto: usar <style> tag (NO inline)
    // así [data-theme="dark"] en styles.css puede seguir sobrescribiéndolos
    const paper = cfg.paperColor || '#F4F1EA';
    const ink   = cfg.inkColor   || '#1a1815';
    const styleTag = document.getElementById('__visual-cfg') || document.head.appendChild(
      Object.assign(document.createElement('style'), { id: '__visual-cfg' })
    );
    styleTag.textContent = `
      :root {
        --paper: ${paper};
        --ink:   ${ink};
      }
      [data-theme="dark"] {
        --bg:      #0B0B0C;
        --bg-2:    #141416;
        --fg:      #FAFAF7;
        --fg-2:    #D4D4CE;
        --fg-3:    #8A8A84;
        --border:  #24242A;
        --card:    #16161A;
        --paper:   #0B0B0C;
        --paper-2: #141416;
        --c-soft:  #062733;
        --m-soft:  #2E0820;
        --y-soft:  #2E2A05;
      }
    `;
  }

  // ---- Init (runs after visual config is fetched) ----
  function init(cfg) {
    cfg = cfg || {};

    // Apply CSS variables from config
    applyVisualConfig(cfg);

    // Inject DOM elements
    document.body.insertAdjacentHTML('afterbegin', buildNav(cfg));
    document.body.insertAdjacentHTML('beforeend', footerHTML);
    document.body.insertAdjacentHTML('beforeend', tweaksHTML);

    // Mark active nav link
    document.querySelectorAll(`.nav-links a[data-link="${CURRENT}"]`).forEach(a => a.classList.add('active'));

    // ---- Theme ----
    const applyTheme = (t) => {
      document.documentElement.dataset.theme = t;
      const icon = document.getElementById('themeIcon');
      if (t === 'dark') {
        icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
      } else {
        icon.innerHTML = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>';
      }
    };
    const savedTheme = localStorage.getItem('mili-theme') || 'light';
    applyTheme(savedTheme);
    document.getElementById('themeToggle').addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem('mili-theme', next);
    });

    // Nav scroll state
    const nav = document.getElementById('nav');
    const onScroll = () => {
      if (window.scrollY > 8) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = nav.querySelector('.nav-links');
    if (mobileMenuBtn && navLinks) {
      mobileMenuBtn.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('mobile-open');
        mobileMenuBtn.classList.toggle('open', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
        // Change icon: hamburger ↔ X
        mobileMenuBtn.querySelector('svg').innerHTML = isOpen
          ? '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'
          : '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>';
      });
      // Close on nav link click
      navLinks.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          navLinks.classList.remove('mobile-open');
          mobileMenuBtn.classList.remove('open');
          document.body.style.overflow = '';
        });
      });
    }

    // ---- Scroll reveal ----
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    window.__reObserveReveal = () => {
      document.querySelectorAll('.reveal:not(.in)').forEach(el => io.observe(el));
    };

    // ---- Tweaks ----
    const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
      "accent":      cfg.accentColor  || "#EC008C",
      "fontDisplay": cfg.fontDisplay  ? `'${cfg.fontDisplay}'` : "'Space Grotesk'",
      "fontBody":    cfg.fontBody     ? `'${cfg.fontBody}'`    : "'DM Sans'"
    }/*EDITMODE-END*/;

    const applyTweaks = (t) => {
      document.documentElement.style.setProperty('--accent', t.accent);
      document.documentElement.style.setProperty('--font-display', `${t.fontDisplay}, ui-sans-serif, system-ui, sans-serif`);
      document.documentElement.style.setProperty('--font-body', `${t.fontBody}, ui-sans-serif, system-ui, sans-serif`);
      document.querySelectorAll('#accentSwatches .tweak-swatch').forEach(s => {
        s.classList.toggle('active', s.dataset.accent.toLowerCase() === t.accent.toLowerCase());
      });
      document.querySelectorAll('#fontDisplayBtns .tweak-font-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.font === t.fontDisplay);
      });
      document.querySelectorAll('#fontBodyBtns .tweak-font-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.font === t.fontBody);
      });
    };

    const state = { ...TWEAK_DEFAULTS };
    applyTweaks(state);

    const notifyHost = () => {
      try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: state }, '*'); } catch(e){}
    };

    document.querySelectorAll('#accentSwatches .tweak-swatch').forEach(s => {
      s.addEventListener('click', () => { state.accent = s.dataset.accent; applyTweaks(state); notifyHost(); });
    });
    document.querySelectorAll('#fontDisplayBtns .tweak-font-btn').forEach(b => {
      b.addEventListener('click', () => { state.fontDisplay = b.dataset.font; applyTweaks(state); notifyHost(); });
    });
    document.querySelectorAll('#fontBodyBtns .tweak-font-btn').forEach(b => {
      b.addEventListener('click', () => { state.fontBody = b.dataset.font; applyTweaks(state); notifyHost(); });
    });

    // ---- Edit mode messaging ----
    window.addEventListener('message', (e) => {
      const d = e.data || {};
      if (d.type === '__activate_edit_mode') {
        document.getElementById('tweaksPanel').classList.add('on');
      } else if (d.type === '__deactivate_edit_mode') {
        document.getElementById('tweaksPanel').classList.remove('on');
      }
    });
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch(e){}
  }

  // ---- Bootstrap: load visual config, then init ----
  fetch('/content/config-visual.json')
    .then(r => r.ok ? r.json() : {})
    .catch(() => ({}))
    .then(cfg => init(cfg));

})();
