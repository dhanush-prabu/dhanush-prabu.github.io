(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var mq = function (q) { return window.matchMedia ? window.matchMedia(q).matches : false; };
  var reduceMotion = mq('(prefers-reduced-motion: reduce)');
  var finePointer = mq('(hover: hover) and (pointer: fine)');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(Math.max(v, a), b); };

  /* ---------- Theme ---------- */
  var themeBtn = $('#themeToggle');
  var metaTheme = $('meta[name="theme-color"]');
  function isLight() { return root.getAttribute('data-theme') === 'light'; }
  function syncThemeColor() { if (metaTheme) metaTheme.setAttribute('content', isLight() ? '#f8f7ff' : '#07070d'); }
  syncThemeColor();
  themeBtn.addEventListener('click', function () {
    var next = isLight() ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncThemeColor();
  });

  /* ---------- Hero name: split into animated letters ---------- */
  var idx = 0;
  $$('#heroName .name-line').forEach(function (line) {
    Array.prototype.slice.call(line.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        var frag = document.createDocumentFragment();
        node.textContent.split('').forEach(function (c) {
          if (!c.trim()) return;
          var s = document.createElement('span');
          s.className = 'ch';
          s.setAttribute('aria-hidden', 'true');
          s.style.setProperty('--i', idx++);
          s.textContent = c;
          frag.appendChild(s);
        });
        line.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        node.classList.add('ch');
        node.style.setProperty('--i', idx++);
      }
    });
  });

  /* ---------- Mobile menu ---------- */
  var menuBtn = $('#menuBtn');
  var navLinks = $('#navLinks');
  function setMenu(open) {
    navLinks.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) nav.classList.remove('hide');
  }
  menuBtn.addEventListener('click', function () { setMenu(!navLinks.classList.contains('open')); });
  $$('a', navLinks).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', function () { if (window.innerWidth >= 960) setMenu(false); });

  /* ---------- Nav: sliding indicator ---------- */
  var nav = $('#nav');
  var indicator = $('#navIndicator');
  var links = $$('.nav-links a[href^="#"]');
  var activeLink = null;
  function moveIndicator(a) {
    if (!a || window.innerWidth < 960 || a.offsetWidth === 0) { indicator.classList.remove('on'); return; }
    indicator.style.left = a.offsetLeft + 'px';
    indicator.style.width = a.offsetWidth + 'px';
    indicator.classList.add('on');
  }
  links.forEach(function (a) {
    a.addEventListener('mouseenter', function () { moveIndicator(a); });
  });
  navLinks.addEventListener('mouseleave', function () { moveIndicator(activeLink); });
  window.addEventListener('resize', function () { moveIndicator(activeLink); });

  /* ---------- Scroll spy ---------- */
  var sections = links.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        activeLink = null;
        links.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + en.target.id;
          a.classList.toggle('active', on);
          if (on && !a.classList.contains('menu-only')) activeLink = a;
        });
        moveIndicator(activeLink);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
    // clear the indicator when back in the hero
    var heroSpy = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && entries[0].intersectionRatio > 0.5) {
        activeLink = null;
        links.forEach(function (a) { a.classList.remove('active'); });
        moveIndicator(null);
      }
    }, { threshold: [0.5, 0.6] });
    heroSpy.observe($('#home'));
  }

  /* ---------- Scroll-driven UI ---------- */
  var progress = $('#scrollProgress');
  var toTop = $('#toTop');
  var timeline = $('#timeline');
  var tFill = $('#tFill');
  var lastY = window.scrollY;
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    nav.classList.toggle('scrolled', y > 20);
    if (!navLinks.classList.contains('open')) {
      nav.classList.toggle('hide', y > 500 && y > lastY + 4);
      if (y < lastY - 4) nav.classList.remove('hide');
    }
    toTop.classList.toggle('show', y > 700);
    if (timeline) {
      var r = timeline.getBoundingClientRect();
      var p = clamp((window.innerHeight * 0.65 - r.top) / r.height, 0, 1);
      tFill.style.setProperty('--p', p.toFixed(3));
    }
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();
  toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });

  /* ---------- Reveal on scroll (staggered in grids) ---------- */
  var revealEls = $$('.reveal');
  revealEls.forEach(function (el) {
    var parent = el.parentElement;
    if (!/grid|groups|cards|timeline/.test(parent.className)) return;
    var sibs = Array.prototype.filter.call(parent.children, function (c) { return c.classList.contains('reveal'); });
    el.style.setProperty('--d', (sibs.indexOf(el) % 4) * 0.09 + 's');
  });
  $$('.chips').forEach(function (list) {
    $$('li', list).forEach(function (li, i) { li.style.setProperty('--ci', i); });
  });
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Counters ---------- */
  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var start = null, dur = 1600;
    (function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 4))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  } else {
    counters.forEach(runCounter);
  }

  /* ---------- Filter tabs ---------- */
  function setupTabs(tabsSel, itemsSel) {
    if (!$(tabsSel)) return;
    var tabs = $$('.tab', $(tabsSel));
    var items = $$(itemsSel);
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var f = tab.getAttribute('data-filter');
        tabs.forEach(function (t) {
          t.classList.toggle('active', t === tab);
          t.setAttribute('aria-selected', String(t === tab));
        });
        var shown = 0;
        items.forEach(function (it) {
          var show = f === 'all' || it.getAttribute('data-cat') === f;
          it.classList.toggle('hide', !show);
          if (!show) return;
          it.style.setProperty('--d', (shown++ % 4) * 0.07 + 's');
          it.classList.remove('in');
          void it.offsetWidth; // restart the entrance animation
          it.classList.add('in');
        });
      });
    });
  }
  setupTabs('#projectTabs', '#projectGrid .project');

  /* ---------- Skill tiles: hover shows details; on touch screens a tap toggles them ---------- */
  var tiles = $$('.skill-tile');
  function closeTiles(except) { tiles.forEach(function (t) { if (t !== except) t.classList.remove('open'); }); }
  tiles.forEach(function (tile) {
    tile.addEventListener('click', function () {
      if (mq('(hover: hover)') && window.innerWidth >= 760) return; // a real hover already reveals the details
      var open = !tile.classList.contains('open');
      closeTiles(tile);
      tile.classList.toggle('open', open);
    });
    tile.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeTiles(tile); tile.classList.toggle('open'); }
    });
    tile.addEventListener('blur', function () { tile.classList.remove('open'); });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.skill-tile')) closeTiles(null); });

  /* ---------- Pointer effects (desktop only) ---------- */
  $$('.spot').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  if (finePointer && !reduceMotion) {
    // 3D tilt on project cards
    $$('.tilt-card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transition = 'transform .12s ease-out, border-color .35s, box-shadow .35s';
        card.style.transform = 'perspective(1000px) rotateX(' + (-y * 6).toFixed(2) + 'deg) rotateY(' + (x * 6).toFixed(2) + 'deg) translateY(-4px)';
      });
      card.addEventListener('pointerleave', function () {
        card.style.transition = 'transform .7s cubic-bezier(.2,.75,.2,1), border-color .35s, box-shadow .35s';
        card.style.transform = '';
      });
    });

    // Magnetic buttons
    $$('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.translate = (dx * 0.22).toFixed(1) + 'px ' + (dy * 0.3).toFixed(1) + 'px';
      });
      el.addEventListener('pointerleave', function () { el.style.translate = ''; });
    });

    // Soft glow that follows the cursor
    var glow = $('#cursorGlow');
    var gx = window.innerWidth / 2, gy = window.innerHeight / 2, tx = gx, ty = gy, gRunning = false;
    function glowLoop() {
      gx += (tx - gx) * 0.12;
      gy += (ty - gy) * 0.12;
      glow.style.transform = 'translate3d(' + gx.toFixed(1) + 'px,' + gy.toFixed(1) + 'px,0)';
      if (Math.abs(tx - gx) > 0.5 || Math.abs(ty - gy) > 0.5) requestAnimationFrame(glowLoop);
      else gRunning = false;
    }
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      glow.classList.add('on');
      if (!gRunning) { gRunning = true; requestAnimationFrame(glowLoop); }
    }, { passive: true });
    document.addEventListener('pointerleave', function () { glow.classList.remove('on'); });
  }

  /* ---------- Hero particle network ---------- */
  var hero = $('#home');
  var canvas = $('#heroCanvas');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, parts = [], mouse = { x: -9999, y: -9999 }, running = false, visible = true;
    var LINK = 130;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = hero.clientWidth; H = hero.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(clamp(W * H / 15000, 26, 95));
      parts = [];
      for (var i = 0; i < n; i++) {
        parts.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.45, vy: (Math.random() - 0.5) * 0.45,
          r: Math.random() * 1.6 + 0.8
        });
      }
    }

    function frame() {
      var light = isLight();
      var c1 = light ? '124,58,237' : '167,139,250';
      var c2 = light ? '219,39,119' : '244,114,182';
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (!reduceMotion) {
          var mdx = p.x - mouse.x, mdy = p.y - mouse.y, md = Math.sqrt(mdx * mdx + mdy * mdy);
          if (md < 120 && md > 0) { p.x += mdx / md * 0.8; p.y += mdy / md * 0.8; }
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > W) p.vx *= -1;
          if (p.y < 0 || p.y > H) p.vy *= -1;
        }
        for (var j = i + 1; j < parts.length; j++) {
          var q = parts[j], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy;
          if (d < LINK * LINK) {
            ctx.strokeStyle = 'rgba(' + c1 + ',' + ((1 - Math.sqrt(d) / LINK) * (light ? 0.22 : 0.28)).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        var ml = Math.sqrt((p.x - mouse.x) * (p.x - mouse.x) + (p.y - mouse.y) * (p.y - mouse.y));
        if (ml < 180) {
          ctx.strokeStyle = 'rgba(' + c2 + ',' + ((1 - ml / 180) * 0.5).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(' + c1 + ',' + (light ? 0.55 : 0.75) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      if (running) requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduceMotion || !visible || document.hidden) return;
      running = true; requestAnimationFrame(frame);
    }
    function stop() { running = false; }

    resize();
    if (reduceMotion) frame(); else start();

    var rT;
    window.addEventListener('resize', function () {
      clearTimeout(rT);
      rT = setTimeout(function () { resize(); if (reduceMotion) frame(); }, 150);
    });
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
    themeBtn.addEventListener('click', function () { if (reduceMotion) frame(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (visible) start(); else stop();
      }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  }

  /* ---------- Case studies ---------- */
  var CASES = [
    {
      id: 'orbcrm', title: 'OrbCRM', sub: 'Multi-tenant SaaS CRM', hue: 262, icon: 'i-users',
      badge: ['live', 'Live in production'], kind: 'Orbitz IT Solution',
      overview: 'A multi-tenant SaaS CRM built from scratch with React.js and Django REST Framework. Many client businesses share one platform, so every request has to respect two boundaries: which tenant the data belongs to, and what the signed-in user’s role allows.',
      role: 'Core full-stack developer — designed and developed core modules of the product.',
      outcome: ['Live and in active use by multiple clients'],
      built: [
        'Role-based access control (RBAC) that decides what each user can see and do',
        'Tenant-level data isolation so each client only ever sees its own records',
        'Real-time business workflows',
        'React.js front-end and Django REST APIs for the core CRM modules'
      ],
      arch: {
        layers: [
          { label: 'Client', nodes: [{ t: 'React.js app', d: ['Role-aware screens', 'Core CRM modules'] }] },
          { label: 'API', nodes: [{ t: 'Django REST Framework', d: ['JWT authentication', 'RBAC permission checks', 'Tenant scoping on every query', 'Real-time workflow events'] }] },
          { label: 'Data', nodes: [{ t: 'PostgreSQL', d: ['Tenant-isolated records'] }] }
        ],
        links: ['REST · JWT', 'Django ORM']
      },
      stack: ['React.js', 'Django REST Framework', 'PostgreSQL', 'JWT', 'RBAC', 'Multi-tenant']
    },
    {
      id: 'orberp', title: 'OrbERP', sub: 'Enterprise resource planning', hue: 190, icon: 'i-box',
      badge: ['live', 'Live in production'], kind: 'Orbitz IT Solution',
      overview: 'Orbitz’s ERP product for running day-to-day operations. I delivered modules covering inventory management, reporting and operational workflows.',
      role: 'Full-stack developer on the ERP modules, turning requirements gathered directly in client meetings into production features.',
      outcome: ['Live and in active use by client organisations'],
      built: ['Inventory management module', 'Reporting module', 'Operational workflow screens and APIs'],
      arch: {
        layers: [
          { label: 'Client', nodes: [{ t: 'React.js modules', d: ['Inventory', 'Reports', 'Workflows'] }] },
          { label: 'API', nodes: [{ t: 'Django REST Framework', d: ['Business logic & validation', 'Reporting endpoints'] }] },
          { label: 'Data', nodes: [{ t: 'PostgreSQL', d: ['Inventory & operational data'] }] }
        ],
        links: ['REST API', 'Django ORM']
      },
      stack: ['React.js', 'Django REST Framework', 'PostgreSQL']
    },
    {
      id: 'orbhms', title: 'OrbHMS', sub: 'Hospital management system', hue: 340, icon: 'i-pulse',
      badge: ['live', 'Live in production'], kind: 'Orbitz IT Solution',
      overview: 'A hospital management system for healthcare clients. I contributed to the patient records, billing and reporting workflows.',
      role: 'Contributor — translated requirements gathered in client meetings into production-ready features.',
      outcome: ['In production with healthcare clients'],
      built: ['Patient records workflows', 'Billing workflows', 'Reporting workflows'],
      arch: {
        layers: [
          { label: 'Client', nodes: [{ t: 'React.js app', d: ['Patient records', 'Billing', 'Reports'] }] },
          { label: 'API', nodes: [{ t: 'Django REST Framework', d: ['Records, billing & reporting endpoints'] }] },
          { label: 'Data', nodes: [{ t: 'PostgreSQL', d: ['Patient & billing data'] }] }
        ],
        links: ['REST API', 'Django ORM']
      },
      stack: ['React.js', 'Django REST Framework', 'PostgreSQL']
    },
    {
      id: 'orbill', title: 'Orbill', sub: 'Client-facing billing application', hue: 38, icon: 'i-receipt',
      badge: ['live', 'Live in production'], kind: 'Orbitz IT Solution',
      overview: 'A billing application used by client staff. The key idea: each business’s own billing rules live in the system, so staff no longer have to apply them by hand.',
      role: 'Developer — designed the billing screens and reporting modules and implemented the billing rules through RESTful APIs.',
      outcome: ['Improved billing accuracy', 'Reduced manual work for client staff'],
      built: ['Billing screens', 'Reporting modules', 'Business-defined billing rules exposed through RESTful APIs'],
      arch: {
        layers: [
          { label: 'Client', nodes: [{ t: 'React.js app', d: ['Billing screens', 'Reports'] }] },
          { label: 'API', nodes: [{ t: 'Django REST Framework', d: ['Business-defined billing rules', 'Reporting APIs'] }] },
          { label: 'Data', nodes: [{ t: 'PostgreSQL', d: ['Billing records'] }] }
        ],
        links: ['REST API', 'Django ORM']
      },
      stack: ['React.js', 'Django REST Framework', 'PostgreSQL']
    },
    {
      id: 'sites', title: '6+ Client Websites & Platforms', sub: 'Marketing sites · E-commerce · Classifieds', hue: 160, icon: 'i-globe',
      badge: ['live', 'Live & serving traffic'], kind: 'Orbitz IT Solution',
      overview: 'Alongside the product suite, I built and deployed full-stack websites and platforms for Orbitz’s clients — marketing sites, e-commerce stores and classifieds platforms.',
      role: 'Full-stack developer — took each project from requirements through to a live deployment.',
      outcome: ['6+ sites live and serving real traffic'],
      built: ['Marketing websites', 'E-commerce platforms', 'Classifieds platforms', 'Responsive React.js front-ends on Django REST back-ends'],
      arch: {
        title: 'Delivery flow',
        layers: [
          { label: 'Plan', nodes: [{ t: 'Requirements', d: ['Client needs'] }] },
          { label: 'Build', nodes: [{ t: 'React.js + Django REST', d: ['Responsive UI', 'REST back-end'] }] },
          { label: 'Ship', nodes: [{ t: 'Google Cloud', d: ['Deployment'] }] },
          { label: 'Run', nodes: [{ t: 'Live', d: ['Real traffic'] }] }
        ],
        links: ['', '', '']
      },
      stack: ['React.js', 'Django REST Framework', 'Google Cloud', 'Responsive design']
    },
    {
      id: 'migration', title: 'Legacy .NET Billing → React + Django', sub: '100% functional parity', hue: 215, icon: 'i-swap',
      badge: ['done', 'Shipped'], kind: 'Orbitz IT Solution',
      overview: 'A legacy .NET billing system had to move to a modern React + Django REST stack — without losing any behaviour clients relied on.',
      role: 'Contributor on the migration, working closely with QA and product teams.',
      outcome: ['100% functional parity with the old system', 'Better usability and maintainability', 'Shipped as production releases'],
      built: ['Rebuilt billing functionality on React + Django REST', 'Matched existing behaviour feature by feature', 'Verified parity together with QA before each release'],
      arch: {
        title: 'Migration path',
        layers: [
          { label: 'Before', nodes: [{ t: 'Legacy .NET', d: ['Billing system'] }] },
          { label: 'After', nodes: [{ t: 'React.js + Django REST', d: ['Modern front-end', 'REST API'] }] },
          { label: 'Release', nodes: [{ t: 'QA & product', d: ['Parity testing', 'Production releases'] }] }
        ],
        links: ['migrate', 'verify']
      },
      stack: ['React.js', 'Django REST Framework', '.NET (legacy)', 'QA collaboration']
    },
    {
      id: 'datalens', title: 'DataLens', sub: 'Android WiFi data usage tracker', hue: 300, icon: 'i-wifi',
      badge: ['info', 'Android app'], kind: 'Personal project',
      overview: 'A native Android app that shows how much WiFi data each app uses, with drill-down screens and a live-updating home-screen widget.',
      role: 'Personal project — designed and built end to end.',
      outcome: ['Source code on GitHub'],
      built: [
        'Per-app WiFi usage via NetworkStatsManager',
        'Timeframe filtering and real-time search',
        'Per-app and monthly detail screens with day-by-day bar charts and calendar-month navigation',
        'Custom day-bucketing algorithm over NetworkStatsManager',
        'Home-screen widget refreshed via AlarmManager and coroutines'
      ],
      arch: {
        layers: [
          { label: 'System', nodes: [{ t: 'NetworkStatsManager', d: ['Per-app WiFi stats'] }] },
          { label: 'Logic', nodes: [{ t: 'Day-bucketing', d: ['Kotlin coroutines'] }] },
          { label: 'UI', nodes: [{ t: 'Jetpack Compose', d: ['Lists, search, charts', 'Navigation3'] }, { t: 'Home-screen widget', d: ['AlarmManager refresh'] }] }
        ],
        links: ['query', 'state']
      },
      stack: ['Kotlin', 'Jetpack Compose', 'Navigation3', 'Coroutines', 'AlarmManager'],
      links: [{ href: 'https://github.com/dhanush-prabu/android-wifi-data-tracker', label: 'View source on GitHub' }]
    },
    {
      id: 'spendwise', title: 'SpendWise', sub: 'Personal finance & expense tracker', hue: 25, icon: 'i-pie',
      badge: ['info', 'Full-stack'], kind: 'Personal project',
      overview: 'A multi-user expense manager with category-wise analytics, built on a Django REST back-end that validates input carefully and returns consistent errors.',
      role: 'Personal project — designed and built end to end.',
      outcome: ['Strict per-user data isolation', 'Analytics dashboards per category'],
      built: ['Strict per-user data isolation', 'Category-wise analytics dashboards with Chart.js', 'Structured validation on every endpoint', 'Consistent API error handling', 'JWT authentication'],
      arch: {
        layers: [
          { label: 'Client', nodes: [{ t: 'React', d: ['Chart.js dashboards'] }] },
          { label: 'API', nodes: [{ t: 'Django REST Framework', d: ['JWT auth', 'Structured validation', 'Consistent error responses', 'Per-user filtering'] }] },
          { label: 'Data', nodes: [{ t: 'PostgreSQL', d: ['Per-user expense data'] }] }
        ],
        links: ['REST · JWT', 'Django ORM']
      },
      stack: ['React', 'Django REST Framework', 'PostgreSQL', 'JWT', 'Chart.js']
    }
  ];

  var dialog = $('#caseDialog');
  var caseInner = $('#caseInner');
  var caseIndex = 0;
  var lastTrigger = null;

  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function icon(id) { return '<svg class="ico"><use href="#' + id + '"/></svg>'; }

  function renderArch(a) {
    var html = '<div class="arch">';
    var ni = 0;
    a.layers.forEach(function (layer, i) {
      if (i > 0) html += '<div class="arch-link" aria-hidden="true">' + (a.links[i - 1] ? '<span>' + esc(a.links[i - 1]) + '</span>' : '') + '</div>';
      html += '<div class="arch-layer"><span class="arch-label">' + esc(layer.label) + '</span>';
      layer.nodes.forEach(function (n) {
        html += '<div class="arch-node" style="--ni:' + (ni++) + '"><b>' + esc(n.t) + '</b>' +
          (n.d && n.d.length ? '<ul>' + n.d.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>' : '') + '</div>';
      });
      html += '</div>';
    });
    return html + '</div>';
  }

  function renderCase(i) {
    var c = CASES[i];
    var prev = CASES[(i - 1 + CASES.length) % CASES.length];
    var next = CASES[(i + 1) % CASES.length];
    var blocks = [
      '<section class="case-block"><h3>Overview</h3><p>' + esc(c.overview) + '</p></section>',
      '<div class="case-cards"><div class="case-card"><h3>My role</h3><p>' + esc(c.role) + '</p></div>' +
        '<div class="case-card"><h3>Outcome</h3><ul>' + c.outcome.map(function (o) { return '<li>' + esc(o) + '</li>'; }).join('') + '</ul></div></div>',
      '<section class="case-block"><h3>What I built</h3><ul class="case-list">' + c.built.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul></section>',
      '<section class="case-block"><h3>' + esc(c.arch.title || 'How it fits together') + '</h3>' + renderArch(c.arch) + '</section>',
      '<section class="case-block"><h3>Stack</h3><ul class="tags">' + c.stack.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></section>'
    ];
    if (c.links) {
      blocks.push('<div class="case-links">' + c.links.map(function (l) {
        return '<a class="btn btn-ghost" href="' + esc(l.href) + '" target="_blank" rel="noopener">' + icon('i-gh') + '<span>' + esc(l.label) + '</span></a>';
      }).join('') + '</div>');
    }
    caseInner.style.setProperty('--hue', c.hue);
    caseInner.innerHTML =
      '<header class="case-hero" style="--hue:' + c.hue + '">' +
        '<button class="case-close" type="button" data-close aria-label="Close case study">' + icon('i-x') + '</button>' +
        '<span class="case-ico">' + icon(c.icon) + '</span>' +
        '<p class="case-kicker"><span class="p-badge ' + c.badge[0] + '"><i></i> ' + esc(c.badge[1]) + '</span>' + esc(c.kind) + '</p>' +
        '<h2 id="caseTitle">' + esc(c.title) + '</h2>' +
        '<p class="case-sub">' + esc(c.sub) + '</p>' +
      '</header>' +
      '<div class="case-body" style="--hue:' + c.hue + '">' +
        blocks.map(function (b, n) { return b.replace(/^<(\w+) class="/, '<$1 style="--bi:' + n + '" class="'); }).join('') +
      '</div>' +
      '<nav class="case-nav" aria-label="More case studies">' +
        '<button type="button" data-prev aria-label="Previous: ' + esc(prev.title) + '">' + icon('i-left') + '<span>' + esc(prev.title) + '</span></button>' +
        '<span class="case-count">' + (i + 1) + ' / ' + CASES.length + '</span>' +
        '<button type="button" data-next aria-label="Next: ' + esc(next.title) + '"><span>' + esc(next.title) + '</span>' + icon('i-right') + '</button>' +
      '</nav>';
    caseInner.scrollTop = 0;
  }

  function openCase(id, trigger) {
    var i = CASES.map(function (c) { return c.id; }).indexOf(id);
    if (i < 0 || !dialog) return;
    caseIndex = i;
    lastTrigger = trigger || null;
    renderCase(i);
    if (!dialog.open) {
      dialog.classList.remove('closing');
      if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
      document.body.classList.add('modal-open');
    }
    var closeBtn = $('[data-close]', dialog);
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  function closeCase() {
    if (!dialog.open || dialog.classList.contains('closing')) return;
    if (reduceMotion) { dialog.close(); return; }
    dialog.classList.add('closing');
    setTimeout(function () { dialog.classList.remove('closing'); dialog.close(); }, 280);
  }

  if (dialog) {
    $$('#projectGrid .project').forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (e.target.closest('a')) return; // the GitHub link keeps working on its own
        openCase(card.getAttribute('data-case'), card.querySelector('.p-case'));
      });
    });
    var step = function (delta, focusSel) {
      caseIndex = (caseIndex + delta + CASES.length) % CASES.length;
      renderCase(caseIndex);
      var el = $(focusSel, dialog);
      if (el) el.focus({ preventScroll: true });
    };
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) { closeCase(); return; } // backdrop
      if (e.target.closest('[data-close]')) closeCase();
      else if (e.target.closest('[data-prev]')) step(-1, '[data-prev]');
      else if (e.target.closest('[data-next]')) step(1, '[data-next]');
    });
    dialog.addEventListener('cancel', function (e) { e.preventDefault(); closeCase(); }); // Esc, animated
    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') step(1, '[data-close]');
      if (e.key === 'ArrowLeft') step(-1, '[data-close]');
    });
    dialog.addEventListener('close', function () {
      document.body.classList.remove('modal-open');
      if (lastTrigger) lastTrigger.focus({ preventScroll: true });
    });
  }

  /* ---------- Live GitHub activity ---------- */
  var GH_USER = 'dhanush-prabu';
  var GH_CACHE = 'gh-cache-v1';
  var GH_TTL = 60 * 60 * 1000; // an hour keeps us well inside GitHub's 60 requests/hour limit
  var GH_HIDE = /test\d*$|^mergeconflict$|\.github\.io$/i; // practice repos and this portfolio's own repo aren't worth showing
  var LANG_COLORS = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Kotlin: '#A97BFF', Java: '#b07219',
    CSS: '#663399', HTML: '#e34c26', Dart: '#00B4AB', Shell: '#89e051', 'Jupyter Notebook': '#DA5B0B'
  };
  var ghRepos = $('#ghRepos');
  var ghStatus = $('#ghStatus');

  function langColor(l) { return LANG_COLORS[l] || '#9d9cb6'; }
  function timeAgo(iso) {
    var diff = (new Date(iso).getTime() - Date.now()) / 1000;
    var units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
    var rtf = window.Intl && Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' }) : null;
    for (var i = 0; i < units.length; i++) {
      if (Math.abs(diff) >= units[i][1] || i === units.length - 1) {
        var v = Math.round(diff / units[i][1]);
        return rtf ? rtf.format(v, units[i][0]) : Math.abs(v) + ' ' + units[i][0] + 's ago';
      }
    }
  }

  function renderGitHub(data) {
    var user = data.user;
    var repos = data.repos.filter(function (r) { return !r.fork && !r.archived && !GH_HIDE.test(r.name); });
    repos.sort(function (a, b) { return new Date(b.pushed_at) - new Date(a.pushed_at); });

    // profile
    var av = $('#ghAvatar');
    av.classList.remove('skel');
    av.innerHTML = '<img src="' + esc(user.avatar_url) + '&s=128" alt="" width="64" height="64" loading="lazy" />';
    $('#ghName').textContent = user.name || user.login;
    $('#ghRepoCount').textContent = user.public_repos;
    $('#ghFollowers').textContent = user.followers;
    $('#ghSince').textContent = new Date(user.created_at).getFullYear();

    // language mix (by repository count)
    var counts = {};
    repos.forEach(function (r) { if (r.language) counts[r.language] = (counts[r.language] || 0) + 1; });
    var langs = Object.keys(counts).map(function (k) { return [k, counts[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
    var total = langs.reduce(function (s, l) { return s + l[1]; }, 0);
    if (langs.length > 5) {
      var other = langs.slice(5).reduce(function (s, l) { return s + l[1]; }, 0);
      langs = langs.slice(0, 5).concat([['Other', other]]);
    }
    $('#langBar').innerHTML = langs.map(function (l, i) {
      return '<span style="width:' + (l[1] / total * 100).toFixed(1) + '%;background:' + langColor(l[0]) + ';--li:' + i + '" title="' + esc(l[0]) + '"></span>';
    }).join('');
    $('#langLegend').innerHTML = langs.map(function (l) {
      return '<li><i style="background:' + langColor(l[0]) + '"></i><b>' + esc(l[0]) + '</b> ' + Math.round(l[1] / total * 100) + '%</li>';
    }).join('');

    // latest repositories
    var monthAgo = Date.now() - 30 * 86400000;
    ghRepos.innerHTML = repos.slice(0, 6).map(function (r, i) {
      var meta = [];
      if (r.language) meta.push('<span><i style="background:' + langColor(r.language) + '"></i>' + esc(r.language) + '</span>');
      if (r.stargazers_count) meta.push('<span>' + icon('i-star') + r.stargazers_count + '</span>');
      if (r.forks_count) meta.push('<span>' + icon('i-fork') + r.forks_count + '</span>');
      meta.push('<span>Updated ' + esc(timeAgo(r.pushed_at)) + '</span>');
      return '<a class="repo reveal in' + (new Date(r.pushed_at) > monthAgo ? ' fresh' : '') + '" style="--d:' + (i % 2) * 0.08 + 's" href="' + esc(r.html_url) + '" target="_blank" rel="noopener">' +
        '<div class="repo-top"><span class="repo-name">' + icon('i-repo') + esc(r.name) + '</span><span class="repo-go">' + icon('i-ext') + '</span></div>' +
        (r.description ? '<p>' + esc(r.description) + '</p>' : '<p class="none">No description yet.</p>') +
        '<div class="repo-meta">' + meta.join('') + '</div></a>';
    }).join('');
  }

  function ghFail(stale) {
    if (stale) { renderGitHub(stale); return; }
    $('#ghAvatar').classList.remove('skel');
    $('#langBar').innerHTML = '';
    ghRepos.innerHTML = '';
    ghStatus.innerHTML = 'GitHub didn’t respond just now. You can browse everything on <a href="https://github.com/' + GH_USER + '" target="_blank" rel="noopener">github.com/' + GH_USER + '</a>.';
  }

  function loadGitHub() {
    var cached = null;
    try { cached = JSON.parse(localStorage.getItem(GH_CACHE)); } catch (e) {}
    if (cached && cached.user && Date.now() - cached.t < GH_TTL) { renderGitHub(cached); return; }
    if (!window.fetch) { ghFail(cached); return; }
    var get = function (url) {
      return fetch(url, { headers: { Accept: 'application/vnd.github+json' } }).then(function (r) {
        if (!r.ok) throw new Error('GitHub ' + r.status);
        return r.json();
      });
    };
    Promise.all([
      get('https://api.github.com/users/' + GH_USER),
      get('https://api.github.com/users/' + GH_USER + '/repos?sort=pushed&per_page=100')
    ]).then(function (res) {
      var u = res[0];
      var data = {
        t: Date.now(),
        user: { login: u.login, name: u.name, avatar_url: u.avatar_url, public_repos: u.public_repos, followers: u.followers, created_at: u.created_at },
        repos: res[1].map(function (r) {
          return {
            name: r.name, description: r.description, html_url: r.html_url, language: r.language, fork: r.fork, archived: r.archived,
            stargazers_count: r.stargazers_count, forks_count: r.forks_count, pushed_at: r.pushed_at
          };
        })
      };
      try { localStorage.setItem(GH_CACHE, JSON.stringify(data)); } catch (e) {}
      renderGitHub(data);
    }).catch(function () { ghFail(cached); });
  }

  /* ---------- Contribution heatmap ---------- */
  var HEAT_CACHE = 'gh-heat-v1';
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function fmtDay(iso) {
    var p = iso.split('-');
    return MONTHS[+p[1] - 1] + ' ' + +p[2] + ', ' + p[0];
  }

  function renderHeat(days) {
    var box = $('#ghHeat');
    var grid = $('#heatGrid');
    if (!box || !days.length) return;

    // stats
    var total = 0, run = 0, longest = 0;
    days.forEach(function (d) {
      total += d.count;
      if (d.count) { run++; if (run > longest) longest = run; } else run = 0;
    });
    var cur = 0, i = days.length - 1;
    if (!days[i].count) i--; // today may simply not have happened yet
    for (; i >= 0 && days[i].count; i--) cur++;
    $('#heatTotal').textContent = total;
    $('#heatCur').textContent = cur + (cur === 1 ? ' day' : ' days');
    $('#heatLong').textContent = longest + (longest === 1 ? ' day' : ' days');

    // cells, Sunday-first columns
    var offset = new Date(days[0].date + 'T00:00:00Z').getUTCDay();
    var html = '';
    for (var p = 0; p < offset; p++) html += '<i class="pad"></i>';
    var months = '', lastMonth = -1, lastWk = -9;
    days.forEach(function (d, n) {
      var wk = Math.floor((n + offset) / 7);
      var m = +d.date.slice(5, 7) - 1;
      if (m !== lastMonth) {
        if (wk - lastWk >= 3) { months += '<span style="left:' + wk * 16 + 'px">' + MONTHS[m] + '</span>'; lastWk = wk; }
        lastMonth = m;
      }
      html += '<i class="l' + d.level + '" style="--wk:' + wk + '" data-d="' + d.date + '" data-c="' + d.count + '"></i>';
    });
    grid.innerHTML = html;
    $('#heatMonths').innerHTML = months;
    box.hidden = false;
    var sc = $('#heatScroll');
    sc.scrollLeft = sc.scrollWidth; // show the most recent weeks on narrow screens

    // tooltip
    var tip = $('#heatTip');
    function show(el) {
      var c = +el.dataset.c;
      tip.innerHTML = '<b>' + (c ? c + (c === 1 ? ' contribution' : ' contributions') : 'No contributions') + '</b> · ' + fmtDay(el.dataset.d);
      tip.hidden = false;
      var b = box.getBoundingClientRect(), r = el.getBoundingClientRect();
      tip.style.left = (r.left - b.left + r.width / 2) + 'px';
      tip.style.top = (r.top - b.top - 8) + 'px';
    }
    grid.addEventListener('mouseover', function (e) { if (e.target.dataset && e.target.dataset.d) show(e.target); });
    grid.addEventListener('mouseleave', function () { tip.hidden = true; });
    grid.addEventListener('click', function (e) { if (e.target.dataset && e.target.dataset.d) show(e.target); });
  }

  function loadHeat() {
    var cached = null;
    try { cached = JSON.parse(localStorage.getItem(HEAT_CACHE)); } catch (e) {}
    if (cached && cached.days && Date.now() - cached.t < GH_TTL) { renderHeat(cached.days); return; }
    if (!window.fetch) { if (cached) renderHeat(cached.days); return; }
    // public mirror of the contribution calendar (GitHub's own needs a token)
    fetch('https://github-contributions-api.jogruber.de/v4/' + GH_USER + '?y=last').then(function (r) {
      if (!r.ok) throw new Error('heat ' + r.status);
      return r.json();
    }).then(function (j) {
      var days = (j.contributions || []).map(function (d) { return { date: d.date, count: d.count, level: d.level }; });
      if (!days.length) throw new Error('empty');
      try { localStorage.setItem(HEAT_CACHE, JSON.stringify({ t: Date.now(), days: days })); } catch (e) {}
      renderHeat(days);
    }).catch(function () { if (cached) renderHeat(cached.days); });
  }

  if (ghRepos) {
    // only call the API when someone is about to reach the section
    if ('IntersectionObserver' in window) {
      var gio = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { gio.disconnect(); loadGitHub(); loadHeat(); }
      }, { rootMargin: '600px 0px' });
      gio.observe($('#github'));
    } else {
      loadGitHub();
      loadHeat();
    }
  }

  /* ---------- Copy email ---------- */
  var copyBtn = $('#copyMail');
  copyBtn.addEventListener('click', function () {
    var email = 'dhanushprabu23@gmail.com';
    function done() {
      copyBtn.classList.add('copied');
      copyBtn.setAttribute('aria-label', 'Email copied');
      setTimeout(function () { copyBtn.classList.remove('copied'); copyBtn.setAttribute('aria-label', 'Copy email address'); }, 1800);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(email).then(done, function () {});
    } else {
      var ta = document.createElement('textarea');
      ta.value = email; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      document.body.removeChild(ta);
    }
  });

  /* ---------- Contact form → mailto ---------- */
  var form = $('#contactForm');
  var note = $('#formNote');
  if (form) {
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function setErr(input, msg) {
    var field = input.closest('.field');
    field.classList.remove('invalid');
    if (msg) { void field.offsetWidth; field.classList.add('invalid'); }
    $('.err', field).textContent = msg || '';
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  function validate(input) {
    var v = input.value.trim();
    if (!v) { setErr(input, 'This field is required.'); return false; }
    if (input.type === 'email' && !emailRe.test(v)) { setErr(input, 'Please enter a valid email address.'); return false; }
    if (input.name === 'message' && v.length < 10) { setErr(input, 'Please write at least 10 characters.'); return false; }
    setErr(input, ''); return true;
  }
  $$('input, textarea', form).forEach(function (inp) {
    inp.addEventListener('blur', function () { if (inp.value) validate(inp); });
    inp.addEventListener('input', function () { if (inp.closest('.field').classList.contains('invalid')) validate(inp); });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = $$('input, textarea', form).map(validate).every(Boolean);
    if (!ok) { note.textContent = 'Please fix the highlighted fields.'; return; }
    var name = form.elements.name.value.trim();
    var email = form.elements.email.value.trim();
    var msg = form.elements.message.value.trim();
    window.location.href = 'mailto:dhanushprabu23@gmail.com?subject=' + encodeURIComponent('Portfolio enquiry from ' + name) +
      '&body=' + encodeURIComponent(msg + '\n\n— ' + name + '\n' + email);
    note.textContent = 'Opening your email app… if nothing happens, write to dhanushprabu23@gmail.com.';
  });
  }

  /* ---------- Footer year ---------- */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
