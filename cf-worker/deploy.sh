#!/usr/bin/env bash
# Deploy LinkShort to Cloudflare Workers from any device (no wrangler needed).
# Usage:
#   export CF_ACCOUNT_ID="<your 32-char account id>"
#   export CF_API_TOKEN="<api token with Workers Scripts Edit + KV Edit>"
#   ./deploy.sh
# The KV namespace is created automatically on first run (id cached in kv-id.txt).
set -euo pipefail
cd "$(dirname "$0")"

[ -n "${CF_ACCOUNT_ID:-}" ] || { echo "ERROR: CF_ACCOUNT_ID not set"; exit 1; }
[ -n "${CF_API_TOKEN:-}" ] || { echo "ERROR: CF_API_TOKEN not set"; exit 1; }
[ -n "${GITHUB_TOKEN:-}" ] || { echo "ERROR: GITHUB_TOKEN not set (GitHub fine-grained PAT with Contents read/write on GITHUB_REPO)"; exit 1; }

SCRIPT="linkshort"
BASE="https://api.cloudflare.com/client/v4"
AUTH="Authorization: Bearer $CF_API_TOKEN"

echo ">> Building worker with embedded assets..."
node build.mjs

KV_ID="${CF_KV_ID:-}"
if [ -z "$KV_ID" ] && [ -f kv-id.txt ]; then KV_ID="$(cat kv-id.txt)"; fi
if [ -z "$KV_ID" ]; then
  echo ">> Creating KV namespace..."
  KV_ID="$(curl -s -X POST "$BASE/accounts/$CF_ACCOUNT_ID/storage/kv/namespaces" \
    -H "$AUTH" -H 'Content-Type: application/json' \
    -d '{"title":"linkshort-kv"}' \
    | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const r=JSON.parse(s);if(!r.success){console.error(JSON.stringify(r.errors));process.exit(1)}console.log(r.result.id)})')"
  echo "$KV_ID" > kv-id.txt
  echo "   namespace id: $KV_ID (cached in kv-id.txt)"
fi

META="$(mktemp)"
cat > "$META" <<EOF
{"main_module":"worker.js","compatibility_date":"2025-01-01","bindings":[{"type":"kv_namespace","name":"KV","namespace_id":"$KV_ID"},{"type":"secret_text","name":"GITHUB_TOKEN","text":"$GITHUB_TOKEN"},{"type":"plain_text","name":"GITHUB_OWNER","text":"${GITHUB_OWNER:-Rishiahuja11}"},{"type":"plain_text","name":"GITHUB_REPO","text":"${GITHUB_REPO:-file2link-storage}"},{"type":"plain_text","name":"GITHUB_BRANCH","text":"${GITHUB_BRANCH:-main}"}]}
EOF

echo ">> Uploading worker '$SCRIPT'..."
RESP="$(curl -s -X PUT "$BASE/accounts/$CF_ACCOUNT_ID/workers/scripts/$SCRIPT" \
  -H "$AUTH" \
  -F "metadata=<$META;type=application/json" \
  -F "worker.js=@dist/worker.js;filename=worker.js;type=application/javascript+module")"
rm -f "$META"

echo "$RESP" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const r=JSON.parse(s);if(!r.success){console.error("DEPLOY FAILED:",JSON.stringify(r.errors));process.exit(1)}console.log("   deployed ok — startup",r.result?.startup_time_ms+"ms, has_modules",r.result?.has_modules)})'

echo ">> Ensuring workers.dev subdomain is enabled..."
curl -s -X POST "$BASE/accounts/$CF_ACCOUNT_ID/workers/scripts/$SCRIPT/subdomain" \
  -H "$AUTH" -H 'Content-Type: application/json' -d '{"enabled":true}' > /dev/null

SUB="$(curl -s "$BASE/accounts/$CF_ACCOUNT_ID/workers/subdomain" -H "$AUTH")"
echo "$SUB" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const r=JSON.parse(s);const sub=r.result&&r.result.subdomain||"";console.log("   test URL: https://linkshort."+sub+".workers.dev")}catch(e){console.log("   enable Workers.dev on the script (or add a custom domain) to test")}})'
echo ">> Done."
