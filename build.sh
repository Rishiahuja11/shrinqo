#!/usr/bin/env bash
# Build LinkShort JAR + optional Cloudflare Tunnel setup
# Usage: bash build.sh
set -euo pipefail
cd "$(dirname "$0")"

echo "=== LinkShort Build ==="

# Check for Maven
if ! command -v mvn &>/dev/null; then
  echo "Maven not found. Installing..."
  if command -v apt &>/dev/null; then
    sudo apt update && sudo apt install -y maven
  elif command -v pkg &>/dev/null; then
    pkg install -y maven
  elif command -v brew &>/dev/null; then
    brew install maven
  else
    echo "ERROR: Cannot install Maven. Please install manually."
    echo "  Ubuntu/Debian: sudo apt install maven"
    echo "  macOS: brew install maven"
    echo "  Termux: pkg install maven"
    exit 1
  fi
fi

# Check for Java 17+
JAVA_VER=$(java -version 2>&1 | head -1 | grep -oP '\d+' | head -1)
if [ "${JAVA_VER:-0}" -lt 17 ]; then
  echo "ERROR: Java 17+ required. Found: java ${JAVA_VER:-unknown}"
  exit 1
fi

echo ">> Building fat JAR..."
mvn clean package -q -DskipTests

JAR="target/linkshort-1.0.0.jar"
if [ ! -f "$JAR" ]; then
  echo "ERROR: Build failed — $JAR not found"
  exit 1
fi

SIZE=$(du -h "$JAR" | cut -f1)
echo ""
echo "=== Build Complete ==="
echo "JAR: $JAR ($SIZE)"
echo ""
echo "=== Deployment Steps ==="
echo ""
echo "1. Copy the JAR to your friend's Minecraft server:"
echo "   scp $JAR friend@host:~/server/plugins/"
echo ""
echo "2. Add config to server/plugins/LinkShort/config.yml:"
echo "   github-token: YOUR_GITHUB_TOKEN"
echo "   site-url: https://short.smp45.qzz.io"
echo ""
echo "3. Install Cloudflare Tunnel on the Minecraft server:"
echo "   curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared"
echo "   chmod +x /usr/local/bin/cloudflared"
echo ""
echo "4. Start the tunnel (pointing to the plugin's HTTP port):"
echo "   cloudflared tunnel --url http://localhost:8080"
echo ""
echo "5. The tunnel will give you a *.trycloudflare.com URL."
echo "   Update your DNS (short.smp45.qzz.io CNAME) to point to the tunnel."
echo ""
echo "   OR use a named tunnel:"
echo "   cloudflared tunnel create linkshort"
echo "   cloudflared tunnel route dns linkshort short.smp45.qzz.io"
echo "   cloudflared tunnel run linkshort"
echo ""
echo "=== Done ==="
