#!/usr/bin/env python3
"""Regenerate AssetManager.java from cf-worker source files."""
import os, re

BASE = os.path.dirname(os.path.abspath(__file__))
CW = os.path.join(BASE, "cf-worker", "public")
OUT = os.path.join(BASE, "src", "main", "java", "linkshort", "AssetManager.java")

def read_file(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def java_string_escape(s):
    """Escape a string for use in a Java string literal."""
    s = s.replace("\\", "\\\\")
    s = s.replace('"', '\\"')
    s = s.replace("\n", "\\n\"\n  + \"")
    s = s.replace("\r", "")
    return s

# Read source files
custom_css = read_file(os.path.join(CW, "custom.css"))
tailwind_css = read_file(os.path.join(CW, "tailwind.min.css"))
safeads_js = read_file(os.path.join(CW, "safeads.js"))
icon_svg = read_file(os.path.join(CW, "icon.svg"))
robots_txt = read_file(os.path.join(CW, "robots.txt"))
sitemap_xml = read_file(os.path.join(CW, "sitemap.xml"))

# Fix safeads.js DOMContentLoaded race condition
safeads_js = safeads_js.replace(
    "document.addEventListener('DOMContentLoaded', () => SafeAds.init());",
    "if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){SafeAds.init()});}else{SafeAds.init();}"
)

# Generate Java file
java = f'''package linkshort;
public class AssetManager {{
  public static final String custom_css = "{java_string_escape(custom_css)}";
  public static final String custom_css_type = "text/css";
  public static final String tailwind_min_css = "{java_string_escape(tailwind_css)}";
  public static final String tailwind_min_css_type = "text/css";
  public static final String safeads_js = "{java_string_escape(safeads_js)}";
  public static final String safeads_js_type = "application/javascript";
  public static final String icon_svg = "{java_string_escape(icon_svg)}";
  public static final String icon_svg_type = "image/svg+xml";
  public static final String robots_txt = "{java_string_escape(robots_txt)}";
  public static final String robots_txt_type = "text/plain";
  public static final String sitemap_xml = "{java_string_escape(sitemap_xml)}";
  public static final String sitemap_xml_type = "application/xml";
}}
'''

with open(OUT, "w", encoding="utf-8") as f:
    f.write(java)

print(f"Generated {OUT}")
print(f"  custom.css: {len(custom_css)} bytes")
print(f"  tailwind.min.css: {len(tailwind_css)} bytes")
print(f"  safeads.js: {len(safeads_js)} bytes")
print(f"  icon.svg: {len(icon_svg)} bytes")
