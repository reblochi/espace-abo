/**
 * Advercity Widget - Formulaires de demarches administratives
 *
 * Usage:
 *   <script src="https://espace-abo.advercity.fr/widget/advercity-widget.js"></script>
 *   <button data-advercity="acte-naissance">Demander un acte de naissance</button>
 *
 * Ou via l'API JS:
 *   Advercity.open('acte-naissance', { partner: 'fridefont' });
 *
 * Configuration globale (optionnelle):
 *   <script>
 *     window.ADVERCITY_CONFIG = {
 *       baseUrl: 'https://espace-abo.advercity.fr',
 *       partner: 'fridefont',
 *       theme: 'light',
 *     };
 *   </script>
 */
(function () {
  'use strict';

  // --- Configuration ---
  var userConfig = window.ADVERCITY_CONFIG || {};
  var BASE_URL = userConfig.baseUrl || 'https://espace-abo.mesdemarchesapp.fr';
  var PARTNER = userConfig.partner || 'default';

  // Types de demarches supportees
  var FORM_TYPES = {
    'acte-naissance': {
      title: 'Demande d\u2019acte de naissance',
      path: '/embed/acte-naissance',
    },
    // A venir:
    // 'acte-mariage': { title: 'Demande d\'acte de mariage', path: '/embed/acte-mariage' },
    // 'acte-deces': { title: 'Demande d\'acte de deces', path: '/embed/acte-deces' },
    // 'carte-grise': { title: 'Carte grise', path: '/embed/carte-grise' },
  };

  // --- Styles du widget (injectes une seule fois) ---
  var STYLES_ID = 'advercity-widget-styles';

  function injectStyles() {
    if (document.getElementById(STYLES_ID)) return;

    var css = [
      // Overlay
      '.advercity-overlay {',
      '  position: fixed;',
      '  top: 0; left: 0; right: 0; bottom: 0;',
      '  z-index: 999999;',
      '  background: rgba(0, 0, 0, 0.6);',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  padding: 16px;',
      '  opacity: 0;',
      '  transition: opacity 0.25s ease;',
      '}',
      '.advercity-overlay.advercity-visible {',
      '  opacity: 1;',
      '}',

      // Modal container
      '.advercity-modal {',
      '  background: #fff;',
      '  border-radius: 12px;',
      '  width: 100%;',
      '  max-width: 720px;',
      '  max-height: 90vh;',
      '  display: flex;',
      '  flex-direction: column;',
      '  overflow: hidden;',
      '  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);',
      '  transform: translateY(20px);',
      '  transition: transform 0.25s ease;',
      '}',
      '.advercity-visible .advercity-modal {',
      '  transform: translateY(0);',
      '}',

      // Header
      '.advercity-header {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  padding: 16px 20px;',
      '  border-bottom: 1px solid #e5e7eb;',
      '  background: #f9fafb;',
      '}',
      '.advercity-title {',
      '  font-family: system-ui, -apple-system, sans-serif;',
      '  font-size: 16px;',
      '  font-weight: 600;',
      '  color: #111827;',
      '  margin: 0;',
      '}',
      '.advercity-badge {',
      '  font-family: system-ui, -apple-system, sans-serif;',
      '  font-size: 11px;',
      '  color: #6b7280;',
      '  background: #e5e7eb;',
      '  padding: 2px 8px;',
      '  border-radius: 9999px;',
      '}',
      '.advercity-close {',
      '  background: none;',
      '  border: none;',
      '  cursor: pointer;',
      '  width: 32px;',
      '  height: 32px;',
      '  border-radius: 8px;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  color: #6b7280;',
      '  transition: background 0.15s, color 0.15s;',
      '}',
      '.advercity-close:hover {',
      '  background: #e5e7eb;',
      '  color: #111827;',
      '}',

      // Iframe container
      '.advercity-body {',
      '  flex: 1;',
      '  overflow: hidden;',
      '}',
      '.advercity-iframe {',
      '  width: 100%;',
      '  height: 70vh;',
      '  border: none;',
      '}',

      // Loading state
      '.advercity-loading {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  height: 300px;',
      '  font-family: system-ui, -apple-system, sans-serif;',
      '  color: #6b7280;',
      '}',
      '.advercity-spinner {',
      '  width: 24px;',
      '  height: 24px;',
      '  border: 3px solid #e5e7eb;',
      '  border-top-color: #3b82f6;',
      '  border-radius: 50%;',
      '  animation: advercity-spin 0.6s linear infinite;',
      '  margin-right: 12px;',
      '}',
      '@keyframes advercity-spin {',
      '  to { transform: rotate(360deg); }',
      '}',

      // Responsive
      '@media (max-width: 640px) {',
      '  .advercity-modal {',
      '    max-height: 100vh;',
      '    height: 100%;',
      '    border-radius: 0;',
      '  }',
      '  .advercity-overlay {',
      '    padding: 0;',
      '  }',
      '  .advercity-iframe {',
      '    height: calc(100vh - 60px);',
      '  }',
      '}',
    ].join('\n');

    var style = document.createElement('style');
    style.id = STYLES_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  // --- Modal management ---
  var activeOverlay = null;

  function open(formType, options) {
    options = options || {};
    var config = FORM_TYPES[formType];

    if (!config) {
      console.error('[Advercity] Type de formulaire inconnu: ' + formType);
      return;
    }

    // Fermer un modal existant
    if (activeOverlay) close();

    injectStyles();

    var partner = options.partner || PARTNER;
    var url = BASE_URL + config.path + '?partner=' + encodeURIComponent(partner);

    // Creer l'overlay
    var overlay = document.createElement('div');
    overlay.className = 'advercity-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', config.title);

    // Fermer au clic sur l'overlay (pas sur le modal)
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    // Modal
    var modal = document.createElement('div');
    modal.className = 'advercity-modal';

    // Header
    var header = document.createElement('div');
    header.className = 'advercity-header';

    var titleWrap = document.createElement('div');
    titleWrap.style.display = 'flex';
    titleWrap.style.alignItems = 'center';
    titleWrap.style.gap = '10px';

    var title = document.createElement('h3');
    title.className = 'advercity-title';
    title.textContent = config.title;

    var badge = document.createElement('span');
    badge.className = 'advercity-badge';
    badge.textContent = 'Advercity';

    titleWrap.appendChild(title);
    titleWrap.appendChild(badge);

    var closeBtn = document.createElement('button');
    closeBtn.className = 'advercity-close';
    closeBtn.setAttribute('aria-label', 'Fermer');
    closeBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    closeBtn.addEventListener('click', close);

    header.appendChild(titleWrap);
    header.appendChild(closeBtn);

    // Body avec loading
    var body = document.createElement('div');
    body.className = 'advercity-body';

    var loading = document.createElement('div');
    loading.className = 'advercity-loading';
    loading.innerHTML = '<div class="advercity-spinner"></div> Chargement du formulaire...';
    body.appendChild(loading);

    // Iframe
    var iframe = document.createElement('iframe');
    iframe.className = 'advercity-iframe';
    iframe.src = url;
    iframe.style.display = 'none';
    iframe.setAttribute('allow', 'payment');

    iframe.addEventListener('load', function () {
      loading.style.display = 'none';
      iframe.style.display = 'block';
    });

    body.appendChild(iframe);

    // Assemblage
    modal.appendChild(header);
    modal.appendChild(body);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Animation d'entree
    requestAnimationFrame(function () {
      overlay.classList.add('advercity-visible');
    });

    // Bloquer le scroll du body
    document.body.style.overflow = 'hidden';

    activeOverlay = overlay;

    // Ecouter les messages de l'iframe
    window.addEventListener('message', handleMessage);

    // Fermer avec Escape
    document.addEventListener('keydown', handleKeydown);
  }

  function close() {
    if (!activeOverlay) return;

    activeOverlay.classList.remove('advercity-visible');

    setTimeout(function () {
      if (activeOverlay && activeOverlay.parentNode) {
        activeOverlay.parentNode.removeChild(activeOverlay);
      }
      activeOverlay = null;
      document.body.style.overflow = '';
    }, 250);

    window.removeEventListener('message', handleMessage);
    document.removeEventListener('keydown', handleKeydown);
  }

  function handleMessage(event) {
    var data = event.data;
    if (!data || data.source !== 'advercity-widget') return;

    switch (data.type) {
      case 'ready':
        // Formulaire charge
        break;
      case 'complete':
        // Demarche terminee
        close();
        if (typeof userConfig.onComplete === 'function') {
          userConfig.onComplete(data.reference);
        }
        break;
      case 'checkout':
        // Redirection vers le paiement
        if (data.url) {
          window.location.href = data.url;
        }
        break;
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') close();
  }

  // --- Auto-init: boutons avec data-advercity ---
  function init() {
    var buttons = document.querySelectorAll('[data-advercity]');
    for (var i = 0; i < buttons.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          var formType = btn.getAttribute('data-advercity');
          var partner = btn.getAttribute('data-advercity-partner') || PARTNER;
          open(formType, { partner: partner });
        });
      })(buttons[i]);
    }
  }

  // Init au chargement du DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // --- API publique ---
  window.Advercity = {
    open: open,
    close: close,
  };
})();
