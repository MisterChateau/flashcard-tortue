#!/bin/bash
# Démarre le serveur sur le port 3201 (aperçu).
# Les credentials sont lues depuis .env — jamais écrites ici.
cd "$(dirname "$0")" || exit 1

set -a
[ -f .env ] && source .env
set +a

export PORT=3201
node src/server.js > /tmp/fc_preview.log 2>&1 &
SRV=$!
sleep 3
echo "serveur prêt (pid $SRV) sur http://localhost:3201"
echo "$SRV" > /tmp/fc_preview.pid
