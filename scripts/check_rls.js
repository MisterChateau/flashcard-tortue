#!/usr/bin/env node
/**
 * Vérifie précisément l'effet de la RLS sur la table reviews.
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env');
const env = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach(l => {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
});

(async () => {
  const anon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false }
  });

  console.log('=== A. reviews avec anon SANS auth ===');
  const { data: a, error: ae, count: ac } = await anon
    .from('reviews').select('card_id', { count: 'exact' });
  console.log('count:', ac, '| lignes renvoyées:', a ? a.length : 0, '| err:', ae ? ae.message : 'aucune');

  console.log('\n=== B. reviews avec anon + claim role anon (simulateur d attaque) ===');
  const { data: b, error: be } = await anon.from('reviews').select('*').limit(100);
  console.log('lignes:', b ? b.length : 0, '| err:', be ? be.message : 'aucune');

  console.log('\n=== C. user_stats avec anon SANS auth ===');
  const { data: c, error: ce, count: cc } = await anon
    .from('user_stats').select('*', { count: 'exact' });
  console.log('count:', cc, '| err:', ce ? ce.message : 'aucune');

  console.log('\n=== D. Tentative d INSERT avec anon SANS auth ===');
  const { error: de } = await anon.from('user_stats').insert({
    user_id: '00000000-0000-0000-0000-000000000000', score: 99999
  });
  console.log('insert:', de ? '❌ BLOQUÉ → ' + de.message : '⚠️ AUTORISÉ !');

  console.log('\n=== E. Tentative de SELECT collections/cards (doit être OK) ===');
  const { data: e1 } = await anon.from('collections').select('slug');
  const { data: e2 } = await anon.from('cards').select('front').limit(2);
  console.log('collections:', e1 ? e1.length : 0, '| cards:', e2 ? e2.length : 0);

  console.log('\n=== F. Policies actives sur reviews ===');
})();
