const ASSETS = [{"path":"/custom.css","type":"text/css","cache":"public, max-age=86400","content":"/* ============================================================\n   LinkShort — aesthetic layer on top of Tailwind (login-first)\n   v2: performance-first redesign (no heavy blur/box-shadow loops)\n   ============================================================ */\n\n:root{\n  --ink-900:#0f172a;\n  --ink-600:#475569;\n  --ink-400:#94a3b8;\n  --accent:#0d9488;\n  --accent-strong:#0f766e;\n  --accent-soft:#ccfbf1;\n  --line:#e2e8f0;\n  --grad:linear-gradient(135deg,#14b8a6,#059669);\n  --card-shadow:0 1px 2px rgba(15,23,42,.05),0 10px 30px -14px rgba(15,23,42,.14);\n  --card-hover-shadow:0 2px 4px rgba(15,23,42,.06),0 20px 44px -18px rgba(13,148,136,.30);\n}\n\nhtml{scroll-behavior:smooth}\nhtml,body{height:100%}\n\nbody{\n  font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;\n  letter-spacing:-.011em;\n  -webkit-font-smoothing:antialiased;\n  -moz-osx-font-smoothing:grayscale;\n  overflow-x:hidden;\n  background:\n    radial-gradient(1100px 520px at 85% -8%,rgba(45,212,191,.09),transparent 62%),\n    radial-gradient(900px 480px at 8% 108%,rgba(251,191,36,.05),transparent 58%),\n    #f8fafc;\n}\n\n::selection{background:var(--accent-soft);color:var(--accent-strong)}\n::-webkit-scrollbar{width:9px;height:9px}\n::-webkit-scrollbar-track{background:transparent}\n::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:999px;border:2px solid #f8fafc}\n::-webkit-scrollbar-thumb:hover{background:var(--accent)}\n\n/* ---------- shimmer headline ---------- */\n.shimmer-text{\n  background-size:220% auto;\n  animation:shimmer 5s linear infinite;\n}\n@media (prefers-reduced-motion:no-preference){\n  @keyframes shimmer{\n    0%{background-position:0% center}\n    50%{background-position:100% center}\n    100%{background-position:0% center}\n  }\n}\n@media (prefers-reduced-motion:reduce){.shimmer-text{animation:none}}\n\n/* ---------- hero checks ---------- */\n.hero-check{\n  background:linear-gradient(135deg,#2dd4bf,#059669);\n  color:#fff;\n  box-shadow:0 4px 10px -4px rgba(5,150,105,.5);\n  flex:0 0 auto;\n}\n\n/* ---------- trust strip ---------- */\n.trust-strip{\n  background:rgba(255,255,255,.75);\n  border:1px solid var(--line);\n  border-radius:16px;\n  padding:12px 20px;\n  box-shadow:0 1px 2px rgba(15,23,42,.04),0 8px 24px -18px rgba(15,23,42,.2);\n}\n.trust-dot{font-size:13px}\n\n/* ---------- section kickers ---------- */\n.kicker{\n  display:block;\n  width:fit-content;\n  margin:0 auto 8px;\n  padding:4px 12px;\n  border-radius:999px;\n  font-size:10px;\n  font-weight:800;\n  letter-spacing:.14em;\n  text-transform:uppercase;\n  color:var(--accent-strong);\n  background:linear-gradient(135deg,rgba(45,212,191,.16),rgba(5,150,105,.10));\n  border:1px solid rgba(13,148,136,.22);\n}\n#analytics .kicker{margin-left:0}\n\n/* ---------- card top hairline ---------- */\n.glass-card{position:relative}\n.glass-card::before{\n  content:'';\n  position:absolute;\n  top:0;left:20%;right:20%;\n  height:1px;\n  background:linear-gradient(90deg,transparent,rgba(13,148,136,.45),transparent);\n  opacity:0;\n  transition:opacity .25s ease;\n}\n.glass-card:hover::before{opacity:1}\n\n/* ---------- focus visibility ---------- */\n:focus-visible{\n  outline:2px solid var(--accent);\n  outline-offset:2px;\n  border-radius:6px;\n}\nbutton:focus-visible,input:focus-visible,a:focus-visible{outline-offset:3px}\n\n/* ---------- sticky header ---------- */\nheader.sticky{\n  background:rgba(255,255,255,.82);\n  backdrop-filter:saturate(160%) blur(12px);\n  -webkit-backdrop-filter:saturate(160%) blur(12px);\n  border-bottom:1px solid rgba(15,23,42,.06);\n  transition:box-shadow .3s ease;\n}\nheader.sticky.scrolled{\n  box-shadow:0 10px 30px -18px rgba(15,23,42,.22);\n}\n\n/* ---------- hero glows (static, GPU-cheap) ---------- */\n.glow{position:absolute;border-radius:50%;pointer-events:none;will-change:transform}\n.glow.g1{width:560px;height:560px;top:-200px;left:-170px;\n  background:radial-gradient(circle,rgba(45,212,191,.18),rgba(45,212,191,0) 66%)}\n.glow.g2{width:620px;height:620px;top:40px;right:-230px;\n  background:radial-gradient(circle,rgba(251,191,36,.12),rgba(251,191,36,0) 64%)}\n.glow.g3{width:540px;height:540px;bottom:-220px;left:34%;\n  background:radial-gradient(circle,rgba(56,189,248,.10),rgba(56,189,248,0) 64%)}\n@media (prefers-reduced-motion:no-preference){\n  .glow.g2{animation:drift 26s ease-in-out infinite alternate}\n  @keyframes drift{from{transform:translate(0,0)}to{transform:translate(-36px,20px)}}\n}\n\n/* ---------- hero entrance ---------- */\n#auth-hero [data-aos]{opacity:0;animation:fadeUp .6s cubic-bezier(.22,1,.36,1) forwards}\n#auth-hero [data-aos=\"d1\"]{animation-delay:.02s}\n#auth-hero [data-aos=\"d2\"]{animation-delay:.10s}\n#auth-hero [data-aos=\"d3\"]{animation-delay:.20s}\n#auth-hero [data-aos=\"d4\"]{animation-delay:.30s}\n#auth-hero [data-aos=\"d5\"]{animation-delay:.40s}\n@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}\n@media (prefers-reduced-motion:reduce){#auth-hero [data-aos]{opacity:1;animation:none}}\n\n/* ---------- auth card ---------- */\n.auth-card{\n  position:relative;\n  border-radius:24px;\n  background:#fff;\n  border:1px solid var(--line);\n  box-shadow:0 1px 2px rgba(15,23,42,.04),0 24px 50px -28px rgba(15,23,42,.28);\n}\n.auth-card-inner{padding:28px}\n.auth-logo{\n  background:var(--grad);\n  box-shadow:0 10px 22px -8px rgba(5,150,105,.55),inset 0 1px 0 rgba(255,255,255,.35);\n}\n\n/* ---------- auth tabs ---------- */\n.auth-tabs{background:#f1f5f9;border:1px solid rgba(15,23,42,.05)}\n.auth-tab{\n  position:relative;z-index:1;\n  transition:color .2s ease,background .2s ease,box-shadow .2s ease;\n}\n.auth-tab.active{background:#fff;color:var(--accent-strong);box-shadow:0 1px 3px rgba(15,23,42,.10)}\n\n/* ---------- auth form ---------- */\n.auth-input{\n  background:#fff;border:1px solid #e2e8f0;color:var(--ink-900);\n  transition:border-color .2s ease,box-shadow .2s ease;\n}\n.auth-input:focus{\n  border-color:var(--accent);\n  box-shadow:0 0 0 4px rgba(13,148,136,.13);\n}\n.auth-input::placeholder{color:#94a3b8}\n.auth-submit{\n  background:var(--grad);\n  box-shadow:0 12px 26px -12px rgba(13,148,136,.6);\n  transition:transform .18s ease,filter .2s ease,box-shadow .2s ease;\n}\n.auth-submit:hover{transform:translateY(-1px);filter:brightness(1.06)}\n.auth-submit:active{transform:translateY(0) scale(.98)}\n.auth-eyes{transition:background .18s ease,color .18s ease}\n.auth-eyes:hover{background:#f1f5f9;color:var(--accent-strong)}\n\n/* ---------- signed-in sections ---------- */\n#signed-in main>section,#signed-in main>div{\n  animation:fadeUp .5s cubic-bezier(.22,1,.36,1) both;\n}\n#signed-in main>section:nth-of-type(2),#signed-in main>div:nth-of-type(2){animation-delay:.04s}\n#signed-in main>section:nth-of-type(3),#signed-in main>div:nth-of-type(3){animation-delay:.08s}\n#signed-in main>section:nth-of-type(4),#signed-in main>div:nth-of-type(4){animation-delay:.12s}\n#signed-in main>section:nth-of-type(5),#signed-in main>div:nth-of-type(5){animation-delay:.16s}\n#signed-in main>section:nth-of-type(6),#signed-in main>div:nth-of-type(6){animation-delay:.2s}\n@media (prefers-reduced-motion:reduce){#signed-in main>section,#signed-in main>div{animation:none}}\n\n/* ---------- cards ---------- */\n.glass-card{\n  background:#fff;\n  border:1px solid var(--line);\n  border-radius:20px;\n  box-shadow:var(--card-shadow);\n  transition:transform .22s cubic-bezier(.22,1,.36,1),box-shadow .28s ease,border-color .28s ease;\n}\n.glass-card:hover{\n  transform:translateY(-3px);\n  box-shadow:var(--card-hover-shadow);\n  border-color:rgba(13,148,136,.30);\n}\n\n/* ---------- shorten ---------- */\n#shorten .glass-card{padding:26px}\n#shorten input{\n  background:#fff;border:1px solid #e2e8f0;color:var(--ink-900);\n  transition:border-color .2s ease,box-shadow .2s ease;\n}\n#shorten input:focus{\n  border-color:var(--accent);\n  box-shadow:0 0 0 4px rgba(13,148,136,.13);\n}\n#shorten input::placeholder{color:#94a3b8}\n#shorten .shorten-btn{\n  background:var(--grad);\n  box-shadow:0 12px 26px -12px rgba(13,148,136,.6);\n  transition:transform .18s ease,filter .2s ease,box-shadow .2s ease;\n}\n#shorten .shorten-btn:hover{transform:translateY(-1px);filter:brightness(1.06)}\n#shorten .shorten-btn:active{transform:translateY(0) scale(.98)}\n#result{animation:fadeUp .4s cubic-bezier(.22,1,.36,1)}\n#result .result-box{\n  background:linear-gradient(135deg,#f0fdfa,#fff);\n  border:1px solid rgba(13,148,136,.22);\n  box-shadow:0 14px 34px -22px rgba(13,148,136,.4);\n}\n#result button,#result a{transition:transform .15s ease,background .18s ease,color .18s ease}\n#result button:active,#result a:active{transform:scale(.96)}\n\n/* ---------- stat chips ---------- */\n.stat-chip{\n  background:linear-gradient(135deg,rgba(45,212,191,.13),rgba(5,150,105,.09));\n  border:1px solid rgba(13,148,136,.22);\n}\n.stat-num{\n  background:var(--grad);\n  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;\n}\n\n/* ---------- tabs + tables ---------- */\n.mini-tabs{background:#f1f5f9;border:1px solid rgba(15,23,42,.05)}\n.mini-tab{transition:color .2s ease,background .2s ease,box-shadow .2s ease}\n.mini-tab.active{background:#fff;color:var(--accent-strong);box-shadow:0 1px 3px rgba(15,23,42,.10)}\n.data-table tbody tr{transition:background .16s ease}\n.data-table tbody tr:hover{background:#f0fdfa}\n.data-table tbody tr .row-link{transition:color .16s ease}\n.data-table tbody tr:hover .row-link{color:var(--accent-strong)}\n\n/* ---------- pill buttons ---------- */\n.pill-btn{transition:transform .15s ease,background .18s ease,color .18s ease,border-color .18s ease,box-shadow .18s ease}\n.pill-btn:hover{transform:translateY(-1px);box-shadow:0 6px 14px -8px rgba(15,23,42,.25)}\n.pill-btn:active{transform:translateY(0) scale(.95)}\n.pill-btn.danger:hover{background:#fef2f2;border-color:#fca5a5;color:#dc2626}\n\n/* ---------- how it works ---------- */\n.how-step .how-ico{\n  background:linear-gradient(135deg,#ccfbf1,#99f6e4);\n  border:1px solid rgba(13,148,136,.18);\n  transition:transform .22s cubic-bezier(.22,1,.36,1),box-shadow .28s ease;\n}\n.how-step:hover .how-ico{\n  transform:scale(1.1) rotate(-4deg);\n  box-shadow:0 12px 24px -12px rgba(13,148,136,.45);\n}\n\n/* ---------- feature tiles ---------- */\n.feature-tile .feat-ico{transition:transform .22s ease}\n.feature-tile:hover .feat-ico{transform:scale(1.15)}\n.feature-tile:hover h3{color:var(--accent-strong)}\n.feature-tile h3{transition:color .2s ease}\n\n/* ---------- FAQ ---------- */\ndetails.faq{transition:border-color .2s ease,box-shadow .2s ease}\ndetails.faq:hover{border-color:rgba(13,148,136,.30);box-shadow:0 12px 28px -20px rgba(15,23,42,.25)}\ndetails.faq[open]{border-color:rgba(13,148,136,.35);box-shadow:0 14px 32px -20px rgba(13,148,136,.35)}\ndetails.faq summary{transition:color .18s ease}\ndetails.faq[open] summary,details.faq:hover summary{color:var(--accent-strong)}\ndetails.faq summary::marker{color:var(--accent)}\n\n/* ---------- footer ---------- */\nfooter{\n  background:linear-gradient(180deg,#fff,#f8fafc);\n  border-top:1px solid rgba(15,23,42,.06);\n  position:relative;\n}\nfooter::before{\n  content:'';position:absolute;top:-1px;left:0;right:0;height:1px;\n  background:linear-gradient(90deg,transparent,rgba(13,148,136,.45),rgba(251,191,36,.45),transparent);\n}\nfooter a{transition:color .18s ease}\n\n/* ---------- nav user chip ---------- */\n#nav-user{box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 4px 12px -8px rgba(13,148,136,.45)}\n\n/* ============================================================\n   v3: mobile-first refinements\n   ============================================================ */\n@media (max-width:640px){\n  #auth-hero [data-aos]{opacity:1;animation:none}\n  #signed-in main>section,#signed-in main>div{animation:none}\n  #auth-hero h1.text-4xl{font-size:2.15rem;line-height:1.12}\n  #auth-hero .glow.g1{width:420px;height:420px;top:-160px;left:-180px}\n  #auth-hero .glow.g2{width:440px;height:440px;top:20px;right:-200px}\n  #auth-hero .glow.g3{width:400px;height:400px;bottom:-180px;left:20%}\n}\n\n@media (max-width:640px){\n  #shorten .glass-card{padding:18px}\n  #shorten input,#auth-form .auth-input{min-height:48px;font-size:16px}\n  #shorten .shorten-btn,#auth-submit{min-height:48px}\n  .pill-btn{padding:8px 12px}\n  .result-box button,.result-box a{padding:9px 14px}\n}\n\n@media (max-width:640px){\n  #panel-recent,#panel-mine{overflow:visible}\n  .data-table{display:block;min-width:0}\n  .data-table thead{display:none}\n  .data-table tbody{display:block}\n  .data-table tbody tr{\n    display:block;\n    border:1px solid var(--line);\n    border-radius:14px;\n    background:#fff;\n    padding:10px 12px;\n    margin-bottom:10px;\n    box-shadow:var(--card-shadow);\n  }\n  .data-table tbody tr:hover{background:#fff}\n  .data-table tbody tr:hover .row-link{color:var(--accent-strong)}\n  .data-table td{\n    display:flex;\n    align-items:center;\n    justify-content:space-between;\n    gap:10px;\n    padding:4px 0!important;\n    max-width:100%;\n  }\n  .data-table td:first-child{justify-content:flex-start}\n  .data-table td:first-child::before{content:none}\n  .data-table td[data-label]::before{\n    content:attr(data-label);\n    font-size:10px;\n    font-weight:800;\n    letter-spacing:.08em;\n    text-transform:uppercase;\n    color:var(--ink-400);\n    flex:0 0 auto;\n  }\n  .data-table td[data-label=\"\"]{justify-content:flex-end}\n  .data-table td[data-label=\"\"]::before{content:none}\n}\n\n/* ============================================================\n   v4: tool slider (URL Shortener | Text to Link)\n   ============================================================ */\n.tool-slider{\n  background:rgba(15,23,42,.05);\n  border:1px solid rgba(15,23,42,.06);\n}\n.tool-tab{\n  -webkit-tap-highlight-color:transparent;\n  transition:background-color .18s ease,color .18s ease;\n  cursor:pointer;\n}\n.tool-tab:active{transform:scale(.98)}\n.tool-tab.active{background:#fff}\n\n@media (max-width:640px){\n  .tool-tab{padding:11px 8px;font-size:13px}\n  #tool-panel-text textarea{min-height:48px;font-size:16px}\n  #tool-panel-text .shorten-btn{min-height:48px}\n}\n\n/* ============================================================\n   v5: tools in header (top-right)\n   ============================================================ */\n#nav-tools .tool-tab{\n  -webkit-tap-highlight-color:transparent;\n  transition:background-color .18s ease,color .18s ease;\n  cursor:pointer;\n}\n#nav-tools .tool-tab:active{transform:scale(.97)}\n#nav-tools .tool-tab.active{background:#fff}\n@media (max-width:640px){\n  #nav-tools .tool-tab{padding:9px 12px}\n}\n\n"},{"path":"/icon.svg","type":"image/svg+xml","cache":"public, max-age=86400","content":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\">\n  <rect width=\"512\" height=\"512\" rx=\"112\" fill=\"#0b0f0e\"/>\n  <rect x=\"56\" y=\"56\" width=\"400\" height=\"400\" rx=\"88\" fill=\"#0ea5a4\"/>\n  <path d=\"M176 200h160M296 132l68 68-68 68M336 312H176M216 244l-68 68 68 68\" stroke=\"#fff\" stroke-width=\"46\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/>\n</svg>\n"},{"path":"/index.html","type":"text/html","cache":"no-store","content":"<!DOCTYPE html>\n<html lang=\"en\" data-theme=\"light\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>LinkShort — Free URL Shortener with Click Stats & QR Codes</title>\n  <meta name=\"description\" content=\"Shorten any link in seconds with LinkShort — fast, free and secure. Get instant short links, QR codes, click tracking and a live analytics dashboard. Save and manage your links with an account.\">\n  <meta name=\"keywords\" content=\"url shortener, link shortener, short links, free link shortener, qr code generator, click tracker, link analytics, shorten url\">\n  <meta name=\"robots\" content=\"index, follow, max-image-preview:large\">\n  <link rel=\"canonical\" href=\"https://short.smp45.qzz.io/\">\n  <meta property=\"og:title\" content=\"LinkShort — Free URL Shortener\">\n  <meta property=\"og:description\" content=\"Shorten any link in seconds. Free short links, QR codes and click stats.\">\n  <meta property=\"og:type\" content=\"website\">\n  <meta property=\"og:site_name\" content=\"LinkShort\">\n  <meta property=\"og:url\" content=\"https://short.smp45.qzz.io/\">\n  <meta property=\"og:image\" content=\"https://short.smp45.qzz.io/og-image.png\">\n  <meta property=\"og:image:width\" content=\"512\">\n  <meta property=\"og:image:height\" content=\"512\">\n  <meta property=\"og:locale\" content=\"en_US\">\n  <meta name=\"theme-color\" content=\"#ffffff\">\n  <link rel=\"icon\" href=\"/icon.svg\" type=\"image/svg+xml\">\n  <link rel=\"apple-touch-icon\" href=\"/og-image.png\">\n  <link rel=\"preconnect\" href=\"https://cdn.jsdelivr.net\" crossorigin>\n  <link rel=\"preconnect\" href=\"https://quge5.com\" crossorigin>\n  <link rel=\"preconnect\" href=\"https://nap5k.com\" crossorigin>\n  <link rel=\"preconnect\" href=\"https://al5sm.com\" crossorigin>\n  <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n  <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n  <link href=\"https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap\" rel=\"stylesheet\">\n  <script type=\"application/ld+json\">\n  {\n    \"@context\": \"https://schema.org\",\n    \"@type\": \"WebSite\",\n    \"name\": \"LinkShort\",\n    \"url\": \"https://short.smp45.qzz.io/\",\n    \"description\": \"Free URL shortener with click stats and QR codes.\",\n    \"inLanguage\": \"en\",\n    \"publisher\": { \"@type\": \"Organization\", \"name\": \"LinkShort\", \"url\": \"https://short.smp45.qzz.io/\" }\n  }\n  </script>\n  <link rel=\"preload\" as=\"style\" href=\"/tailwind.min.css\">\n  <link rel=\"stylesheet\" href=\"/tailwind.min.css\">\n  <link rel=\"stylesheet\" href=\"/custom.css?v=5\">\n  <script type=\"application/ld+json\">\n  {\n    \"@context\": \"https://schema.org\",\n    \"@type\": \"FAQPage\",\n    \"mainEntity\": [\n      {\n        \"@type\": \"Question\",\n        \"name\": \"Is LinkShort really free?\",\n        \"acceptedAnswer\": { \"@type\": \"Answer\", \"text\": \"Yes. Shortening is free for normal use. The service is supported by unobtrusive advertising.\" }\n      },\n      {\n        \"@type\": \"Question\",\n        \"name\": \"Why do I need an account?\",\n        \"acceptedAnswer\": { \"@type\": \"Answer\", \"text\": \"An account lets you save, track and manage all of your short links in one place. Sign up is free and takes seconds.\" }\n      },\n      {\n        \"@type\": \"Question\",\n        \"name\": \"How long do my links last?\",\n        \"acceptedAnswer\": { \"@type\": \"Answer\", \"text\": \"Links are kept permanently as long as they are used. We reserve the right to remove spam or illegal content.\" }\n      }\n    ]\n  }\n  </script>\n</head>\n<body class=\"bg-slate-50 text-slate-800 antialiased signed-out\">\n\n  <header class=\"sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur\">\n    <div class=\"mx-auto flex max-w-5xl flex-wrap items-center gap-y-2 px-4 py-3\">\n      <a href=\"/\" class=\"flex items-center gap-2\">\n        <span class=\"flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-lg shadow\">🔗</span>\n        <span class=\"text-lg font-bold tracking-tight text-slate-900\">Link<span class=\"text-teal-600\">Short</span></span>\n      </a>\n      <div class=\"order-1 ml-auto flex items-center gap-2 sm:order-none sm:ml-2\">\n        <span id=\"nav-user\" class=\"hidden max-w-[120px] truncate rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700\"></span>\n        <button onclick=\"logout()\" id=\"nav-logout\"\n          class=\"hidden rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100\">Log out</button>\n      </div>\n      <div id=\"nav-tools\" class=\"order-2 flex w-full items-center justify-end gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 sm:order-none sm:ml-auto sm:w-auto sm:border-0 sm:bg-transparent sm:p-0\">\n        <button id=\"tool-url\" onclick=\"selectTool('url')\" aria-label=\"URL Shortener\"\n          class=\"tool-tab active flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-teal-700\">\n          <span class=\"text-sm\">🔗</span><span class=\"hidden md:inline\">URL Shortener</span>\n        </button>\n        <button id=\"tool-text\" onclick=\"selectTool('text')\" aria-label=\"Text to Link\"\n          class=\"tool-tab flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-500\">\n          <span class=\"text-sm\">📄</span><span class=\"hidden md:inline\">Text to Link</span>\n        </button>\n        <button id=\"tool-file\" onclick=\"selectTool('file')\" aria-label=\"File to Link\"\n          class=\"tool-tab flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-500\">\n          <span class=\"text-sm\">📁</span><span class=\"hidden md:inline\">File to Link</span>\n        </button>\n      </div>\n    </div>\n  </header>\n\n  <section id=\"auth-hero\" class=\"relative overflow-hidden\">\n    <div class=\"glow g1\" aria-hidden=\"true\"></div>\n    <div class=\"glow g2\" aria-hidden=\"true\"></div>\n    <div class=\"glow g3\" aria-hidden=\"true\"></div>\n\n    <div class=\"relative mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:py-20 lg:grid-cols-2 lg:items-center\">\n      <div class=\"text-center lg:text-left\">\n        <span data-aos=\"d1\" class=\"inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-white/80 px-3 py-1 text-xs font-semibold text-teal-700 shadow-sm\">✨ Free · No email · 100% online</span>\n        <h1 data-aos=\"d2\" class=\"mx-auto mt-5 max-w-xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:mx-0\">\n          Own your links.<br><span class=\"shimmer-text bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent\">Track every click.</span>\n        </h1>\n        <p data-aos=\"d3\" class=\"mx-auto mt-4 max-w-md text-base text-slate-500 lg:mx-0\">Shorten long URLs into clean links, get a QR code and watch your clicks grow — all saved safely to your account.</p>\n        <ul data-aos=\"d4\" class=\"mx-auto mt-8 grid max-w-md gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:mx-0\">\n          <li class=\"flex items-center gap-2\"><span class=\"hero-check flex h-5 w-5 items-center justify-center rounded-full text-[10px]\">✓</span> Save unlimited links</li>\n          <li class=\"flex items-center gap-2\"><span class=\"hero-check flex h-5 w-5 items-center justify-center rounded-full text-[10px]\">✓</span> Live click analytics</li>\n          <li class=\"flex items-center gap-2\"><span class=\"hero-check flex h-5 w-5 items-center justify-center rounded-full text-[10px]\">✓</span> Instant QR codes</li>\n          <li class=\"flex items-center gap-2\"><span class=\"hero-check flex h-5 w-5 items-center justify-center rounded-full text-[10px]\">✓</span> Instant 301 redirects</li>\n        </ul>\n      </div>\n\n      <div data-aos=\"d5\" class=\"mx-auto w-full max-w-md\">\n        <div class=\"auth-card\">\n          <div class=\"auth-card-inner p-7\">\n            <div class=\"text-center\">\n              <span class=\"auth-logo mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-2xl\">🔗</span>\n              <h2 id=\"auth-title\" class=\"mt-4 text-xl font-bold text-slate-900\">Welcome back</h2>\n              <p class=\"mt-1 text-sm text-slate-500\">Log in to your LinkShort account</p>\n            </div>\n            <div class=\"auth-tabs mt-5 flex gap-1 rounded-xl p-1 text-xs font-semibold\">\n              <button id=\"auth-tab-login\" onclick=\"authTab('login')\" class=\"auth-tab active flex-1 rounded-lg bg-white px-3 py-2 text-teal-700 shadow-sm\">Log in</button>\n              <button id=\"auth-tab-signup\" onclick=\"authTab('signup')\" class=\"auth-tab flex-1 rounded-lg px-3 py-2 text-slate-500\">Sign up</button>\n            </div>\n            <form id=\"auth-form\" class=\"mt-5\" onsubmit=\"return submitAuth(event)\">\n              <label class=\"block text-sm font-semibold text-slate-700\">Username</label>\n              <div class=\"relative mt-1.5\">\n                <span class=\"pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400\">👤</span>\n                <input id=\"auth-name\" type=\"text\" autocomplete=\"username\" minlength=\"3\" maxlength=\"20\" required placeholder=\"Choose a username\"\n                  class=\"auth-input w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition\">\n              </div>\n              <label class=\"mt-4 block text-sm font-semibold text-slate-700\">Password</label>\n              <div class=\"relative mt-1.5\">\n                <span class=\"pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400\">🔒</span>\n                <input id=\"auth-pass\" type=\"password\" autocomplete=\"current-password\" minlength=\"6\" required placeholder=\"At least 6 characters\"\n                  class=\"auth-input w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-11 text-sm text-slate-800 placeholder-slate-400 outline-none transition\">\n                <button type=\"button\" onclick=\"togglePass()\" aria-label=\"Show password\"\n                  class=\"auth-eyes absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400\">👁</button>\n              </div>\n              <p id=\"auth-msg\" class=\"mt-3 hidden rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600\"></p>\n              <button id=\"auth-submit\" type=\"submit\"\n                class=\"auth-submit mt-5 w-full rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/25\">Log in</button>\n              <p id=\"auth-alt\" class=\"mt-3 text-center text-xs text-slate-500\">No account yet? <button type=\"button\" onclick=\"authTab('signup')\" class=\"font-semibold text-teal-600\">Sign up free</button></p>\n            </form>\n          </div>\n        </div>\n        <p class=\"mt-3 text-center text-[11px] text-slate-400\">By continuing you agree to the terms of service and privacy policy.</p>\n      </div>\n    </div>\n\n    <div class=\"relative mx-auto max-w-5xl px-4 pb-10\">\n      <div class=\"trust-strip mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-x-9 gap-y-3 text-xs font-semibold text-slate-500\">\n        <span class=\"flex items-center gap-2\"><span class=\"trust-dot\">⚡</span> Instant 301 redirects</span>\n        <span class=\"flex items-center gap-2\"><span class=\"trust-dot\">🛡️</span> Secure by default</span>\n        <span class=\"flex items-center gap-2\"><span class=\"trust-dot\">💯</span> Free forever</span>\n      </div>\n      <div class=\"safead\"></div>\n    </div>\n  </section>\n\n  <div id=\"signed-in\" class=\"hidden\">\n    <main class=\"mx-auto max-w-5xl px-4\">\n\n      <section class=\"pt-10 pb-6 text-center\">\n        <span class=\"inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700\">✓ Free · ✓ Saved to your account · ✓ Fast</span>\n        <h1 class=\"mx-auto mt-4 max-w-2xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl\">Shorten links. Share smart.</h1>\n        <p class=\"mx-auto mt-4 max-w-xl text-base text-slate-500\">Paste any URL, get a clean short link, a shareable QR code and live click stats in seconds.</p>\n      </section>\n\n      <div id=\"tool-panel-url\">\n        <section id=\"shorten\" class=\"mx-auto max-w-2xl scroll-mt-24\">\n          <div class=\"glass-card p-6 sm:p-8\">\n            <label for=\"url\" class=\"block text-sm font-semibold text-slate-700\">Enter the URL to shorten</label>\n            <div class=\"mt-3 flex flex-col gap-3 sm:flex-row\">\n              <input id=\"url\" type=\"url\" inputmode=\"url\" autocomplete=\"off\" spellcheck=\"false\" placeholder=\"https://example.com/very-long-link\"\n                class=\"flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none\">\n              <button onclick=\"shortenUrl()\" id=\"shorten-btn\"\n                class=\"shorten-btn rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm\">Shorten Link</button>\n            </div>\n            <p id=\"form-msg\" class=\"mt-3 hidden text-sm font-medium text-red-600\"></p>\n          </div>\n        </section>\n      </div>\n\n      <div id=\"tool-panel-text\" class=\"hidden\">\n        <section class=\"mx-auto max-w-2xl scroll-mt-24\">\n          <div class=\"glass-card p-6 sm:p-8\">\n            <label for=\"text-input\" class=\"block text-sm font-semibold text-slate-700\">Paste your text</label>\n            <textarea id=\"text-input\" rows=\"7\" maxlength=\"100000\" spellcheck=\"false\"\n              placeholder=\"Paste any long text — a message, code snippet, notes, article…\"\n              class=\"mt-3 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none\"></textarea>\n            <div class=\"mt-2 flex flex-wrap items-center justify-between gap-2\">\n              <span id=\"text-count\" class=\"text-xs text-slate-400\">0 / 100,000</span>\n              <button onclick=\"createTextLink()\" id=\"text-btn\"\n                class=\"shorten-btn rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm\">Create Text Link</button>\n            </div>\n            <p id=\"text-msg\" class=\"mt-3 hidden text-sm font-medium text-red-600\"></p>\n          </div>\n          <div class=\"mt-6 grid gap-3 sm:grid-cols-3\">\n            <div class=\"glass-card how-step p-4 text-center\">\n              <div class=\"how-ico mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-base\">1️⃣</div>\n              <h3 class=\"mt-2 text-sm font-bold text-slate-900\">Paste your text</h3>\n              <p class=\"mt-1 text-xs text-slate-500\">Any long message, code or notes.</p>\n            </div>\n            <div class=\"glass-card how-step p-4 text-center\">\n              <div class=\"how-ico mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-base\">2️⃣</div>\n              <h3 class=\"mt-2 text-sm font-bold text-slate-900\">Get a short link</h3>\n              <p class=\"mt-1 text-xs text-slate-500\">Created in under a second.</p>\n            </div>\n            <div class=\"glass-card how-step p-4 text-center\">\n              <div class=\"how-ico mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-base\">3️⃣</div>\n              <h3 class=\"mt-2 text-sm font-bold text-slate-900\">Share & track</h3>\n              <p class=\"mt-1 text-xs text-slate-500\">Anyone with the link sees your text.</p>\n            </div>\n          </div>\n        </section>\n      </div>\n\n      <div id=\"tool-panel-file\" class=\"hidden\">\n        <section class=\"mx-auto max-w-2xl scroll-mt-24\">\n          <div class=\"glass-card p-6 sm:p-8\">\n            <label for=\"file-input\" class=\"block text-sm font-semibold text-slate-700\">Choose a file</label>\n            <label for=\"file-input\" id=\"file-drop\"\n              class=\"mt-3 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-9 text-center transition hover:border-teal-400 hover:bg-teal-50/50\">\n              <span id=\"file-ico\" class=\"text-3xl\">📁</span>\n              <span id=\"file-name\" class=\"text-sm font-semibold text-slate-600\">Tap to choose a file</span>\n              <span id=\"file-meta\" class=\"text-xs text-slate-400\">Up to 100 MB · any type</span>\n              <input id=\"file-input\" type=\"file\" class=\"sr-only\" onchange=\"onFilePick(this)\">\n            </label>\n            <div class=\"mt-3 flex flex-wrap items-center justify-between gap-2\">\n              <span id=\"file-size\" class=\"text-xs text-slate-400\"></span>\n              <button onclick=\"createFileLink()\" id=\"file-btn\"\n                class=\"shorten-btn rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm\">Upload &amp; Get Link</button>\n            </div>\n            <p id=\"file-msg\" class=\"mt-3 hidden text-sm font-medium text-red-600\"></p>\n          </div>\n          <div class=\"mt-6 grid gap-3 sm:grid-cols-3\">\n            <div class=\"glass-card how-step p-4 text-center\">\n              <div class=\"how-ico mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-base\">1️⃣</div>\n              <h3 class=\"mt-2 text-sm font-bold text-slate-900\">Pick a file</h3>\n              <p class=\"mt-1 text-xs text-slate-500\">Any file up to 100 MB.</p>\n            </div>\n            <div class=\"glass-card how-step p-4 text-center\">\n              <div class=\"how-ico mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-base\">2️⃣</div>\n              <h3 class=\"mt-2 text-sm font-bold text-slate-900\">Get a short link</h3>\n              <p class=\"mt-1 text-xs text-slate-500\">Uploaded in a few seconds.</p>\n            </div>\n            <div class=\"glass-card how-step p-4 text-center\">\n              <div class=\"how-ico mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-base\">3️⃣</div>\n              <h3 class=\"mt-2 text-sm font-bold text-slate-900\">Share &amp; download</h3>\n              <p class=\"mt-1 text-xs text-slate-500\">Anyone with the link can grab the file.</p>\n            </div>\n          </div>\n        </section>\n      </div>\n\n      <div id=\"result\" class=\"mx-auto mt-6 max-w-2xl hidden\">\n        <div class=\"result-box rounded-xl p-4\">\n          <div class=\"text-xs font-semibold uppercase tracking-wide text-teal-600\">Your link is ready</div>\n          <div class=\"mt-1 flex flex-wrap items-center gap-2\">\n            <a id=\"short-link\" href=\"#\" target=\"_blank\" rel=\"noopener\" class=\"break-all text-base font-bold text-teal-700 underline decoration-teal-300 underline-offset-2\"></a>\n          </div>\n          <div class=\"mt-4 flex flex-wrap items-center gap-2\">\n            <button onclick=\"copyShort()\" id=\"copy-btn\"\n              class=\"rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700\">Copy Link</button>\n            <a id=\"open-link\" href=\"#\" target=\"_blank\" rel=\"noopener\"\n              class=\"rounded-lg border border-teal-300 bg-white px-4 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50\">Open</a>\n            <button onclick=\"shareShort()\"\n              class=\"rounded-lg border border-teal-300 bg-white px-4 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50\">Share</button>\n          </div>\n        </div>\n        <div class=\"mt-4 flex flex-col items-center gap-3 sm:flex-row sm:items-start\">\n          <div id=\"qr-box\" class=\"flex h-36 w-36 items-center justify-center rounded-xl border border-slate-200 bg-white\"></div>\n          <p class=\"text-xs leading-5 text-slate-500 sm:mt-1\">Scan with any phone camera to open your link instantly. Perfect for posters, menus and product packaging.</p>\n        </div>\n      </div>\n\n      <div class=\"ad-banner\"></div>\n\n      <section id=\"how\" class=\"mt-12 scroll-mt-24\">\n        <span class=\"kicker\">Simple</span>\n        <h2 class=\"text-center text-2xl font-bold text-slate-900\">How it works</h2>\n        <div class=\"mt-6 grid gap-4 sm:grid-cols-3\">\n          <div class=\"glass-card how-step p-6 text-center\">\n            <div class=\"how-ico mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-teal-100 text-lg\">📋</div>\n            <h3 class=\"mt-3 text-sm font-bold text-slate-900\">1. Paste</h3>\n            <p class=\"mt-1 text-xs text-slate-500\">Paste the long URL you want to share.</p>\n          </div>\n          <div class=\"glass-card how-step p-6 text-center\">\n            <div class=\"how-ico mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-teal-100 text-lg\">🔗</div>\n            <h3 class=\"mt-3 text-sm font-bold text-slate-900\">2. Shorten</h3>\n            <p class=\"mt-1 text-xs text-slate-500\">Get a clean short link in under a second.</p>\n          </div>\n          <div class=\"glass-card how-step p-6 text-center\">\n            <div class=\"how-ico mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-teal-100 text-lg\">📊</div>\n            <h3 class=\"mt-3 text-sm font-bold text-slate-900\">3. Track</h3>\n            <p class=\"mt-1 text-xs text-slate-500\">Watch clicks grow with live analytics.</p>\n          </div>\n        </div>\n      </section>\n\n      <div class=\"direct-ad\"></div>\n      <div class=\"ad-duo\"></div>\n      <div class=\"ad-duo\"></div>\n\n      <section id=\"analytics\" class=\"mt-12 scroll-mt-24\">\n        <div class=\"glass-card p-6\">\n          <div class=\"flex flex-wrap items-end justify-between gap-2\">\n            <div>\n              <span class=\"kicker\">Live</span>\n              <h2 class=\"text-xl font-bold text-slate-900\">Link analytics</h2>\n              <p class=\"mt-1 text-xs text-slate-500\">Recently shortened links, click counts and creation time.</p>\n            </div>\n            <div class=\"stat-chip rounded-xl px-3 py-2 text-right text-xs text-slate-500\">\n              <span class=\"stat-num text-base font-extrabold\" id=\"stat-total\">0</span> links · <span class=\"stat-num text-base font-extrabold\" id=\"stat-clicks\">0</span> clicks\n            </div>\n          </div>\n          <div class=\"mini-tabs mt-4 flex gap-1 rounded-xl p-1 text-xs font-semibold\">\n            <button id=\"tab-recent\" onclick=\"switchTab('recent')\"\n              class=\"mini-tab active flex-1 rounded-lg px-3 py-2 text-slate-500 transition\">Recent</button>\n            <button id=\"tab-mine\" onclick=\"switchTab('mine')\" class=\"mini-tab flex-1 rounded-lg px-3 py-2 text-slate-500 transition\">\n              My links <span id=\"mine-count\" class=\"ml-1\"></span>\n            </button>\n          </div>\n          <div class=\"mt-4 overflow-x-auto\" id=\"panel-recent\">\n            <table class=\"data-table w-full min-w-[560px] text-left text-sm\">\n              <thead>\n                <tr class=\"border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400\">\n                  <th class=\"py-2 pr-4 font-semibold\">Short code</th>\n                  <th class=\"py-2 pr-4 font-semibold\">Long URL</th>\n                  <th class=\"py-2 pr-4 font-semibold\">Clicks</th>\n                  <th class=\"py-2 pr-4 font-semibold\">Created</th>\n                  <th class=\"py-2 font-semibold\"></th>\n                </tr>\n              </thead>\n              <tbody id=\"analytics-body\">\n                <tr><td colspan=\"5\" class=\"py-6 text-center text-slate-400\">Loading analytics…</td></tr>\n              </tbody>\n            </table>\n          </div>\n          <div class=\"mt-4 overflow-x-auto hidden\" id=\"panel-mine\">\n            <div id=\"my-links\" class=\"scroll-mt-24\">\n              <table class=\"data-table hidden w-full min-w-[560px] text-left text-sm\" id=\"mine-table\">\n                <thead>\n                  <tr class=\"border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400\">\n                    <th class=\"py-2 pr-4 font-semibold\">Short code</th>\n                    <th class=\"py-2 pr-4 font-semibold\">Long URL</th>\n                    <th class=\"py-2 pr-4 font-semibold\">Clicks</th>\n                    <th class=\"py-2 pr-4 font-semibold\">Created</th>\n                    <th class=\"py-2 font-semibold\"></th>\n                  </tr>\n                </thead>\n                <tbody id=\"mine-body\"></tbody>\n              </table>\n            </div>\n          </div>\n        </div>\n      </section>\n\n      <section class=\"mt-12 grid gap-4 sm:grid-cols-3\">\n        <div class=\"glass-card feature-tile p-5\">\n          <div class=\"feat-ico text-lg\">⚡</div>\n          <h3 class=\"mt-2 text-sm font-bold text-slate-900\">Instant 301 redirects</h3>\n          <p class=\"mt-1 text-xs text-slate-500\">Links redirect straight to the destination — nothing in the way, no waiting.</p>\n        </div>\n        <div class=\"glass-card feature-tile p-5\">\n          <div class=\"feat-ico text-lg\">🔒</div>\n          <h3 class=\"mt-2 text-sm font-bold text-slate-900\">Secure by default</h3>\n          <p class=\"mt-1 text-xs text-slate-500\">Served over HTTPS with strict headers and safe sharing metadata.</p>\n        </div>\n        <div class=\"glass-card feature-tile p-5\">\n          <div class=\"feat-ico text-lg\">🆓</div>\n          <h3 class=\"mt-2 text-sm font-bold text-slate-900\">Free forever</h3>\n          <p class=\"mt-1 text-xs text-slate-500\">Free to sign up and free to use for everyday needs. Keep it simple.</p>\n        </div>\n      </section>\n\n      <div class=\"ad-count\"></div>\n\n      <section class=\"mt-12\">\n        <span class=\"kicker\">Support</span>\n        <h2 class=\"text-center text-2xl font-bold text-slate-900\">Frequently asked</h2>\n        <div class=\"mx-auto mt-6 max-w-2xl space-y-3\">\n          <details class=\"faq rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm\">\n            <summary class=\"cursor-pointer text-sm font-semibold text-slate-800\">Is LinkShort really free?</summary>\n            <p class=\"mt-2 text-sm text-slate-500\">Yes. Shortening is free for normal use. The service is supported by unobtrusive advertising.</p>\n          </details>\n          <details class=\"faq rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm\">\n            <summary class=\"cursor-pointer text-sm font-semibold text-slate-800\">Why do I need an account?</summary>\n            <p class=\"mt-2 text-sm text-slate-500\">An account lets you save, track and manage all of your short links in one place. Sign up is free and takes seconds.</p>\n          </details>\n          <details class=\"faq rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm\">\n            <summary class=\"cursor-pointer text-sm font-semibold text-slate-800\">How long do my links last?</summary>\n            <p class=\"mt-2 text-sm text-slate-500\">Links are kept permanently as long as they are used. We reserve the right to remove spam or illegal content.</p>\n          </details>\n        </div>\n      </section>\n\n      <div class=\"ad-banner\"></div>\n      <div class=\"safead\"></div>\n\n    </main>\n  </div>\n\n  <footer class=\"mt-16 border-t border-slate-200 bg-white\">\n    <div class=\"mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-3\">\n      <div>\n        <div class=\"flex items-center gap-2\">\n          <span class=\"flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-sm shadow\">🔗</span>\n          <span class=\"font-bold text-slate-900\">Link<span class=\"text-teal-600\">Short</span></span>\n        </div>\n        <p class=\"mt-3 max-w-xs text-xs leading-5 text-slate-500\">A fast, free and secure URL shortener with click tracking and QR codes for everyone.</p>\n      </div>\n      <div>\n        <h4 class=\"text-sm font-bold text-slate-900\">Product</h4>\n        <ul class=\"mt-3 space-y-2 text-sm text-slate-500\">\n          <li><a href=\"#shorten\" class=\"hover:text-teal-600\">Shorten a link</a></li>\n          <li><a href=\"#analytics\" class=\"hover:text-teal-600\">Link analytics</a></li>\n          <li><a href=\"#how\" class=\"hover:text-teal-600\">How it works</a></li>\n        </ul>\n      </div>\n      <div>\n        <h4 class=\"text-sm font-bold text-slate-900\">Company</h4>\n        <ul class=\"mt-3 space-y-2 text-sm text-slate-500\">\n          <li><a href=\"/\" class=\"hover:text-teal-600\">About</a></li>\n          <li><a href=\"/\" class=\"hover:text-teal-600\">Privacy policy</a></li>\n          <li><a href=\"/\" class=\"hover:text-teal-600\">Terms of service</a></li>\n          <li><a href=\"mailto:support@short.smp45.qzz.io\" class=\"hover:text-teal-600\">Contact</a></li>\n        </ul>\n      </div>\n    </div>\n    <div class=\"border-t border-slate-100 py-4 text-center text-xs text-slate-400\">© 2026 LinkShort · Free URL shortener with click stats & QR codes</div>\n  </footer>\n\n  <div id=\"sticky-bar\" class=\"sticky-bar\"></div>\n  <div id=\"ad-modal\" class=\"ad-modal\"></div>\n\n  <script src=\"https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js\"></script>\n  <script src=\"/safeads.js?v=15\"></script>\n  <script>\n    let lastShort = '';\n    let me = null;\n    let activeTab = 'recent';\n    let authMode = 'login';\n    let monetagLoaded = false;\n    const linksCache = { at: 0, data: null };\n    const myCache = { at: 0, data: null };\n    const CACHE_TTL = 8000;\n\n    function esc(s) {\n      return String(s).replace(/[&<>\"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', \"'\": '&#39;' }[c]));\n    }\n    function escAttr(s) {\n      return String(s).replace(/[&<>\"'\\\\\\/]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', \"'\": '&#39;', '\\\\': '\\\\\\\\', '/': '\\\\/' }[c]));\n    }\n\n    function msg(text) {\n      const m = document.getElementById('form-msg');\n      m.textContent = text;\n      m.classList.remove('hidden');\n    }\n\n    function togglePass() {\n      const p = document.getElementById('auth-pass');\n      p.type = p.type === 'password' ? 'text' : 'password';\n    }\n\n    function authTab(mode) {\n      authMode = mode;\n      const login = mode === 'login';\n      document.getElementById('auth-title').textContent = login ? 'Welcome back' : 'Create your account';\n      document.querySelector('#auth-title + p').textContent = login ? 'Log in to your LinkShort account' : 'It takes less than 10 seconds';\n      document.getElementById('auth-submit').textContent = login ? 'Log in' : 'Create account';\n      document.getElementById('auth-pass').setAttribute('autocomplete', login ? 'current-password' : 'new-password');\n      const lt = document.getElementById('auth-tab-login');\n      const st = document.getElementById('auth-tab-signup');\n      lt.className = 'auth-tab flex-1 rounded-lg px-3 py-2 ' + (login ? 'active bg-white text-teal-700 shadow-sm' : 'text-slate-500');\n      st.className = 'auth-tab flex-1 rounded-lg px-3 py-2 ' + (login ? 'text-slate-500' : 'active bg-white text-teal-700 shadow-sm');\n      document.getElementById('auth-alt').innerHTML = login\n        ? 'No account yet? <button type=\"button\" onclick=\"authTab(\\'signup\\')\" class=\"font-semibold text-teal-600\">Sign up free</button>'\n        : 'Already have an account? <button type=\"button\" onclick=\"authTab(\\'login\\')\" class=\"font-semibold text-teal-600\">Log in</button>';\n    }\n\n    async function submitAuth(e) {\n      e.preventDefault();\n      const name = document.getElementById('auth-name').value.trim();\n      const pass = document.getElementById('auth-pass').value;\n      const am = document.getElementById('auth-msg');\n      am.classList.add('hidden');\n      const btn = document.getElementById('auth-submit');\n      btn.disabled = true;\n      const old = btn.textContent;\n      btn.textContent = 'Please wait…';\n      try {\n        const r = await fetch('/api/' + (authMode === 'login' ? 'login' : 'register'), {\n          method: 'POST',\n          headers: { 'Content-Type': 'application/json' },\n          body: JSON.stringify({ name, password: pass })\n        });\n        const d = await r.json();\n        if (!r.ok) throw new Error(d.error || 'Something went wrong');\n        me = { name: d.name };\n        applyAuthState();\n        loadAnalytics();\n        loadMyLinks();\n        document.getElementById('shorten').scrollIntoView({ behavior: 'smooth' });\n        if (window.SafeAds) SafeAds.reinit();\n      } catch (err) {\n        am.textContent = err.message;\n        am.classList.remove('hidden');\n      } finally {\n        btn.disabled = false;\n        btn.textContent = old;\n      }\n      return false;\n    }\n\n    async function logout() {\n      try { await fetch('/api/logout', { method: 'POST' }); } catch (e) {}\n      me = null;\n      applyAuthState();\n      loadAnalytics();\n      loadMyLinks();\n      if (activeTab === 'mine') switchTab('recent');\n      window.scrollTo({ top: 0, behavior: 'smooth' });\n    }\n\n    async function loadMe() {\n      try {\n        const r = await fetch('/api/me');\n        if (r.ok) { me = await r.json(); }\n      } catch (e) {}\n      applyAuthState();\n    }\n\n    function loadMonetag() {\n      if (monetagLoaded) return;\n      monetagLoaded = true;\n      const zones = [\n        ['265635', 'https://quge5.com/88/tag.min.js'],\n        ['11468479', 'https://nap5k.com/tag.min.js'],\n        ['11468375', 'https://al5sm.com/tag.min.js']\n      ];\n      zones.forEach(([z, src]) => {\n        const s = document.createElement('script');\n        s.async = true;\n        s.dataset.zone = z;\n        s.src = src;\n        s.setAttribute('data-cfasync', 'false');\n        document.head.appendChild(s);\n      });\n    }\n\n    function applyAuthState() {\n      const isIn = !!me;\n      document.body.classList.toggle('signed-in', isIn);\n      document.getElementById('auth-hero').classList.toggle('hidden', isIn);\n      document.getElementById('signed-in').classList.toggle('hidden', !isIn);\n      document.getElementById('nav-logout').classList.toggle('hidden', !isIn);\n      document.getElementById('nav-user').classList.toggle('hidden', !isIn);\n      document.getElementById('nav-tools').classList.toggle('hidden', !isIn);\n      if (isIn) {\n        document.getElementById('nav-user').textContent = '👤 ' + me.name;\n      }\n      loadMonetag();\n    }\n\n    function switchTab(tab) {\n      activeTab = tab;\n      const recent = tab === 'recent';\n      document.getElementById('panel-recent').classList.toggle('hidden', !recent);\n      document.getElementById('panel-mine').classList.toggle('hidden', recent);\n      const rt = document.getElementById('tab-recent');\n      const mt = document.getElementById('tab-mine');\n      rt.className = 'mini-tab flex-1 rounded-lg px-3 py-2 ' + (recent ? 'active bg-white text-teal-700 shadow-sm' : 'text-slate-500');\n      mt.className = 'mini-tab flex-1 rounded-lg px-3 py-2 ' + (recent ? 'text-slate-500' : 'active bg-white text-teal-700 shadow-sm');\n      if (recent) loadAnalytics(); else loadMyLinks();\n    }\n\n    function renderMyLinks(d) {\n      const body = document.getElementById('mine-body');\n      const table = document.getElementById('mine-table');\n      const count = document.getElementById('mine-count');\n      if (!me) { table.classList.add('hidden'); count.textContent = ''; return; }\n      table.classList.remove('hidden');\n      count.textContent = d.length ? '(' + d.length + ')' : '';\n      body.innerHTML = d.length ? d.map(l => {\n        const short = window.location.origin + '/' + l.id;\n        const isText = l.kind === 'text';\n        const isFile = l.kind === 'file';\n        let host = isText ? '📄 ' + (l.text || '').slice(0, 42) : (isFile ? '📁 ' + (l.name || 'file') : l.url);\n        try { if (!isText && !isFile) host = new URL(l.url).hostname; } catch (e) {}\n        return `\n          <tr class=\"border-b border-slate-100 hover:bg-slate-50\">\n            <td data-label=\"Link\" class=\"py-2.5 pr-4\"><a href=\"${esc(short)}\" target=\"_blank\" rel=\"noopener\" class=\"row-link font-mono text-xs font-semibold text-teal-700 hover:underline\">/${esc(l.id)}</a></td>\n            <td data-label=\"Content\" class=\"max-w-[240px] truncate py-2.5 pr-4 text-xs text-slate-500\" title=\"${esc(isText ? (l.text || '') : (isFile ? (l.name || '') : l.url))}\">${esc(host)}</td>\n            <td data-label=\"Clicks\" class=\"py-2.5 pr-4 text-xs font-semibold text-slate-700\">${esc(l.clicks || 0)}</td>\n            <td data-label=\"Created\" class=\"py-2.5 pr-4 text-xs text-slate-500\">${esc(fmtDate(l.created))}</td>\n            <td data-label=\"\" class=\"py-2.5\"><button onclick=\"deleteMyLink('${escAttr(l.id)}', this)\" class=\"pill-btn danger rounded-md border border-red-200 px-2.5 py-1 text-[11px] font-semibold text-red-600\">Delete</button></td>\n          </tr>`;\n      }).join('') : '<tr><td colspan=\"5\" class=\"py-10 text-center\"><div class=\"mx-auto w-fit\"><div class=\"text-2xl\">🗂️</div><div class=\"mt-2 text-sm font-semibold text-slate-500\">No saved links</div><div class=\"mt-1 text-xs text-slate-400\">Shorten one while logged in and it appears here.</div></div></td></tr>';\n    }\n\n    async function loadMyLinks() {\n      if (!me) return;\n      const body = document.getElementById('mine-body');\n      const cached = myCache.data;\n      const fresh = Date.now() - myCache.at < CACHE_TTL;\n      if (cached && fresh) { renderMyLinks(cached); return; }\n      if (cached) renderMyLinks(cached);\n      else body.innerHTML = '<tr><td colspan=\"5\" class=\"py-6 text-center text-slate-400\">Loading…</td></tr>';\n      try {\n        const r = await fetch('/api/me/links');\n        const d = await r.json();\n        if (!Array.isArray(d)) throw new Error('bad');\n        myCache.at = Date.now();\n        myCache.data = d;\n        renderMyLinks(d);\n      } catch (e) {\n        if (!cached) body.innerHTML = '<tr><td colspan=\"5\" class=\"py-6 text-center text-slate-400\">Failed to load your links.</td></tr>';\n      }\n    }\n\n    async function deleteMyLink(id, btn) {\n      if (!me) return;\n      const done = () => {\n        btn.textContent = 'Deleted';\n        setTimeout(() => { btn.closest('tr').remove(); }, 400);\n        if (myCache.data) myCache.data = myCache.data.filter(l => l.id !== id);\n        if (linksCache.data) linksCache.data = linksCache.data.filter(l => l.id !== id);\n        loadMyLinks();\n        loadAnalytics();\n      };\n      try {\n        const r = await fetch('/api/me/links/' + id, { method: 'DELETE' });\n        if (r.ok) done(); else alert('Could not delete link.');\n      } catch (e) { alert('Network error.'); }\n    }\n\n    let activeTool = 'url';\n\n    function selectTool(tool) {\n      activeTool = tool;\n      document.getElementById('tool-panel-url').classList.toggle('hidden', tool !== 'url');\n      document.getElementById('tool-panel-text').classList.toggle('hidden', tool !== 'text');\n      document.getElementById('tool-panel-file').classList.toggle('hidden', tool !== 'file');\n      ['url', 'text', 'file'].forEach(t => {\n        document.getElementById('tool-' + t).classList.toggle('active', t === tool);\n      });\n    }\n\n    function showTextMsg(m) {\n      const el = document.getElementById('text-msg');\n      el.textContent = m;\n      el.classList.remove('hidden');\n    }\n\n    async function createTextLink() {\n      const ta = document.getElementById('text-input');\n      const text = ta.value;\n      showTextMsg('');\n      document.getElementById('text-msg').classList.add('hidden');\n      if (!text.trim()) { showTextMsg('Please paste some text.'); ta.focus(); return; }\n      const btn = document.getElementById('text-btn');\n      btn.disabled = true;\n      const old = btn.textContent;\n      btn.textContent = 'Creating…';\n      try {\n        const r = await fetch('/api/text', {\n          method: 'POST',\n          headers: { 'Content-Type': 'application/json' },\n          body: JSON.stringify({ text })\n        });\n        const d = await r.json();\n        if (!d.id) { showTextMsg(d.error || 'Something went wrong. Please try again.'); return; }\n        lastShort = window.location.origin + '/' + d.id;\n        const link = document.getElementById('short-link');\n        link.textContent = lastShort;\n        link.href = lastShort;\n        document.getElementById('open-link').href = lastShort;\n        document.getElementById('result').classList.remove('hidden');\n        showQr(lastShort);\n        ta.value = '';\n        document.getElementById('text-count').textContent = '0 / 100,000';\n        const pseudo = { id: d.id, kind: 'text', text, clicks: 0, created: new Date().toISOString() };\n        linksCache.at = 0;\n        linksCache.data = [pseudo].concat(linksCache.data || []).slice(0, 25);\n        myCache.at = 0;\n        myCache.data = [pseudo].concat(myCache.data || []).slice(0, 200);\n        loadAnalytics();\n        loadMyLinks();\n        document.getElementById('result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });\n      } catch (e) {\n        showTextMsg('Network error. Please try again.');\n      } finally {\n        btn.disabled = false;\n        btn.textContent = old;\n      }\n    }\n\n    let pickedFile = null;\n\n    function onFilePick(input) {\n      pickedFile = input.files && input.files[0] || null;\n      const ico = document.getElementById('file-ico');\n      const name = document.getElementById('file-name');\n      const meta = document.getElementById('file-meta');\n      const size = document.getElementById('file-size');\n      document.getElementById('file-msg').classList.add('hidden');\n      if (!pickedFile) {\n        ico.textContent = '📁'; name.textContent = 'Tap to choose a file'; meta.textContent = 'Up to 100 MB · any type'; size.textContent = '';\n        return;\n      }\n      if (pickedFile.size > 104857600) {\n        ico.textContent = '⛔'; name.textContent = pickedFile.name; meta.textContent = 'Too large — max 100 MB'; size.textContent = '';\n        return;\n      }\n      ico.textContent = '📄';\n      name.textContent = pickedFile.name;\n      meta.textContent = 'Ready to upload';\n      size.textContent = fmtSize(pickedFile.size);\n    }\n\n    function fmtSize(n) {\n      if (n < 1024) return n + ' B';\n      if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';\n      return (n / 1048576).toFixed(2) + ' MB';\n    }\n\n    function showFileMsg(m) {\n      const el = document.getElementById('file-msg');\n      el.textContent = m;\n      el.classList.remove('hidden');\n    }\n\n    async function createFileLink() {\n      const f = pickedFile;\n      document.getElementById('file-msg').classList.add('hidden');\n      if (!f) { showFileMsg('Please choose a file first.'); return; }\n      if (f.size > 104857600) { showFileMsg('File is too large — maximum 100 MB.'); return; }\n      const btn = document.getElementById('file-btn');\n      btn.disabled = true;\n      const old = btn.textContent;\n      btn.textContent = 'Uploading…';\n      try {\n        const r = await fetch('/api/file', {\n          method: 'POST',\n          headers: { 'X-File-Name': encodeURIComponent(f.name) },\n          body: f\n        });\n        const d = await r.json();\n        if (!d.id) { showFileMsg(d.error || 'Something went wrong. Please try again.'); return; }\n        lastShort = window.location.origin + '/' + d.id;\n        const link = document.getElementById('short-link');\n        link.textContent = lastShort;\n        link.href = lastShort;\n        document.getElementById('open-link').href = lastShort;\n        document.getElementById('result').classList.remove('hidden');\n        showQr(lastShort);\n        const pseudo = { id: d.id, kind: 'file', name: f.name, size: f.size, type: f.type, clicks: 0, created: new Date().toISOString() };\n        linksCache.at = 0;\n        linksCache.data = [pseudo].concat(linksCache.data || []).slice(0, 25);\n        myCache.at = 0;\n        myCache.data = [pseudo].concat(myCache.data || []).slice(0, 200);\n        loadAnalytics();\n        loadMyLinks();\n        pickedFile = null;\n        const input = document.getElementById('file-input');\n        input.value = '';\n        onFilePick(input);\n        document.getElementById('result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });\n      } catch (e) {\n        showFileMsg('Network error. Please try again.');\n      } finally {\n        btn.disabled = false;\n        btn.textContent = old;\n      }\n    }\n\n    async function shortenUrl() {\n      const input = document.getElementById('url');\n      const url = input.value.trim();      document.getElementById('form-msg').classList.add('hidden');\n      if (!url) { msg('Please enter a URL.'); input.focus(); return; }\n      try {\n        const r = await fetch('/api/shorten', {\n          method: 'POST',\n          headers: { 'Content-Type': 'application/json' },\n          body: JSON.stringify({ url })\n        });\n        const d = await r.json();\n        if (!d.id) { msg(d.error || 'Something went wrong. Please try again.'); return; }\n        lastShort = window.location.origin + '/' + d.id;\n        const link = document.getElementById('short-link');\n        link.textContent = lastShort;\n        link.href = lastShort;\n        document.getElementById('open-link').href = lastShort;\n        document.getElementById('result').classList.remove('hidden');\n        showQr(lastShort);\n        input.value = '';\n        const normalized = /^https?:\\/\\//i.test(url) ? url : 'https://' + url;\n        const pseudo = { id: d.id, url: normalized, clicks: 0, created: new Date().toISOString() };\n        linksCache.at = 0;\n        linksCache.data = [pseudo].concat(linksCache.data || []).slice(0, 25);\n        myCache.at = 0;\n        myCache.data = [pseudo].concat(myCache.data || []).slice(0, 200);\n        loadAnalytics();\n        loadMyLinks();\n        document.getElementById('result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });\n      } catch (e) {\n        msg('Network error. Please try again.');\n      }\n    }\n\n    function showQr(text) {\n      const box = document.getElementById('qr-box');\n      box.innerHTML = '<span class=\"text-xs text-slate-400\">Generating…</span>';\n      try {\n        if (typeof qrcode !== 'function') throw new Error('no lib');\n        const q = qrcode(0, 'M');\n        q.addData(text);\n        q.make();\n        const img = document.createElement('img');\n        img.src = q.createDataURL(8, 4);\n        img.alt = 'QR code for ' + text;\n        img.className = 'h-32 w-32';\n        box.innerHTML = '';\n        box.appendChild(img);\n      } catch (e) {\n        box.innerHTML = '<span class=\"text-xs text-slate-400\">QR unavailable — check your connection.</span>';\n      }\n    }\n\n    function copyShort() {\n      if (!lastShort) return;\n      const btn = document.getElementById('copy-btn');\n      const done = () => {\n        btn.textContent = 'Copied!';\n        btn.classList.add('bg-emerald-600');\n        setTimeout(() => { btn.textContent = 'Copy Link'; btn.classList.remove('bg-emerald-600'); }, 2000);\n      };\n      if (navigator.clipboard && window.isSecureContext) {\n        navigator.clipboard.writeText(lastShort).then(done).catch(() => fallbackCopy(lastShort, done));\n      } else {\n        fallbackCopy(lastShort, done);\n      }\n    }\n\n    function fallbackCopy(text, done) {\n      const ta = document.createElement('textarea');\n      ta.value = text;\n      ta.style.position = 'fixed';\n      ta.style.opacity = '0';\n      document.body.appendChild(ta);\n      ta.select();\n      try { document.execCommand('copy'); done(); } catch (e) {}\n      document.body.removeChild(ta);\n    }\n\n    function shareShort() {\n      if (!lastShort) return;\n      const data = { title: 'Check this out', text: 'Shortened with LinkShort', url: lastShort };\n      if (navigator.share) {\n        navigator.share(data).catch(() => {});\n      } else if (navigator.clipboard && window.isSecureContext) {\n        navigator.clipboard.writeText(lastShort).then(() => alert('Link copied to clipboard.'));\n      } else {\n        fallbackCopy(lastShort, () => alert('Link copied to clipboard.'));\n      }\n    }\n\n    function fmtDate(iso) {\n      try {\n        const d = new Date(iso);\n        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });\n      } catch (e) { return ''; }\n    }\n\n    function renderAnalytics(d) {\n      const body = document.getElementById('analytics-body');\n      document.getElementById('stat-total').textContent = d.length;\n      document.getElementById('stat-clicks').textContent = d.reduce((s, l) => s + (l.clicks || 0), 0);\n      body.innerHTML = d.length ? d.map(l => {\n        const short = window.location.origin + '/' + l.id;\n        const isText = l.kind === 'text';\n        const isFile = l.kind === 'file';\n        let host = isText ? '📄 ' + (l.text || '').slice(0, 42) : (isFile ? '📁 ' + (l.name || 'file') : l.url);\n        try { if (!isText && !isFile) host = new URL(l.url).hostname; } catch (e) {}\n        return `\n          <tr class=\"border-b border-slate-100 hover:bg-slate-50\">\n            <td data-label=\"Link\" class=\"py-2.5 pr-4\"><a href=\"${esc(short)}\" target=\"_blank\" rel=\"noopener\" class=\"row-link font-mono text-xs font-semibold text-teal-700 hover:underline\">/${esc(l.id)}</a></td>\n            <td data-label=\"Content\" class=\"max-w-[240px] truncate py-2.5 pr-4 text-xs text-slate-500\" title=\"${esc(isText ? (l.text || '') : (isFile ? (l.name || '') : l.url))}\">${esc(host)}</td>\n            <td data-label=\"Clicks\" class=\"py-2.5 pr-4 text-xs font-semibold text-slate-700\">${esc(l.clicks || 0)}</td>\n            <td data-label=\"Created\" class=\"py-2.5 pr-4 text-xs text-slate-500\">${esc(fmtDate(l.created))}</td>\n            <td data-label=\"\" class=\"py-2.5\"><button onclick=\"copyRow('${escAttr(short)}', this)\" class=\"pill-btn rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600\">Copy</button></td>\n          </tr>`;\n      }).join('') : '<tr><td colspan=\"5\" class=\"py-10 text-center\"><div class=\"mx-auto w-fit\"><div class=\"text-2xl\">🔗</div><div class=\"mt-2 text-sm font-semibold text-slate-500\">No links yet</div><div class=\"mt-1 text-xs text-slate-400\">Shorten your first link above and it appears here.</div></div></td></tr>';\n    }\n\n    async function loadAnalytics() {\n      if (!me) return;\n      const body = document.getElementById('analytics-body');\n      const cached = linksCache.data;\n      const fresh = Date.now() - linksCache.at < CACHE_TTL;\n      if (cached && fresh) { renderAnalytics(cached); return; }\n      if (cached) renderAnalytics(cached);\n      else body.innerHTML = '<tr><td colspan=\"5\" class=\"py-6 text-center text-slate-400\">Loading analytics…</td></tr>';\n      try {\n        const r = await fetch('/api/links');\n        const d = await r.json();\n        if (!Array.isArray(d)) throw new Error('bad');\n        linksCache.at = Date.now();\n        linksCache.data = d;\n        renderAnalytics(d);\n      } catch (e) {\n        if (!cached) body.innerHTML = '<tr><td colspan=\"5\" class=\"py-6 text-center text-slate-400\">Failed to load analytics.</td></tr>';\n      }\n    }\n\n    function copyRow(text, btn) {\n      const done = () => {\n        btn.textContent = 'Copied';\n        setTimeout(() => { btn.textContent = 'Copy'; }, 1800);\n      };\n      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));\n      else fallbackCopy(text, done);\n    }\n\n    document.getElementById('url').addEventListener('keydown', e => { if (e.key === 'Enter') shortenUrl(); });\n    const textInput = document.getElementById('text-input');\n    textInput.addEventListener('input', () => {\n      document.getElementById('text-count').textContent = textInput.value.length + ' / 100,000';\n    });\n    textInput.addEventListener('keydown', e => {\n      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) createTextLink();\n    });\n    const hdr = document.querySelector('header.sticky');\n    if (hdr) {\n      const onScroll = () => hdr.classList.toggle('scrolled', window.scrollY > 8);\n      onScroll();\n      window.addEventListener('scroll', onScroll, { passive: true });\n    }\n    document.addEventListener('DOMContentLoaded', async () => {\n      await loadMe();\n      loadAnalytics();\n      loadMyLinks();\n    });\n  </script>\n</body>\n</html>\n"},{"path":"/og-image.png","type":"image/png","cache":"public, max-age=86400","b64":"iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAIAAAB7GkOtAAANCElEQVR42u3Vx3EYMBDAQDUgHmXlHBxk99+gy8CDO4MasBeX605hS2mjtK20CwsGAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAAAAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAAAAABAAACAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAAgAAACAAAEAAAIAAcB4Ac6+wpbRR2lYaAAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAAAAABAAACAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAAAQBYMAAAIAAAQAAAgAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAAAAABAACyYAAAQAAAgABwIAD7QWFLaaO0rTQAAAAAAgAABAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAAAAABAAACAAAEAAAIAAAQAAAgAABAAACALBgAABAAACAAAEAAAIAAAAABAAACAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAGTBADgbgKtHhS2ljdK20gAAAAAIAAAQAAAgAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAAAAABAACyYAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAAAAABAAACAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAAgAABAAACAAAkAUDAAACAAAEgAMB+PGksKW0UdpWGgAAAAABAAACAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAWDAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAAAAABAAACAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAsmAAnA3A9bPCltJGaVtpAAAAAAQAAAgAABAAACAAAEAAAIAAAAABAAACAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAAAQAAAgAAAAFkwAAAgAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAAAAABAAACAAAEAADIggEAAAEAAALAgQDcvChsKW2UtpUGAAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAAAAABAAACAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAAgAABAAACAAAkAUDAAACAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAsGAAAEAAAIAAcCMDtq8KW0kZpW2kAAAAABAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAAAAABAAACAAAEAAAIAAAQAAAgAABAAACAAAAAWTAAACAAAEAAAIAAAAABAAACAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAAQAAMiCAXA2AHdvCltKG6VtpQEAAAAQAAAgAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAAAAABAAACAABkwQAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAAAAABAAACAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAsGAAAEAAAIAAcCcP+usKW0UdpWGgAAAAABAAACAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAWDAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAAAAABAAACAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAsmAAnA3Aw4fCltJGaVtpAAAAAAQAAAgAABAAACAAAEAAAIAAAAABAAACAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAAAQAAAgAAAAFkwAAAgAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAAAAABAAACAAAEAADIggEAAAEAAALAgQA8fipsKW2UtpUGAAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAAAAABAAACAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAAgAABAAACAAAkAUDAAACAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAsGAAAEAAAIAAcCMDTl8KW0kZpW2kAAAAABAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAAAAABAAACAAAEAAAIAAAQAAAgAABAAACAAAAAWTAAACAAAEAAAIAAAAABAAACAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAAQAAMiCAXA2AM8/FbaUNkrbSgMAAAAgAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAAAAABAAACAAAEAADIggEAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAAAAABAAACAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAAAQBYMAAAIAAAQAA4E4OWXwpbSRmlbaQAAAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAAAABZMAAAIAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAAAAABAAACAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAAgAABAAAyIIBcDYAr78VtpQ2SttKAwAAACAAAEAAAIAAAAABAAACAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAAQAAMiCAQAAAQAAAgAABAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAAAAABAAACAAAEAAAIAAAQAAAgAABAFgwAAAgAABAADgTg7Y/CltJGaVtpAAAAAAQAAAgAABAAACAAAEAAAIAAAAABAAACAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAAAQAAAgAAAAFkwAAAgAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAAAAABAAACAAAEAADIggEAAAEAAALAgQC8fytsKW2UtpUGAAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAAAAABAAACAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAAgAABAAACAAAkAUDAAACAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAsGABnA/DxV2FLaaO0rTQAAAAAAgAABAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAAAAABAAACAAAEAAAIAAAQAAAgAABAAACALBgAABAAACAAAEAAAIAAAAABAAACAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAGTBAACAAAAAAeBAAD7/KWwpbZS2lQYAAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAAAQAAAgAAAAAEAAAIAAAQAAAgAABAAACAAAEAAAIAAAAABAAACAAAEAAAIAACQBQMAAAIAAAQAAAgAABAAACAAAEAAAIAAAAABAAACAAAEAAAIAAAQAAAgAABAAACAAAAAAQAAAgAABAAACAAAEAAAIAAAQAAAgCwYACf3H7jo8Dw3y7zSAAAAAElFTkSuQmCC"},{"path":"/robots.txt","type":"text/plain; charset=utf-8","cache":"public, max-age=86400","content":"User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /dashboard.html\nDisallow: /step1.html\nDisallow: /step2.html\nDisallow: /step3.html\n\nSitemap: https://short.smp45.qzz.io/sitemap.xml\n"},{"path":"/safeads.js","type":"application/javascript","cache":"public, max-age=86400","content":"const SafeAds = {\n  V: 15,\n  directUrl: 'https://omg10.com/4/11468566',\n\n  ads: [\n    { emoji: '🎁', title: 'Win a Free Gift Card', desc: 'Claim yours now — thousands claim every day', cta: 'Claim Now', t: 0 },\n    { emoji: '💰', title: 'Exclusive Cash Rewards', desc: 'Simple tasks, real payouts today', cta: 'Claim', t: 1 },\n    { emoji: '📱', title: 'Hot New App', desc: 'Download free and play instantly', cta: 'Get It Free', t: 2 },\n    { emoji: '⚡', title: 'Speed Boost', desc: 'Optimize your device in one tap', cta: 'Optimize Now', t: 3 },\n    { emoji: '🎮', title: 'Game of the Year', desc: 'Join millions of players right now', cta: 'Play Now', t: 0 },\n    { emoji: '🤑', title: 'Earn Bonus Cash', desc: 'Limited time offer — tap to start', cta: 'Claim', t: 1 },\n    { emoji: '🍿', title: 'Watch Free & Win', desc: 'Exclusive previews plus instant prizes', cta: 'Watch Now', t: 2 },\n    { emoji: '✈️', title: '70% Off Travel Deals', desc: 'Insider deals that expire soon', cta: 'Book Deal', t: 3 },\n    { emoji: '🛒', title: 'Mega Shopping Sale', desc: 'Up to 90% off top brands', cta: 'Shop Sale', t: 0 },\n    { emoji: '🎧', title: 'Free Music App', desc: 'Stream everything for free', cta: 'Start Free', t: 1 },\n    { emoji: '🔋', title: 'Battery Saver Pro', desc: 'Double your battery life — free', cta: 'Boost Now', t: 2 },\n    { emoji: '🎰', title: 'Spin & Win', desc: 'Try your luck — instant prizes', cta: 'Spin Now', t: 3 },\n    { emoji: '📚', title: 'Free E-Book Library', desc: '1 million titles unlocked now', cta: 'Read Free', t: 0 },\n    { emoji: '🎨', title: 'Premium Filters', desc: 'Make your photos pop for free', cta: 'Try Free', t: 1 },\n    { emoji: '📷', title: 'AI Photo Editor', desc: 'Edit like a pro in seconds', cta: 'Edit Free', t: 2 },\n    { emoji: '🎵', title: 'Unlimited Music', desc: 'No ads, no limits — free trial', cta: 'Unlock', t: 3 },\n    { emoji: '🏆', title: 'Daily Prize Draw', desc: 'A new winner every hour', cta: 'Enter Now', t: 0 },\n    { emoji: '🧧', title: 'Surprise Bonus', desc: 'Open your reward right now', cta: 'Open Gift', t: 1 },\n    { emoji: '📺', title: 'Stream Free TV', desc: 'All your shows in one place', cta: 'Stream Free', t: 2 },\n    { emoji: '🍕', title: 'Free Delivery Code', desc: 'Save on your next order', cta: 'Get Code', t: 3 },\n    { emoji: '💳', title: 'Prepaid Card Offer', desc: 'Get yours in minutes', cta: 'Claim Card', t: 0 },\n    { emoji: '🔓', title: 'Unlock Premium', desc: 'Full features free for you', cta: 'Unlock', t: 1 },\n    { emoji: '😍', title: 'Your Lucky Day', desc: 'A special prize is waiting for you', cta: 'Reveal', t: 2 },\n    { emoji: '💎', title: 'VIP Rewards', desc: 'Free access for a limited time', cta: 'Join Free', t: 3 },\n    { emoji: '🧲', title: 'Try Your Fortune', desc: 'Swipe to reveal your prize', cta: 'Reveal', t: 0 },\n    { emoji: '☕', title: 'Free Coffee Month', desc: 'Members only — sign up free', cta: 'Get Free', t: 1 },\n    { emoji: '🎳', title: 'Arcade Night', desc: 'Play unlimited for free', cta: 'Play Free', t: 2 },\n    { emoji: '🧸', title: 'Plush Giveaway', desc: 'Win cute prizes today', cta: 'Enter', t: 3 },\n    { emoji: '🚗', title: 'Car Rental Deal', desc: 'Save up to 40% now', cta: 'Rent Now', t: 0 },\n    { emoji: '💍', title: 'Jewelry Flash Sale', desc: 'Gorgeous deals, low stock', cta: 'Shop Now', t: 1 },\n    { emoji: '🛋️', title: 'Home Upgrade Sale', desc: 'Furnish for less today', cta: 'Save Now', t: 2 },\n    { emoji: '🐶', title: 'Pet Lovers Offer', desc: 'Free treats for your pet', cta: 'Get Treats', t: 3 },\n    { emoji: '🛍️', title: 'Shopping Club', desc: 'Exclusive member prices today', cta: 'Join Free', t: 0 },\n    { emoji: '⚽', title: 'Live Sports App', desc: 'Stream every match for free', cta: 'Stream Now', t: 2 },\n    { emoji: '🧑‍🍳', title: 'Recipe Club', desc: 'Free gourmet recipes daily', cta: 'Get Recipes', t: 1 },\n    { emoji: '💆', title: 'Spa & Wellness Deals', desc: 'Relax for less — book now', cta: 'Book Now', t: 3 },\n    { emoji: '📉', title: 'Crypto Bonus', desc: 'Claim your trading bonus today', cta: 'Claim Bonus', t: 0 },\n    { emoji: '🎓', title: 'Course Giveaway', desc: 'Learn new skills free', cta: 'Start Free', t: 1 },\n    { emoji: '💊', title: 'Wellness Boost', desc: 'Feel great every single day', cta: 'Try Now', t: 2 },\n    { emoji: '🌴', title: 'Vacation Flash Sale', desc: 'Tropical trips at 60% off', cta: 'Book Trip', t: 3 }\n  ],\n\n  themes: [\n    ['#0d9488', '#0f766e', '#134e4a'],\n    ['#7c3aed', '#6d28d9', '#5b21b6'],\n    ['#ea580c', '#c2410c', '#9a3412'],\n    ['#0284c7', '#0369a1', '#075985']\n  ],\n\n  rotateMs: 6000,\n  tick: 0,\n  safeadPool: [],\n  directPool: [],\n  bannerPool: [],\n  countPool: [],\n\n  styles() {\n    return `\n      :root{\n        --sad-bg0:#ffffff;\n        --sad-bg1:#f1f5f9;\n        --sad-bg2:#f8fafc;\n        --sad-card:linear-gradient(180deg,#ffffff,#f8fafc);\n        --sad-sel:#f1f5f9;\n        --sad-text:#0f172a;\n        --sad-muted:#64748b;\n        --sad-note:#94a3b8;\n        --sad-border:rgba(15,23,42,.08);\n        --sad-acc-border:rgba(13,148,136,.16);\n        --sad-cta-bg:rgba(13,148,136,.1);\n        --sad-cta-text:#0f766e;\n        --sad-shadow:0 6px 18px rgba(15,23,42,.08);\n        --sad-direct-bg:linear-gradient(135deg,rgba(45,212,191,.10),rgba(251,191,36,.07));\n        --sad-direct-border:rgba(245,158,11,.28);\n        --sad-banner-bg:linear-gradient(135deg,rgba(45,212,191,.08),rgba(56,189,248,.06));\n        --sad-count-bg:linear-gradient(90deg,rgba(251,146,60,.13),rgba(251,191,36,.06));\n        --sad-count-border:rgba(245,158,11,.28);\n        --sad-timer-bg:rgba(15,23,42,.07);\n        --sad-amber:#d97706;\n        --sad-sticky-bg:linear-gradient(180deg,rgba(255,255,255,.98),rgba(248,250,252,.98));\n        --sad-modal-bg:linear-gradient(180deg,#ffffff,#f8fafc);\n        --sad-overlay:rgba(15,23,42,.5);\n      }\n      html[data-theme=\"dark\"]{\n        --sad-bg0:#151d1a;\n        --sad-bg1:#131a18;\n        --sad-bg2:#0f2a26;\n        --sad-card:linear-gradient(180deg,#151d1a,#131a18);\n        --sad-sel:#1b2623;\n        --sad-text:#e8f2ef;\n        --sad-muted:#7f9a93;\n        --sad-note:#4d625c;\n        --sad-border:rgba(45,212,191,.09);\n        --sad-acc-border:rgba(45,212,191,.12);\n        --sad-cta-bg:rgba(45,212,191,.12);\n        --sad-cta-text:#2dd4bf;\n        --sad-shadow:0 6px 18px rgba(0,0,0,.3);\n        --sad-direct-bg:linear-gradient(135deg,rgba(45,212,191,.14),rgba(251,191,36,.10));\n        --sad-direct-border:rgba(251,191,36,.28);\n        --sad-banner-bg:linear-gradient(135deg,rgba(45,212,191,.10),rgba(56,189,248,.08));\n        --sad-count-bg:linear-gradient(90deg,rgba(251,146,60,.16),rgba(251,191,36,.08));\n        --sad-count-border:rgba(251,146,60,.3);\n        --sad-timer-bg:rgba(0,0,0,.35);\n        --sad-amber:#fbbf24;\n        --sad-sticky-bg:linear-gradient(180deg,#151d1a,#101513);\n        --sad-modal-bg:linear-gradient(180deg,#161e1b,#121816);\n        --sad-overlay:rgba(5,8,7,.55);\n      }\n      @media (prefers-color-scheme: dark){\n        html:not([data-theme=\"light\"]){--sad-bg0:#151d1a;--sad-bg1:#131a18;--sad-bg2:#0f2a26;\n          --sad-card:linear-gradient(180deg,#151d1a,#131a18);--sad-sel:#1b2623;--sad-text:#e8f2ef;--sad-muted:#7f9a93;\n          --sad-note:#4d625c;--sad-border:rgba(45,212,191,.09);--sad-acc-border:rgba(45,212,191,.12);\n          --sad-cta-bg:rgba(45,212,191,.12);--sad-cta-text:#2dd4bf;--sad-shadow:0 6px 18px rgba(0,0,0,.3);\n          --sad-direct-bg:linear-gradient(135deg,rgba(45,212,191,.14),rgba(251,191,36,.10));\n          --sad-direct-border:rgba(251,191,36,.28);\n          --sad-banner-bg:linear-gradient(135deg,rgba(45,212,191,.10),rgba(56,189,248,.08));\n          --sad-count-bg:linear-gradient(90deg,rgba(251,146,60,.16),rgba(251,191,36,.08));\n          --sad-count-border:rgba(251,146,60,.3);--sad-timer-bg:rgba(0,0,0,.35);--sad-amber:#fbbf24;\n          --sad-sticky-bg:linear-gradient(180deg,#151d1a,#101513);\n          --sad-modal-bg:linear-gradient(180deg,#161e1b,#121816);--sad-overlay:rgba(5,8,7,.55)}\n      }\n      .safead{margin:10px 0}\n      .safead-card{display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--sad-card);\n        border:1px solid var(--sad-acc-border);border-radius:16px;padding:12px 14px;box-shadow:var(--sad-shadow);\n        transition:transform .15s ease,box-shadow .15s ease}\n      .safead-card:active{transform:scale(.985)}\n      .safead-emoji{font-size:26px;width:48px;height:48px;flex:0 0 48px;display:flex;align-items:center;justify-content:center;\n        background:var(--sad-sel);border:1px solid var(--sad-acc-border);border-radius:14px}\n      .safead-text{flex:1;min-width:0}\n      .safead-text strong{display:block;font-size:13.5px;color:var(--sad-text);line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n      .safead-text small{display:-webkit-box;font-size:11.5px;color:var(--sad-muted);line-height:1.3;margin-top:2px;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}\n      .safead-cta{flex:0 0 auto;font-size:12px;font-weight:700;color:var(--sad-cta-text);background:var(--sad-cta-bg);border-radius:999px;padding:6px 12px;white-space:nowrap}\n      .safead-note{display:block;text-align:center;font-size:9px;color:var(--sad-note);letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px}\n      .safe-badge{display:inline-flex;align-items:center;gap:5px;background:var(--sad-cta-bg);color:var(--sad-cta-text);border:1px solid var(--sad-acc-border);\n        font-size:11px;font-weight:700;padding:5px 12px;border-radius:999px}\n      .direct-ad{margin:12px 0}\n      .direct-card{display:flex;align-items:center;gap:14px;text-decoration:none;border-radius:16px;padding:14px 16px;\n        background:var(--sad-direct-bg);border:1px solid var(--sad-direct-border);box-shadow:var(--sad-shadow);transition:transform .15s ease}\n      .direct-card:active{transform:scale(.985)}\n      .direct-emoji{font-size:30px;width:54px;height:54px;flex:0 0 54px;display:flex;align-items:center;justify-content:center;\n        background:var(--sad-sel);border:1px solid var(--sad-direct-border);border-radius:14px}\n      .direct-text{flex:1;min-width:0}\n      .direct-text strong{display:block;font-size:14.5px;color:var(--sad-text);line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n      .direct-text small{display:-webkit-box;font-size:12px;color:var(--sad-muted);line-height:1.35;margin-top:3px;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}\n      .direct-cta{flex:0 0 auto;font-size:12.5px;font-weight:800;color:#1e293b;background:linear-gradient(135deg,#fbbf24,#2dd4bf);\n        border-radius:999px;padding:8px 14px;white-space:nowrap}\n      .ad-banner{margin:12px 0}\n      .banner-card{display:flex;align-items:center;gap:12px;text-decoration:none;border-radius:16px;padding:14px 16px;\n        border:1px solid var(--sad-acc-border);background:var(--sad-banner-bg);box-shadow:var(--sad-shadow);transition:transform .15s ease}\n      .banner-card:active{transform:scale(.985)}\n      .banner-emoji{font-size:34px;flex:0 0 auto}\n      .banner-text{flex:1;min-width:0}\n      .banner-text strong{display:block;color:var(--sad-text);font-size:14.5px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n      .banner-text small{display:-webkit-box;color:var(--sad-muted);font-size:12px;margin-top:2px;line-height:1.35;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}\n      .banner-cta{flex:0 0 auto;font-size:12.5px;font-weight:800;color:#1e293b;background:linear-gradient(135deg,#fbbf24,#2dd4bf);\n        border-radius:999px;padding:9px 16px;white-space:nowrap}\n      .ad-duo{margin:12px 0}\n      .duo-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}\n      .duo-card{display:flex;flex-direction:column;align-items:center;gap:6px;text-decoration:none;background:var(--sad-card);\n        border:1px solid var(--sad-acc-border);border-radius:14px;padding:12px 8px;text-align:center;box-shadow:var(--sad-shadow)}\n      .duo-emoji{font-size:26px}\n      .duo-text{min-width:0;width:100%}\n      .duo-text strong{display:-webkit-box;color:var(--sad-text);font-size:12.5px;line-height:1.25;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}\n      .duo-cta{font-size:11px;font-weight:800;color:var(--sad-cta-text)}\n      .ad-count{margin:12px 0}\n      .count-card{display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--sad-count-bg);\n        border:1px solid var(--sad-count-border);border-radius:14px;padding:11px 14px;box-shadow:var(--sad-shadow)}\n      .count-fire{font-size:22px;flex:0 0 auto}\n      .count-text{flex:1;min-width:0}\n      .count-text strong{display:block;color:var(--sad-text);font-size:13px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n      .count-text small{display:block;color:var(--sad-amber);font-size:11px;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n      .count-time{flex:0 0 auto;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;font-weight:800;color:var(--sad-amber);\n        background:var(--sad-timer-bg);padding:6px 8px;border-radius:8px}\n      .count-cta{flex:0 0 auto;font-size:11.5px;font-weight:800;color:#1e293b;background:linear-gradient(135deg,#fbbf24,#fb923c);padding:7px 11px;border-radius:999px}\n      .safead,.direct-ad,.ad-banner,.ad-duo,.ad-count{contain:content;content-visibility:auto;transition:opacity .2s ease;\n        touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none}\n      .safead{contain-intrinsic-size:auto 88px}\n      .safead.mini{contain-intrinsic-size:auto 62px}\n      .direct-ad{contain-intrinsic-size:auto 98px}\n      .ad-banner{contain-intrinsic-size:auto 86px}\n      .ad-duo{contain-intrinsic-size:auto 132px}\n      .ad-count{contain-intrinsic-size:auto 66px}\n      .sticky-bar{position:fixed;left:0;right:0;bottom:0;z-index:9000;background:var(--sad-sticky-bg);\n        border-top:1px solid rgba(245,158,11,.35);padding:8px 10px;padding-bottom:calc(8px + env(safe-area-inset-bottom));\n        box-shadow:0 -6px 20px var(--sad-shadow);display:flex;align-items:center;gap:10px;transform:translateY(102%);\n        transition:transform .35s cubic-bezier(.22,1,.36,1)}\n      .sticky-bar.in{transform:translateY(0)}\n      .sticky-bar a{display:flex;align-items:center;gap:10px;flex:1;text-decoration:none;min-width:0;touch-action:manipulation;-webkit-tap-highlight-color:transparent}\n      .sticky-emoji{font-size:22px;flex:0 0 auto}\n      .sticky-text{flex:1;min-width:0}\n      .sticky-text strong{display:block;color:var(--sad-text);font-size:13px}\n      .sticky-text small{display:block;color:var(--sad-muted);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n      .sticky-cta{flex:0 0 auto;font-size:12px;font-weight:800;color:#1e293b;background:linear-gradient(135deg,#fbbf24,#2dd4bf);\n        padding:8px 12px;border-radius:999px;animation:pulseCta 1.8s ease-in-out infinite}\n      .sticky-close{flex:0 0 auto;background:none;border:none;color:var(--sad-note);font-size:14px;cursor:pointer;padding:4px 6px}\n      .ad-modal{position:fixed;z-index:9500;bottom:calc(82px + env(safe-area-inset-bottom));left:12px;right:12px;\n        max-width:352px;margin:0 auto;pointer-events:none;opacity:0;visibility:hidden;\n        transform:translateY(16px) scale(.97);transition:opacity .3s ease,transform .3s ease,visibility .3s}\n      @media (min-width:520px){.ad-modal{left:auto;right:20px;margin:0}}\n      .ad-modal.show{opacity:1;visibility:visible;transform:none;pointer-events:auto}\n      .ad-modal-card{position:relative;display:flex;align-items:center;gap:8px;background:var(--sad-modal-bg);\n        border:1px solid rgba(245,158,11,.32);border-radius:16px;padding:10px 10px 10px 12px;\n        box-shadow:0 16px 40px -14px rgba(15,23,42,.38)}\n      .ad-modal-link{flex:1;min-width:0;display:flex;align-items:center;gap:10px;text-decoration:none;touch-action:manipulation}\n      .ad-modal-x{flex:0 0 auto;background:none;border:none;color:var(--sad-note);font-size:13px;cursor:pointer;padding:6px;align-self:flex-start}\n      .ad-modal-emoji{font-size:24px;flex:0 0 auto}\n      .ad-modal-body{flex:1;min-width:0}\n      .ad-modal-title{display:block;color:var(--sad-text);font-size:13px;font-weight:800;line-height:1.25}\n      .ad-modal-desc{display:block;color:var(--sad-muted);font-size:11px;line-height:1.3;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n      .ad-modal-btn{flex:0 0 auto;font-size:12px;font-weight:800;color:#1e293b;background:linear-gradient(135deg,#fbbf24,#2dd4bf);\n        border-radius:999px;padding:8px 12px;animation:pulseCta 1.8s ease-in-out infinite;touch-action:manipulation}\n      @keyframes pulseCta{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}\n      @media (max-width:360px){.duo-grid{grid-template-columns:1fr}}\n      @media (prefers-reduced-motion: reduce){\n        .safead,.direct-ad,.ad-banner,.ad-duo,.ad-count,.sticky-bar,.ad-modal-card,.sticky-cta,.ad-modal-btn{\n          transition:none!important;animation:none!important}\n      }\n    `;\n  },\n\n  theme(t) {\n    const th = this.themes[t % this.themes.length];\n    return { accent: th[0], from: th[1], to: th[2] };\n  },\n\n  slotAt(pool, i, stride, offset) {\n    return pool[(i * stride + offset + this.tick) % pool.length];\n  },\n\n  buildSafead(ad) {\n    const th = this.theme(ad.t);\n    return `\n      <span class=\"safead-note\">Sponsored</span>\n      <a class=\"safead-card\" href=\"${this.directUrl}\" target=\"_blank\" rel=\"sponsored nofollow noopener noreferrer\" style=\"border-color:${th.accent}33\">\n        <span class=\"safead-emoji\" style=\"border-color:${th.accent}44\">${ad.emoji}</span>\n        <span class=\"safead-text\"><strong>${ad.title}</strong><small>${ad.desc}</small></span>\n        <span class=\"safead-cta\" style=\"color:${th.accent};background:${th.accent}1a\">${ad.cta} →</span>\n      </a>`;\n  },\n\n  buildDirect(ad) {\n    const th = this.theme(ad.t);\n    return `\n      <span class=\"safead-note\">Sponsored</span>\n      <a class=\"direct-card\" href=\"${this.directUrl}\" target=\"_blank\" rel=\"sponsored nofollow noopener noreferrer\" style=\"border-color:${th.accent}55\">\n        <span class=\"direct-emoji\" style=\"border-color:${th.accent}44\">${ad.emoji}</span>\n        <span class=\"direct-text\"><strong>${ad.title}</strong><small>${ad.desc}</small></span>\n        <span class=\"direct-cta\">${ad.cta.toUpperCase()}</span>\n      </a>`;\n  },\n\n  buildBanner(ad) {\n    return `\n      <a class=\"banner-card\" href=\"${this.directUrl}\" target=\"_blank\" rel=\"sponsored nofollow noopener noreferrer\">\n        <span class=\"banner-emoji\">${ad.emoji}</span>\n        <span class=\"banner-text\"><strong>${ad.title}</strong><small>${ad.desc}</small></span>\n        <span class=\"banner-cta\">${ad.cta.toUpperCase()}</span>\n      </a>`;\n  },\n\n  buildCount(ad) {\n    const mins = 9 - (this.tick % 10);\n    const secs = 59 - ((this.tick * 7) % 60);\n    const mm = String(mins).padStart(2, '0');\n    const ss = String(secs).padStart(2, '0');\n    return `\n      <span class=\"safead-note\">Sponsored</span>\n      <a class=\"count-card\" href=\"${this.directUrl}\" target=\"_blank\" rel=\"sponsored nofollow noopener noreferrer\">\n        <span class=\"count-fire\">🔥</span>\n        <span class=\"count-text\"><strong>${ad.title}</strong><small>${ad.desc}</small></span>\n        <span class=\"count-time\">${mm}:${ss}</span>\n        <span class=\"count-cta\">${ad.cta.toUpperCase()}</span>\n      </a>`;\n  },\n\n  buildDuo(a, b) {\n    const card = (ad, accent) => `\n      <a class=\"duo-card\" href=\"${this.directUrl}\" target=\"_blank\" rel=\"sponsored nofollow noopener noreferrer\" style=\"border-color:${accent}44\">\n        <span class=\"duo-emoji\">${ad.emoji}</span>\n        <span class=\"duo-text\"><strong>${ad.title}</strong></span>\n        <span class=\"duo-cta\" style=\"color:${accent}\">GO →</span>\n      </a>`;\n    return `<span class=\"safead-note\">Sponsored</span><div class=\"duo-grid\">${card(a, this.theme(a.t).accent)}${card(b, this.theme(b.t).accent)}</div>`;\n  },\n\n  prepare() {\n    this.tick = Math.floor(Date.now() / this.rotateMs);\n    this.safeadPool = this.ads.map(a => this.buildSafead(a));\n    this.directPool = this.ads.map(a => this.buildDirect(a));\n    this.bannerPool = this.ads.map(a => this.buildBanner(a));\n    this.countPool = this.ads.map(a => this.buildCount(a));\n  },\n\n  swap(slot, html) {\n    if (!html || slot.innerHTML === html) return;\n    slot.style.opacity = '0';\n    setTimeout(() => {\n      slot.innerHTML = html;\n      slot.style.opacity = '1';\n    }, 180);\n  },\n\n  fillAll(initial) {\n    const set = initial\n      ? (slot, html) => { slot.innerHTML = html; }\n      : (slot, html) => this.swap(slot, html);\n\n    document.querySelectorAll('.safead').forEach((slot, i) => set(slot, this.slotAt(this.safeadPool, i, 1, 0)));\n    document.querySelectorAll('.direct-ad').forEach((slot, i) => set(slot, this.slotAt(this.directPool, i, 2, 5)));\n    document.querySelectorAll('.ad-banner').forEach((slot, i) => set(slot, this.slotAt(this.bannerPool, i, 3, 3)));\n    document.querySelectorAll('.ad-duo').forEach((slot, i) => {\n      set(slot, this.buildDuo(this.slotAt(this.ads, i * 2, 1, 7), this.slotAt(this.ads, i * 2 + 1, 1, 11)));\n    });\n    document.querySelectorAll('.ad-count').forEach((slot, i) => set(slot, this.buildCount(this.slotAt(this.ads, i, 1, 2))));\n  },\n\n  isAuthed() {\n    return !document.body.classList.contains('signed-out');\n  },\n\n  renderSticky() {\n    const bar = document.getElementById('sticky-bar');\n    if (!bar || !this.isAuthed()) return;\n    const ad = this.ads[(10 + this.tick) % this.ads.length];\n    bar.innerHTML = `\n      <a href=\"${this.directUrl}\" target=\"_blank\" rel=\"sponsored nofollow noopener noreferrer\">\n        <span class=\"sticky-emoji\">${ad.emoji}</span>\n        <span class=\"sticky-text\"><strong>${ad.title}</strong><small>${ad.desc}</small></span>\n        <span class=\"sticky-cta\">${ad.cta.toUpperCase()}</span>\n      </a>\n      <button class=\"sticky-close\" onclick=\"this.parentNode.remove()\" aria-label=\"Close ad\">✕</button>`;\n    document.body.style.paddingBottom = 'calc(64px + env(safe-area-inset-bottom))';\n    requestAnimationFrame(() => bar.classList.add('in'));\n  },\n\n  showModal() {\n    const modal = document.getElementById('ad-modal');\n    if (!modal || !this.isAuthed()) return;\n    try {\n      if (sessionStorage.getItem('ls-modal')) return;\n      sessionStorage.setItem('ls-modal', '1');\n    } catch (e) {}\n    const ad = this.ads[(7 + this.tick) % this.ads.length];\n    modal.innerHTML = `\n      <div class=\"ad-modal-card\">\n        <a class=\"ad-modal-link\" href=\"${this.directUrl}\" target=\"_blank\" rel=\"sponsored nofollow noopener noreferrer\">\n          <span class=\"ad-modal-emoji\">${ad.emoji}</span>\n          <span class=\"ad-modal-body\">\n            <span class=\"ad-modal-title\">${ad.title}</span>\n            <span class=\"ad-modal-desc\">${ad.desc}</span>\n          </span>\n          <span class=\"ad-modal-btn\">${ad.cta.toUpperCase()}</span>\n        </a>\n        <button class=\"ad-modal-x\" onclick=\"SafeAds.hideModal()\" aria-label=\"Close ad\">✕</button>\n      </div>`;\n    modal.classList.add('show');\n    clearTimeout(this._modalTimer);\n    this._modalTimer = setTimeout(() => this.hideModal(), 9000);\n  },\n\n  hideModal() {\n    const m = document.getElementById('ad-modal');\n    if (!m) return;\n    m.classList.remove('show');\n    clearTimeout(this._modalTimer);\n    setTimeout(() => { if (!m.classList.contains('show')) m.innerHTML = ''; }, 320);\n  },\n\n  init() {\n    const style = document.createElement('style');\n    style.textContent = this.styles();\n    document.head.appendChild(style);\n\n    this.prepare();\n    this.fillAll(true);\n    this.renderSticky();\n\n    setInterval(() => {\n      this.tick++;\n      this.fillAll(false);\n    }, this.rotateMs);\n\n    setTimeout(() => this.showModal(), 3000);\n  },\n\n  reinit() {\n    this.renderSticky();\n    setTimeout(() => this.showModal(), 3000);\n  }\n};\n\nwindow.SafeAds = SafeAds;\n\ndocument.addEventListener('DOMContentLoaded', () => SafeAds.init());\n"},{"path":"/sitemap.xml","type":"application/xml","cache":"public, max-age=86400","content":"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n  <url>\n    <loc>https://short.smp45.qzz.io/</loc>\n    <lastmod>2026-08-16</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n"},{"path":"/tailwind.min.css","type":"text/css","cache":"public, max-age=86400","content":"*,:after,:before{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(59,130,246,.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(59,130,246,.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }/*! tailwindcss v3.4.17 | MIT License | https://tailwindcss.com*/*,:after,:before{box-sizing:border-box;border:0 solid #e5e7eb}:after,:before{--tw-content:\"\"}:host,html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;font-feature-settings:normal;font-variation-settings:normal;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}button,input:where([type=button]),input:where([type=reset]),input:where([type=submit]){-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0}fieldset,legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::-moz-placeholder,textarea::-moz-placeholder{opacity:1;color:#9ca3af}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]:where(:not([hidden=until-found])){display:none}.fixed{position:fixed}.sticky{position:sticky}.top-0{top:0}.z-40{z-index:40}.mx-auto{margin-left:auto;margin-right:auto}.mt-1{margin-top:.25rem}.mt-12{margin-top:3rem}.mt-16{margin-top:4rem}.mt-2{margin-top:.5rem}.mt-3{margin-top:.75rem}.mt-4{margin-top:1rem}.mt-6{margin-top:1.5rem}.block{display:block}.flex{display:flex}.inline-flex{display:inline-flex}.table{display:table}.grid{display:grid}.contents{display:contents}.hidden{display:none}.h-11{height:2.75rem}.h-32{height:8rem}.h-36{height:9rem}.h-8{height:2rem}.h-9{height:2.25rem}.w-11{width:2.75rem}.w-32{width:8rem}.w-36{width:9rem}.w-8{width:2rem}.w-9{width:2.25rem}.w-full{width:100%}.min-w-\\[560px\\]{min-width:560px}.max-w-2xl{max-width:42rem}.max-w-5xl{max-width:64rem}.max-w-\\[240px\\]{max-width:240px}.max-w-xl{max-width:36rem}.max-w-xs{max-width:20rem}.flex-1{flex:1 1 0%}.grow{flex-grow:1}.cursor-pointer{cursor:pointer}.scroll-mt-24{scroll-margin-top:6rem}.flex-col{flex-direction:column}.flex-wrap{flex-wrap:wrap}.items-end{align-items:flex-end}.items-center{align-items:center}.justify-center{justify-content:center}.justify-between{justify-content:space-between}.gap-1\\.5{gap:.375rem}.gap-2{gap:.5rem}.gap-3{gap:.75rem}.gap-4{gap:1rem}.gap-6{gap:1.5rem}.gap-8{gap:2rem}.space-y-2>:not([hidden])~:not([hidden]){--tw-space-y-reverse:0;margin-top:calc(.5rem*(1 - var(--tw-space-y-reverse)));margin-bottom:calc(.5rem*var(--tw-space-y-reverse))}.space-y-3>:not([hidden])~:not([hidden]){--tw-space-y-reverse:0;margin-top:calc(.75rem*(1 - var(--tw-space-y-reverse)));margin-bottom:calc(.75rem*var(--tw-space-y-reverse))}.overflow-x-auto{overflow-x:auto}.truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.break-all{word-break:break-all}.rounded-2xl{border-radius:1rem}.rounded-full{border-radius:9999px}.rounded-lg{border-radius:.5rem}.rounded-md{border-radius:.375rem}.rounded-xl{border-radius:.75rem}.border{border-width:1px}.border-b{border-bottom-width:1px}.border-t{border-top-width:1px}.border-slate-100{--tw-border-opacity:1;border-color:rgb(241 245 249/var(--tw-border-opacity,1))}.border-slate-200{--tw-border-opacity:1;border-color:rgb(226 232 240/var(--tw-border-opacity,1))}.border-slate-300{--tw-border-opacity:1;border-color:rgb(203 213 225/var(--tw-border-opacity,1))}.border-teal-200{--tw-border-opacity:1;border-color:rgb(153 246 228/var(--tw-border-opacity,1))}.border-teal-300{--tw-border-opacity:1;border-color:rgb(94 234 212/var(--tw-border-opacity,1))}.bg-emerald-600{--tw-bg-opacity:1;background-color:rgb(5 150 105/var(--tw-bg-opacity,1))}.bg-red-50{--tw-bg-opacity:1;background-color:rgb(254 242 242/var(--tw-bg-opacity,1))}.bg-slate-50{--tw-bg-opacity:1;background-color:rgb(248 250 252/var(--tw-bg-opacity,1))}.bg-teal-100{--tw-bg-opacity:1;background-color:rgb(204 251 241/var(--tw-bg-opacity,1))}.bg-teal-50{--tw-bg-opacity:1;background-color:rgb(240 253 250/var(--tw-bg-opacity,1))}.bg-teal-50\\/60{background-color:rgba(240,253,250,.6)}.bg-teal-600{--tw-bg-opacity:1;background-color:rgb(13 148 136/var(--tw-bg-opacity,1))}.bg-white{--tw-bg-opacity:1;background-color:rgb(255 255 255/var(--tw-bg-opacity,1))}.bg-white\\/85{background-color:hsla(0,0%,100%,.85)}.bg-gradient-to-br{background-image:linear-gradient(to bottom right,var(--tw-gradient-stops))}.from-teal-500{--tw-gradient-from:#14b8a6 var(--tw-gradient-from-position);--tw-gradient-to:rgba(20,184,166,0) var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to)}.to-emerald-600{--tw-gradient-to:#059669 var(--tw-gradient-to-position)}.p-4{padding:1rem}.p-5{padding:1.25rem}.p-6{padding:1.5rem}.px-2\\.5{padding-left:.625rem;padding-right:.625rem}.px-3{padding-left:.75rem;padding-right:.75rem}.px-4{padding-left:1rem;padding-right:1rem}.px-5{padding-left:1.25rem;padding-right:1.25rem}.px-6{padding-left:1.5rem;padding-right:1.5rem}.py-1{padding-top:.25rem;padding-bottom:.25rem}.py-10{padding-top:2.5rem;padding-bottom:2.5rem}.py-2{padding-top:.5rem;padding-bottom:.5rem}.py-2\\.5{padding-top:.625rem;padding-bottom:.625rem}.py-3{padding-top:.75rem;padding-bottom:.75rem}.py-4{padding-top:1rem;padding-bottom:1rem}.py-6{padding-top:1.5rem;padding-bottom:1.5rem}.pb-8{padding-bottom:2rem}.pr-4{padding-right:1rem}.pt-12{padding-top:3rem}.text-left{text-align:left}.text-center{text-align:center}.text-right{text-align:right}.font-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace}.text-2xl{font-size:1.5rem;line-height:2rem}.text-4xl{font-size:2.25rem;line-height:2.5rem}.text-\\[11px\\]{font-size:11px}.text-base{font-size:1rem;line-height:1.5rem}.text-lg{font-size:1.125rem;line-height:1.75rem}.text-sm{font-size:.875rem;line-height:1.25rem}.text-xl{font-size:1.25rem;line-height:1.75rem}.text-xs{font-size:.75rem;line-height:1rem}.font-bold{font-weight:700}.font-extrabold{font-weight:800}.font-medium{font-weight:500}.font-semibold{font-weight:600}.uppercase{text-transform:uppercase}.leading-5{line-height:1.25rem}.tracking-tight{letter-spacing:-.025em}.tracking-wide{letter-spacing:.025em}.text-red-600{--tw-text-opacity:1;color:rgb(220 38 38/var(--tw-text-opacity,1))}.text-slate-400{--tw-text-opacity:1;color:rgb(148 163 184/var(--tw-text-opacity,1))}.text-slate-500{--tw-text-opacity:1;color:rgb(100 116 139/var(--tw-text-opacity,1))}.text-slate-600{--tw-text-opacity:1;color:rgb(71 85 105/var(--tw-text-opacity,1))}.text-slate-700{--tw-text-opacity:1;color:rgb(51 65 85/var(--tw-text-opacity,1))}.text-slate-800{--tw-text-opacity:1;color:rgb(30 41 59/var(--tw-text-opacity,1))}.text-slate-900{--tw-text-opacity:1;color:rgb(15 23 42/var(--tw-text-opacity,1))}.text-teal-600{--tw-text-opacity:1;color:rgb(13 148 136/var(--tw-text-opacity,1))}.text-teal-700{--tw-text-opacity:1;color:rgb(15 118 110/var(--tw-text-opacity,1))}.text-white{--tw-text-opacity:1;color:rgb(255 255 255/var(--tw-text-opacity,1))}.underline{text-decoration-line:underline}.decoration-teal-300{text-decoration-color:#5eead4}.underline-offset-2{text-underline-offset:2px}.antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.placeholder-slate-400::-moz-placeholder{--tw-placeholder-opacity:1;color:rgb(148 163 184/var(--tw-placeholder-opacity,1))}.placeholder-slate-400::placeholder{--tw-placeholder-opacity:1;color:rgb(148 163 184/var(--tw-placeholder-opacity,1))}.shadow{--tw-shadow:0 1px 3px 0 rgba(0,0,0,.1),0 1px 2px -1px rgba(0,0,0,.1);--tw-shadow-colored:0 1px 3px 0 var(--tw-shadow-color),0 1px 2px -1px var(--tw-shadow-color)}.shadow,.shadow-sm{box-shadow:var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow)}.shadow-sm{--tw-shadow:0 1px 2px 0 rgba(0,0,0,.05);--tw-shadow-colored:0 1px 2px 0 var(--tw-shadow-color)}.outline-none{outline:2px solid transparent;outline-offset:2px}.backdrop-blur{--tw-backdrop-blur:blur(8px);-webkit-backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)}.transition{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,-webkit-backdrop-filter;transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter,-webkit-backdrop-filter;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.ease-in-out{transition-timing-function:cubic-bezier(.4,0,.2,1)}.hover\\:bg-slate-100:hover{--tw-bg-opacity:1;background-color:rgb(241 245 249/var(--tw-bg-opacity,1))}.hover\\:bg-slate-50:hover{--tw-bg-opacity:1;background-color:rgb(248 250 252/var(--tw-bg-opacity,1))}.hover\\:bg-teal-50:hover{--tw-bg-opacity:1;background-color:rgb(240 253 250/var(--tw-bg-opacity,1))}.hover\\:bg-teal-700:hover{--tw-bg-opacity:1;background-color:rgb(15 118 110/var(--tw-bg-opacity,1))}.hover\\:text-teal-600:hover{--tw-text-opacity:1;color:rgb(13 148 136/var(--tw-text-opacity,1))}.hover\\:underline:hover{text-decoration-line:underline}.focus\\:border-teal-500:focus{--tw-border-opacity:1;border-color:rgb(20 184 166/var(--tw-border-opacity,1))}.focus\\:ring-2:focus{--tw-ring-offset-shadow:var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow:var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow,0 0 #0000)}.focus\\:ring-teal-500\\/20:focus{--tw-ring-color:rgba(20,184,166,.2)}.active\\:scale-\\[\\.98\\]:active{--tw-scale-x:.98;--tw-scale-y:.98;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}@media (min-width:640px){.sm\\:mt-1{margin-top:.25rem}.sm\\:flex{display:flex}.sm\\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.sm\\:flex-row{flex-direction:row}.sm\\:items-start{align-items:flex-start}.sm\\:p-8{padding:2rem}.sm\\:text-5xl{font-size:3rem;line-height:1}}"}];
export { ASSETS };

