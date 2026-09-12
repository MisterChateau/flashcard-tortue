#!/bin/bash
cd /home/chapi/.openclaw/workspace/flashcards-tortue || exit 1
kill $(cat /tmp/fc_preview.pid 2>/dev/null) 2>/dev/null
rm -f /tmp/fc_preview.pid
set -a
[ -f .env ] && source .env
set +a
export PORT=3201
node src/server.js > /tmp/fc_preview.log 2>&1 &
SRV=$!
sleep 3
echo "$SRV" > /tmp/fc_preview.pid
node anim_test.js
kill $SRV 2>/dev/null
wait $SRV 2>/dev/null
rm -f /tmp/fc_preview.pid
