// Simule le rendu du groupement pour vérification visuelle
const collections = [
  { slug: 'francais:glossaire-litteraire', title: 'Glossaire littéraire', description: "Termes d'analyse littéraire et théâtrale.", cards_count: 13 },
  { slug: 'anglais:verbes-irreguliers', title: 'Verbes irréguliers anglais', description: 'Les verbes irréguliers essentiels.', cards_count: 99 },
  { slug: 'anglais:adverbes-de-degre', title: 'Adverbes de degré (anglais)', description: 'Les intensificateurs anglais.', cards_count: 10 }
];
const MATIERES = {
  anglais: { emoji: '🇬🇧', label: 'Anglais', color: '#E1000F' },
  francais: { emoji: '🇫🇷', label: 'Français', color: '#4C0297' }
};
const groups = new Map();
collections.forEach(c => {
  const i = c.slug.indexOf(':');
  const k = i < 0 ? '__autres__' : c.slug.slice(0, i);
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(c);
});
groups.forEach((items, key) => {
  const m = key === '__autres__' ? { emoji: '📚', label: 'Autres' } : (MATIERES[key] || { emoji: '📚', label: key });
  const total = items.reduce((s, c) => s + c.cards_count, 0);
  console.log(`\n${m.emoji}  ${m.label.toUpperCase()}  (${items.length} coll. · ${total} cartes)`);
  items.forEach(c => console.log(`     └─ ${c.title} — ${c.cards_count} cartes`));
});