const SITE_URL = 'https://short.smp45.qzz.io';
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const MAX_FILE = 104857600;
const FILE_CHUNK = 8388608;

const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'none'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net quge5.com nap5k.com al5sm.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; frame-src 'none'; base-uri 'self'; form-action 'self'"
};

function json(code, obj, extra) {
  return new Response(JSON.stringify(obj), {
    status: code,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Cookie' }, SECURITY, extra || {})
  });
}

function html(code, body, extra) {
  return new Response(body, {
    status: code,
    headers: Object.assign({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }, SECURITY, extra || {})
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function isCrawler(ua) {
  return /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|TelegramBot|Googlebot|Google-InspectionTool|Bingbot|YandexBot|Pinterest|redditbot|vkShare|Viber|SkypeUriPreview|WeChat|MicroMessenger|Snapchat|Applebot|facebookcatalog|curl|wget|python-requests/i.test(ua);
}

function notFound() {
  return html(404,
    '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>LinkShort — Link not found</title><meta name="robots" content="noindex, nofollow"></head><body style="margin:0;font-family:system-ui,sans-serif;background:#0b0f0e;color:#e8f2ef;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center"><div><div style="font-size:48px">🔗</div><h1 style="font-size:24px;margin:12px 0 6px">Link not found</h1><p style="color:#7f9a93;margin:0 0 18px">The short link you opened does not exist.</p><a href="/" style="color:#2dd4bf;text-decoration:none;font-weight:600">← Back to LinkShort</a></div></body></html>',
    { 'X-Robots-Tag': 'noindex, nofollow' });
}

function crawlerPage(link) {
  const shortUrl = SITE_URL + '/' + link.id;
  let host = '';
  try { host = new URL(link.url).hostname; } catch (e) {}
  const title = host ? 'LinkShort — short link to ' + host : 'LinkShort — short link';
  const desc = 'A free short link hosted on LinkShort. Click to reach the destination.';
  return '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + escapeHtml(title) + '</title>\n' +
    '<meta name="robots" content="noindex, nofollow">\n' +
    '<meta property="og:title" content="' + escapeHtml(title) + '">\n' +
    '<meta property="og:description" content="' + desc + '">\n' +
    '<meta property="og:type" content="website">\n' +
    '<meta property="og:site_name" content="LinkShort">\n' +
    '<meta property="og:url" content="' + shortUrl + '">\n' +
    '<meta property="og:image" content="' + SITE_URL + '/og-image.png">\n' +
    '<meta http-equiv="refresh" content="0; url=' + escapeHtml(link.url) + '">\n' +
    '</head>\n' +
    '<body>\n' +
    '<p>Redirecting to <a href="' + escapeHtml(link.url) + '">' + escapeHtml(host || link.url) + '</a>…</p>\n' +
    '</body>\n' +
    '</html>';
}

function textPage(link) {
  const shortUrl = SITE_URL + '/' + link.id;
  const text = escapeHtml(link.text);
  const preview = escapeHtml(String(link.text).slice(0, 160));
  const chars = String(link.text).length;
  const words = String(link.text).trim().split(/\s+/).filter(Boolean).length;
  return '<!DOCTYPE html><html lang="en"><head>' +
    '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>LinkShort — text /' + escapeHtml(link.id) + '</title>' +
    '<meta name="robots" content="noindex, nofollow">' +
    '<meta property="og:title" content="Shared text — /' + escapeHtml(link.id) + '">' +
    '<meta property="og:description" content="' + preview + '">' +
    '<meta property="og:type" content="website">' +
    '<meta property="og:site_name" content="LinkShort">' +
    '<meta property="og:url" content="' + shortUrl + '">' +
    '<meta property="og:image" content="' + SITE_URL + '/og-image.png">' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap">' +
    '<link rel="stylesheet" href="/custom.css?v=5">' +
    '<style>' +
    'body{margin:0}' +
    'header{position:sticky;top:0;z-index:40;background:rgba(255,255,255,.9);border-bottom:1px solid var(--line);padding:12px 16px}' +
    '.wrap{max-width:760px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:10px}' +
    '.brand{display:flex;align-items:center;gap:8px;font-weight:800;text-decoration:none;color:var(--ink-900)}' +
    '.brand span{display:flex;width:28px;height:28px;align-items:center;justify-content:center;border-radius:9px;background:var(--grad);color:#fff}' +
    'header button{background:var(--grad);color:#fff;border:none;border-radius:999px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer}' +
    'header button:active{transform:scale(.97)}' +
    'main{max-width:760px;margin:0 auto;padding:20px 16px 40px}' +
    '.meta{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}' +
    '.meta span{font-size:11px;font-weight:700;color:var(--accent-strong);background:var(--accent-soft);border:1px solid #99f6e4;border-radius:999px;padding:4px 10px}' +
    'pre{white-space:pre-wrap;word-wrap:break-word;background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px;margin:0;font-size:14px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;box-shadow:var(--card-shadow)}' +
    '.foot{max-width:760px;margin:0 auto;padding:0 16px 90px;color:#94a3b8;font-size:12px;text-align:center}' +
    '.foot a{color:var(--accent);text-decoration:none;font-weight:600}' +
    '.how{margin-top:28px;text-align:center}' +
    '.how h2{margin:4px 0 16px;font-size:22px;font-weight:800;color:var(--ink-900)}' +
    '.how-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}' +
    '.how-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px 14px;box-shadow:var(--card-shadow)}' +
    '.how-card .how-ico{width:40px;height:40px;margin:0 auto;border-radius:999px;background:linear-gradient(135deg,#ccfbf1,#99f6e4);display:flex;align-items:center;justify-content:center;font-size:18px}' +
    '.how-card h3{margin:10px 0 4px;font-size:13px;font-weight:800;color:var(--ink-900)}' +
    '.how-card p{margin:0;font-size:12px;color:var(--ink-400)}' +
    '</style></head><body class="text-view">' +
    '<header><div class="wrap">' +
    '<a class="brand" href="' + SITE_URL + '/"><span>🔗</span>Link<span style="color:var(--accent)">Short</span></a>' +
    '<button onclick="copyText()">Copy text</button>' +
    '</div></header>' +
    '<div class="ad-banner" style="max-width:760px;margin:14px auto 0;padding:0 16px"></div>' +
    '<main>' +
    '<div class="meta"><span>' + chars + ' chars</span><span>' + words + ' words</span><span>shared via LinkShort</span></div>' +
    '<pre id="tx">' + text + '</pre>' +
    '</main>' +
    '<section class="how" style="max-width:760px">' +
    '<span class="kicker">Simple</span>' +
    '<h2>How it works</h2>' +
    '<div class="how-grid">' +
    '<div class="how-card"><div class="how-ico">1️⃣</div><h3>Open the link</h3><p>Anyone with the link lands on your text.</p></div>' +
    '<div class="how-card"><div class="how-ico">2️⃣</div><h3>Read &amp; copy</h3><p>One tap copies the text to the clipboard.</p></div>' +
    '<div class="how-card"><div class="how-ico">3️⃣</div><h3>Share it on</h3><p>Forward the short link anywhere you like.</p></div>' +
    '</div>' +
    '</section>' +
    '<div class="direct-ad" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div>' +
    '<div class="ad-duo" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div>' +
    '<div class="ad-duo" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div>' +
    '<div class="ad-count" style="max-width:760px;margin:12px 0 0"></div>' +
    '<div class="ad-banner" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div>' +
    '<div class="safead" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div>' +
    '<div class="foot">Shared with <a href="' + SITE_URL + '/">LinkShort</a> · <a href="' + SITE_URL + '/">shorten a link</a> · <a href="' + SITE_URL + '/">text to link</a></div>' +
    '<div id="sticky-bar" class="sticky-bar"></div>' +
    '<div id="ad-modal" class="ad-modal"></div>' +
    '<script src="/safeads.js?v=15"></script>' +
    '<script>' +
    'window.__mtg=window.__mtg||false;' +
    'if(!window.__mtg){window.__mtg=true;' +
    '[["265635","https://quge5.com/88/tag.min.js"],["11468479","https://nap5k.com/tag.min.js"],["11468375","https://al5sm.com/tag.min.js"]].forEach(function(z){var s=document.createElement("script");s.async=true;s.dataset.zone=z[0];s.src=z[1];s.setAttribute("data-cfasync","false");document.head.appendChild(s);});}' +
    'function copyText(){var tb=document.getElementById("tb");tb.value=document.getElementById("tx").textContent;tb.select();try{document.execCommand("copy")}catch(e){}var b=document.querySelector("header button");b.textContent="Copied!";setTimeout(function(){b.textContent="Copy text"},1600)}' +
    '</script>' +
    '<textarea id="tb" style="position:fixed;opacity:0;pointer-events:none" tabindex="-1" aria-hidden="true"></textarea>' +
    '</body></html>';
}

function fmtSize(n) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1048576).toFixed(2) + ' MB';
}

function filePage(link) {
  const shortUrl = SITE_URL + '/' + link.id;
  const dlUrl = SITE_URL + '/' + link.id + '/dl';
  const name = escapeHtml(link.name || 'file');
  const type = escapeHtml(link.type || 'file');
  const size = fmtSize(link.size || 0);
  return '<!DOCTYPE html><html lang="en"><head>' +
    '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>LinkShort — ' + name + '</title>' +
    '<meta name="robots" content="noindex, nofollow">' +
    '<meta property="og:title" content="Shared file — ' + name + '">' +
    '<meta property="og:description" content="' + size + ' file shared via LinkShort">' +
    '<meta property="og:type" content="website">' +
    '<meta property="og:site_name" content="LinkShort">' +
    '<meta property="og:url" content="' + shortUrl + '">' +
    '<meta property="og:image" content="' + SITE_URL + '/og-image.png">' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap">' +
    '<link rel="stylesheet" href="/custom.css?v=5">' +
    '<style>' +
    'body{margin:0}' +
    'header{position:sticky;top:0;z-index:40;background:rgba(255,255,255,.9);border-bottom:1px solid var(--line);padding:12px 16px}' +
    '.wrap{max-width:760px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:10px}' +
    '.brand{display:flex;align-items:center;gap:8px;font-weight:800;text-decoration:none;color:var(--ink-900)}' +
    '.brand span{display:flex;width:28px;height:28px;align-items:center;justify-content:center;border-radius:9px;background:var(--grad);color:#fff}' +
    'header button{background:var(--grad);color:#fff;border:none;border-radius:999px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer}' +
    'header button:active{transform:scale(.97)}' +
    'main{max-width:760px;margin:0 auto;padding:20px 16px 40px}' +
    '.fcard{background:#fff;border:1px solid var(--line);border-radius:20px;padding:30px 22px;text-align:center;box-shadow:var(--card-shadow)}' +
    '.fico{width:72px;height:72px;margin:0 auto;border-radius:20px;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;font-size:34px}' +
    '.fcard h1{font-size:20px;font-weight:800;color:var(--ink-900);margin:16px 0 4px;word-break:break-all}' +
    '.fmeta{color:#94a3b8;font-size:12px;font-weight:600}' +
    '.factions{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:22px}' +
    '.fbtn{display:inline-flex;align-items:center;gap:8px;background:var(--grad);color:#fff;text-decoration:none;font-weight:800;font-size:14px;border-radius:999px;padding:12px 22px;box-shadow:0 10px 24px -12px rgba(5,150,105,.6)}' +
    '.fbtn.ghost{background:#fff;color:var(--accent-strong);border:1px solid rgba(13,148,136,.35);box-shadow:none}' +
    '.furl{margin-top:18px;font-size:12px;color:var(--ink-400);word-break:break-all}' +
    '.furl b{color:var(--ink-600);font-weight:700}' +
    '.step-card{margin-top:16px}' +
    '.step-chip{display:inline-flex;align-items:center;gap:5px;background:rgba(45,212,191,.12);color:#0f766e;border:1px solid rgba(13,148,136,.25);padding:5px 13px;border-radius:999px;font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}' +
    '.timer-ring{width:88px;height:88px;border-radius:50%;margin:14px auto 8px;position:relative;display:flex;align-items:center;justify-content:center;background:conic-gradient(var(--ring,#10b981) calc(var(--p,100)*1%),#e2e8f0 0);transition:filter .2s ease}' +
    '.timer-ring::before{content:"";position:absolute;inset:7px;border-radius:50%;background:radial-gradient(circle,#0f1a17 0%,#0c1210 100%);box-shadow:inset 0 2px 8px rgba(0,0,0,.6)}' +
    '.timer-ring.warn{--ring:#f59e0b;animation:pulseRing .6s ease infinite alternate}' +
    '.timer-ring.done{background:conic-gradient(#10b981 0,#10b981 100%)}' +
    '.timer-num{position:relative;z-index:1;font-size:1.9em;font-weight:800;color:#e8f2ef;font-variant-numeric:tabular-nums}' +
    '.timer-msg{color:#94a3b8;font-size:12.5px;margin:6px 0 14px}' +
    '.timer-msg strong{color:#0f766e}' +
    '@keyframes pulseRing{from{filter:brightness(1)}to{filter:brightness(1.35)}}' +
    '.cta-btn{display:block;width:100%;padding:14px;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .2s ease,filter .2s ease;position:relative;font-family:inherit}' +
    '.cta-btn:active{transform:scale(.97)}' +
    '.cta-btn.disabled{background:#f1f5f9;color:#94a3b8;pointer-events:none;box-shadow:none}' +
    '.cta-btn.ready{background:var(--grad);color:#fff;box-shadow:0 8px 22px -12px rgba(5,150,105,.55)}' +
    '.cta-btn.ready:active{filter:brightness(1.08)}' +
    '.progress{display:flex;justify-content:center;gap:7px;margin-top:14px}' +
    '.progress .dot{width:8px;height:8px;border-radius:50%;background:#e2e8f0;transition:background .2s ease,transform .2s ease}' +
    '.progress .dot.on{background:#10b981;box-shadow:0 0 8px rgba(16,185,129,.5)}' +
    '.foot{max-width:760px;margin:0 auto;padding:0 16px 90px;color:#94a3b8;font-size:12px;text-align:center}' +
    '.foot a{color:var(--accent);text-decoration:none;font-weight:600}' +
    '.how{margin-top:28px;text-align:center}' +
    '.how h2{margin:4px 0 16px;font-size:22px;font-weight:800;color:var(--ink-900)}' +
    '.how-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}' +
    '.how-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px 14px;box-shadow:var(--card-shadow)}' +
    '.how-card .how-ico{width:40px;height:40px;margin:0 auto;border-radius:999px;background:linear-gradient(135deg,#ccfbf1,#99f6e4);display:flex;align-items:center;justify-content:center;font-size:18px}' +
    '.how-card h3{margin:10px 0 4px;font-size:13px;font-weight:800;color:var(--ink-900)}' +
    '.how-card p{margin:0;font-size:12px;color:var(--ink-400)}' +
    '</style></head><body class="text-view">' +
    '<header><div class="wrap">' +
    '<a class="brand" href="' + SITE_URL + '/"><span>🔗</span>Link<span style="color:var(--accent)">Short</span></a>' +
    '<button onclick="copyDl()">Copy link</button>' +
    '</div></header>' +
    '<div class="ad-banner" style="max-width:760px;margin:14px auto 0;padding:0 16px"></div>' +
    '<main>' +
    '<div class="fcard">' +
    '<div class="fico">📁</div>' +
    '<h1>' + name + '</h1>' +
    '<div class="fmeta">' + type + ' · ' + size + ' · shared via LinkShort</div>' +
    '<div class="step-card" id="step-box">' +
    '<div class="step-chip" id="step-chip">Step 1 of 3</div>' +
    '<div class="timer-ring active" id="timer-ring"><span class="timer-num" id="timer-num">15</span></div>' +
    '<p class="timer-msg" id="timer-msg">Please wait <strong>15</strong> seconds</p>' +
    '<button class="cta-btn disabled" id="cta-btn" disabled>Wait...</button>' +
    '<div class="progress"><div class="dot on"></div><div class="dot"></div><div class="dot"></div></div>' +
    '</div>' +
    '<div id="dl-box" style="display:none">' +
    '<div class="factions">' +
    '<a class="fbtn" href="' + dlUrl + '" download="' + name + '" rel="noopener">⬇ Download</a>' +
    '<a class="fbtn ghost" href="' + shortUrl + '">🔗 Open link</a>' +
    '</div>' +
    '<div class="furl"><b>Link:</b> ' + shortUrl + '</div>' +
    '</div>' +
    '</div>' +
    '<div class="ad-count" style="max-width:760px;margin:16px 0 0"></div>' +
    '<section class="how" style="max-width:760px">' +
    '<span class="kicker">Simple</span>' +
    '<h2>How it works</h2>' +
    '<div class="how-grid">' +
    '<div class="how-card"><div class="how-ico">1️⃣</div><h3>Open the link</h3><p>Anyone with the link lands on this page.</p></div>' +
    '<div class="how-card"><div class="how-ico">2️⃣</div><h3>Download the file</h3><p>One tap downloads it straight to their device.</p></div>' +
    '<div class="how-card"><div class="how-ico">3️⃣</div><h3>Share it on</h3><p>Forward the short link anywhere you like.</p></div>' +
    '</div>' +
    '</section>' +
    '</main>' +
    '<div class="direct-ad" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div>' +
    '<div class="ad-duo" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div>' +
    '<div class="ad-duo" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div>' +
    '<div class="ad-banner" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div>' +
    '<div class="safead" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div>' +
    '<div class="foot">Shared with <a href="' + SITE_URL + '/">LinkShort</a> · <a href="' + SITE_URL + '/">file to link</a></div>' +
    '<div id="sticky-bar" class="sticky-bar"></div>' +
    '<div id="ad-modal" class="ad-modal"></div>' +
    '<script src="/safeads.js?v=15"></script>' +
    '<script>' +
    'window.__mtg=window.__mtg||false;' +
    'if(!window.__mtg){window.__mtg=true;' +
    '[["265635","https://quge5.com/88/tag.min.js"],["11468479","https://nap5k.com/tag.min.js"],["11468375","https://al5sm.com/tag.min.js"]].forEach(function(z){var s=document.createElement("script");s.async=true;s.dataset.zone=z[0];s.src=z[1];s.setAttribute("data-cfasync","false");document.head.appendChild(s);});}' +
    'function copyDl(){var tb=document.getElementById("tb");tb.value="' + dlUrl + '";tb.select();try{document.execCommand("copy")}catch(e){}var b=document.querySelector("header button");b.textContent="Copied!";setTimeout(function(){b.textContent="Copy link"},1600)}' +
    'var Step={cur:1,secs:15,run:function(){' +
    'var chip=document.getElementById("step-chip"),ring=document.getElementById("timer-ring"),num=document.getElementById("timer-num"),msg=document.getElementById("timer-msg"),btn=document.getElementById("cta-btn"),dots=document.querySelectorAll("#step-box .progress .dot");' +
    'if(!num)return;' +
    'var labels=["Step 1 of 3","Step 2 of 3","Final Step"];' +
    'chip.textContent=labels[Step.cur-1];' +
    'dots.forEach(function(d,i){d.classList.toggle("on",i<Step.cur)});' +
    'var sec=Step.secs;num.textContent=sec;' +
    'ring.classList.remove("done","warn");ring.classList.add("active");ring.style.setProperty("--p",100);' +
    'btn.disabled=true;btn.classList.remove("ready");btn.classList.add("disabled");' +
    'msg.innerHTML=Step.cur===1?"Please wait <strong>"+Step.secs+"</strong> seconds":(Step.cur===2?"Preparing your download...":"Your download unlocks in <strong>"+Step.secs+"</strong> seconds");' +
    'btn.textContent=Step.cur===2?"Preparing...":(Step.cur===3?"Almost there...":"Wait...");' +
    'var iv=setInterval(function(){' +
    'sec--;num.textContent=sec>0?sec:"0";' +
    'ring.style.setProperty("--p",Math.max(0,(sec/Step.secs)*100));' +
    'if(sec<=5)ring.classList.add("warn");' +
    'if(sec<=0){clearInterval(iv);ring.classList.remove("active","warn");ring.classList.add("done");num.textContent="✓";' +
    'msg.innerHTML="<strong style=\\"color:#0f766e\\">Ready!</strong>";' +
    'btn.textContent=Step.cur===3?"Get Your Download":"Click Here to Continue";' +
    'btn.disabled=false;btn.classList.remove("disabled");btn.classList.add("ready");' +
    'btn.onclick=function(){if(Step.cur<3){Step.cur++;Step.run();}else Step.reveal();};' +
    '}' +
    '},1000);' +
    '},reveal:function(){' +
    'var sb=document.getElementById("step-box"),db=document.getElementById("dl-box");' +
    'if(sb)sb.style.display="none";' +
    'if(db){db.style.display="block";try{db.scrollIntoView({behavior:"smooth",block:"center"})}catch(e){}}' +
    '}};' +
    'Step.run();' +
    '</script>' +
    '<textarea id="tb" style="position:fixed;opacity:0;pointer-events:none" tabindex="-1" aria-hidden="true"></textarea>' +
    '</body></html>';
}

async function sha1(str) {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Bytes(buf) {
  return hexBytes(await crypto.subtle.digest('SHA-256', buf));
}

async function ghFetch(env, pathname, options = {}) {
  const res = await fetch('https://api.github.com' + pathname, {
    ...options,
    headers: {
      Authorization: 'token ' + env.GITHUB_TOKEN,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'LinkShort-file2link',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!res.ok) throw new Error('GitHub ' + res.status + ' ' + pathname + ': ' + String(await res.text()).slice(0, 200));
  if (res.status === 204) return null;
  return res.json();
}

async function githubCommit(env, { add = [], removePrefixes = [] } = {}) {
  const owner = env.GITHUB_OWNER;
  const repo = env.GITHUB_REPO;
  const branch = env.GITHUB_BRANCH || 'main';
  const refPath = '/repos/' + owner + '/' + repo + '/git/refs/heads/' + branch;
  const latest = await ghFetch(env, refPath);
  const latestSha = latest.object.sha;
  const current = await ghFetch(env, '/repos/' + owner + '/' + repo + '/git/commits/' + latestSha);

  let entries = [];
  if (removePrefixes.length > 0) {
    const tree = await ghFetch(env, '/repos/' + owner + '/' + repo + '/git/trees/' + current.tree.sha + '?recursive=1');
    entries = tree.tree.filter(e => e.type === 'blob' && !removePrefixes.some(p => e.path === p || e.path.startsWith(p.replace(/\/$/, '') + '/')));
  }
  for (const a of add) {
    if (a.sha) {
      entries.push({ path: a.path, mode: a.mode || '100644', type: 'blob', sha: a.sha });
      continue;
    }
    const blob = await ghFetch(env, '/repos/' + owner + '/' + repo + '/git/blobs', {
      method: 'POST',
      body: JSON.stringify({ content: a.content, encoding: 'utf-8' })
    });
    entries.push({ path: a.path, mode: '100644', type: 'blob', sha: blob.sha });
  }

  let treeSha;
  if (entries.length === 0) {
    treeSha = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
  } else {
    const body = { tree: entries };
    if (removePrefixes.length === 0) body.base_tree = current.tree.sha;
    const newTree = await ghFetch(env, '/repos/' + owner + '/' + repo + '/git/trees', { method: 'POST', body: JSON.stringify(body) });
    treeSha = newTree.sha;
  }

  const newCommit = await ghFetch(env, '/repos/' + owner + '/' + repo + '/git/commits', {
    method: 'POST',
    body: JSON.stringify({ message: 'file2link: ' + (add.length ? 'upload ' + add.length + ' blob(s)' : 'delete ' + removePrefixes.join(', ')), tree: treeSha, parents: [latestSha] })
  });
  await ghFetch(env, refPath, { method: 'PATCH', body: JSON.stringify({ sha: newCommit.sha, force: false }) });
  return newCommit.sha;
}

function bytesToBase64(u8) {
  const STEP = 3 * 4096;
  let out = '';
  for (let i = 0; i < u8.length; i += STEP) {
    out += btoa(String.fromCharCode.apply(null, u8.subarray(i, Math.min(i + STEP, u8.length))));
  }
  return out;
}

function base64ToBytes(b64) {
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

function githubFileStream(link) {
  const base = 'https://raw.githubusercontent.com/' + link.github.owner + '/' + link.github.repo + '/' + link.github.branch + '/files/' + link.github.id;
  const parts = link.chunks;
  let i = 1;
  return new ReadableStream({
    async pull(controller) {
      if (i > parts) { controller.close(); return; }
      const idx = i++;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch(base + '/part-' + String(idx).padStart(4, '0') + '.b64');
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const txt = await res.text();
          controller.enqueue(base64ToBytes(txt));
          return;
        } catch (e) {
          if (attempt === 1) { controller.error(new Error('file part ' + idx + ' failed after retry')); return; }
          await new Promise(r => setTimeout(r, 300));
        }
      }
    }
  });
}

async function genId(env) {
  let id;
  do {
    const rnd = new Uint8Array(8);
    crypto.getRandomValues(rnd);
    id = '';
    for (let i = 0; i < 6; i++) id += ALPHABET[rnd[i] % 62];
  } while (await env.KV.get('link:' + id));
  return id;
}

async function rateOk(env, ctx, ip, scope, max, windowMs) {
  const key = 'rl:' + ip + ':' + scope;
  let arr = [];
  try { arr = JSON.parse((await env.KV.get(key, 'text')) || '[]'); } catch (e) {}
  const now = Date.now();
  arr = arr.filter(t => now - t < windowMs);
  if (arr.length >= max) return false;
  arr.push(now);
  ctx.waitUntil(env.KV.put(key, JSON.stringify(arr), { expirationTtl: Math.ceil(windowMs / 1000) + 30 }).catch(() => {}));
  return true;
}

async function updateMeta(env, link) {
  const meta = (await env.KV.get('meta', 'json')) || { total: 0, clicks: 0, recent: [] };
  meta.total = (meta.total || 0) + 1;
  const summary = {
    id: link.id, kind: link.kind || 'url', clicks: link.clicks || 0,
    created: link.created, ...(link.kind === 'text' ? { text: String(link.text).slice(0, 200) } : {}),
    ...(link.kind === 'file' ? { name: link.name, size: link.size, type: link.type } : {}),
    ...(!link.kind || link.kind === 'url' ? { url: link.url } : {})
  };
  meta.recent = [summary].concat(meta.recent || []).slice(0, 25);
  await env.KV.put('meta', JSON.stringify(meta));
}

function incrClicks(env, id, link) {
  const newClicks = (link.clicks || 0) + 1;
  return Promise.all([
    env.KV.put('link:' + id, JSON.stringify(Object.assign({}, link, { clicks: newClicks }))),
    env.KV.get('meta', 'json').then(meta => {
      meta = meta || { total: 0, clicks: 0, recent: [] };
      meta.clicks = (meta.clicks || 0) + 1;
      return env.KV.put('meta', JSON.stringify(meta));
    })
  ]);
}

const SESSION_COOKIE = 'ls_sess';
const SESSION_TTL = 60 * 60 * 24 * 30;

function parseCookies(req) {
  const out = {};
  const c = req.headers.get('Cookie');
  if (!c) return out;
  c.split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function hexBytes(buf) {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function randomToken(n) {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return hexBytes(b);
}

function constEq(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

async function pbkdf2(password, salt, iter) {
  const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: iter, hash: 'SHA-256' }, km, 256);
  return hexBytes(bits);
}

function sessionSetCookie(token) {
  return SESSION_COOKIE + '=' + token + '; Path=/; Max-Age=' + SESSION_TTL + '; HttpOnly; Secure; SameSite=Lax';
}

function sessionClearCookie() {
  return SESSION_COOKIE + '=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax';
}

async function currentUser(env, request) {
  const t = parseCookies(request)[SESSION_COOKIE];
  if (!t) return null;
  const s = await env.KV.get('sess:' + t, 'json');
  if (!s || !s.name) return null;
  return { name: s.name };
}

async function createSession(env, name) {
  const token = randomToken(32);
  await env.KV.put('sess:' + token, JSON.stringify({ name }), { expirationTtl: SESSION_TTL });
  const r = json(200, { ok: true, name });
  r.headers.set('Set-Cookie', sessionSetCookie(token));
  return r;
}

async function addUserLink(env, name, link) {
  if (!link) return;
  const list = (await env.KV.get('userlinks:' + name, 'json')) || [];
  const next = [link].concat(list.filter(l => l.id !== link.id)).slice(0, 200);
  await env.KV.put('userlinks:' + name, JSON.stringify(next));
}

async function removeUserLink(env, name, id) {
  const list = (await env.KV.get('userlinks:' + name, 'json')) || [];
  await env.KV.put('userlinks:' + name, JSON.stringify(list.filter(l => l.id !== id)));
}

async function handleLink(request, env, ctx, id, ip) {
  const now = Date.now();
  const [rawRl, link] = await Promise.all([
    env.KV.get('rl:' + ip + ':go', 'text'),
    env.KV.get('link:' + id, 'json')
  ]);

  let rl = [];
  try { rl = JSON.parse(rawRl || '[]'); } catch (e) {}
  rl = rl.filter(t => now - t < 60000);
  if (rl.length >= 120) return html(429, 'Too many requests — slow down.', { 'X-Robots-Tag': 'noindex, nofollow' });
  rl.push(now);
  ctx.waitUntil(env.KV.put('rl:' + ip + ':go', JSON.stringify(rl), { expirationTtl: 120 }));

  if (!link) return notFound();
  if (link.kind === 'text') {
    ctx.waitUntil(incrClicks(env, id, link));
    return html(200, textPage(link), { 'X-Robots-Tag': 'noindex, nofollow' });
  }
  if (link.kind === 'file') {
    ctx.waitUntil(incrClicks(env, id, link));
    return html(200, filePage(link), { 'X-Robots-Tag': 'noindex, nofollow' });
  }
  if (isCrawler(request.headers.get('user-agent') || '')) {
    return html(200, crawlerPage(link), { 'X-Robots-Tag': 'noindex, nofollow' });
  }

  ctx.waitUntil(incrClicks(env, id, link));

  return new Response(null, {
    status: 301,
    headers: Object.assign({ 'Location': link.url, 'Cache-Control': 'no-store' }, SECURITY)
  });
}

async function handleFileDownload(env, ctx, id, ip) {
  const link = await env.KV.get('link:' + id, 'json');
  if (!link || link.kind !== 'file') return notFound();
  const now = Date.now();
  let rl = [];
  try { rl = JSON.parse((await env.KV.get('rl:' + ip + ':dl', 'text')) || '[]'); } catch (e) {}
  rl = rl.filter(t => now - t < 60000);
  if (rl.length >= 60) return html(429, 'Too many requests — slow down.', { 'X-Robots-Tag': 'noindex, nofollow' });
  rl.push(now);
  ctx.waitUntil(env.KV.put('rl:' + ip + ':dl', JSON.stringify(rl), { expirationTtl: 120 }));
  ctx.waitUntil(incrClicks(env, id, link));
  const cd = 'attachment; filename="' + (link.name || 'file').replace(/["\\\r\n]/g, '_') + '"';
  const headers = Object.assign({
    'Content-Type': link.type || 'application/octet-stream',
    'Content-Disposition': cd,
    'Cache-Control': 'private, max-age=60',
    'X-Robots-Tag': 'noindex, nofollow'
  }, SECURITY);
  if (link.github) {
    const stream = githubFileStream(link);
    return new Response(stream, { headers: Object.assign({ 'Content-Length': String(link.size) }, headers) });
  }
  if (link.chunks) {
    const n = link.chunks;
    let i = 0;
    const stream = new ReadableStream({
      pull(controller) {
        if (i >= n) { controller.close(); return Promise.resolve(); }
        const idx = i++;
        return env.KV.get('f:' + id + ':' + idx, 'arrayBuffer').then(v => {
          if (!v) { controller.error(new Error('missing chunk')); return; }
          controller.enqueue(new Uint8Array(v));
        });
      }
    });
    return new Response(stream, { headers: Object.assign({ 'Content-Length': String(link.size) }, headers) });
  }
  const data = await env.KV.get('f:' + id, 'arrayBuffer');
  if (!data) return notFound();
  return new Response(data, { headers: Object.assign({ 'Content-Length': String(link.size || data.byteLength) }, headers) });
}

async function handleApi(request, env, ctx, path, ip) {
  if (path === '/api/shorten' && request.method === 'POST') {
    const user = await currentUser(env, request);
    let body = {};
    try { body = await request.json(); } catch (e) {}
    let target = String(body.url || '').trim();
    if (!target) return json(400, { error: 'URL required' });
    if (!/^https?:\/\//i.test(target)) target = 'https://' + target;
    try { new URL(target); } catch (e) { return json(400, { error: 'Invalid URL' }); }

    const hash = await sha1(target);
    const [rateOkResult, dedupId] = await Promise.all([
      rateOk(env, ctx, ip, 'short', 10, 60000),
      env.KV.get('u:' + hash, 'text')
    ]);
    if (!rateOkResult) return json(429, { error: 'Too many links. Slow down.' });
    let id = dedupId;
    let created = false;
    if (!id) {
      id = await genId(env);
      const link = { id, url: target, clicks: 0, created: new Date().toISOString() };
      if (user) link.owner = user.name;
      await env.KV.put('link:' + id, JSON.stringify(link));
      ctx.waitUntil(env.KV.put('u:' + hash, id).catch(() => {}));
      ctx.waitUntil(updateMeta(env, link));
      created = true;
    }
    if (user) {
      if (!created) {
        const cur = await env.KV.get('link:' + id, 'json');
        if (cur && !cur.owner) {
          cur.owner = user.name;
          await env.KV.put('link:' + id, JSON.stringify(cur));
        }
      }
      const link = await env.KV.get('link:' + id, 'json');
      if (link) ctx.waitUntil(addUserLink(env, user.name, link));
    }
    return json(200, { id, owned: !!user });
  }

  if (path === '/api/text' && request.method === 'POST') {
    const user = await currentUser(env, request);
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const text = String(body.text || '');
    if (!text.trim()) return json(400, { error: 'Text required' });
    if (text.length > 100000) return json(400, { error: 'Text is too long — maximum 100,000 characters' });

    const hash = await sha1(text);
    const [rateOkResult, dedupId] = await Promise.all([
      rateOk(env, ctx, ip, 'text', 10, 60000),
      env.KV.get('t:' + hash, 'text')
    ]);
    if (!rateOkResult) return json(429, { error: 'Too many links. Slow down.' });
    let id = dedupId;
    let created = false;
    if (!id) {
      id = await genId(env);
      const link = { id, kind: 'text', text, clicks: 0, created: new Date().toISOString() };
      if (user) link.owner = user.name;
      await env.KV.put('link:' + id, JSON.stringify(link));
      ctx.waitUntil(env.KV.put('t:' + hash, id).catch(() => {}));
      ctx.waitUntil(updateMeta(env, link));
      created = true;
    }
    if (user) {
      if (!created) {
        const cur = await env.KV.get('link:' + id, 'json');
        if (cur && !cur.owner) {
          cur.owner = user.name;
          await env.KV.put('link:' + id, JSON.stringify(cur));
        }
      }
      const link = await env.KV.get('link:' + id, 'json');
      if (link) ctx.waitUntil(addUserLink(env, user.name, link));
    }
    return json(200, { id, owned: !!user });
  }

  if (path === '/api/file' && request.method === 'POST') {
    const user = await currentUser(env, request);
    let name = '';
    try { name = decodeURIComponent(request.headers.get('X-File-Name') || ''); } catch (e) {}
    name = String(name).trim().replace(/[\/\\]/g, '_').slice(0, 120) || 'file';
    const type = (request.headers.get('Content-Type') || 'application/octet-stream').split(';')[0].trim();
    const blocked = /^(text\/html|text\/javascript|text\/x-script|application\/x-javascript|application\/javascript|application\/x-html)/i;
    const safeType = blocked.test(type) ? 'application/octet-stream' : type;
    const buf = await request.arrayBuffer();
    if (!buf.byteLength) return json(400, { error: 'File required' });
    if (buf.byteLength > MAX_FILE) return json(400, { error: 'File too large — maximum 100 MB' });

    const hash = await sha256Bytes(buf);
    const [rateOkResult, dedupId] = await Promise.all([
      rateOk(env, ctx, ip, 'file', 6, 60000),
      env.KV.get('fh:' + hash, 'text')
    ]);
    if (!rateOkResult) return json(429, { error: 'Too many uploads. Slow down.' });
    let id = dedupId;
    let created = false;
    if (!id) {
      if (!env.GITHUB_TOKEN) return json(503, { error: 'File storage not configured' });
      id = await genId(env);
      const u8 = new Uint8Array(buf);
      const chunks = Math.max(1, Math.ceil(u8.byteLength / FILE_CHUNK));
      const b64s = [];
      for (let i = 0; i < chunks; i++) {
        const start = i * FILE_CHUNK;
        const end = Math.min(start + FILE_CHUNK, u8.byteLength);
        b64s.push(bytesToBase64(u8.subarray(start, end)));
      }
      const prefix = 'files/' + id;
      const add = [];
      for (let i = 0; i < chunks; i++) {
        add.push({ path: prefix + '/part-' + String(i + 1).padStart(4, '0') + '.b64', content: b64s[i] });
      }
      add.push({ path: prefix + '/manifest.json', content: JSON.stringify({ id, name, type: safeType, size: u8.byteLength, hash, chunks }) });
      const commitSha = await githubCommit(env, { add });
      const link = {
        id, kind: 'file', name, type: safeType, size: u8.byteLength, hash, chunks,
        github: { owner: env.GITHUB_OWNER, repo: env.GITHUB_REPO, branch: env.GITHUB_BRANCH || 'main', id, commit: commitSha },
        clicks: 0, created: new Date().toISOString()
      };
      if (user) link.owner = user.name;
      const linkPutOk = await env.KV.put('link:' + id, JSON.stringify(link)).then(() => true).catch(() => false);
      if (!linkPutOk) return json(500, { error: 'Storage write failed' });
      ctx.waitUntil(env.KV.put('fh:' + hash, id).catch(() => {}));
      ctx.waitUntil(updateMeta(env, link));
      created = true;
    }
    if (user) {
      if (!created) {
        const cur = await env.KV.get('link:' + id, 'json');
        if (cur && !cur.owner) {
          cur.owner = user.name;
          await env.KV.put('link:' + id, JSON.stringify(cur));
        }
      }
      const link = await env.KV.get('link:' + id, 'json');
      if (link) ctx.waitUntil(addUserLink(env, user.name, link));
    }
    return json(200, { id, owned: !!user });
  }

  if (path === '/api/register' && request.method === 'POST') {
    if (!(await rateOk(env, ctx, ip, 'auth', 8, 60000))) return json(429, { error: 'Too many attempts. Slow down.' });
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const name = String(body.name || '').trim();
    const password = String(body.password || '');
    if (!/^[a-zA-Z0-9_.\-]{3,20}$/.test(name)) return json(400, { error: 'Username must be 3–20 chars using letters, numbers, _ . -' });
    if (password.length < 6) return json(400, { error: 'Password must be at least 6 characters' });
    const key = 'user:' + name.toLowerCase();
    if (await env.KV.get(key)) return json(409, { error: 'Username is already taken' });
    const salt = randomToken(16);
    const iter = 100000;
    const hash = await pbkdf2(password, salt, iter);
    await env.KV.put(key, JSON.stringify({ name: name.toLowerCase(), hash, salt, iter, created: new Date().toISOString() }));
    return createSession(env, name.toLowerCase());
  }

  if (path === '/api/login' && request.method === 'POST') {
    if (!(await rateOk(env, ctx, ip, 'auth', 8, 60000))) return json(429, { error: 'Too many attempts. Slow down.' });
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const name = String(body.name || '').trim().toLowerCase();
    const rec = await env.KV.get('user:' + name, 'json');
    if (!rec) return json(401, { error: 'Invalid username or password' });
    const hash = await pbkdf2(String(body.password || ''), rec.salt, rec.iter);
    if (!constEq(hash, rec.hash)) return json(401, { error: 'Invalid username or password' });
    return createSession(env, name);
  }

  if (path === '/api/logout' && request.method === 'POST') {
    const t = parseCookies(request)[SESSION_COOKIE];
    if (t) await env.KV.delete('sess:' + t);
    const r = json(200, { ok: true });
    r.headers.set('Set-Cookie', sessionClearCookie());
    return r;
  }

  if (path === '/api/me' && request.method === 'GET') {
    const u = await currentUser(env, request);
    if (!u) return json(401, { error: 'Not signed in' });
    return json(200, { ok: true, name: u.name });
  }

  if (path === '/api/me/links' && request.method === 'GET') {
    const u = await currentUser(env, request);
    if (!u) return json(401, { error: 'Not signed in' });
    const list = (await env.KV.get('userlinks:' + u.name, 'json')) || [];
    return json(200, list);
  }

  const del = path.match(/^\/api\/me\/links\/([0-9a-zA-Z]{6})$/);
  if (del && request.method === 'DELETE') {
    const u = await currentUser(env, request);
    if (!u) return json(401, { error: 'Not signed in' });
    const id = del[1];
    const link = await env.KV.get('link:' + id, 'json');
    if (!link || link.owner !== u.name) return json(404, { error: 'Not found' });
    await env.KV.delete('link:' + id);
    if (link.kind === 'file') {
      if (link.github) {
        ctx.waitUntil(githubCommit(env, { removePrefixes: ['files/' + id] }).catch(() => {}));
      }
      if (link.chunks) {
        const n = link.chunks;
        for (let i = 0; i < n; i++) await env.KV.delete('f:' + id + ':' + i);
        await env.KV.delete('f:' + id);
      }
      if (link.hash) await env.KV.delete('fh:' + link.hash);
    } else {
      await env.KV.delete((link.kind === 'text' ? 't:' : 'u:') + (await sha1(link.kind === 'text' ? link.text : link.url)));
    }
    await removeUserLink(env, u.name, id);
    const meta = (await env.KV.get('meta', 'json')) || { total: 0, clicks: 0, recent: [] };
    meta.recent = (meta.recent || []).filter(l => l.id !== id);
    meta.total = Math.max(0, (meta.total || 0) - 1);
    await env.KV.put('meta', JSON.stringify(meta));
    return json(200, { ok: true });
  }

  if (path === '/api/links' && request.method === 'GET') {
    const meta = (await env.KV.get('meta', 'json')) || { total: 0, clicks: 0, recent: [] };
    return json(200, (meta.recent || []).slice(0, 25));
  }

  if (path === '/api/stats' && request.method === 'GET') {
    const meta = (await env.KV.get('meta', 'json')) || { total: 0, clicks: 0, recent: [] };
    return json(200, { total: meta.total || 0, clicks: meta.clicks || 0 });
  }

  return json(404, { error: 'Not found' });
}

function b64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function serveAsset(path) {
  const p = path === '/' ? '/index.html' : path;
  const a = ASSETS.find(x => x.path === p) || ASSETS.find(x => x.path === path);
  if (!a) return null;
  const body = a.b64 ? b64ToBytes(a.b64) : a.content;
  return new Response(body, {
    status: 200,
    headers: Object.assign({ 'Content-Type': a.type, 'Cache-Control': a.cache, 'Vary': 'Accept-Encoding' }, SECURITY)
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+/g, '/');
    const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';

    const short = path.match(/^\/([0-9a-zA-Z]{6})$/);
    if (short) return handleLink(request, env, ctx, short[1], ip);

    const dl = path.match(/^\/([0-9a-zA-Z]{6})\/dl$/);
    if (dl) return handleFileDownload(env, ctx, dl[1], ip);

    if (path.startsWith('/api/')) {
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Cookie',
            'Access-Control-Max-Age': '86400'
          }
        });
      }
      return handleApi(request, env, ctx, path, ip);
    }

    return serveAsset(path) || notFound();
  }
};
