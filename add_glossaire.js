#!/usr/bin/env node
/**
 * Crée la collection « Glossaire littéraire » (français) pour Dan.
 * Décalage des positions existantes pour placer la nouvelle en premier.
 */
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CARDS = [
  { front: "Acte", back: "Partie d'une pièce de théâtre. Un acte comporte des scènes.", extra: "" },
  { front: "Alexandrin", back: "Vers de douze syllabes.", extra: "" },
  { front: "Allégorie", back: "Figure de style : consiste à donner un visage ou un aspect concret à une réalité abstraite.", extra: "Marianne est l'allégorie de la France." },
  { front: "Allitération", back: "Figure de style : répétition d'un son consonne.", extra: "« Laisse-la s'élargir, cette sainte blessure. » (Musset, La Nuit de mai)" },
  { front: "Anachronisme", back: "Présence d'un élément qui ne correspond pas à l'époque de l'histoire.", extra: "Un téléphone dans un récit médiéval." },
  { front: "Anaphore", back: "Figure de style : répétition d'un mot ou d'une expression en début de vers, de groupe de mots, de proposition ou de phrase.", extra: "« Je veux, sans que la mort ose me secourir, / Toujours aimer, toujours souffrir, toujours mourir. » (Corneille, Suréna)" },
  { front: "Anticipation", back: "Consiste à bouleverser la chronologie d'un récit, pour raconter par avance des évènements qui se passeront plus tard (prophétie...). Contraire : retour en arrière.", extra: "" },
  { front: "Antithèse", back: "Figure de style : rapprochement de deux éléments opposés.", extra: "" },
  { front: "Antonyme", back: "Contraire.", extra: "Facile et difficile." },
  { front: "Aparté", back: "Nom masculin. Au théâtre, réplique prononcée « à part », comme si le personnage s'adressait à lui-même, et que seul le public est censé entendre.", extra: "" },
  { front: "Argument", back: "Raison que l'on donne pour défendre une idée.", extra: "" },
  { front: "Assonance", back: "Figure de style : répétition d'un son voyelle.", extra: "« Je fais souvent ce rêve étrange et pénétrant » (Verlaine, Mon rêve familier)" },
  { front: "Auteur", back: "Personne réelle qui a écrit un livre (à ne pas confondre avec le narrateur).", extra: "Virgile est l'auteur de l'Énéide." }
];

const COLLECTION = {
  slug: "glossaire-litteraire",
  title: "Glossaire littéraire",
  description: "Termes d'analyse littéraire et théâtrale (glossaire de manuel scolaire).",
  lang_from: "fr",
  lang_to: "fr",
  position: 1,
  is_public: true
};

(async () => {
  // 1. Décale les positions existantes
  const { data: existing, error: e1 } = await sb.from('collections').select('id, position');
  if (e1) { console.error('err lecture:', e1.message); process.exit(1); }

  for (const c of existing) {
    await sb.from('collections').update({ position: (c.position || 1) + 1 }).eq('id', c.id);
  }
  console.log('✓ positions décalées (' + existing.length + ' collections)');

  // 2. Crée la collection
  const { data: col, error: e2 } = await sb.from('collections').insert(COLLECTION).select().single();
  if (e2) { console.error('err création:', e2.message); process.exit(1); }
  console.log('✓ collection créée :', col.slug, '| position', col.position);

  // 3. Insère les cartes
  const rows = CARDS.map((c, i) => ({
    collection_id: col.id,
    front: c.front,
    back: c.back,
    extra: c.extra || null,
    position: i + 1
  }));
  const { error: e3 } = await sb.from('cards').insert(rows);
  if (e3) { console.error('err cartes:', e3.message); process.exit(1); }
  console.log('✓ ' + rows.length + ' cartes insérées');

  // 4. Vérification
  const { data: check } = await sb.from('collections').select('slug,title,position').order('position');
  console.log('\n=== COLLECTIONS FINALES ===');
  check.forEach(c => console.log(' ', c.position, '|', c.slug, '|', c.title));
  const { count } = await sb.from('cards').select('id', { count: 'exact', head: true });
  console.log('total cartes en base:', count);
})();
