/* Shrinqo SubFX v2 — cinematic animation layer for steps/paste/file/error/docs pages.
   Vanilla JS, zero deps, honors prefers-reduced-motion, desktop-only effects gated by pointer:fine. */
(function () {
  'use strict';
  var rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(pointer: fine)').matches;
  if (document.getElementById('sx-style')) return;

  var COLORS = ['#2563eb', '#7c3aed', '#0ea5e9'];

  var css = ''
    /* orbs */
    + '@keyframes sxDrift1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(46px,-30px) scale(1.08)}66%{transform:translate(-24px,18px) scale(.94)}}'
    + '@keyframes sxDrift2{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(-38px,26px) scale(1.06)}70%{transform:translate(26px,-16px) scale(.95)}}'
    + '@keyframes sxDrift3{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,34px) scale(1.1)}}'
    + '.sx-orb{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0;will-change:transform}'
    + '.sx-o1{width:520px;height:520px;top:-170px;right:-140px;background:radial-gradient(circle,rgba(37,99,235,.17),transparent 70%);animation:sxDrift1 26s ease-in-out infinite}'
    + '.sx-o2{width:560px;height:560px;bottom:-210px;left:-160px;background:radial-gradient(circle,rgba(124,58,237,.15),transparent 70%);animation:sxDrift2 31s ease-in-out infinite}'
    + '.sx-o3{width:340px;height:340px;top:38%;left:52%;background:radial-gradient(circle,rgba(14,165,233,.12),transparent 70%);animation:sxDrift3 22s ease-in-out infinite}'
    /* grain */
    + '.sx-grain{position:fixed;inset:0;z-index:1;pointer-events:none;opacity:.05;background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27120%27 height=%27120%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27 opacity=%270.6%27/%3E%3C/svg%3E")}'
    /* cursor glow */
    + '.sx-glow{position:fixed;width:420px;height:420px;border-radius:50%;pointer-events:none;z-index:0;background:radial-gradient(circle,rgba(37,99,235,.09),transparent 65%);transform:translate(-50%,-50%);left:-999px;top:-999px}'
    /* reveal */
    + '.sx-reveal{opacity:0;transform:translateY(26px)}'
    + '.sx-in{opacity:1;transform:none!important;transition:opacity .65s cubic-bezier(.22,1,.36,1),transform .65s cubic-bezier(.22,1,.36,1)}'
    /* tilt */
    + '[data-tilt]{will-change:transform;transform-style:preserve-3d}'
    + '.sx-spot{position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity .3s ease;background:radial-gradient(420px circle at var(--mx,50%) var(--my,50%),rgba(37,99,235,.10),transparent 45%)!important}'
    + '[data-tilt]:hover .sx-spot{opacity:1}'
    /* magnetic */
    + '.sx-mag{transition:transform .18s cubic-bezier(.22,1,.36,1)!important}'
    /* ripple */
    + '.sx-rip{position:absolute;border-radius:50%;pointer-events:none;background:radial-gradient(circle,rgba(255,255,255,.55),transparent 60%);transform:scale(0);animation:sxRip .55s ease-out forwards;z-index:2}'
    + '@keyframes sxRip{to{transform:scale(3.4);opacity:0}}'
    /* progress bar */
    + '#sx-bar{position:fixed;top:0;left:0;height:3px;width:0;z-index:80;background:linear-gradient(90deg,#2563eb,#7c3aed,#0ea5e9);border-radius:0 99px 99px 0;box-shadow:0 0 12px rgba(37,99,235,.55);transition:width .08s linear}'
    /* wipe */
    + '#sx-wipe{position:fixed;inset:0;z-index:2147483646;pointer-events:none;transform:translateY(102%);background:linear-gradient(135deg,#2563eb,#7c3aed)}'
    + '#sx-wipe.go{transition:transform .45s cubic-bezier(.76,0,.24,1);transform:translateY(0)}'
    /* shimmer text */
    + '.gtext{background:linear-gradient(90deg,#2563eb,#7c3aed,#0ea5e9,#2563eb);background-size:280% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;animation:sxShim 5s linear infinite}'
    + '@keyframes sxShim{to{background-position:280% center}}'
    /* ===== NEW: floating particle canvas ===== */
    + '#sx-particles{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0}'
    /* ===== NEW: conic ring on main card ===== */
    + '@property --sx-ring-a{syntax:"<angle>";initial-value:0deg;inherits:false}'
    + '.sx-ring{position:relative}'
    + '.sx-ring::before{content:"";position:absolute;inset:-2px;border-radius:inherit;padding:2px;background:conic-gradient(from var(--sx-ring-a),#2563eb,#7c3aed,#0ea5e9,#2563eb);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;animation:sxRingSpin 5s linear infinite;opacity:.55;pointer-events:none;z-index:0}'
    + '@keyframes sxRingSpin{to{--sx-ring-a:360deg}}'
    + '.sx-ring>*{position:relative;z-index:1}'
    /* ===== NEW: countdown ring glow pulse ===== */
    + '.sx-glow-pulse{animation:sxGlowPulse 1.2s ease-in-out infinite}'
    + '@keyframes sxGlowPulse{0%,100%{filter:drop-shadow(0 0 6px rgba(37,99,235,.3))}50%{filter:drop-shadow(0 0 18px rgba(37,99,235,.6))}}'
    /* ===== NEW: staggered entrance for inner elements ===== */
    + '.sx-stag{opacity:0;transform:translateY(14px);transition:opacity .5s cubic-bezier(.22,1,.36,1),transform .5s cubic-bezier(.22,1,.36,1)}'
    + '.sx-stag.sx-show{opacity:1;transform:none}'
    /* ===== NEW: button hover glow ===== */
    + '.sx-glow-btn{transition:box-shadow .3s ease,transform .2s ease}'
    + '.sx-glow-btn:hover{box-shadow:0 0 24px rgba(37,99,235,.35),0 8px 20px -6px rgba(37,99,235,.5);transform:translateY(-2px)}'
    + '.sx-glow-btn:active{transform:scale(.97);box-shadow:0 0 12px rgba(37,99,235,.25)}'
    /* ===== NEW: smooth count-up number ===== */
    + '.sx-count{font-variant-numeric:tabular-nums;transition:transform .3s cubic-bezier(.22,1,.36,1)}'
    + '.sx-count.bump{transform:scale(1.15)}'
    /* ===== NEW: card entrance cascade ===== */
    + '@keyframes sxCardIn{from{opacity:0;transform:translateY(20px) scale(.97)}to{opacity:1;transform:none}}'
    + '.sx-card-in{animation:sxCardIn .55s cubic-bezier(.22,1,.36,1) both}'
    /* reduced motion */
    + '@media(prefers-reduced-motion:reduce){.sx-orb,.gtext,.sx-glow-pulse,.sx-ring::before{animation:none!important}.sx-reveal{opacity:1;transform:none}#sx-particles{display:none}}';
  var st = document.createElement('style');
  st.id = 'sx-style';
  st.textContent = css;
  document.head.appendChild(st);

  function ready(fn) { document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn(); }

  ready(function () {
    if (rm) return;

    /* --- floating particles canvas --- */
    var pCanvas = document.createElement('canvas');
    pCanvas.id = 'sx-particles';
    pCanvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(pCanvas);
    var pCtx = pCanvas.getContext('2d');
    var pW = 0, pH = 0, parts = [], pRunning = true;
    var pDPR = Math.min(window.devicePixelRatio || 1, 2);
    function pSize() { pW = innerWidth; pH = innerHeight; pCanvas.width = pW * pDPR; pCanvas.height = pH * pDPR; pCtx.setTransform(pDPR, 0, 0, pDPR, 0, 0); }
    function pSpawn(anyY) {
      return { x: Math.random() * pW, y: anyY ? Math.random() * pH : pH + 6, r: Math.random() * 1.8 + 0.6, vx: (Math.random() - 0.5) * 0.18, vy: -(Math.random() * 0.22 + 0.05), hue: Math.random() < 0.6 ? 217 : 262, a: Math.random() * 0.25 + 0.08 };
    }
    function pSeed() { parts = []; var n = pW < 600 ? 18 : 32; for (var i = 0; i < n; i++) parts.push(pSpawn(true)); }
    function pStep() {
      if (pRunning) {
        pCtx.clearRect(0, 0, pW, pH);
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          p.x += p.vx; p.y += p.vy;
          if (p.x < -10) p.x = pW + 8; else if (p.x > pW + 10) p.x = -8;
          if (p.y < -10) parts[i] = pSpawn(false);
          pCtx.beginPath(); pCtx.arc(p.x, p.y, p.r, 0, 6.2832);
          pCtx.fillStyle = 'hsla(' + p.hue + ',80%,60%,' + p.a + ')';
          pCtx.fill();
        }
      }
      requestAnimationFrame(pStep);
    }
    pSize(); pSeed(); pStep();
    window.addEventListener('resize', function () { pSize(); pSeed(); }, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { pRunning = en[0].isIntersecting && !document.hidden; }, { threshold: 0 }).observe(document.body);
    }
    document.addEventListener('visibilitychange', function () { pRunning = !document.hidden; });

    /* --- orb parallax on mouse (desktop) --- */
    if (fine) {
      var orbs = [].slice.call(document.querySelectorAll('.sx-orb'));
      document.addEventListener('mousemove', function (e) {
        var dx = e.clientX / innerWidth - 0.5, dy = e.clientY / innerHeight - 0.5;
        for (var i = 0; i < orbs.length; i++) {
          var d = (i + 1) * 10;
          orbs[i].style.marginLeft = (dx * d).toFixed(1) + 'px';
          orbs[i].style.marginTop = (dy * d).toFixed(1) + 'px';
        }
      }, { passive: true });
    }

    /* --- orbs --- */
    ['sx-o1', 'sx-o2', 'sx-o3'].forEach(function (c) {
      var o = document.createElement('div');
      o.className = 'sx-orb ' + c;
      o.setAttribute('aria-hidden', 'true');
      document.body.appendChild(o);
    });
    var g = document.createElement('div');
    g.className = 'sx-grain';
    g.setAttribute('aria-hidden', 'true');
    document.body.appendChild(g);

    /* --- cursor glow (desktop) --- */
    if (fine) {
      var glow = document.createElement('div');
      glow.className = 'sx-glow';
      glow.setAttribute('aria-hidden', 'true');
      document.body.appendChild(glow);
      var gx = -999, gy = -999, cx = gx, cy = gy;
      document.addEventListener('mousemove', function (e) { gx = e.clientX; gy = e.clientY; }, { passive: true });
      (function loop() {
        cx += (gx - cx) * 0.12; cy += (gy - cy) * 0.12;
        glow.style.left = cx + 'px'; glow.style.top = cy + 'px';
        requestAnimationFrame(loop);
      })();
    }

    /* --- card reveal (IntersectionObserver) --- */
    var revs = [].slice.call(document.querySelectorAll('.card, section.card, .step'));
    if ('IntersectionObserver' in window && revs.length) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('sx-in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      revs.forEach(function (el, i) {
        el.classList.add('sx-reveal');
        el.style.transitionDelay = Math.min(i * 70, 350) + 'ms';
        io.observe(el);
      });
    }

    /* --- staggered inner elements (.chip, .ring, .cta, .rmsg, .dots, .chip, p, h1, h2) --- */
    var stagEls = [].slice.call(document.querySelectorAll('.chip, .ring, .cta, .rmsg, .dots, main p, main h1, main h2, #dlbox > div:first-child, #stepbox'));
    if ('IntersectionObserver' in window && stagEls.length) {
      var sio = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (en.isIntersecting) {
            var idx = stagEls.indexOf(en.target);
            setTimeout(function () { en.target.classList.add('sx-show'); }, Math.min((idx >= 0 ? idx : 0) * 80, 400));
            sio.unobserve(en.target);
          }
        });
      }, { threshold: 0.1 });
      stagEls.forEach(function (el) { el.classList.add('sx-stag'); sio.observe(el); });
    }

    /* --- conic ring on main card --- */
    var ringCard = document.querySelector('.card');
    if (ringCard) ringCard.classList.add('sx-ring');

    /* --- countdown ring glow pulse --- */
    var ring = document.getElementById('ring');
    if (ring) ring.classList.add('sx-glow-pulse');

    /* --- button glow effect --- */
    [].slice.call(document.querySelectorAll('.gbtn, .cta.go')).forEach(function (b) {
      b.classList.add('sx-glow-btn');
    });

    /* --- 3D card tilt + spotlight (desktop) --- */
    if (fine) {
      [].slice.call(document.querySelectorAll('.card')).forEach(function (card) {
        if (card.dataset.tiltDone) return;
        card.dataset.tiltDone = '1';
        card.setAttribute('data-tilt', '');
        if (!card.style.position || card.style.position === 'static') card.style.position = 'relative';
        var spot = document.createElement('div');
        spot.className = 'sx-spot';
        spot.setAttribute('aria-hidden', 'true');
        card.appendChild(spot);
        card.addEventListener('mousemove', function (e) {
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
          card.style.setProperty('--mx', (px * 100) + '%');
          card.style.setProperty('--my', (py * 100) + '%');
          card.style.transform = 'perspective(900px) rotateX(' + ((0.5 - py) * 3.2).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * 3.2).toFixed(2) + 'deg)';
        });
        card.addEventListener('mouseleave', function () { card.style.transform = ''; });
      });

      /* --- magnetic buttons (desktop) --- */
      [].slice.call(document.querySelectorAll('.gbtn, .btn-p, .cta.go')).forEach(function (b) {
        b.classList.add('sx-mag');
        b.addEventListener('mousemove', function (e) {
          var r = b.getBoundingClientRect();
          b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.28 - 2).toFixed(1) + 'px)';
        });
        b.addEventListener('mouseleave', function () { b.style.transform = ''; });
      });
    }

    /* --- click ripple --- */
    document.addEventListener('click', function (e) {
      var t = e.target.closest('.gbtn, .btn-p, .cta, .sa-card');
      if (!t || rm) return;
      var r = t.getBoundingClientRect();
      var rip = document.createElement('span');
      rip.className = 'sx-rip';
      var s = Math.max(r.width, r.height);
      rip.style.width = rip.style.height = s + 'px';
      rip.style.left = (e.clientX - r.left - s / 2) + 'px';
      rip.style.top = (e.clientY - r.top - s / 2) + 'px';
      if (getComputedStyle(t).position === 'static') t.style.position = 'relative';
      t.style.overflow = 'hidden';
      t.appendChild(rip);
      setTimeout(function () { rip.remove(); }, 600);
    }, true);

    /* --- data-count animation --- */
    [].slice.call(document.querySelectorAll('[data-count]')).forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      if (!target) return;
      var t0 = null, dur = 1100;
      function tick(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });

    /* --- reading progress bar --- */
    var bar = document.createElement('div');
    bar.id = 'sx-bar';
    document.body.appendChild(bar);
    function barUpd() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 40 ? (window.scrollY / h) * 100 : 0) + '%';
    }
    window.addEventListener('scroll', barUpd, { passive: true });
    barUpd();

    /* --- page-leave wipe --- */
    var wipe = document.createElement('div');
    wipe.id = 'sx-wipe';
    document.body.appendChild(wipe);
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download') || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || /^(mailto|tel|javascript):/i.test(href)) return;
      try { if (new URL(href, location.href).origin !== location.origin) return; } catch (err) { return; }
      e.preventDefault();
      wipe.classList.add('go');
      setTimeout(function () { location.href = href; }, 430);
    }, true);
  });
})();
