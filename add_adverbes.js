#!/usr/bin/env node
/**
 * Ajoute la collection « Adverbes de degré (anglais) » — vocabulaire Dan.
 * Basé sur la liste du portail scolaire (ANGLAIS LV1, mid task).
 */
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CARDS = [
  { front: "very", back: "très" },
  { front: "really", back: "vraiment" },
  { front: "quite", back: "assez / plutôt" },
  { front: "too", back: "trop" },
  { front: "so", back: "tellement / si" },
  { front: "extremely", back: "extrêmement" },
  { front: "absolutely", back: "absolument" },
  { front: "completely", back: "complètement" },
  { front: "almost", back: "presque" },
  { front: "enough", back: "suffisamment" }
];

const COLLECTION = {
  slug: "adverbes-de-degre-anglais",
  title: "Adverbes de degré (anglais)",
  description: "Les intensificateurs anglais (mid task) : very, really, quite, too, so…",
  lang_from: "en",
  lang_to: "fr",
  position: 3,
  is_public: true
};

(async () => {
  // Vérifie si la collection existe déjà
  const { data: exists } = await sb.from('collections').select('id').eq('slug', COLLECTION.slug).maybeSingle();
  if (exists) {
    console.log('⚠️  Collection déjà existante, on ajoute seulement les cartes manquantes…');
    const { data: existing } = await sb.from('cards').select('front').eq('collection_id', exists.id);
    const have = new Set((existing || []).map(c => c.front.toLowerCase()));
    const rows = CARDS.filter(c => !have.has(c.front.toLowerCase()))
      .map((c, i) => ({ collection_id: exists.id, front: c.front, back: c.back, extra: null, position: 100 + i }));
    if (!rows.length) { console.log('rien à ajouter.'); return; }
    const { error } = await sb.from('cards').insert(rows);
    if (error) { console.error('err:', error.message); process.exit(1); }
    console.log('✓ ' + rows.length + ' cartes ajoutées');
    return;
  }

  // Crée la collection
  const { data: col, error: e2 } = await sb.from('collections').insert(COLLECTION).select().single();
  if (e2) { console.error('err création:', e2.message); process.exit(1); }
  console.log('✓ collection créée :', col.slug, '| position', col.position);

  const rows = CARDS.map((c, i) => ({
    collection_id: col.id, front: c.front, back: c.back, extra: null, position: i + 1
  }));
  const { error: e3 } = await sb.from('cards').insert(rows);
  if (e3) { console.error('err cartes:', e3.message); process.exit(1); }
  console.log('✓ ' + rows.length + ' cartes insérées');

  const { data: check } = await sb.from('collections').select('slug,title,position').order('position');
  console.log('\n=== COLLECTIONS FINALES ===');
  check.forEach(c => console.log(' ', c.position, '|', c.slug, '|', c.title));
})();
