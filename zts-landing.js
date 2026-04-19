/* ==========================================================================
   ZTS Landing Template — Script unique
   Zone Total Sport — usage :
     <link rel="stylesheet" href="zts-landing.css">
     <script>window.ZTS_LANDING_CONFIG = { ... };</script>
     <script src="zts-landing.js"></script>
   ========================================================================== */
(function () {
  'use strict';

  var cfg = window.ZTS_LANDING_CONFIG || {};
  if (!cfg.appId) { console.warn('[ZTS Landing] appId manquant'); return; }

  var LS_KEY = 'zts_landing_' + cfg.appId + '_seen';
  var LANG_KEY = 'zts_lang';

  var DEFAULT_LANGS = ['fr', 'en', 'zh'];
  var LANG_LABELS = { fr: 'FR', en: 'EN', zh: '中文' };
  var HOME_URL = cfg.homeUrl || 'https://zonetotalsport.ca';
  var FOOTER_BRAND = 'Zone Total Sport';

  // -- helpers ----------------------------------------------------------------
  function getLang() {
    var l = localStorage.getItem(LANG_KEY) || 'fr';
    return DEFAULT_LANGS.indexOf(l) >= 0 ? l : 'fr';
  }

  function setLang(l) {
    localStorage.setItem(LANG_KEY, l);
    try { window.dispatchEvent(new CustomEvent('zts:langchange', { detail: { lang: l } })); } catch (e) {}
    render();
  }

  // pick localized string: { fr: "..", en: "..", zh: ".." } OR plain string
  function t(v, lang) {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    lang = lang || getLang();
    return v[lang] || v.fr || v.en || Object.values(v)[0] || '';
  }

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === 'class') e.className = attrs[k];
        else if (k === 'html') e.innerHTML = attrs[k];
        else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') e[k] = attrs[k];
        else e.setAttribute(k, attrs[k]);
      }
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (c == null) return;
        e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return e;
  }

  // -- localization defaults for chrome ---------------------------------------
  var CHROME = {
    home:    { fr: 'Accueil',   en: 'Home',    zh: '首页' },
    start:   { fr: 'Commencer!',en: 'Start!',  zh: '开始!' },
    help:    { fr: 'Comment utiliser', en: 'How to use', zh: '使用说明' },
    footer:  {
      fr: '<strong>' + FOOTER_BRAND + '</strong> — Éducation physique et à la santé<br>100% gratuit · Aucun compte requis · Données sur ton appareil',
      en: '<strong>' + FOOTER_BRAND + '</strong> — Physical & Health Education<br>100% free · No account required · Data stays on your device',
      zh: '<strong>' + FOOTER_BRAND + '</strong> — 体育与健康教育<br>100% 免费 · 无需账户 · 数据存储在您的设备'
    }
  };

  // -- render -----------------------------------------------------------------
  function buildLogo(lang) {
    var iconSrc = cfg.logoIcon || 'https://zonetotalsport.ca/logo-zts.png';
    if (cfg.logoWide) {
      return el('div', { class: 'zts-landing-logo zts-landing-logo--wide' }, [
        el('img', { class: 'zts-landing-logo-icon zts-landing-logo-icon--wide', src: iconSrc, alt: 'Zone Total Sport' })
      ]);
    }
    return el('div', { class: 'zts-landing-logo' }, [
      el('img', { class: 'zts-landing-logo-icon', src: iconSrc, alt: '' }),
      el('div', { class: 'zts-landing-logo-text' }, [
        el('h1', { class: 'zts-landing-logo-title' }, t(cfg.logoTitle || cfg.title, lang).toUpperCase()),
        el('p', { class: 'zts-landing-logo-sub' }, t(cfg.logoSub || 'Zone Total Sport', lang))
      ])
    ]);
  }

  function buildLangSwitch(lang) {
    var wrap = el('div', { class: 'zts-landing-lang-switch' });
    DEFAULT_LANGS.forEach(function (l) {
      var btn = el('button', {
        class: 'zts-landing-lang-btn' + (l === lang ? ' is-active' : ''),
        type: 'button',
        'data-lang': l,
        onclick: function () { setLang(l); }
      }, LANG_LABELS[l]);
      wrap.appendChild(btn);
    });
    return wrap;
  }

  function buildBadges(lang) {
    var wrap = el('div', { class: 'zts-landing-badges' });
    (cfg.badges || []).forEach(function (b) {
      var color = b.color ? ' badge-' + b.color : '';
      wrap.appendChild(el('span', { class: 'zts-landing-badge' + color }, [
        el('span', { class: 'zts-emoji' }, b.emoji || ''),
        document.createTextNode(' ' + t(b.text, lang))
      ]));
    });
    return wrap;
  }

  function buildActions(lang) {
    var wrap = el('div', { class: 'zts-landing-actions' });

    var startLabel = (cfg.ctaStart && cfg.ctaStart.label) || CHROME.start;
    var startBtn = el('button', {
      class: 'zts-landing-btn-primary',
      type: 'button',
      onclick: function () {
        localStorage.setItem(LS_KEY, '1');
        hideLanding();
        if (cfg.ctaStart && typeof cfg.ctaStart.onClick === 'function') cfg.ctaStart.onClick();
      }
    }, '🚀 ' + t(startLabel, lang));
    wrap.appendChild(startBtn);

    if (cfg.ctaHelp) {
      var helpLabel = cfg.ctaHelp.label || CHROME.help;
      var helpBtn = el('button', {
        class: 'zts-landing-btn-outline',
        type: 'button',
        onclick: function () {
          var target = document.getElementById('zts-landing-howto');
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            target.classList.add('zts-landing-flash');
            setTimeout(function () { target.classList.remove('zts-landing-flash'); }, 1600);
          } else if (typeof cfg.ctaHelp.onClick === 'function') {
            cfg.ctaHelp.onClick();
          }
        }
      }, '📖 ' + t(helpLabel, lang));
      wrap.appendChild(helpBtn);
    }

    return wrap;
  }

  function buildFeatures(lang) {
    var wrap = el('div', { class: 'zts-landing-features-grid', id: 'zts-landing-howto' });
    (cfg.features || []).forEach(function (f) {
      wrap.appendChild(el('div', { class: 'zts-landing-feature-card' }, [
        el('div', { class: 'zts-landing-feature-icon' }, f.emoji || ''),
        el('h3', { class: 'zts-landing-feature-title' }, t(f.title, lang)),
        el('p', { class: 'zts-landing-feature-desc' }, t(f.desc, lang))
      ]));
    });
    return wrap;
  }

  function buildContent() {
    var lang = getLang();
    var accent = cfg.accentColor || '#00E5FF';

    var header = el('header', { class: 'zts-landing-header' }, [
      el('a', {
        class: 'zts-landing-home-btn',
        href: HOME_URL
      }, '🏠 ' + t(CHROME.home, lang)),
      buildLogo(lang),
      buildLangSwitch(lang)
    ]);

    var hero = el('section', { class: 'zts-landing-hero-card' }, [
      el('div', { class: 'zts-landing-hero-grid' }, [
        el('div', { class: 'zts-landing-mascot-wrap' }, [
          el('img', {
            class: 'zts-landing-mascot',
            src: cfg.mascot || 'https://zonetotalsport.ca/bucheron-basketball.png',
            alt: ''
          })
        ]),
        el('div', { class: 'zts-landing-hero-text' }, [
          el('h2', { class: 'zts-landing-title' }, t(cfg.title, lang)),
          el('p', { class: 'zts-landing-subtitle' }, t(cfg.subtitle, lang)),
          el('p', { class: 'zts-landing-desc' }, t(cfg.description, lang)),
          buildBadges(lang),
          buildActions(lang)
        ])
      ])
    ]);

    var features = buildFeatures(lang);

    var footer = el('footer', { class: 'zts-landing-footer', html: t(CHROME.footer, lang) });

    var container = el('div', { class: 'zts-landing-container' }, [hero, features, footer]);

    var root = el('div', {
      class: 'zts-landing',
      id: 'zts-landing',
      style: '--zts-accent-color:' + accent + ';'
    }, [header, container]);

    return root;
  }

  function render() {
    var existing = document.getElementById('zts-landing');
    if (existing) {
      var fresh = buildContent();
      existing.parentNode.replaceChild(fresh, existing);
    }
  }

  function showLanding() {
    if (document.getElementById('zts-landing')) return;
    var node = buildContent();
    document.body.appendChild(node);
    document.body.style.overflow = 'hidden';
    document.documentElement.classList.add('zts-landing-open');
  }

  function hideLanding() {
    var node = document.getElementById('zts-landing');
    if (!node) return;
    node.classList.add('is-hidden');
    setTimeout(function () {
      if (node.parentNode) node.parentNode.removeChild(node);
      document.body.style.overflow = '';
      document.documentElement.classList.remove('zts-landing-open');
    }, 450);
  }

  // -- entry point ------------------------------------------------------------
  function shouldShow() {
    var forced = /[?&]welcome=1\b/.test(window.location.search);
    if (forced) return true;
    return !localStorage.getItem(LS_KEY);
  }

  function init() {
    if (shouldShow()) showLanding();
  }

  // expose API
  window.ztsShowLanding = function () {
    // Force show even if seen
    showLanding();
  };
  window.ztsHideLanding = hideLanding;
  window.ztsResetLanding = function () { localStorage.removeItem(LS_KEY); };

  // re-render on external lang change
  window.addEventListener('zts:langchange', function () { render(); });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
