#!/usr/bin/env node
/**
 * Flashcard Tortue — Script de seed via l'API Supabase (alternative au SQL)
 *
 * Usage :
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.js
 *
 * ⚠️ Nécessite la clé service_role (contourne la RLS).
 * Crée la collection « Verbes irréguliers anglais » + ses cartes.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  console.error('❌ SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.');
  process.exit(1);
}

const sb = createClient(URL, KEY, { auth: { persistSession: false } });

// Les 100 verbes (front, back, extra, level)
const VERBS = [
  ['be','was / were | been','être',1],
  ['have','had | had','avoir',1],
  ['do','did | done','faire',1],
  ['say','said | said','dire',1],
  ['go','went | gone','aller',1],
  ['get','got | got/gotten','obtenir, devenir',1],
  ['make','made | made','fabriquer, faire',1],
  ['know','knew | known','savoir, connaître',1],
  ['think','thought | thought','penser',1],
  ['take','took | taken','prendre',1],
  ['see','saw | seen','voir',1],
  ['come','came | come','venir',1],
  ['give','gave | given','donner',1],
  ['find','found | found','trouver',1],
  ['tell','told | told','raconter, dire à',1],
  ['become','became | become','devenir',1],
  ['leave','left | left','partir, quitter',1],
  ['feel','felt | felt','ressentir',1],
  ['put','put | put','poser, mettre',1],
  ['bring','brought | brought','apporter',1],
  ['begin','began | begun','commencer',1],
  ['keep','kept | kept','garder',1],
  ['hold','held | held','tenir',1],
  ['write','wrote | written','écrire',1],
  ['stand','stood | stood','être debout, supporter',1],
  ['hear','heard | heard','entendre',1],
  ['let','let | let','laisser, permettre',1],
  ['mean','meant | meant','signifier',1],
  ['set','set | set','poser, régler',1],
  ['meet','met | met','rencontrer',1],
  ['run','ran | run','courir',1],
  ['pay','paid | paid','payer',1],
  ['sit','sat | sat',"s'asseoir",1],
  ['speak','spoke | spoken','parler',1],
  ['lie','lay | lain','être allongé',1],
  ['lead','led | led','mener, conduire',1],
  ['read','read | read','lire (prononciation !)',1],
  ['grow','grew | grown','grandir, pousser',1],
  ['lose','lost | lost','perdre',1],
  ['fall','fell | fallen','tomber',1],
  ['send','sent | sent','envoyer',1],
  ['build','built | built','construire',1],
  ['understand','understood | understood','comprendre',1],
  ['draw','drew | drawn','dessiner, tirer',1],
  ['break','broke | broken','casser',1],
  ['spend','spent | spent','dépenser, passer (temps)',1],
  ['cut','cut | cut','couper',1],
  ['rise','rose | risen','se lever, monter',1],
  ['drive','drove | driven','conduire',1],
  ['buy','bought | bought','acheter',2],
  ['wear','wore | worn','porter (vêtement)',2],
  ['choose','chose | chosen','choisir',2],
  ['seek','sought | sought','chercher',2],
  ['throw','threw | thrown','lancer, jeter',2],
  ['catch','caught | caught','attraper',2],
  ['deal','dealt | dealt','traiter, distribuer',2],
  ['win','won | won','gagner',2],
  ['forget','forgot | forgotten','oublier',2],
  ['lay','laid | laid','poser, étendre',2],
  ['beat','beat | beaten','battre',2],
  ['bite','bit | bitten','mordre',2],
  ['blow','blew | blown','souffler',2],
  ['burn','burnt/burned | burnt','brûler',2],
  ['dream','dreamt/dreamed | dreamt','rêver',2],
  ['drink','drank | drunk','boire',2],
  ['eat','ate | eaten','manger',2],
  ['fight','fought | fought','se battre',2],
  ['fly','flew | flown','voler (dans les airs)',2],
  ['forgive','forgave | forgiven','pardonner',2],
  ['freeze','froze | frozen','geler',2],
  ['hang','hung | hung','accrocher, pendre',2],
  ['hide','hid | hidden','cacher',2],
  ['hit','hit | hit','frapper',2],
  ['hurt','hurt | hurt','blesser, faire mal',2],
  ['lend','lent | lent','prêter',2],
  ['light','lit | lit','allumer, éclairer',2],
  ['ride','rode | ridden','monter (vélo, cheval)',2],
  ['ring','rang | rung','sonner',2],
  ['sell','sold | sold','vendre',2],
  ['shake','shook | shaken','secouer',2],
  ['shine','shone | shone','briller',2],
  ['shoot','shot | shot','tirer (arme)',2],
  ['show','showed | shown','montrer',2],
  ['shut','shut | shut','fermer',2],
  ['sing','sang | sung','chanter',2],
  ['sink','sank | sunk','couler, sombrer',2],
  ['sleep','slept | slept','dormir',2],
  ['smell','smelt/smelled | smelt','sentir (odeur)',2],
  ['spread','spread | spread','répandre, étaler',2],
  ['steal','stole | stolen','voler (dérober)',2],
  ['stick','stuck | stuck','coller, coincer',2],
  ['strike','struck | struck','frapper, faire grève',2],
  ['swear','swore | sworn','jurer',2],
  ['sweep','swept | swept','balayer',2],
  ['swim','swam | swum','nager',2],
  ['tear','tore | torn','déchirer',2],
  ['wake','woke | woken','se réveiller',2]
];

async function main() {
  console.log('🐢 Seed Flashcard Tortue —', VERBS.length, 'verbes\n');

  // 1. Collection
  const { error: cErr } = await sb.from('collections').upsert({
    slug: 'verbes-irreguliers-anglais',
    title: 'Verbes irréguliers anglais',
    description: 'Les verbes irréguliers essentiels : base, prétérit, participe passé et traduction.',
    lang_from: 'en', lang_to: 'fr', is_public: true, position: 1
  }, { onConflict: 'slug' });
  if (cErr) { console.error('❌ Collection :', cErr.message); process.exit(1); }

  const { data: col } = await sb.from('collections')
    .select('id').eq('slug', 'verbes-irreguliers-anglais').single();
  console.log('✅ Collection créée :', col.id);

  // 2. Cartes
  const { data: existing } = await sb.from('cards')
    .select('front').eq('collection_id', col.id);
  const have = new Set((existing || []).map(c => c.front));

  const toInsert = VERBS
    .filter(v => !have.has(v[0]))
    .map((v, i) => ({
      collection_id: col.id,
      front: v[0], back: v[1], extra: v[2], level: v[3],
      position: i + 1
    }));

  if (!toInsert.length) {
    console.log('ℹ️  Toutes les cartes existent déjà.');
  } else {
    const { error: kErr } = await sb.from('cards').insert(toInsert);
    if (kErr) { console.error('❌ Cartes :', kErr.message); process.exit(1); }
    console.log('✅ Cartes insérées :', toInsert.length);
  }

  const { count } = await sb.from('cards')
    .select('id', { count: 'exact', head: true }).eq('collection_id', col.id);
  console.log('\n📊 Total cartes dans la collection :', count);
}

main().catch(e => { console.error('💥', e.message); process.exit(1); });
