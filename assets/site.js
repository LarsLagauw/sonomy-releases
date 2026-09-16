/* Sonomy Notes — the site's one script. Shared by index.html and how.html.

   Nothing here is needed to read the page: every reveal starts visible without
   scripting (see .rv in site.css), every popup's text is in the document, and
   every download link already points at the releases page before this runs. */
(function () {
  'use strict';

  var REPO = 'LarsLagauw/sonomy-releases';
  var RELEASES = 'https://github.com/' + REPO + '/releases/latest';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- Glyphs
     SF Symbols out of the app's own table. `data-g="bell"` becomes the same
     SVG chrome.js draws, sized in ems the way chrome.js sizes it. */
  function paintGlyphs(root) {
    var table = window.GLYPHS || {};
    (root || document).querySelectorAll('[data-g]').forEach(function (node) {
      if (node.firstElementChild) return;
      var g = table[node.getAttribute('data-g')];
      if (!g) return;
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 ' + g.box);
      svg.setAttribute('aria-hidden', 'true');
      svg.innerHTML = g.d;
      node.style.setProperty('--gw', g.w);
      node.style.setProperty('--gh', g.h);
      node.classList.add('g');
      node.appendChild(svg);
    });
  }
  paintGlyphs(document);

  /* ---------------------------------------------------------------- Sticky bar */
  var bar = document.getElementById('bar');
  var stuck = null;
  function onScroll() {
    var s = window.scrollY > 24;
    if (s === stuck) return;
    stuck = s;
    bar.classList.toggle('is-stuck', s);
  }
  if (bar) {
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------------------------------------------------------- Word and letter reveals */
  function splitWords(el) {
    var words = el.textContent.split(' ');
    el.textContent = '';
    words.forEach(function (w, i) {
      var s = document.createElement('span');
      s.className = 'w';
      s.style.setProperty('--i', i);
      s.textContent = w + (i < words.length - 1 ? ' ' : '');
      el.appendChild(s);
    });
  }
  function splitChars(el) {
    var chars = el.textContent.split('');
    el.textContent = '';
    chars.forEach(function (c, i) {
      var s = document.createElement('span');
      s.className = 'c';
      s.style.setProperty('--i', i);
      s.textContent = c;
      el.appendChild(s);
    });
  }
  if (!reduced) {
    document.querySelectorAll('[data-type]').forEach(splitWords);
    document.querySelectorAll('[data-chars]').forEach(splitChars);
  }

  /* ---------------------------------------------------------------- Reveal on scroll */
  var targets = document.querySelectorAll('.rv, [data-vig]');
  if (!reduced && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Looping animations are stilled while their host is a whole viewport away. */
  if (!reduced && 'IntersectionObserver' in window) {
    var pio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('pz', !e.isIntersecting); });
    }, { rootMargin: '100% 0px' });
    document.querySelectorAll('[data-loop]').forEach(function (el) { pio.observe(el); });
  }

  /* Scenes on the "how" page restart their timeline each time they scroll into
     view, so a visitor who scrolls back sees the story from its first frame. */
  if (!reduced && 'IntersectionObserver' in window) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.remove('play');
          void e.target.offsetWidth;
          e.target.classList.add('play');
        } else {
          e.target.classList.remove('play');
        }
      });
    }, { threshold: 0.35 });
    document.querySelectorAll('[data-scene]').forEach(function (el) { sio.observe(el); });
  } else {
    document.querySelectorAll('[data-scene]').forEach(function (el) { el.classList.add('play', 'still'); });
  }

  /* A clock that counts while its capsule is on screen. */
  document.querySelectorAll('[data-clock]').forEach(function (el) {
    var start = el.getAttribute('data-clock').split(':').map(Number);
    var secs = start[0] * 60 + start[1];
    function paint() {
      var m = Math.floor(secs / 60), s = secs % 60;
      el.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    }
    paint();
    if (reduced) return;
    var timer = null;
    var tick = function () { secs += 1; paint(); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var on = entries[0].isIntersecting;
        if (on && timer === null) timer = setInterval(tick, 1000);
        if (!on && timer !== null) { clearInterval(timer); timer = null; }
      }).observe(el);
    } else {
      setInterval(tick, 1000);
    }
  });

  /* ---------------------------------------------------------------- The popups
     One <dialog>. Each feature carries a <template>; opening copies it in. */
  var pop = document.getElementById('pop');
  if (pop) {
    var popIn = pop.querySelector('.pop-in');
    var opener = null;
    function openPop(id, from) {
      var tpl = document.getElementById('tpl-' + id);
      if (!tpl) return;
      popIn.innerHTML = '';
      popIn.appendChild(tpl.content.cloneNode(true));
      paintGlyphs(popIn);
      if (!reduced) {
        popIn.querySelectorAll('[data-type]').forEach(splitWords);
        popIn.querySelectorAll('[data-vig]').forEach(function (v) { v.classList.add('is-in'); });
      } else {
        popIn.querySelectorAll('[data-vig]').forEach(function (v) { v.classList.add('is-in'); });
      }
      opener = from || null;
      if (typeof pop.showModal === 'function') pop.showModal(); else pop.setAttribute('open', '');
      popIn.scrollTop = 0;
      if (history.replaceState) history.replaceState(null, '', '#about-' + id);
    }
    function closePop() {
      if (pop.open) pop.close(); else pop.removeAttribute('open');
    }
    pop.addEventListener('close', function () {
      if (history.replaceState && location.hash) history.replaceState(null, '', location.pathname + location.search);
      if (opener) { opener.focus(); opener = null; }
    });
    pop.addEventListener('click', function (e) {
      if (e.target === pop) closePop();
      if (e.target.closest('.pop-x')) closePop();
    });
    document.querySelectorAll('[data-pop]').forEach(function (b) {
      b.addEventListener('click', function () { openPop(b.getAttribute('data-pop'), b); });
    });
    /* A link straight to one popup — index.html#pictures — opens it. */
    var wanted = /^#about-/.test(location.hash) ? location.hash.replace('#about-', '') : '';
    if (wanted && document.getElementById('tpl-' + wanted)) {
      setTimeout(function () { openPop(wanted, document.querySelector('[data-pop="' + wanted + '"]')); }, 300);
    }
  }

  /* ---------------------------------------------------------------- Which build is this visitor after? */
  var main = document.getElementById('cta-main');
  if (!main) return;

  function detect() {
    var ua = navigator.userAgent;
    var p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
    if (/Android/i.test(ua)) return null;
    if (/iPhone|iPad|iPod/i.test(ua)) return null;
    if (/Win/i.test(p) || /Windows/i.test(ua)) return 'windows';
    if (/Mac/i.test(p) || /Mac OS X/i.test(ua)) return 'macos';
    if (/Linux|X11/i.test(p) || /Linux/i.test(ua)) return 'linux';
    return null;
  }
  var LABEL = { macos: 'macOS', windows: 'Windows', linux: 'Linux' };

  function macIsArm() {
    try {
      var c = document.createElement('canvas');
      var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) return true;
      var ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (!ext) return true;
      var r = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '');
      if (/Intel|AMD|Radeon/i.test(r)) return false;
      return true;
    } catch (err) { return true; }
  }

  function pick(assets, os) {
    var arm = os === 'macos' ? macIsArm() : false;
    var tests = {
      macos: arm ? [/-macos-arm64\.dmg$/i, /-macos-.*\.dmg$/i] : [/-macos-x86_64\.dmg$/i, /-macos-.*\.dmg$/i],
      windows: [/-x86_64-setup\.exe$/i, /setup\.exe$/i, /\.exe$/i],
      linux: [/\.AppImage$/i]
    }[os] || [];
    for (var t = 0; t < tests.length; t++) {
      for (var a = 0; a < assets.length; a++) {
        if (tests[t].test(assets[a].name)) return assets[a];
      }
    }
    return null;
  }

  function mb(bytes) { return Math.round(bytes / 1048576) + ' MB'; }
  function pretty(v) { return v.replace(/-beta$/i, ' beta').replace(/-rc/i, ' rc'); }

  var os = detect();
  var mainLabel = document.getElementById('cta-main-label');
  var get = document.getElementById('cta-get');
  var getLabel = document.getElementById('cta-get-label');
  var note = document.getElementById('cta-note');
  var barBtn = document.getElementById('cta-bar');

  if (os) {
    if (mainLabel) mainLabel.textContent = 'Download for ' + LABEL[os];
    if (getLabel) getLabel.textContent = 'Download for ' + LABEL[os];
  }

  /* Every link already points at the releases page, so a failed API call costs nothing. */
  fetch('https://api.github.com/repos/' + REPO + '/releases/latest', { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (rel) {
      var version = (rel.tag_name || rel.name || '').replace(/^v/, '');
      var assets = rel.assets || [];

      if (version) {
        document.querySelectorAll('[data-version]').forEach(function (el) { el.textContent = pretty(version); });
      }

      document.querySelectorAll('.plat').forEach(function (row) {
        var found = pick(assets, row.getAttribute('data-os'));
        var file = row.querySelector('[data-file]');
        var go = row.querySelector('.go');
        var size = row.querySelector('[data-size]');
        if (found) {
          row.href = found.browser_download_url;
          file.textContent = found.name;
          if (size) size.textContent = mb(found.size);
        } else {
          row.classList.add('none');
          file.textContent = 'Not part of ' + (version ? pretty(version) : 'this release') + ' yet';
          go.textContent = 'See all releases';
        }
      });

      if (os) {
        var asset = pick(assets, os);
        if (asset) {
          main.href = asset.browser_download_url;
          if (get) get.href = asset.browser_download_url;
          if (barBtn) barBtn.href = asset.browser_download_url;
          if (note) note.textContent = 'Version ' + pretty(version) + ' · ' + mb(asset.size) + ' · Free while in beta';
        }
      }
    })
    .catch(function () {
      if (main.href !== RELEASES) main.href = RELEASES;
    });
})();
