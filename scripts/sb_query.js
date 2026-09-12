#!/usr/bin/env node
/**
 * Exécute une requête SQL sur le projet Supabase via l'API management
 * (endpoint /v1/projects/{ref}/database/query).
 *
 * Usage: node scripts/sb_query.js <fichier.sql>
 */
const fs = require('fs');

const TOKEN = process.env.SB_MGMT_TOKEN;
const REF = process.env.SB_PROJECT_REF;
const file = process.argv[2];

if (!TOKEN || !REF || !file) {
  console.error('Usage: SB_MGMT_TOKEN=... SB_PROJECT_REF=... node sb_query.js <fichier.sql>');
  process.exit(1);
}

const sql = fs.readFileSync(file, 'utf8');

(async () => {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  const text = await res.text();
  console.log('HTTP', res.status);
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log(text);
  }
  if (!res.ok) process.exit(1);
})();
