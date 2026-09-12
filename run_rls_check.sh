#!/bin/bash
# Vérifie la RLS + affiche les policies actives.
# ⚠️ Token lu depuis l'environnement, jamais écrit ici.
cd "$(dirname "$0")" || exit 1

node scripts/check_rls.js
echo ""
echo "===== POLICIES ====="

if [ -z "$SB_MGMT_TOKEN" ] || [ -z "$SB_PROJECT_REF" ]; then
  echo "(SB_MGMT_TOKEN / SB_PROJECT_REF absents — affichage des policies ignoré)"
  exit 0
fi

node scripts/sb_query.js /dev/stdin <<'SQL'
select tablename, policyname, cmd, qual::text, with_check::text
from pg_policies where schemaname='public' order by tablename;
SQL
