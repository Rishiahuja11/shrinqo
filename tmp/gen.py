#!/usr/bin/env python3
"""Generate new AssetManager.java and Templates.java"""
import os

# Read existing file to extract non-CSS parts (safeads_js, tailwind, icon, robots, sitemap)
with open('/data/data/com.termux/files/home/url-shortener/src/main/java/linkshort/AssetManager.java', 'r') as f:
    old = f.read()

# Extract sections between markers
def extract(old, start_marker, end_marker):
    s = old.find(start_marker)
    e = old.find(end_marker) + len(end_marker)
    return old[s:e]

safeads = extract(old, '  public static final String safeads_js = ', 'public static final String safeads_js_type = "application/javascript";')
tailwind = extract(old, '  public static final String tailwind_min_css = ', 'public static final String tailwind_min_css_type = "text/css";')
icon = extract(old, '  public static final String icon_svg = ', 'public static final String icon_svg_type = "image/svg+xml";')
robots = extract(old, '  public static final String robots_txt = ', 'public static final String robots_txt_type = "text/plain";')
sitemap = extract(old, '  public static final String sitemap_xml = ', 'public static final String sitemap_xml_type = "application/xml";')

print("Extracted all sections OK")

# Write the new file
with open('/data/data/com.termux/files/home/url-shortener/src/main/java/linkshort/AssetManager.java', 'w') as f:
    f.write('''package linkshort;
public class AssetManager {
  public static final String custom_css = """
/* LinkShort v10 - blue/green/white, mobile-first, zero scroll-reveal */
*,*::before,*::after{box-sizing:border-box}
body{margin:0;font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;line-height:1.5}
a{color:inherit;text-decoration:none}
button{font:inherit;cursor:pointer}
input,textarea{font:inherit}
img{max-width:100%;display:block}
html{scroll-behavior:smooth}
::selection{background:#dbeafe;color:#1d4ed8}
:focus-visible{outline:2px solid var(--blue);outline-offset:2px;border-radius:4px}
:root{
  --blue:#2563eb;--blue-d:#1d4ed8;--blue-bg:#eff6ff;--blue-border:#bfdbfe;
  --green:#059669;--green-d:#047857;--green-bg:#ecfdf5;--green-border:#a7f3d0;
  --cyan:#06b6d4;--grad:linear-gradient(135deg,#2563eb,#059669);
  --bg:#f8fafc;--text:#0f172a;--text2:#475569;--muted:#94a3b8;--border:#e2e8f0;
  --radius:16px;--r2:12px;--r3:8px;
  --sh-sm:0 1px 3px rgba(0,0,0,.04);--sh:0 4px 20px rgba(0,0,0,.06);--sh-lg:0 8px 40px rgba(0,0,0,.1)
}
.container{width:100%;max-width:920px;margin:0 auto;padding:0 16px}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}

/* ===== HEADER ===== */
.site-header{position:sticky;top:0;background:rgba(255,255,255,.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(226,232,240,.6);z-index:100;transition:box-shadow .2s}
.site-header.scrolled{box-shadow:0 2px 12px rgba(0,0,0,.06)}
.header-inner{max-width:920px;margin:0 auto;padding:10px 16px;display:flex;align-items:center;justify-content:space-between}
.logo{display:flex;align-items:center;gap:8px;font-weight:800;font-size:1rem;transition:opacity .15s}
.logo:hover{opacity:.8}
.logo-icon{width:32px;height:32px;border-radius:var(--r3);background:var(--grad);color:#fff;display:flex;align-items:center;justify-content:center;font-size:.85rem;font-weight:800}
.logo em{font-style:normal;color:var(--blue)}
.header-nav{display:flex;align-items:center;gap:8px}
.nav-pill{padding:6px 12px;border-radius:var(--r3);font-size:.75rem;font-weight:600;border:1px solid var(--border);background:#fff;color:var(--text2);transition:all .15s}
.nav-pill:hover{border-color:var(--blue);color:var(--blue)}

/* ===== HERO ===== */
.hero{background:linear-gradient(160deg,#0c1a2c 0%,#0f2b3d 40%,#134e4a 100%);color:#fff;text-align:center;padding:80px 16px 88px;position:relative;z-index:0;overflow:hidden}
.hero::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:56px 56px;pointer-events:none}
.hero::after{content:'';position:absolute;top:-100px;right:-100px;width:340px;height:340px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.2) 0%,transparent 70%);pointer-events:none}
.hero-content{position:relative;z-index:2}
.hero-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:999px;font-size:.72rem;font-weight:600;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.8)}
.hero-badge-dot{width:6px;height:6px;border-radius:50%;background:#5eead4;animation:blink 2s infinite}
@keyframes blink{50%{opacity:.35}}
.hero h1{font-size:2.6rem;font-weight:800;line-height:1.08;margin:24px 0 0}
.hero .hl{color:#5eead4;font-style:italic}
.hero p{margin:16px auto 0;max-width:480px;font-size:.92rem;color:rgba(255,255,255,.65)}
.hero-actions{display:flex;justify-content:center;gap:12px;margin-top:32px;flex-wrap:wrap}
.hero-checks{display:flex;justify-content:center;gap:24px;margin-top:40px;flex-wrap:wrap;font-size:.78rem;color:rgba(255,255,255,.5);font-weight:600}

/* ===== BUTTONS ===== */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 20px;border-radius:var(--r2);font-size:.85rem;font-weight:600;border:none;cursor:pointer;transition:all .18s cubic-bezier(.16,1,.3,1);text-decoration:none}
.btn:active{transform:scale(.97)}
.btn-primary{background:var(--grad);color:#fff;box-shadow:0 2px 8px rgba(37,99,235,.25)}
.btn-primary:hover{filter:brightness(1.08);box-shadow:0 4px 16px rgba(37,99,235,.35);transform:translateY(-1px)}
.btn-primary:active{transform:scale(.97) translateY(0)}
.btn-secondary{background:#fff;color:var(--text2);border:1px solid var(--border)}
.btn-secondary:hover{border-color:var(--blue);color:var(--blue);transform:translateY(-1px)}
.btn-secondary:active{transform:scale(.97) translateY(0)}
.btn-sm{padding:7px 12px;font-size:.78rem;border-radius:var(--r3)}
.btn-lg{padding:12px 24px;font-size:.9rem;border-radius:var(--r2)}
.btn[disabled]{opacity:.5;pointer-events:none}

/* ===== AUTH SECTION ===== */
.auth-section{margin-top:-56px;padding:0 16px 32px;position:relative;z-index:10}
.auth-panel{max-width:400px;margin:0 auto;background:#fff;border-radius:var(--radius);border:1px solid var(--border);box-shadow:var(--sh-lg);overflow:hidden}
.auth-tabs{display:flex;background:#f1f5f9;border-bottom:1px solid rgba(0,0,0,.04)}
.auth-tab-btn{flex:1;padding:11px;border:none;background:transparent;font-size:.8rem;font-weight:600;color:var(--muted);border-bottom:2px solid transparent;transition:all .15s}
.auth-tab-btn.active{color:var(--blue);border-bottom-color:var(--blue);background:#fff}
.auth-body{padding:28px 24px}
.auth-logo-wrap{width:52px;height:52px;border-radius:var(--radius);background:var(--grad);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.4rem;margin:0 auto}
.auth-title{margin:16px 0 4px;font-size:1.1rem;font-weight:700;text-align:center}
.auth-subtitle{font-size:.8rem;color:var(--muted);margin:0 0 20px;text-align:center}
.field-row{margin-bottom:14px}
.field-label{display:block;font-size:.78rem;font-weight:600;margin-bottom:5px}
.field{width:100%;padding:10px 14px;border-radius:var(--r2);border:1px solid var(--border);font-size:.85rem;background:#fff;outline:none;transition:border .15s,box-shadow .15s}
.field:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(37,99,235,.08)}
.field::placeholder{color:var(--muted)}
.input-group{position:relative}
.input-group .field{padding-right:36px}
.input-icon{position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:1rem;opacity:.35;pointer-events:none}
.auth-msg{display:none;margin-top:10px;padding:8px 12px;border-radius:var(--r3);font-size:.8rem}
.auth-msg.err{display:block;background:#fef2f2;color:#dc2626}
.auth-msg.ok{display:block;background:#f0fdf4;color:#16a34a}
.auth-footer{text-align:center;margin-top:16px;font-size:.78rem;color:var(--muted)}
.auth-footer button{border:none;background:none;color:var(--blue);font-weight:600;cursor:pointer}

/* ===== TOOL SWITCHER ===== */
.tool-bar{display:flex;justify-content:center;margin:28px 0 20px}
.tool-switcher{display:inline-flex;background:#f1f5f9;border-radius:var(--r2);padding:3px;gap:3px}
.tool-btn{display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border:none;background:transparent;border-radius:var(--r3);font-size:.78rem;font-weight:600;color:var(--muted);transition:all .18s}
.tool-btn.active{background:#fff;color:var(--blue);box-shadow:0 1px 4px rgba(0,0,0,.06)}

/* ===== CARDS / PANELS ===== */
.card{background:#fff;border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--sh-sm);transition:transform .2s,box-shadow .2s;position:relative;z-index:1}
.card:hover{box-shadow:var(--sh)}
.card-glow{box-shadow:0 0 0 1px rgba(37,99,235,.06),0 4px 24px rgba(0,0,0,.05)}
.card-glow:hover{box-shadow:0 0 0 1px rgba(37,99,235,.12),0 8px 32px rgba(0,0,0,.08)}
.content-card{padding:28px 24px}
.tool-panel{max-width:600px;margin:0 auto 20px}
.tool-panel h2{font-size:1rem;font-weight:700;margin:0 0 2px}
.tool-panel .sub{font-size:.8rem;color:var(--muted);margin:0 0 16px}
.input-row{display:flex;gap:8px}
.input-row .field{flex:1}
.drop-zone{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px;border:2px dashed var(--border);border-radius:var(--radius);cursor:pointer;transition:border .2s,background .2s}
.drop-zone:hover,.drop-zone.over{border-color:var(--blue);background:rgba(37,99,235,.02)}
.char-count{font-size:.72rem;color:var(--muted);margin-top:8px}

/* ===== RESULT ===== */
.result-card{background:linear-gradient(135deg,var(--blue-bg),var(--green-bg));border:1px solid var(--blue-border);border-radius:var(--radius);padding:20px;text-align:center;max-width:600px;margin:16px auto}
.result-url{font-size:.9rem;font-weight:700;color:var(--blue);word-break:break-all}
.result-actions{display:flex;justify-content:center;gap:8px;margin-top:12px;flex-wrap:wrap}
.copy-ok{background:#10b981!important;color:#fff!important}

/* ===== SECTIONS ===== */
.section{padding:40px 0}
.kicker{display:inline-block;padding:3px 10px;border-radius:999px;font-size:.65rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--blue);background:var(--blue-bg);border:1px solid var(--blue-border);margin-bottom:8px}
.section-title{font-size:1.5rem;font-weight:800;text-align:center;margin:0 0 24px}

/* ===== STEPS ===== */
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.step{text-align:center;padding:24px 14px}
.step-num{width:38px;height:38px;border-radius:var(--r2);background:var(--grad);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:.9rem;font-weight:800;margin-bottom:12px;transition:transform .2s}
.step:hover .step-num{transform:scale(1.1)}
.step h3{font-size:.85rem;font-weight:700;margin:0 0 4px}
.step p{font-size:.75rem;color:var(--muted);margin:0}

/* ===== FEATURES ===== */
.features{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.feat{text-align:center;padding:24px 14px;transition:transform .2s}
.feat:hover{transform:translateY(-4px)}
.feat-icon{width:44px;height:44px;border-radius:var(--r2);display:inline-flex;align-items:center;justify-content:center;font-size:1.2rem;margin-bottom:12px;transition:transform .2s}
.feat:hover .feat-icon{transform:scale(1.1)}
.feat-icon-1{background:rgba(37,99,235,.08)}
.feat-icon-2{background:rgba(5,150,105,.08)}
.feat-icon-3{background:rgba(6,182,212,.08)}
.feat h3{font-size:.85rem;font-weight:700;margin:0 0 4px}
.feat p{font-size:.75rem;color:var(--muted);margin:0}

/* ===== FAQ ===== */
.faq-list{display:flex;flex-direction:column;gap:8px;max-width:600px;margin:0 auto}
.faq-item{border:1px solid var(--border);border-radius:var(--r2);background:#fff;overflow:hidden;transition:border .2s}
.faq-item[open]{border-color:rgba(37,99,235,.25)}
.faq-item summary{padding:14px 16px;cursor:pointer;font-size:.85rem;font-weight:600;list-style:none;display:flex;justify-content:space-between;align-items:center;transition:color .15s}
.faq-item summary:hover{color:var(--blue)}
.faq-item summary::-webkit-details-marker{display:none}
.faq-item summary::after{content:'+';color:var(--muted);font-size:1rem;transition:transform .2s}
.faq-item[open] summary::after{content:'\\2212';transform:rotate(180deg)}
.faq-answer{padding:0 16px 14px;font-size:.8rem;line-height:1.6;color:var(--text2)}

/* ===== AD SLOTS ===== */
.safead,.direct-ad,.ad-banner,.ad-duo,.ad-count{min-height:0;text-align:center}
.ad-slot{margin:20px auto;max-width:728px;text-align:center}

/* ===== FOOTER ===== */
.site-footer{background:#0f172a;color:rgba(255,255,255,.5);margin-top:48px;padding:40px 16px 20px}
.footer-grid{max-width:920px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr;gap:24px}
.footer-brand{font-size:.95rem;font-weight:800;color:#fff}
.footer-brand span{color:#5eead4}
.footer-copy{text-align:center;font-size:.68rem;margin-top:28px;color:rgba(255,255,255,.3)}
.site-footer a{color:rgba(255,255,255,.45);text-decoration:none;transition:color .15s}
.site-footer a:hover{color:#5eead4}

/* ===== STATUS PAGE (MCBOT) ===== */
.status-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px}
.status-stat{padding:18px;text-align:center}
.status-big{font-size:1.6rem;font-weight:800;color:var(--blue)}
.log-box{max-height:300px;overflow-y:auto;background:#f8fafc;border:1px solid var(--border);border-radius:var(--r2);padding:12px;font-size:.78rem;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.log-line{padding:4px 0;border-bottom:1px solid rgba(226,232,240,.5);word-break:break-all;color:var(--text2)}
.badge{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:999px;font-size:.72rem;font-weight:700}
.badge-green{background:rgba(16,185,129,.1);color:#059669}
.badge-amber{background:rgba(245,158,11,.1);color:#d97706}
.badge-red{background:rgba(239,68,68,.1);color:#dc2626}
.status-dot{width:10px;height:10px;border-radius:50%;display:inline-block;margin-right:6px}
.status-dot.on{background:#10b981;box-shadow:0 0 8px rgba(16,185,129,.4)}
.status-dot.off{background:#ef4444}

/* ===== RESPONSIVE ===== */
@media(max-width:640px){
  .hero{padding:56px 16px 60px}
  .hero h1{font-size:1.9rem}
  .hero p{font-size:.85rem}
  .hero-checks{gap:14px}
  .steps,.features{grid-template-columns:1fr}
  .footer-grid{grid-template-columns:1fr}
  .input-row{flex-direction:column}
  .site-footer{margin-top:32px}
  .auth-body{padding:20px 16px}
  .status-grid{grid-template-columns:1fr 1fr}
}
@media(max-width:380px){
  .hero h1{font-size:1.6rem}
  .hero-actions{flex-direction:column;align-items:center}
  .status-grid{grid-template-columns:1fr}
}
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}
  html{scroll-behavior:auto}
}
""";
public static final String custom_css_type = "text/css";
''')

    # Now append the non-CSS parts from the original file
    for section in [tailwind, safeads, icon, robots, sitemap]:
        f.write('\n')
        f.write(section)
        f.write('\n')

    f.write('}\n')

print("AssetManager.java written successfully")
