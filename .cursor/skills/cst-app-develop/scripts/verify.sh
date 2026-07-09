#!/usr/bin/env bash
# CST app verification gate — agents must run before every PR
set -euo pipefail
cd "$(dirname "$0")/../../../.."

echo "→ lint"
npm run lint

echo "→ test"
npm run test:run

echo "→ build"
npm run build

echo "✓ All checks passed"
