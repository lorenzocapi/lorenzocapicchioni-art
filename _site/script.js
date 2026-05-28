/**
 * LORENZO CAPICCHIONI ART — Interazioni base
 *
 * Moduli:
 * 1. Gestione tema dark/light con localStorage
 * 2. Overlay INFO (apertura, chiusura, focus trap, ESC)
 * 3. Lazy loading immagini con blur placeholder
 * 4. Protezione immagini (drag, right-click)
 * 5. Utilità generali
 */

/* =============================================
   IIFE — tutto in scope isolato
   ============================================= */
(function () {
  'use strict';

  /* ==========================================
     1. TEMA DARK / LIGHT
     ========================================== */

  const CHIAVE_TEMA = 'lca-theme';
  const html = document.documentElement;
  const switchTema = document.getElementById('themeSwitch');

  /**
   * Legge il tema da localStorage.
   * Default: dark.
   */
  function leggiTema() {
    try {
      return localStorage.getItem(CHIAVE_TEMA) || 'dark';
    } catch (e) {
      return 'dark';
    }
  }

  /**
   * Applica il tema all'elemento <html> e aggiorna
   * l'aria-label dello switch.
   */
  function applicaTema(tema) {
    html.setAttribute('data-theme', tema);

    if (switchTema) {
      switchTema.setAttribute(
        'aria-label',
        tema === 'dark' ? 'Toggle light mode' : 'Toggle dark mode'
      );
    }
  }

  /**
   * Salva e applica il tema.
   */
  function salvaTema(tema) {
    try {
      localStorage.setItem(CHIAVE_TEMA, tema);
    } catch (e) {}
    applicaTema(tema);
  }

  /**
   * Alterna tra dark e light.
   */
  function alternaTema() {
    const corrente = leggiTema();
    salvaTema(corrente === 'dark' ? 'light' : 'dark');
  }

  // Inizializzazione: applica il tema salvato
  // (il FOUC è prevenuto dall'inline script nel <head>)
  applicaTema(leggiTema());

  if (switchTema) {
    switchTema.addEventListener('click', alternaTema);
  }

  /* ==========================================
     2. OVERLAY INFO
     ========================================== */

  const overlay = document.getElementById('infoOverlay');
  const triggerInfo = document.getElementById('infoTrigger');
  const chiudiInfo = document.getElementById('infoChiudi');

  // Elementi focusabili nell'overlay — per focus trap
  const SELETTORI_FOCUS =
    'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';

  let ultimoFocusEsterno = null; // elemento che aveva focus prima dell'apertura

  /**
   * Apre l'overlay INFO.
   */
  function apriOverlay() {
    if (!overlay) return;

    ultimoFocusEsterno = document.activeElement;

    overlay.classList.add('is-aperto');
    overlay.setAttribute('aria-hidden', 'false');

    if (triggerInfo) {
      triggerInfo.setAttribute('aria-expanded', 'true');
    }

    // Blocca scroll del body
    document.body.style.overflow = 'hidden';

    // Sposta il focus al primo elemento focusabile nell'overlay
    requestAnimationFrame(function () {
      const primoFocus = overlay.querySelector(SELETTORI_FOCUS);
      if (primoFocus) primoFocus.focus();
    });
  }

  /**
   * Chiude l'overlay INFO.
   */
  function chiudiOverlay() {
    if (!overlay) return;

    overlay.classList.remove('is-aperto');
    overlay.setAttribute('aria-hidden', 'true');

    if (triggerInfo) {
      triggerInfo.setAttribute('aria-expanded', 'false');
    }

    // Ripristina scroll
    document.body.style.overflow = '';

    // Restituisce il focus all'elemento di origine
    if (ultimoFocusEsterno) {
      ultimoFocusEsterno.focus();
      ultimoFocusEsterno = null;
    }
  }

  /**
   * Focus trap: mantiene il focus all'interno dell'overlay
   * quando è aperto. (Tab / Shift+Tab ciclano tra gli
   * elementi focusabili dell'overlay.)
   */
  function gestisciFocusTrap(event) {
    if (!overlay || !overlay.classList.contains('is-aperto')) return;

    const elementi = Array.from(overlay.querySelectorAll(SELETTORI_FOCUS));
    if (!elementi.length) return;

    const primo = elementi[0];
    const ultimo = elementi[elementi.length - 1];

    if (event.key === 'Tab') {
      if (event.shiftKey) {
        // Shift+Tab: se siamo sul primo, salta all'ultimo
        if (document.activeElement === primo) {
          event.preventDefault();
          ultimo.focus();
        }
      } else {
        // Tab: se siamo sull'ultimo, salta al primo
        if (document.activeElement === ultimo) {
          event.preventDefault();
          primo.focus();
        }
      }
    }
  }

  // Event listeners overlay
  if (triggerInfo) {
    triggerInfo.addEventListener('click', apriOverlay);
  }

  if (chiudiInfo) {
    chiudiInfo.addEventListener('click', chiudiOverlay);
  }

  // Chiusura via ESC
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && overlay && overlay.classList.contains('is-aperto')) {
      chiudiOverlay();
    }
    gestisciFocusTrap(event);
  });

  // Chiusura via click sull'overlay (non sul contenuto)
  if (overlay) {
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) {
        chiudiOverlay();
      }
    });
  }

  /* ==========================================
     3. LAZY LOADING IMMAGINI — Blur placeholder
     ========================================== */

  /**
   * Osserva le immagini con la classe .img-lazy.
   * Quando entrano nel viewport:
   * - imposta src / srcset dal data attribute
   * - al caricamento aggiunge .is-caricata (rimuove blur)
   */
  function inizializzaLazyLoading() {
    // IntersectionObserver: ampiamente supportato
    if (!('IntersectionObserver' in window)) {
      // Fallback: carica tutte immediatamente
      document.querySelectorAll('img.img-lazy[data-src]').forEach(function (img) {
        caricaImmagine(img);
      });
      return;
    }

    const opzioni = {
      rootMargin: '200px 0px', // inizia a caricare 200px prima
      threshold: 0
    };

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          caricaImmagine(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, opzioni);

    document.querySelectorAll('img.img-lazy[data-src]').forEach(function (img) {
      observer.observe(img);
    });
  }

  /**
   * Carica effettivamente un'immagine lazy.
   * Sposta data-src → src e data-srcset → srcset.
   */
  function caricaImmagine(img) {
    var src = img.dataset.src;
    var srcset = img.dataset.srcset;

    if (!src) return;

    // Listener: quando l'immagine è caricata, rimuove il blur
    img.addEventListener('load', function () {
      img.classList.add('is-caricata');
    });

    img.addEventListener('error', function () {
      // Immagine non trovata: rimuoviamo comunque il blur
      // per non lasciare l'UI bloccata in stato di caricamento
      img.classList.add('is-caricata');
    });

    if (srcset) img.srcset = srcset;
    img.src = src;
  }

  // Avvia lazy loading al DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inizializzaLazyLoading);
  } else {
    inizializzaLazyLoading();
  }

  /* ==========================================
     4. PROTEZIONE IMMAGINI
     ========================================== */

  /**
   * Disabilita il menu contestuale (right-click) sulle immagini.
   * Disabilita il drag delle immagini.
   * Non usa overlay invasivi — solo UX leggera.
   */
  document.addEventListener('contextmenu', function (event) {
    if (event.target.tagName === 'IMG') {
      event.preventDefault();
    }
  });

  document.addEventListener('dragstart', function (event) {
    if (event.target.tagName === 'IMG') {
      event.preventDefault();
    }
  });

  /* ==========================================
     5. UTILITÀ GENERALI
     ========================================== */

  /**
   * Gestione transizione di pagina (per uso futuro).
   * Aggiunge classe .page-leaving al body prima di
   * navigare, per permettere animazioni di uscita.
   */
  document.querySelectorAll('a[href]').forEach(function (link) {
    // Solo link interni e non ancorati
    var href = link.getAttribute('href');
    if (
      href &&
      !href.startsWith('#') &&
      !href.startsWith('mailto:') &&
      !href.startsWith('http') &&
      !href.startsWith('//')
    ) {
      link.addEventListener('click', function (event) {
        // Lascia spazio per future animazioni di uscita
        // Per ora non interrompe la navigazione
      });
    }
  });

  /**
   * Salva e legge preferenze generali da localStorage.
   * API pubblica: window.LCA.prefs
   *
   * Usata dai moduli futuri (categoria portfolio, vista lista/griglia)
   */
  window.LCA = window.LCA || {};

  window.LCA.prefs = {
    CHIAVE_CATEGORIA: 'lca-categoria',
    CHIAVE_VISTA:     'lca-vista',

    salva: function (chiave, valore) {
      try {
        localStorage.setItem(chiave, valore);
      } catch (e) {}
    },

    leggi: function (chiave, fallback) {
      try {
        return localStorage.getItem(chiave) || fallback || null;
      } catch (e) {
        return fallback || null;
      }
    },

    rimuovi: function (chiave) {
      try {
        localStorage.removeItem(chiave);
      } catch (e) {}
    }
  };

  /**
   * Espone utilità per i moduli futuri (portfolio, gallery).
   */
  window.LCA.apriOverlay = apriOverlay;
  window.LCA.chiudiOverlay = chiudiOverlay;
  window.LCA.caricaImmagine = caricaImmagine;

})();

