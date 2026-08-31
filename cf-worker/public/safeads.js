const SafeAds = {
  V: 15,
  directUrl: 'https://omg10.com/4/11468566',

  ads: [
    { emoji: '🎁', title: 'Win a Free Gift Card', desc: 'Claim yours now — thousands claim every day', cta: 'Claim Now', t: 0 },
    { emoji: '💰', title: 'Exclusive Cash Rewards', desc: 'Simple tasks, real payouts today', cta: 'Claim', t: 1 },
    { emoji: '📱', title: 'Hot New App', desc: 'Download free and play instantly', cta: 'Get It Free', t: 2 },
    { emoji: '⚡', title: 'Speed Boost', desc: 'Optimize your device in one tap', cta: 'Optimize Now', t: 3 },
    { emoji: '🎮', title: 'Game of the Year', desc: 'Join millions of players right now', cta: 'Play Now', t: 0 },
    { emoji: '🤑', title: 'Earn Bonus Cash', desc: 'Limited time offer — tap to start', cta: 'Claim', t: 1 },
    { emoji: '🍿', title: 'Watch Free & Win', desc: 'Exclusive previews plus instant prizes', cta: 'Watch Now', t: 2 },
    { emoji: '✈️', title: '70% Off Travel Deals', desc: 'Insider deals that expire soon', cta: 'Book Deal', t: 3 },
    { emoji: '🛒', title: 'Mega Shopping Sale', desc: 'Up to 90% off top brands', cta: 'Shop Sale', t: 0 },
    { emoji: '🎧', title: 'Free Music App', desc: 'Stream everything for free', cta: 'Start Free', t: 1 },
    { emoji: '🔋', title: 'Battery Saver Pro', desc: 'Double your battery life — free', cta: 'Boost Now', t: 2 },
    { emoji: '🎰', title: 'Spin & Win', desc: 'Try your luck — instant prizes', cta: 'Spin Now', t: 3 },
    { emoji: '📚', title: 'Free E-Book Library', desc: '1 million titles unlocked now', cta: 'Read Free', t: 0 },
    { emoji: '🎨', title: 'Premium Filters', desc: 'Make your photos pop for free', cta: 'Try Free', t: 1 },
    { emoji: '📷', title: 'AI Photo Editor', desc: 'Edit like a pro in seconds', cta: 'Edit Free', t: 2 },
    { emoji: '🎵', title: 'Unlimited Music', desc: 'No ads, no limits — free trial', cta: 'Unlock', t: 3 },
    { emoji: '🏆', title: 'Daily Prize Draw', desc: 'A new winner every hour', cta: 'Enter Now', t: 0 },
    { emoji: '🧧', title: 'Surprise Bonus', desc: 'Open your reward right now', cta: 'Open Gift', t: 1 },
    { emoji: '📺', title: 'Stream Free TV', desc: 'All your shows in one place', cta: 'Stream Free', t: 2 },
    { emoji: '🍕', title: 'Free Delivery Code', desc: 'Save on your next order', cta: 'Get Code', t: 3 },
    { emoji: '💳', title: 'Prepaid Card Offer', desc: 'Get yours in minutes', cta: 'Claim Card', t: 0 },
    { emoji: '🔓', title: 'Unlock Premium', desc: 'Full features free for you', cta: 'Unlock', t: 1 },
    { emoji: '😍', title: 'Your Lucky Day', desc: 'A special prize is waiting for you', cta: 'Reveal', t: 2 },
    { emoji: '💎', title: 'VIP Rewards', desc: 'Free access for a limited time', cta: 'Join Free', t: 3 },
    { emoji: '🧲', title: 'Try Your Fortune', desc: 'Swipe to reveal your prize', cta: 'Reveal', t: 0 },
    { emoji: '☕', title: 'Free Coffee Month', desc: 'Members only — sign up free', cta: 'Get Free', t: 1 },
    { emoji: '🎳', title: 'Arcade Night', desc: 'Play unlimited for free', cta: 'Play Free', t: 2 },
    { emoji: '🧸', title: 'Plush Giveaway', desc: 'Win cute prizes today', cta: 'Enter', t: 3 },
    { emoji: '🚗', title: 'Car Rental Deal', desc: 'Save up to 40% now', cta: 'Rent Now', t: 0 },
    { emoji: '💍', title: 'Jewelry Flash Sale', desc: 'Gorgeous deals, low stock', cta: 'Shop Now', t: 1 },
    { emoji: '🛋️', title: 'Home Upgrade Sale', desc: 'Furnish for less today', cta: 'Save Now', t: 2 },
    { emoji: '🐶', title: 'Pet Lovers Offer', desc: 'Free treats for your pet', cta: 'Get Treats', t: 3 },
    { emoji: '🛍️', title: 'Shopping Club', desc: 'Exclusive member prices today', cta: 'Join Free', t: 0 },
    { emoji: '⚽', title: 'Live Sports App', desc: 'Stream every match for free', cta: 'Stream Now', t: 2 },
    { emoji: '🧑‍🍳', title: 'Recipe Club', desc: 'Free gourmet recipes daily', cta: 'Get Recipes', t: 1 },
    { emoji: '💆', title: 'Spa & Wellness Deals', desc: 'Relax for less — book now', cta: 'Book Now', t: 3 },
    { emoji: '📉', title: 'Crypto Bonus', desc: 'Claim your trading bonus today', cta: 'Claim Bonus', t: 0 },
    { emoji: '🎓', title: 'Course Giveaway', desc: 'Learn new skills free', cta: 'Start Free', t: 1 },
    { emoji: '💊', title: 'Wellness Boost', desc: 'Feel great every single day', cta: 'Try Now', t: 2 },
    { emoji: '🌴', title: 'Vacation Flash Sale', desc: 'Tropical trips at 60% off', cta: 'Book Trip', t: 3 }
  ],

  themes: [
    ['#0d9488', '#0f766e', '#134e4a'],
    ['#7c3aed', '#6d28d9', '#5b21b6'],
    ['#ea580c', '#c2410c', '#9a3412'],
    ['#0284c7', '#0369a1', '#075985']
  ],

  rotateMs: 6000,
  tick: 0,
  safeadPool: [],
  directPool: [],
  bannerPool: [],
  countPool: [],

  styles() {
    return `
      :root{
        --sad-bg0:#ffffff;
        --sad-bg1:#f1f5f9;
        --sad-bg2:#f8fafc;
        --sad-card:linear-gradient(180deg,#ffffff,#f8fafc);
        --sad-sel:#f1f5f9;
        --sad-text:#0f172a;
        --sad-muted:#64748b;
        --sad-note:#94a3b8;
        --sad-border:rgba(15,23,42,.08);
        --sad-acc-border:rgba(13,148,136,.16);
        --sad-cta-bg:rgba(13,148,136,.1);
        --sad-cta-text:#0f766e;
        --sad-shadow:0 6px 18px rgba(15,23,42,.08);
        --sad-direct-bg:linear-gradient(135deg,rgba(45,212,191,.10),rgba(251,191,36,.07));
        --sad-direct-border:rgba(245,158,11,.28);
        --sad-banner-bg:linear-gradient(135deg,rgba(45,212,191,.08),rgba(56,189,248,.06));
        --sad-count-bg:linear-gradient(90deg,rgba(251,146,60,.13),rgba(251,191,36,.06));
        --sad-count-border:rgba(245,158,11,.28);
        --sad-timer-bg:rgba(15,23,42,.07);
        --sad-amber:#d97706;
        --sad-sticky-bg:linear-gradient(180deg,rgba(255,255,255,.98),rgba(248,250,252,.98));
        --sad-modal-bg:linear-gradient(180deg,#ffffff,#f8fafc);
        --sad-overlay:rgba(15,23,42,.5);
      }
      html[data-theme="dark"]{
        --sad-bg0:#151d1a;
        --sad-bg1:#131a18;
        --sad-bg2:#0f2a26;
        --sad-card:linear-gradient(180deg,#151d1a,#131a18);
        --sad-sel:#1b2623;
        --sad-text:#e8f2ef;
        --sad-muted:#7f9a93;
        --sad-note:#4d625c;
        --sad-border:rgba(45,212,191,.09);
        --sad-acc-border:rgba(45,212,191,.12);
        --sad-cta-bg:rgba(45,212,191,.12);
        --sad-cta-text:#2dd4bf;
        --sad-shadow:0 6px 18px rgba(0,0,0,.3);
        --sad-direct-bg:linear-gradient(135deg,rgba(45,212,191,.14),rgba(251,191,36,.10));
        --sad-direct-border:rgba(251,191,36,.28);
        --sad-banner-bg:linear-gradient(135deg,rgba(45,212,191,.10),rgba(56,189,248,.08));
        --sad-count-bg:linear-gradient(90deg,rgba(251,146,60,.16),rgba(251,191,36,.08));
        --sad-count-border:rgba(251,146,60,.3);
        --sad-timer-bg:rgba(0,0,0,.35);
        --sad-amber:#fbbf24;
        --sad-sticky-bg:linear-gradient(180deg,#151d1a,#101513);
        --sad-modal-bg:linear-gradient(180deg,#161e1b,#121816);
        --sad-overlay:rgba(5,8,7,.55);
      }
      @media (prefers-color-scheme: dark){
        html:not([data-theme="light"]){--sad-bg0:#151d1a;--sad-bg1:#131a18;--sad-bg2:#0f2a26;
          --sad-card:linear-gradient(180deg,#151d1a,#131a18);--sad-sel:#1b2623;--sad-text:#e8f2ef;--sad-muted:#7f9a93;
          --sad-note:#4d625c;--sad-border:rgba(45,212,191,.09);--sad-acc-border:rgba(45,212,191,.12);
          --sad-cta-bg:rgba(45,212,191,.12);--sad-cta-text:#2dd4bf;--sad-shadow:0 6px 18px rgba(0,0,0,.3);
          --sad-direct-bg:linear-gradient(135deg,rgba(45,212,191,.14),rgba(251,191,36,.10));
          --sad-direct-border:rgba(251,191,36,.28);
          --sad-banner-bg:linear-gradient(135deg,rgba(45,212,191,.10),rgba(56,189,248,.08));
          --sad-count-bg:linear-gradient(90deg,rgba(251,146,60,.16),rgba(251,191,36,.08));
          --sad-count-border:rgba(251,146,60,.3);--sad-timer-bg:rgba(0,0,0,.35);--sad-amber:#fbbf24;
          --sad-sticky-bg:linear-gradient(180deg,#151d1a,#101513);
          --sad-modal-bg:linear-gradient(180deg,#161e1b,#121816);--sad-overlay:rgba(5,8,7,.55)}
      }
      .safead{margin:10px 0}
      .safead-card{display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--sad-card);
        border:1px solid var(--sad-acc-border);border-radius:16px;padding:12px 14px;box-shadow:var(--sad-shadow);
        transition:transform .15s ease,box-shadow .15s ease}
      .safead-card:active{transform:scale(.985)}
      .safead-emoji{font-size:26px;width:48px;height:48px;flex:0 0 48px;display:flex;align-items:center;justify-content:center;
        background:var(--sad-sel);border:1px solid var(--sad-acc-border);border-radius:14px}
      .safead-text{flex:1;min-width:0}
      .safead-text strong{display:block;font-size:13.5px;color:var(--sad-text);line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .safead-text small{display:-webkit-box;font-size:11.5px;color:var(--sad-muted);line-height:1.3;margin-top:2px;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
      .safead-cta{flex:0 0 auto;font-size:12px;font-weight:700;color:var(--sad-cta-text);background:var(--sad-cta-bg);border-radius:999px;padding:6px 12px;white-space:nowrap}
      .safead-note{display:block;text-align:center;font-size:9px;color:var(--sad-note);letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px}
      .safe-badge{display:inline-flex;align-items:center;gap:5px;background:var(--sad-cta-bg);color:var(--sad-cta-text);border:1px solid var(--sad-acc-border);
        font-size:11px;font-weight:700;padding:5px 12px;border-radius:999px}
      .direct-ad{margin:12px 0}
      .direct-card{display:flex;align-items:center;gap:14px;text-decoration:none;border-radius:16px;padding:14px 16px;
        background:var(--sad-direct-bg);border:1px solid var(--sad-direct-border);box-shadow:var(--sad-shadow);transition:transform .15s ease}
      .direct-card:active{transform:scale(.985)}
      .direct-emoji{font-size:30px;width:54px;height:54px;flex:0 0 54px;display:flex;align-items:center;justify-content:center;
        background:var(--sad-sel);border:1px solid var(--sad-direct-border);border-radius:14px}
      .direct-text{flex:1;min-width:0}
      .direct-text strong{display:block;font-size:14.5px;color:var(--sad-text);line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .direct-text small{display:-webkit-box;font-size:12px;color:var(--sad-muted);line-height:1.35;margin-top:3px;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .direct-cta{flex:0 0 auto;font-size:12.5px;font-weight:800;color:#1e293b;background:linear-gradient(135deg,#fbbf24,#2dd4bf);
        border-radius:999px;padding:8px 14px;white-space:nowrap}
      .ad-banner{margin:12px 0}
      .banner-card{display:flex;align-items:center;gap:12px;text-decoration:none;border-radius:16px;padding:14px 16px;
        border:1px solid var(--sad-acc-border);background:var(--sad-banner-bg);box-shadow:var(--sad-shadow);transition:transform .15s ease}
      .banner-card:active{transform:scale(.985)}
      .banner-emoji{font-size:34px;flex:0 0 auto}
      .banner-text{flex:1;min-width:0}
      .banner-text strong{display:block;color:var(--sad-text);font-size:14.5px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .banner-text small{display:-webkit-box;color:var(--sad-muted);font-size:12px;margin-top:2px;line-height:1.35;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .banner-cta{flex:0 0 auto;font-size:12.5px;font-weight:800;color:#1e293b;background:linear-gradient(135deg,#fbbf24,#2dd4bf);
        border-radius:999px;padding:9px 16px;white-space:nowrap}
      .ad-duo{margin:12px 0}
      .duo-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .duo-card{display:flex;flex-direction:column;align-items:center;gap:6px;text-decoration:none;background:var(--sad-card);
        border:1px solid var(--sad-acc-border);border-radius:14px;padding:12px 8px;text-align:center;box-shadow:var(--sad-shadow)}
      .duo-emoji{font-size:26px}
      .duo-text{min-width:0;width:100%}
      .duo-text strong{display:-webkit-box;color:var(--sad-text);font-size:12.5px;line-height:1.25;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .duo-cta{font-size:11px;font-weight:800;color:var(--sad-cta-text)}
      .ad-count{margin:12px 0}
      .count-card{display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--sad-count-bg);
        border:1px solid var(--sad-count-border);border-radius:14px;padding:11px 14px;box-shadow:var(--sad-shadow)}
      .count-fire{font-size:22px;flex:0 0 auto}
      .count-text{flex:1;min-width:0}
      .count-text strong{display:block;color:var(--sad-text);font-size:13px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .count-text small{display:block;color:var(--sad-amber);font-size:11px;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .count-time{flex:0 0 auto;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;font-weight:800;color:var(--sad-amber);
        background:var(--sad-timer-bg);padding:6px 8px;border-radius:8px}
      .count-cta{flex:0 0 auto;font-size:11.5px;font-weight:800;color:#1e293b;background:linear-gradient(135deg,#fbbf24,#fb923c);padding:7px 11px;border-radius:999px}
      .safead,.direct-ad,.ad-banner,.ad-duo,.ad-count{contain:content;content-visibility:auto;transition:opacity .2s ease;
        touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none}
      .safead{contain-intrinsic-size:auto 88px}
      .safead.mini{contain-intrinsic-size:auto 62px}
      .direct-ad{contain-intrinsic-size:auto 98px}
      .ad-banner{contain-intrinsic-size:auto 86px}
      .ad-duo{contain-intrinsic-size:auto 132px}
      .ad-count{contain-intrinsic-size:auto 66px}
      .sticky-bar{position:fixed;left:0;right:0;bottom:0;z-index:9000;background:var(--sad-sticky-bg);
        border-top:1px solid rgba(245,158,11,.35);padding:8px 10px;padding-bottom:calc(8px + env(safe-area-inset-bottom));
        box-shadow:0 -6px 20px var(--sad-shadow);display:flex;align-items:center;gap:10px;transform:translateY(102%);
        transition:transform .35s cubic-bezier(.22,1,.36,1)}
      .sticky-bar.in{transform:translateY(0)}
      .sticky-bar a{display:flex;align-items:center;gap:10px;flex:1;text-decoration:none;min-width:0;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
      .sticky-emoji{font-size:22px;flex:0 0 auto}
      .sticky-text{flex:1;min-width:0}
      .sticky-text strong{display:block;color:var(--sad-text);font-size:13px}
      .sticky-text small{display:block;color:var(--sad-muted);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .sticky-cta{flex:0 0 auto;font-size:12px;font-weight:800;color:#1e293b;background:linear-gradient(135deg,#fbbf24,#2dd4bf);
        padding:8px 12px;border-radius:999px;animation:pulseCta 1.8s ease-in-out infinite}
      .sticky-close{flex:0 0 auto;background:none;border:none;color:var(--sad-note);font-size:14px;cursor:pointer;padding:4px 6px}
      .ad-modal{position:fixed;z-index:9500;bottom:calc(82px + env(safe-area-inset-bottom));left:12px;right:12px;
        max-width:352px;margin:0 auto;pointer-events:none;opacity:0;visibility:hidden;
        transform:translateY(16px) scale(.97);transition:opacity .3s ease,transform .3s ease,visibility .3s}
      @media (min-width:520px){.ad-modal{left:auto;right:20px;margin:0}}
      .ad-modal.show{opacity:1;visibility:visible;transform:none;pointer-events:auto}
      .ad-modal-card{position:relative;display:flex;align-items:center;gap:8px;background:var(--sad-modal-bg);
        border:1px solid rgba(245,158,11,.32);border-radius:16px;padding:10px 10px 10px 12px;
        box-shadow:0 16px 40px -14px rgba(15,23,42,.38)}
      .ad-modal-link{flex:1;min-width:0;display:flex;align-items:center;gap:10px;text-decoration:none;touch-action:manipulation}
      .ad-modal-x{flex:0 0 auto;background:none;border:none;color:var(--sad-note);font-size:13px;cursor:pointer;padding:6px;align-self:flex-start}
      .ad-modal-emoji{font-size:24px;flex:0 0 auto}
      .ad-modal-body{flex:1;min-width:0}
      .ad-modal-title{display:block;color:var(--sad-text);font-size:13px;font-weight:800;line-height:1.25}
      .ad-modal-desc{display:block;color:var(--sad-muted);font-size:11px;line-height:1.3;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .ad-modal-btn{flex:0 0 auto;font-size:12px;font-weight:800;color:#1e293b;background:linear-gradient(135deg,#fbbf24,#2dd4bf);
        border-radius:999px;padding:8px 12px;animation:pulseCta 1.8s ease-in-out infinite;touch-action:manipulation}
      @keyframes pulseCta{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
      @media (max-width:360px){.duo-grid{grid-template-columns:1fr}}
      @media (prefers-reduced-motion: reduce){
        .safead,.direct-ad,.ad-banner,.ad-duo,.ad-count,.sticky-bar,.ad-modal-card,.sticky-cta,.ad-modal-btn{
          transition:none!important;animation:none!important}
      }
    `;
  },

  theme(t) {
    const th = this.themes[t % this.themes.length];
    return { accent: th[0], from: th[1], to: th[2] };
  },

  slotAt(pool, i, stride, offset) {
    return pool[(i * stride + offset + this.tick) % pool.length];
  },

  buildSafead(ad) {
    const th = this.theme(ad.t);
    return `
      <span class="safead-note">Sponsored</span>
      <a class="safead-card" href="${this.directUrl}" target="_blank" rel="sponsored nofollow noopener noreferrer" style="border-color:${th.accent}33">
        <span class="safead-emoji" style="border-color:${th.accent}44">${ad.emoji}</span>
        <span class="safead-text"><strong>${ad.title}</strong><small>${ad.desc}</small></span>
        <span class="safead-cta" style="color:${th.accent};background:${th.accent}1a">${ad.cta} →</span>
      </a>`;
  },

  buildDirect(ad) {
    const th = this.theme(ad.t);
    return `
      <span class="safead-note">Sponsored</span>
      <a class="direct-card" href="${this.directUrl}" target="_blank" rel="sponsored nofollow noopener noreferrer" style="border-color:${th.accent}55">
        <span class="direct-emoji" style="border-color:${th.accent}44">${ad.emoji}</span>
        <span class="direct-text"><strong>${ad.title}</strong><small>${ad.desc}</small></span>
        <span class="direct-cta">${ad.cta.toUpperCase()}</span>
      </a>`;
  },

  buildBanner(ad) {
    return `
      <a class="banner-card" href="${this.directUrl}" target="_blank" rel="sponsored nofollow noopener noreferrer">
        <span class="banner-emoji">${ad.emoji}</span>
        <span class="banner-text"><strong>${ad.title}</strong><small>${ad.desc}</small></span>
        <span class="banner-cta">${ad.cta.toUpperCase()}</span>
      </a>`;
  },

  buildCount(ad) {
    const mins = 9 - (this.tick % 10);
    const secs = 59 - ((this.tick * 7) % 60);
    const mm = String(mins).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');
    return `
      <span class="safead-note">Sponsored</span>
      <a class="count-card" href="${this.directUrl}" target="_blank" rel="sponsored nofollow noopener noreferrer">
        <span class="count-fire">🔥</span>
        <span class="count-text"><strong>${ad.title}</strong><small>${ad.desc}</small></span>
        <span class="count-time">${mm}:${ss}</span>
        <span class="count-cta">${ad.cta.toUpperCase()}</span>
      </a>`;
  },

  buildDuo(a, b) {
    const card = (ad, accent) => `
      <a class="duo-card" href="${this.directUrl}" target="_blank" rel="sponsored nofollow noopener noreferrer" style="border-color:${accent}44">
        <span class="duo-emoji">${ad.emoji}</span>
        <span class="duo-text"><strong>${ad.title}</strong></span>
        <span class="duo-cta" style="color:${accent}">GO →</span>
      </a>`;
    return `<span class="safead-note">Sponsored</span><div class="duo-grid">${card(a, this.theme(a.t).accent)}${card(b, this.theme(b.t).accent)}</div>`;
  },

  prepare() {
    this.tick = Math.floor(Date.now() / this.rotateMs);
    this.safeadPool = this.ads.map(a => this.buildSafead(a));
    this.directPool = this.ads.map(a => this.buildDirect(a));
    this.bannerPool = this.ads.map(a => this.buildBanner(a));
    this.countPool = this.ads.map(a => this.buildCount(a));
  },

  swap(slot, html) {
    if (!html || slot.innerHTML === html) return;
    slot.style.opacity = '0';
    setTimeout(() => {
      slot.innerHTML = html;
      slot.style.opacity = '1';
    }, 180);
  },

  fillAll(initial) {
    const set = initial
      ? (slot, html) => { slot.innerHTML = html; }
      : (slot, html) => this.swap(slot, html);

    document.querySelectorAll('.safead').forEach((slot, i) => set(slot, this.slotAt(this.safeadPool, i, 1, 0)));
    document.querySelectorAll('.direct-ad').forEach((slot, i) => set(slot, this.slotAt(this.directPool, i, 2, 5)));
    document.querySelectorAll('.ad-banner').forEach((slot, i) => set(slot, this.slotAt(this.bannerPool, i, 3, 3)));
    document.querySelectorAll('.ad-duo').forEach((slot, i) => {
      set(slot, this.buildDuo(this.slotAt(this.ads, i * 2, 1, 7), this.slotAt(this.ads, i * 2 + 1, 1, 11)));
    });
    document.querySelectorAll('.ad-count').forEach((slot, i) => set(slot, this.buildCount(this.slotAt(this.ads, i, 1, 2))));
  },

  isAuthed() {
    return !document.body.classList.contains('signed-out');
  },

  renderSticky() {
    const bar = document.getElementById('sticky-bar');
    if (!bar || !this.isAuthed()) return;
    const ad = this.ads[(10 + this.tick) % this.ads.length];
    bar.innerHTML = `
      <a href="${this.directUrl}" target="_blank" rel="sponsored nofollow noopener noreferrer">
        <span class="sticky-emoji">${ad.emoji}</span>
        <span class="sticky-text"><strong>${ad.title}</strong><small>${ad.desc}</small></span>
        <span class="sticky-cta">${ad.cta.toUpperCase()}</span>
      </a>
      <button class="sticky-close" onclick="this.parentNode.remove()" aria-label="Close ad">✕</button>`;
    document.body.style.paddingBottom = 'calc(64px + env(safe-area-inset-bottom))';
    requestAnimationFrame(() => bar.classList.add('in'));
  },

  showModal() {
    const modal = document.getElementById('ad-modal');
    if (!modal || !this.isAuthed()) return;
    try {
      if (sessionStorage.getItem('ls-modal')) return;
      sessionStorage.setItem('ls-modal', '1');
    } catch (e) {}
    const ad = this.ads[(7 + this.tick) % this.ads.length];
    modal.innerHTML = `
      <div class="ad-modal-card">
        <a class="ad-modal-link" href="${this.directUrl}" target="_blank" rel="sponsored nofollow noopener noreferrer">
          <span class="ad-modal-emoji">${ad.emoji}</span>
          <span class="ad-modal-body">
            <span class="ad-modal-title">${ad.title}</span>
            <span class="ad-modal-desc">${ad.desc}</span>
          </span>
          <span class="ad-modal-btn">${ad.cta.toUpperCase()}</span>
        </a>
        <button class="ad-modal-x" onclick="SafeAds.hideModal()" aria-label="Close ad">✕</button>
      </div>`;
    modal.classList.add('show');
    clearTimeout(this._modalTimer);
    this._modalTimer = setTimeout(() => this.hideModal(), 9000);
  },

  hideModal() {
    const m = document.getElementById('ad-modal');
    if (!m) return;
    m.classList.remove('show');
    clearTimeout(this._modalTimer);
    setTimeout(() => { if (!m.classList.contains('show')) m.innerHTML = ''; }, 320);
  },

  init() {
    const style = document.createElement('style');
    style.textContent = this.styles();
    document.head.appendChild(style);

    this.prepare();
    this.fillAll(true);
    this.renderSticky();

    setInterval(() => {
      this.tick++;
      this.fillAll(false);
    }, this.rotateMs);

    setTimeout(() => this.showModal(), 3000);
  },

  reinit() {
    this.renderSticky();
    setTimeout(() => this.showModal(), 3000);
  }
};

window.SafeAds = SafeAds;

document.addEventListener('DOMContentLoaded', () => SafeAds.init());
