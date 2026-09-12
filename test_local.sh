#!/bin/bash
# Test local du serveur Flashcard Tortue (Supabase factice)
cd /home/chapi/.openclaw/workspace/flashcards-tortue || exit 1

export SUPABASE_URL="https://fake.supabase.co"
export SUPABASE_ANON_KEY="fake-anon"
export SUPABASE_SERVICE_ROLE_KEY="fake-service"
export PORT=3200

node src/server.js > /tmp/fc_server.log 2>&1 &
SRV=$!
sleep 3

echo "=== log serveur ==="
cat /tmp/fc_server.log
echo ""
echo "=== /health ==="
curl -s http://localhost:3200/health
echo ""
echo "=== /api/config ==="
curl -s http://localhost:3200/api/config
echo ""
echo "=== / (titre) ==="
curl -s http://localhost:3200/ | grep -o "<title>.*</title>"
echo "=== manifest ==="
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3200/manifest.webmanifest
echo "=== robots ==="
curl -s http://localhost:3200/robots.txt
echo "=== sw.js ==="
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3200/sw.js
echo "=== icon-512 ==="
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3200/icons/icon-512.png
echo "=== tortue.jpg ==="
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3200/tortue.jpg
echo "=== route SPA fallback /xyz ==="
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3200/xyz

kill $SRV 2>/dev/null
wait $SRV 2>/dev/null
echo "=== serveur arrêté ==="
