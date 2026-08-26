/* Shrinqo FX v2 — cinematic motion engine
   GSAP timelines · particle field · aurora · confetti · magnetic UI */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var G = window.gsap || null;
  var COLORS = ['#2563eb', '#7c3aed', '#0ea5e9', '#10b981'];

  /* ---------- scroll progress + header state ---------- */
  var bar = document.createElement('div');
  bar.id = 'fx-progress';
  document.body.appendChild(bar);
  var headerEl = document.querySelector('header');
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? (h.scrollTop || document.body.scrollTop) / max : 0) + ')';
    if (headerEl) headerEl.classList.toggle('scrolled', (h.scrollTop || 0) > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- section reveals (.sr system) ---------- */
  var srEls = [].slice.call(document.querySelectorAll('.sr'));
  if ('IntersectionObserver' in window && srEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('revealed');
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    srEls.forEach(function (el) { io.observe(el); });
  } else {
    srEls.forEach(function (el) { el.classList.add('revealed'); });
  }

  /* ---------- helpers ---------- */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function centerOf(node) {
    var r = node.getBoundingClientRect();
    return { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight };
  }

  /* ---------- confetti toolkit ---------- */
  function boom(origin, opts) {
    if (!window.confetti) return;
    var o = opts || {};
    window.confetti(Object.assign({
      particleCount: o.count || 90,
      spread: o.spread || 78,
      startVelocity: o.velocity || 42,
      scalar: o.scalar || 1,
      ticks: o.ticks || 220,
      origin: origin,
      colors: COLORS,
      disableForReducedMotion: true,
      zIndex: 2147483000
    }, o.extra || {}));
  }
  function celebrateCard(card) {
    if (!card) return;
    card.classList.add('fx-ring');
    card.classList.remove('fx-celebrate');
    void card.offsetWidth;
    card.classList.add('fx-celebrate');
    var c = centerOf(card);
    boom({ x: c.x - 0.18, y: Math.max(0.12, c.y - 0.05) }, { count: 60, spread: 60, angle: 60 });
    boom({ x: c.x + 0.18, y: Math.max(0.12, c.y - 0.05) }, { count: 60, spread: 60, angle: 120 });
    boom({ x: c.x, y: Math.max(0.1, c.y - 0.1) }, { count: 80, spread: 100 });
  }

  /* ---------- copy feedback (pulse + micro-burst) ---------- */
  window.fxCopied = function (node) {
    if (!node) return;
    node.classList.remove('fx-copied');
    void node.offsetWidth;
    node.classList.add('fx-copied');
    boom(centerOf(node), { count: 34, spread: 55, velocity: 20, scalar: 0.75, ticks: 110 });
  };

  /* ---------- error shake watchers ---------- */
  ['form-msg', 'text-msg', 'file-msg'].forEach(function (id) {
    var m = document.getElementById(id);
    if (!m) return;
    new MutationObserver(function () {
      if (m.style.display !== 'none') {
        m.classList.remove('fx-shake');
        void m.offsetWidth;
        m.classList.add('fx-shake');
      }
    }).observe(m, { attributes: true, attributeFilter: ['style'] });
  });

  /* ---------- success / QR hooks ---------- */
  var res = document.getElementById('result');
  var celebrated = false;
  if (res) {
    new MutationObserver(function () {
      var shown = res.style.display !== 'none' && res.offsetParent !== null;
      if (shown && !celebrated) {
        celebrated = true;
        celebrateCard(res);
      } else if (!shown) {
        celebrated = false;
      }
    }).observe(res, { attributes: true, attributeFilter: ['style'] });
  }
  var qrBox = document.getElementById('qr-box');
  if (qrBox) {
    new MutationObserver(function () {
      var kid = qrBox.firstElementChild;
      if (kid && qrBox.offsetParent !== null) {
        kid.classList.remove('fx-pop');
        void kid.offsetWidth;
        kid.classList.add('fx-pop');
      }
    }).observe(qrBox, { childList: true });
  }

  /* ---------- hero scenery: aurora + particles ---------- */
  var hero = document.getElementById('hero-section');
  var aurora = null;
  if (hero) {
    aurora = el('div', 'fx-aurora');
    aurora.setAttribute('aria-hidden', 'true');
    aurora.innerHTML = '<i></i><i></i><i></i>';
    hero.insertBefore(aurora, hero.firstChild);

    var cv = el('canvas');
    cv.id = 'fx-particles';
    cv.setAttribute('aria-hidden', 'true');
    hero.appendChild(cv);

    var ctx = cv.getContext('2d');
    var W = 0, H = 0, parts = [], running = true;
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var mouse = { x: -9999, y: -9999 };

    function size() {
      W = hero.clientWidth; H = hero.clientHeight;
      cv.width = W * DPR; cv.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    function spawn(anyY) {
      var hue = Math.random() < 0.72 ? 217 : 262;
      return {
        x: Math.random() * W,
        y: anyY ? Math.random() * H : H + 8,
        r: Math.random() * 2.1 + 0.7,
        vx: (Math.random() - 0.5) * 0.24,
        vy: -(Math.random() * 0.3 + 0.07),
        hue: hue,
        a: Math.random() * 0.32 + 0.14
      };
    }
    function seed() {
      parts = [];
      var n = W < 700 ? 26 : 46;
      for (var i = 0; i < n; i++) parts.push(spawn(true));
    }
    function step() {
      if (running) {
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          var dx = p.x - mouse.x, dy = p.y - mouse.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 8100 && d2 > 0.01) {
            var d = Math.sqrt(d2), f = (90 - d) / 90 * 0.6;
            p.x += dx / d * f; p.y += dy / d * f;
          }
          p.x += p.vx; p.y += p.vy;
          if (p.x < -12) p.x = W + 10; else if (p.x > W + 12) p.x = -10;
          if (p.y < -12) parts[i] = spawn(false);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, 6.2832);
          ctx.fillStyle = 'hsla(' + p.hue + ',86%,62%,' + p.a + ')';
          ctx.fill();
        }
      }
      requestAnimationFrame(step);
    }
    size(); seed();
    window.addEventListener('resize', function () { size(); seed(); }, { passive: true });
    if (fine) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      }, { passive: true });
      hero.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; }, { passive: true });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        running = en[0].isIntersecting && !document.hidden;
      }, { threshold: 0 }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { running = !document.hidden; });
    requestAnimationFrame(step);
  }

  /* ---------- cursor glow ---------- */
  if (fine) {
    var glow = el('div');
    glow.id = 'fx-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);
    var tx = innerWidth / 2, ty = innerHeight / 3, gx = tx, gy = ty;
    window.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function followLoop() {
      gx += (tx - gx) * 0.11; gy += (ty - gy) * 0.11;
      glow.style.transform = 'translate(' + gx.toFixed(1) + 'px,' + gy.toFixed(1) + 'px)';
      requestAnimationFrame(followLoop);
    })();
  }

  /* ---------- marquee ticker ---------- */
  if (hero && hero.nextElementSibling) {
    var items = ['Instant Short Links', 'QR Codes', 'Click Analytics', 'Text Pastes',
      'File Sharing · 100 MB', 'Custom Aliases', 'Permanent Links', 'No Signup Needed'];
    var half = '<b>' + items.join('</b><b>') + '</b>';
    var mq = el('div', 'fx-marquee');
    mq.setAttribute('aria-hidden', 'true');
    mq.innerHTML = '<div class="fx-marquee-track">' + half + half + '</div>';
    hero.parentNode.insertBefore(mq, hero.nextElementSibling);
  }

  /* ---------- char splitter (word-safe, preserves <br> + nested spans) ---------- */
  function splitChars(root) {
    var chars = [];
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(function (tok) {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = el('span');
            w.style.cssText = 'display:inline-block;white-space:nowrap';
            tok.split('').forEach(function (c) {
              var s = el('span');
              s.textContent = c;
              s.style.display = 'inline-block';
              w.appendChild(s);
              chars.push(s);
            });
            frag.appendChild(w);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1 && ch.tagName !== 'BR') walk(ch);
      });
    })(root);
    return chars;
  }

  /* ---------- hero entrance timeline ---------- */
  if (G && hero) {
    try {
      var chars = [];
      var title = hero.querySelector('.hero-title');
      if (title) { chars = splitChars(title); title.style.perspective = '700px'; }
      var tl = G.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('header.site-header', { y: -26, opacity: 0, duration: 0.55 }, 0)
        .from('.hero-badge', { y: 18, opacity: 0, duration: 0.5 }, 0.1)
        .from(chars, {
          yPercent: 120, rotateX: -75, opacity: 0, transformOrigin: '50% 100%',
          duration: 0.8, stagger: 0.03, ease: 'back.out(1.7)'
        }, 0.22)
        .from('.hero-sub', { y: 16, opacity: 0, duration: 0.55 }, '-=.35')
        .from('.hero-stat', { y: 16, opacity: 0, scale: 0.9, duration: 0.45, stagger: 0.09 }, '-=.3')
        .from('#main-card', { y: 40, opacity: 0, scale: 0.96, duration: 0.7, ease: 'power4.out' }, '-=.28')
        .from('.features-section .section-badge, .features-section .section-title, .features-section .section-sub',
          { y: 22, opacity: 0, duration: 0.5, stagger: 0.08 }, '-=.3');
    } catch (err) {
      G.set(['header.site-header', '.hero-badge', '.hero-sub', '.hero-stat', '#main-card',
        '.section-badge', '.section-title', '.section-sub'], { clearProps: 'all' });
    }
  }

  /* ---------- card tilt + pointer glare ---------- */
  if (fine) {
    document.querySelectorAll('.feature-card, .step-card').forEach(function (card) {
      card.classList.add('fx-tilt', 'fx-glare');
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--gx', ((x + 0.5) * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', ((y + 0.5) * 100).toFixed(1) + '%');
        card.style.transform = 'perspective(800px) rotateY(' + (x * 10).toFixed(2) +
          'deg) rotateX(' + (-y * 10).toFixed(2) + 'deg) translateY(-5px) scale(1.02)';
      });
      card.addEventListener('pointerleave', function () { card.style.transform = ''; });
    });
  }

  /* ---------- magnetic primary buttons ---------- */
  if (fine && G) {
    document.querySelectorAll('.btn-primary').forEach(function (b) {
      b.classList.add('fx-magnet');
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        G.to(b, {
          x: (e.clientX - r.left - r.width / 2) * 0.22,
          y: (e.clientY - r.top - r.height / 2) * 0.32,
          duration: 0.35, ease: 'power3.out', overwrite: 'auto'
        });
      });
      b.addEventListener('pointerleave', function () {
        G.to(b, { x: 0, y: 0, duration: 0.75, ease: 'elastic.out(1,.4)', overwrite: 'auto' });
      });
    });
  }

  /* ---------- click ripple ---------- */
  document.addEventListener('pointerdown', function (e) {
    var b = e.target.closest ? e.target.closest('.fx-btn') : null;
    if (!b) return;
    var r = b.getBoundingClientRect();
    var d = Math.max(r.width, r.height) * 1.15;
    var s = el('span', 'fx-ripple');
    s.style.width = s.style.height = d + 'px';
    s.style.left = (e.clientX - r.left - d / 2) + 'px';
    s.style.top = (e.clientY - r.top - d / 2) + 'px';
    b.appendChild(s);
    setTimeout(function () { s.remove(); }, 700);
  }, { passive: true });

  /* ---------- aurora parallax ---------- */
  if (aurora) {
    window.addEventListener('scroll', function () {
      aurora.style.transform = 'translateY(' + ((window.scrollY || 0) * 0.07).toFixed(1) + 'px)';
    }, { passive: true });
  }

  /* ---------- typed tagline ---------- */
  var sub = document.querySelector('.hero-sub');
  if (sub && window.Typed) {
    var anchor = el('span', 'fx-typed-wrap');
    anchor.style.cssText = 'color:#1d4ed8;font-weight:700';
    sub.appendChild(document.createElement('br'));
    sub.appendChild(anchor);
    new Typed(anchor, {
      strings: ['Shorten links.', 'Share files.', 'Paste text.', 'Track clicks.', 'Own your links.'],
      typeSpeed: 52, backSpeed: 26, backDelay: 1400, startDelay: 900,
      loop: true, smartBackspace: false
    });
  }

  /* ---------- animated counters ---------- */
  var counters = [].slice.call(document.querySelectorAll('[data-count-to]'));
  if (counters.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var target = parseInt(en.target.getAttribute('data-count-to'), 10) || 0;
        var cell = en.target;
        if (window.CountUp) {
          var cu = new CountUp.CountUp(cell, target, { duration: 1.6, separator: ',' });
          if (!cu.error) { cu.start(); setTimeout(function () { cell.classList.add('stat-done'); }, 1650); }
          else cell.textContent = target.toLocaleString();
        } else {
          cell.textContent = target.toLocaleString();
        }
        cio.unobserve(en.target);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { c.classList.add('fx-counter'); cio.observe(c); });
  }

  /* ---------- AOS ---------- */
  if (window.AOS) AOS.init({ duration: 650, easing: 'ease-out-cubic', once: true, offset: 60 });

  /* ---------- sheen class on buttons ---------- */
  document.querySelectorAll('.btn, .btn-p, button[class*="grad"], .hero-cta button').forEach(function (b) {
    b.classList.add('fx-btn');
  });

  /* ============================================================
     FX v3
     ============================================================ */

  /* ---------- loader wipe handoff ---------- */
  var loader = document.getElementById('fxLoader');
  if (loader) {
    var wipe = function () {
      setTimeout(function () {
        loader.classList.add('done');
        try { sessionStorage.setItem('fxSeen', '1'); } catch (e) {}
        setTimeout(function () { if (loader.parentNode) loader.remove(); }, 800);
      }, 180);
    };
    if (document.readyState === 'complete') wipe();
    else window.addEventListener('load', wipe);
  }

  /* ---------- scramble-in section titles ---------- */
  function scramble(node) {
    var orig = node.textContent;
    var pool = '!<>-_\\/[]{}=+*^?#@%&';
    var frame = 0, total = Math.max(16, orig.length + 8);
    var iv = setInterval(function () {
      frame++;
      var solved = Math.floor((frame / total) * orig.length);
      var out = '';
      for (var i = 0; i < orig.length; i++) {
        out += i < solved ? orig[i] : (orig[i] === ' ' ? ' ' : pool[Math.floor(Math.random() * pool.length)]);
      }
      node.textContent = out;
      if (frame >= total) { node.textContent = orig; clearInterval(iv); }
    }, 32);
  }
  var titles = [].slice.call(document.querySelectorAll('.section-title'));
  if ('IntersectionObserver' in window && titles.length) {
    var sio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        scramble(en.target);
        sio.unobserve(en.target);
      });
    }, { threshold: 0.6 });
    titles.forEach(function (t) { sio.observe(t); });
  }

  /* ---------- spotlight hover on cards ---------- */
  if (fine) {
    document.querySelectorAll('.feature-card, .step-card, .tool-card').forEach(function (c) {
      c.classList.add('fx-spot');
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
        c.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
      }, { passive: true });
    });
  }

  /* ---------- conic ring on the main card ---------- */
  var mainCard = document.getElementById('main-card');
  if (mainCard) mainCard.classList.add('fx-ring');

  /* ---------- tool panel switch animation ---------- */
  ['tool-panel-url', 'tool-panel-text', 'tool-panel-file'].forEach(function (id) {
    var p = document.getElementById(id);
    if (!p) return;
    new MutationObserver(function () {
      if (p.style.display !== 'none' && p.offsetParent !== null) {
        p.classList.remove('panel-live');
        void p.offsetWidth;
        p.classList.add('panel-live');
      }
    }).observe(p, { attributes: true, attributeFilter: ['style'] });
  });

  /* ---------- underline-draw links ---------- */
  document.querySelectorAll('.result-link a, footer a, .site-foot a').forEach(function (a) {
    a.classList.add('fx-ul');
  });

  /* ---------- easter eggs: konami storm + logo double-tap ---------- */
  var seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  var ki = 0;
  window.addEventListener('keydown', function (e) {
    ki = (e.key && e.key.toLowerCase() === seq[ki].toLowerCase()) ? ki + 1 : ((e.key === seq[0]) ? 1 : 0);
    if (ki === seq.length) {
      ki = 0;
      for (var j = 0; j < 6; j++) {
        (function (d) {
          setTimeout(function () {
            boom({ x: Math.random(), y: 0.18 + Math.random() * 0.4 }, { count: 130, spread: 120, velocity: 55 });
          }, d * 170);
        })(j);
      }
    }
  });
  var brand = document.querySelector('.brand');
  if (brand) {
    brand.addEventListener('dblclick', function (e) {
      e.preventDefault();
      boom(centerOf(brand), { count: 140, spread: 100, velocity: 50 });
    });
  }

  /* ============================================================
     FX v4
     ============================================================ */

  /* ---------- orb mouse-parallax depth (desktop) ---------- */
  if (fine && hero) {
    var orbs = [].slice.call(hero.querySelectorAll('.hero-orb'));
    if (orbs.length) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - 0.5;
        var dy = (e.clientY - r.top) / r.height - 0.5;
        for (var i = 0; i < orbs.length; i++) {
          var d = (i + 1) * 14;
          orbs[i].style.marginLeft = (dx * d).toFixed(1) + 'px';
          orbs[i].style.marginTop = (dy * d).toFixed(1) + 'px';
        }
      }, { passive: true });
    }
  }

  /* ---------- main-card whisper tilt (desktop, ±3°) ---------- */
  var mCard = document.getElementById('main-card');
  if (fine && mCard) {
    mCard.addEventListener('pointermove', function (e) {
      var r = mCard.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      mCard.style.transform = 'perspective(1300px) rotateY(' + (x * 3).toFixed(2) +
        'deg) rotateX(' + (-y * 3).toFixed(2) + 'deg)';
    }, { passive: true });
    mCard.addEventListener('pointerleave', function () { mCard.style.transform = ''; });
  }

  /* ---------- directional reveals by grid position ---------- */
  [].slice.call(document.querySelectorAll('.features-grid')).forEach(function (g) {
    var n = g.children.length;
    if (n < 3) return;
    [].slice.call(g.children).forEach(function (c, i) {
      if (i % n === 0) c.classList.add('sr-l');
      else if (i % n === n - 1) c.classList.add('sr-r');
    });
  });

  /* ---------- footer mega watermark ---------- */
  var foot = document.querySelector('footer.site-foot, .site-foot, footer');
  if (foot && !foot.querySelector('.fx-mark')) {
    var mark = el('div', 'fx-mark');
    mark.setAttribute('aria-hidden', 'true');
    mark.innerHTML = '<b>SHRINQO</b>';
    foot.insertBefore(mark, foot.firstChild);
  }

  /* ---------- hidden-tab wink ---------- */
  var baseTitle = document.title;
  document.addEventListener('visibilitychange', function () {
    document.title = document.hidden ? '\uD83D\uDC4B Come back! \u2014 Shrinqo' : baseTitle;
  });
})();
