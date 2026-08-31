#!/usr/bin/env python3
import os

base = os.path.expanduser("~/url-shortener")
src = os.path.join(base, "src/main/java/linkshort/AssetManager.java")

with open(src) as f:
    lines = f.readlines()

# Find boundaries
start = end = None
for i, l in enumerate(lines):
    if 'public static final String custom_css' in l and 'custom_css_type' not in l:
        start = i
    if start and not end and 'custom_css_type' in l:
        end = i
        break

print(f"Replacing lines {start+1}-{end} in AssetManager.java")

# Read new CSS from file
with open(os.path.join(base, "new.css")) as f:
    new_css = f.read()

# Build the Java string for custom_css
java_lines = ['  public static final String custom_css = ""\n']
for line in new_css.split('\n'):
    escaped = line.replace('\\', '\\\\').replace('"', '\\"')
    java_lines.append(f'  + "{escaped}\\n"\n')
java_lines.append('  + "";\n')

new_content = lines[:start] + java_lines + lines[end:]

with open(src, 'w') as f:
    f.writelines(new_content)

print(f"AssetManager.java updated ({len(new_content)} lines)")
