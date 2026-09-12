#!/bin/bash
# Supprime le compte de test et ses données.
# ⚠️ Token lu depuis l'environnement, jamais écrit ici.
cd "$(dirname "$0")" || exit 1

if [ -z "$SB_MGMT_TOKEN" ] || [ -z "$SB_PROJECT_REF" ]; then
  echo "❌ Définis SB_MGMT_TOKEN et SB_PROJECT_REF dans l'environnement."
  exit 1
fi

node scripts/sb_query.js /dev/stdin <<'SQL'
select count(*) as users from auth.users;
select count(*) as revisions from public.reviews;
select count(*) as stats from public.user_stats;
select count(*) as cartes from public.cards;
SQL
