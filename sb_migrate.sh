#!/bin/bash
# Applique le schéma + le seed via l'API management Supabase.
# ⚠️ Le token NE DOIT PAS être écrit dans ce fichier — il est lu depuis l'environnement.
#
# Usage :
#   export SB_MGMT_TOKEN="<ton-token-management>"
#   export SB_PROJECT_REF="xxxxxxxxxxxx"
#   ./sb_migrate.sh
cd "$(dirname "$0")" || exit 1

if [ -z "$SB_MGMT_TOKEN" ] || [ -z "$SB_PROJECT_REF" ]; then
  echo "❌ Définis SB_MGMT_TOKEN et SB_PROJECT_REF dans l'environnement."
  exit 1
fi

echo "===== 1. SCHÉMA ====="
node scripts/sb_query.js supabase_schema.sql
echo ""
echo "===== 2. SEED ====="
node scripts/sb_query.js seed_verbes.sql
