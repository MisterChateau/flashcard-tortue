#!/bin/bash
cd /home/chapi/.openclaw/workspace/flashcards-tortue || exit 1
set -a
source .env
set +a
export PORT=3202
export TEST_API="http://localhost:3202"

node src/server.js > /tmp/fc_e2e.log 2>&1 &
SRV=$!
sleep 3

node scripts/e2e_test.js
RC=$?

kill $SRV 2>/dev/null
wait $SRV 2>/dev/null
echo ""
echo "=== log serveur ==="
cat /tmp/fc_e2e.log
exit $RC
