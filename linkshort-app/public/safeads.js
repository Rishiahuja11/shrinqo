/* SafeAds v2 — fills ad containers + sticky bar + modal. All clicks -> direct link. */
const SafeAds = {
  V: 17,
  directUrl: 'https://omg10.com/4/11468566',
  rotateMs: 6000,

  ads: [
    { emoji: "🎁", title: "Win a Free Gift Card", desc: "Claim yours now — thousands claim every day", cta: "Claim Now", theme: 0 },
    { emoji: "💰", title: "Exclusive Cash Rewards", desc: "Simple tasks, real payouts today", cta: "Claim", theme: 1 },
    { emoji: "📱", title: "Hot New App", desc: "Download free and play instantly", cta: "Get It Free", theme: 2 },
    { emoji: "⚡", title: "Speed Boost", desc: "Optimize your device in one tap", cta: "Optimize Now", theme: 3 },
    { emoji: "🎮", title: "Game of the Year", desc: "Join millions of players right now", cta: "Play Now", theme: 0 },
    { emoji: "🤑", title: "Earn Bonus Cash", desc: "Limited time offer — tap to start", cta: "Claim", theme: 1 },
    { emoji: "🍿", title: "Watch Free & Win", desc: "Exclusive previews plus instant prizes", cta: "Watch Now", theme: 2 },
    { emoji: "✈️", title: "70% Off Travel Deals", desc: "Insider deals that expire soon", cta: "Book Deal", theme: 3 },
    { emoji: "🛒", title: "Mega Shopping Sale", desc: "Up to 90% off top brands", cta: "Shop Sale", theme: 0 },
    { emoji: "🎧", title: "Free Music App", desc: "Stream everything for free", cta: "Start Free", theme: 1 },
    { emoji: "🔋", title: "Battery Saver Pro", desc: "Double your battery life — free", cta: "Boost Now", theme: 2 },
    { emoji: "🎰", title: "Spin & Win", desc: "Try your luck — instant prizes", cta: "Spin Now", theme: 3 },
    { emoji: "📚", title: "Free E-Book Library", desc: "1 million titles unlocked now", cta: "Read Free", theme: 0 },
    { emoji: "🎨", title: "Premium Filters", desc: "Make your photos pop for free", cta: "Try Free", theme: 1 },
    { emoji: "📷", title: "AI Photo Editor", desc: "Edit like a pro in seconds", cta: "Edit Free", theme: 2 },
    { emoji: "🎵", title: "Unlimited Music", desc: "No ads, no limits — free trial", cta: "Unlock", theme: 3 },
    { emoji: "🏆", title: "Daily Prize Draw", desc: "A new winner every hour", cta: "Enter Now", theme: 0 },
    { emoji: "🧧", title: "Surprise Bonus", desc: "Open your reward right now", cta: "Open Gift", theme: 1 },
    { emoji: "📺", title: "Stream Free TV", desc: "All your shows in one place", cta: "Stream Free", theme: 2 },
    { emoji: "🍕", title: "Free Delivery Code", desc: "Save on your next order", cta: "Get Code", theme: 3 },
    { emoji: "💳", title: "Prepaid Card Offer", desc: "Get yours in minutes", cta: "Claim Card", theme: 0 },
    { emoji: "🔓", title: "Unlock Premium", desc: "Full features free for you", cta: "Unlock", theme: 1 },
    { emoji: "😍", title: "Your Lucky Day", desc: "A special prize is waiting for you", cta: "Reveal", theme: 2 },
    { emoji: "💎", title: "VIP Rewards", desc: "Free access for a limited time", cta: "Join Free", theme: 3 },
    { emoji: "🧲", title: "Try Your Fortune", desc: "Swipe to reveal your prize", cta: "Reveal", theme: 0 },
    { emoji: "☕", title: "Free Coffee Month", desc: "Members only — sign up free", cta: "Get Free", theme: 1 },
    { emoji: "🎳", title: "Arcade Night", desc: "Play unlimited for free", cta: "Play Free", theme: 2 },
    { emoji: "🧸", title: "Plush Giveaway", desc: "Win cute prizes today", cta: "Enter", theme: 3 },
    { emoji: "🚗", title: "Car Rental Deal", desc: "Save up to 40% now", cta: "Rent Now", theme: 0 },
    { emoji: "💍", title: "Jewelry Flash Sale", desc: "Gorgeous deals, low stock", cta: "Shop Now", theme: 1 },
    { emoji: "🛋️", title: "Home Upgrade Sale", desc: "Furnish for less today", cta: "Save Now", theme: 2 },
    { emoji: "🐶", title: "Pet Lovers Offer", desc: "Free treats for your pet", cta: "Get Treats", theme: 3 },
    { emoji: "🛍️", title: "Shopping Club", desc: "Exclusive member prices today", cta: "Join Free", theme: 0 },
    { emoji: "⚽", title: "Live Sports App", desc: "Stream every match for free", cta: "Stream Now", theme: 2 },
    { emoji: "🧑‍🍳", title: "Recipe Club", desc: "Free gourmet recipes daily", cta: "Get Recipes", theme: 1 },
    { emoji: "💆", title: "Spa & Wellness Deals", desc: "Relax for less — book now", cta: "Book Now", theme: 3 },
    { emoji: "📉", title: "Crypto Bonus", desc: "Claim your trading bonus today", cta: "Claim Bonus", theme: 0 },
    { emoji: "🎓", title: "Course Giveaway", desc: "Learn new skills free", cta: "Start Free", theme: 1 },
    { emoji: "💊", title: "Wellness Boost", desc: "Feel great every single day", cta: "Try Now", theme: 2 },
    { emoji: "🌴", title: "Vacation Flash Sale", desc: "Tropical trips at 60% off", cta: "Book Trip", theme: 3 }
  ],

  themes: [
    ['#2563eb', '#1d4ed8'],
    ['#059669', '#047857'],
    ['#7c3aed', '#6d28d9'],
    ['#ea580c', '#c2410c']
  ],

  idx: 0,
  timer: null,
  modalShown: false,

  esc(s) {
    return String(s).replace(/[&<>"']/g, function(c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  },

  pick() {
    var ad = this.ads[this.idx % this.ads.length];
    this.idx++;
    return ad;
  },

  card(ad) {
    var t = this.themes[ad.theme % this.themes.length];
    return '<a class="sa-card" href="' + this.directUrl + '" target="_blank" rel="nofollow sponsored noopener"'
      + ' style="border-left:4px solid ' + t[0] + '">'
      + '<span class="sa-badge">Ad</span>'
      + '<span class="sa-emoji">' + ad.emoji + '</span>'
      + '<span class="sa-body"><span class="sa-title">' + this.esc(ad.title) + '</span>'
      + '<span class="sa-desc">' + this.esc(ad.desc) + '</span></span>'
      + '<span class="sa-cta" style="background:' + t[0] + '">' + this.esc(ad.cta) + '</span>'
      + '</a>';
  },

  styles() {
    var css = ''
      + '.safead,.direct-ad,.ad-banner,.ad-duo,.ad-count{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:stretch;padding:4px 0}'
      + '.sa-card{position:relative;display:inline-flex;align-items:center;gap:10px;max-width:520px;width:100%;box-sizing:border-box;'
      + 'background:#fff;border:1px solid rgba(226,232,240,.9);border-radius:14px;padding:12px 14px;text-decoration:none;'
      + 'box-shadow:0 1px 3px rgba(15,23,42,.06);transition:transform .25s cubic-bezier(.22,1,.36,1),box-shadow .25s ease;'
      + 'animation:fadeInUp .5s cubic-bezier(.22,1,.36,1) both;font-family:inherit;text-align:left}'
      + '.sa-card:hover{transform:translateY(-2px);box-shadow:0 6px 20px -6px rgba(37,99,235,.25)}'
      + '.sa-badge{position:absolute;top:-7px;right:10px;font-size:8px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;'
      + 'color:#94a3b8;background:#f1f5f9;border-radius:999px;padding:2px 7px}'
      + '.sa-emoji{font-size:24px;line-height:1;flex-shrink:0}'
      + '.sa-body{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}'
      + '.sa-title{font-size:13px;font-weight:800;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '.sa-desc{font-size:11px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '.sa-cta{flex-shrink:0;color:#fff;font-size:11px;font-weight:700;padding:7px 14px;border-radius:999px;'
      + 'transition:transform .2s ease}.sa-card:hover .sa-cta{transform:scale(1.06)}'
      + '#sa-sticky{position:fixed;left:0;right:0;bottom:0;z-index:60;display:flex;justify-content:center;padding:8px;'
      + 'background:rgba(255,255,255,.95);backdrop-filter:blur(12px);border-top:1px solid rgba(226,232,240,.8);'
      + 'animation:fadeInUp .5s cubic-bezier(.22,1,.36,1) both}'
      + '#sa-sticky .sa-card{max-width:560px;margin-bottom:26px}'
      + '#sa-sticky-close{position:absolute;top:-34px;right:12px;width:26px;height:26px;border-radius:50%;border:none;'
      + 'background:rgba(15,23,42,.75);color:#fff;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:61}'
      + '@media(max-width:480px){#sa-sticky .sa-body{min-width:0}}';
    var st = document.createElement('style');
    st.id = 'sa-styles';
    st.textContent = css;
    document.head.appendChild(st);
  },

  fill() {
    var self = this;
    document.querySelectorAll('.ad-banner').forEach(function(el) { if (!el.childElementCount) el.innerHTML = self.card(self.pick()); });
    document.querySelectorAll('.safead').forEach(function(el) { if (!el.childElementCount) el.innerHTML = self.card(self.pick()); });
    document.querySelectorAll('.direct-ad').forEach(function(el) { if (!el.childElementCount) el.innerHTML = self.card(self.pick()); });
    document.querySelectorAll('.ad-count').forEach(function(el) { if (!el.childElementCount) el.innerHTML = self.card(self.pick()); });
    document.querySelectorAll('.ad-duo').forEach(function(el) {
      if (el.childElementCount >= 2) return;
      el.innerHTML = '';
      for (var i = 0; i < 2; i++) el.insertAdjacentHTML('beforeend', self.card(self.pick()));
    });
    this.mountSticky();
  },

  mountSticky() {
    if (document.getElementById('sa-sticky')) return;
    var bar = document.getElementById('sticky-bar');
    var host = bar || document.body;
    var wrap = document.createElement('div');
    wrap.id = 'sa-sticky';
    wrap.innerHTML = '<button id="sa-sticky-close" aria-label="Close ad">\u2715</button>' + this.card(this.pick());
    host.appendChild(wrap);
    wrap.querySelector('#sa-sticky-close').addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      wrap.remove();
    });
  },

  showModal(ad) {
    if (this.modalShown) return;
    this.modalShown = true;
    var host = document.getElementById('ad-modal');
    if (!host) return;
    host.classList.add('show');
    host.innerHTML = '<div style="position:relative;background:#fff;border-radius:22px;padding:30px 26px;max-width:380px;width:90%;'
      + 'text-align:center;box-shadow:0 30px 90px -20px rgba(15,23,42,.35);animation:bounceIn .5s cubic-bezier(.22,1,.36,1)">'
      + '<div style="font-size:44px;margin-bottom:8px">' + ad.emoji + '</div>'
      + '<h3 style="margin:0 0 6px;font-size:19px;font-weight:800;color:#0f172a">' + this.esc(ad.title) + '</h3>'
      + '<p style="margin:0 0 18px;font-size:13px;color:#64748b">' + this.esc(ad.desc) + '</p>'
      + '<a href="' + this.directUrl + '" target="_blank" rel="nofollow sponsored noopener" '
      + 'style="display:block;padding:13px;border-radius:12px;background:linear-gradient(135deg,#2563eb,#059669);color:#fff;'
      + 'font-weight:700;text-decoration:none;font-size:14px">' + this.esc(ad.cta) + '</a>'
      + '<button onclick="document.getElementById(\'ad-modal\').classList.remove(\'show\')" '
      + 'style="margin-top:10px;background:none;border:none;color:#94a3b8;font-size:12px;cursor:pointer;font-family:inherit">No thanks</button></div>';
  },

  reinit() {
    this.fill();
  },

  init() {
    if (!document.getElementById('sa-styles')) this.styles();
    this.fill();
    var self = this;
    this.timer = setInterval(function() { self.fill(); }, this.rotateMs);
    setTimeout(function() {
      if (!sessionStorage.getItem('saModalSeen')) {
        sessionStorage.setItem('saModalSeen', '1');
        self.showModal(self.ads[Math.floor(Math.random() * self.ads.length)]);
      }
    }, 20000);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { SafeAds.init(); });
} else {
  SafeAds.init();
}
