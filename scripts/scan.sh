#!/usr/bin/env bash
# Backstop secret scan over the exported repo tree.
# Fails (non-zero) if any high-risk pattern is found that wasn't redacted.
set -euo pipefail

ROOT="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$ROOT"

echo "[scan] scope: $ROOT"

FAIL=0

scan() {
  local label="$1" pattern="$2"
  # -n line numbers; exclude MANIFEST + this script; allow __REDACTED__ as safe sentinel
  if grep -RInE --exclude-dir=.git --exclude=MANIFEST.tsv --exclude-dir=scripts \
       "$pattern" . | grep -v '__REDACTED__' ; then
    echo "[scan] FAIL: $label matched"
    FAIL=1
  fi
}

# Bearer tokens
scan "bearer-token"       'Bearer [A-Za-z0-9]{20,}'
# Provider-prefixed tokens
scan "provider-token"     '\b(sk|ghp|gho|ghu|ghs|glpat|xoxb|xoxp|AKIA)[_-][A-Za-z0-9_-]{16,}\b'
# Google API keys
scan "google-api-key"     'AIza[0-9A-Za-z_-]{20,}'
# Private keys
scan "private-key"        'BEGIN (RSA|OPENSSH|EC|DSA|PGP) PRIVATE KEY'
# JWT
scan "jwt"                'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'
# Hex-looking 64+ char opaque secrets on token-ish lines
scan "hex-secret-line"    '(token|secret|password|api[_-]?key).{0,8}[:=].{0,4}[a-f0-9]{32,}'
# Absolute home paths leak machine/user identifiers
scan "absolute-home-path" '/Users/[A-Za-z0-9._-]+'

# Public IPv4s can reveal infrastructure. Ignore private/local/reserved ranges.
if grep -RInE --exclude-dir=.git --exclude=MANIFEST.tsv --exclude-dir=scripts \
     '\b([0-9]{1,3}\.){3}[0-9]{1,3}\b' . \
     | grep -vE '127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|0\.0\.0\.0|255\.255\.255\.255' \
     | grep -v '__REDACTED__'; then
  echo "[scan] FAIL: public-ipv4 matched"
  FAIL=1
fi

if [[ $FAIL -ne 0 ]]; then
  echo "[scan] SECRETS/IDENTIFIERS DETECTED — export is NOT public-safe. Review and redact."
  exit 1
fi
echo "[scan] clean"