/* =============================================
   MODULO PORTFOLIO
   - Filtro categorie con localStorage
   - Switch lista / griglia
   - Hover preview che segue il cursore (solo desktop, solo vista lista)
   ============================================= */
(function () {
  'use strict';

  /* ----------------------------------------
     Costanti e riferimenti DOM
     ---------------------------------------- */

  const CHIAVE_CATEGORIA = 'lca-categoria';
  const CHIAVE_VISTA     = 'lca-vista';
  const CAT_DEFAULT      = 'Paintings';

  const pannello    = document.getElementById('pannello-opere');
  const vistaLista  = document.getElementById('vistaLista');
  const vistaGriglia = document.getElementById('vistaGriglia');
  const vuoto       = document.getElementById('portfolioVuoto');
  const tabs        = document.querySelectorAll('.portfolio__cat');
  const btnLista    = document.getElementById('btnLista');
  const btnGriglia  = document.getElementById('btnGriglia');
  const hoverPreview = document.getElementById('hoverPreview');
  const hoverImg     = hoverPreview ? hoverPreview.querySelector('.hover-preview__img') : null;

  // Esci se non siamo nella pagina portfolio
  if (!pannello || !vistaLista || !vistaGriglia) return;

  /* ----------------------------------------
     1. FILTRO CATEGORIE
     ---------------------------------------- */

  /**
   * Mostra solo le opere della categoria indicata
   * in entrambe le viste (lista e griglia).
   * Aggiunge/rimuove visibilità senza ricarica pagina.
   */
  function filtraCategoria(categoria) {
    // Aggiorna aria-selected sui tab
    tabs.forEach(function (tab) {
      const attivo = tab.dataset.categoria === categoria;
      tab.setAttribute('aria-selected', attivo ? 'true' : 'false');
    });

    // Transizione morbida
    pannello.classList.add('is-transitioning');

    setTimeout(function () {
      var conteggioVisibili = 0;

      // Lista
      vistaLista.querySelectorAll('.lista__opera').forEach(function (li) {
        const visibile = li.dataset.categoria === categoria;
        li.hidden = !visibile;
        if (visibile) conteggioVisibili++;
      });

      // Griglia
      vistaGriglia.querySelectorAll('.griglia__opera').forEach(function (li) {
        const visibile = li.dataset.categoria === categoria;
        li.hidden = !visibile;
      });

      // Stato vuoto
      if (vuoto) {
        vuoto.hidden = conteggioVisibili > 0;
      }

      // Riavvia animazioni fade-in sugli elementi visibili
      riavviaFadeIn(vistaLista);
      riavviaFadeIn(vistaGriglia);

      // Avvia lazy loading per le nuove immagini esposte
      if (window.LCA && window.LCA.caricaImmagine) {
        vistaLista.querySelectorAll('img.img-lazy[data-src]:not([src])').forEach(function (img) {
          if (!img.closest('[hidden]')) window.LCA.caricaImmagine(img);
        });
      }

      pannello.classList.remove('is-transitioning');

    }, 220); // pari alla durata transizione opacity

    // Salva in localStorage
    try {
      localStorage.setItem(CHIAVE_CATEGORIA, categoria);
    } catch (e) {}
  }

  /**
   * Riavvia le animazioni fade-in degli elementi visibili
   * re-aggiungendo la classe dopo un reflow.
   */
  function riavviaFadeIn(contenitore) {
    contenitore.querySelectorAll('.fade-in:not([hidden])').forEach(function (el) {
      el.classList.remove('fade-in');
      void el.offsetWidth; // forza reflow
      el.classList.add('fade-in');
    });
  }

  // Event listener sui tab
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      filtraCategoria(tab.dataset.categoria);
    });
  });

  // Inizializzazione: ripristina ultima categoria o usa default
  var categoriaSalvata;
  try {
    categoriaSalvata = localStorage.getItem(CHIAVE_CATEGORIA) || CAT_DEFAULT;
  } catch (e) {
    categoriaSalvata = CAT_DEFAULT;
  }
  filtraCategoria(categoriaSalvata);

  /* ----------------------------------------
     2. SWITCH VISTA: Lista / Griglia
     ---------------------------------------- */

  /**
   * Cambia la vista attiva.
   * Salva la preferenza in localStorage.
   */
  function cambiaVista(vista) {
    const isLista = vista === 'lista';

    vistaLista.hidden  = !isLista;
    vistaGriglia.hidden = isLista;

    // Aggiorna pulsanti
    if (btnLista) {
      btnLista.classList.toggle('is-attivo', isLista);
      btnLista.setAttribute('aria-pressed', isLista ? 'true' : 'false');
    }
    if (btnGriglia) {
      btnGriglia.classList.toggle('is-attivo', !isLista);
      btnGriglia.setAttribute('aria-pressed', !isLista ? 'true' : 'false');
    }

    // Su mobile usa sempre griglia — nasconde hover preview
    if (hoverPreview) {
      hoverPreview.style.display = isLista ? '' : 'none';
    }

    // Lazy loading immagini della griglia appena mostrata
    if (!isLista && window.LCA && window.LCA.caricaImmagine) {
      vistaGriglia.querySelectorAll('img.img-lazy[data-src]:not([src])').forEach(function (img) {
        if (!img.closest('[hidden]')) window.LCA.caricaImmagine(img);
      });
    }

    try {
      localStorage.setItem(CHIAVE_VISTA, vista);
    } catch (e) {}
  }

  if (btnLista)   btnLista.addEventListener('click',   function () { cambiaVista('lista'); });
  if (btnGriglia) btnGriglia.addEventListener('click', function () { cambiaVista('griglia'); });

  // Inizializza vista salvata; su mobile default griglia
  var vistaSalvata;
  try {
    var isMobile = window.matchMedia('(max-width: 768px)').matches;
    vistaSalvata = isMobile
      ? 'griglia'
      : (localStorage.getItem(CHIAVE_VISTA) || 'lista');
  } catch (e) {
    vistaSalvata = 'lista';
  }
  cambiaVista(vistaSalvata);

  /* ----------------------------------------
     3. HOVER PREVIEW — Desktop lista
     Immagine grande che segue il cursore
     ---------------------------------------- */

  if (!hoverPreview || !hoverImg) return;

  var offsetX = 24; // distanza orizzontale dal cursore
  var offsetY = -20;

  /**
   * Aggiorna la posizione del preview seguendo il mouse.
   * Inverte automaticamente se si avvicina ai bordi.
   */
  function aggiornaPosizione(e) {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var pw = hoverPreview.offsetWidth  || 300;
    var ph = hoverPreview.offsetHeight || 400;

    var x = e.clientX + offsetX;
    var y = e.clientY + offsetY;

    // Evita uscita a destra
    if (x + pw > vw - 20) x = e.clientX - pw - offsetX;
    // Evita uscita in basso
    if (y + ph > vh - 20) y = vh - ph - 20;
    // Evita uscita in alto
    if (y < 20) y = 20;

    hoverPreview.style.left = x + 'px';
    hoverPreview.style.top  = y + 'px';
  }

  var ultimaSrc = '';

  /**
   * Mostra l'immagine di preview per un'opera in hover.
   */
  function mostraPreview(cover, alt) {
    if (!cover) return;

    // Evita reload inutile se è già la stessa immagine
    if (cover !== ultimaSrc) {
      hoverImg.src = cover;
      hoverImg.alt = alt || '';
      ultimaSrc = cover;
    }

    hoverPreview.classList.add('is-visibile');
  }

  function nascondiPreview() {
    hoverPreview.classList.remove('is-visibile');
  }

  // Listener su ogni riga della lista
  vistaLista.querySelectorAll('.lista__opera').forEach(function (li) {
    li.addEventListener('mouseenter', function () {
      if (li.hidden) return;
      mostraPreview(li.dataset.cover, li.dataset.alt);
    });

    li.addEventListener('mouseleave', nascondiPreview);
  });

  document.addEventListener('mousemove', function (e) {
    if (hoverPreview.classList.contains('is-visibile')) {
      aggiornaPosizione(e);
    }
  });

})();
