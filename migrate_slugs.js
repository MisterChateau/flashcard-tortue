#!/usr/bin/env node
/**
 * Migration : préfixe la matière dans le slug des collections.
 * Convention : <matiere>:<sous-categorie>   (le title reste humain)
 */
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// slug actuel -> nouveau slug (convention matiere:sous-categorie)
const MAPPING = {
  'verbes-irreguliers-anglais': 'anglais:verbes-irreguliers',
  'adverbes-de-degre-anglais':  'anglais:adverbes-de-degre',
  'glossaire-litteraire':       'francais:glossaire-litteraire'
};

(async () => {
  const { data: cols, error } = await sb.from('collections').select('id, slug, title, position').order('position');
  if (error) { console.error(error.message); process.exit(1); }

  console.log('=== AVANT ===');
  cols.forEach(c => console.log(' ', c.position, '|', c.slug));

  for (const c of cols) {
    const next = MAPPING[c.slug];
    if (!next) { console.log('  (ignoré, pas dans le mapping):', c.slug); continue; }
    const { error: e } = await sb.from('collections').update({ slug: next }).eq('id', c.id);
    if (e) { console.error('  err sur', c.slug, ':', e.message); continue; }
    console.log('  ✓', c.slug, '->', next);
  }

  const { data: after } = await sb.from('collections').select('slug, title, position').order('position');
  console.log('\n=== APRÈS ===');
  after.forEach(c => console.log(' ', c.position, '|', c.slug, '|', c.title));
})();
