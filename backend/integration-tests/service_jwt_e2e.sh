#!/usr/bin/env bash
# Simple E2E test: generate a short HS256 JWT and call the custom admin settings endpoint
set -euo pipefail

# Read BACKEND_SERVICE_KEY from backend .env or env
if [ -z "${BACKEND_SERVICE_KEY:-}" ]; then
  echo "Please set BACKEND_SERVICE_KEY in the environment before running this script."
  exit 2
fi

## Build JWT (header.payload.signature) using node and capture into TOKEN
TOKEN=$(node - <<'NODE'
const crypto = require('crypto')
const key = process.env.BACKEND_SERVICE_KEY
if (!key) { console.error('BACKEND_SERVICE_KEY not set'); process.exit(2) }
const now = Math.floor(Date.now()/1000)
const header = { alg: 'HS256', typ: 'JWT' }
const payload = { service: 'admin', iat: now, exp: now + 300 }
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_')
const unsigned = `${b64(header)}.${b64(payload)}`
const sig = crypto.createHmac('sha256', key).update(unsigned).digest('base64').replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_')
console.log(unsigned + '.' + sig)
NODE
)

echo "Using token: ${TOKEN:0:32}..."

curl -sS -X GET "http://localhost/custom/admin/settings" -H "Authorization: Bearer $TOKEN" | jq || true

