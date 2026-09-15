#!/bin/bash
cd /home/chapi/.openclaw/workspace/flashcards-tortue || exit 1
set -a
[ -f .env ] && source .env
set +a
node migrate_slugs.js
