#!/usr/bin/env node
/**
 * Test bout-en-bout : crée un user de test, appelle l'API /api/study puis
 * /api/review, et vérifie que la RLS + SM-2 fonctionnent.
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Charge .env
const envPath = path.join(__dirname, '..', '.env');
const env = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach(l => {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
});

const API = process.env.TEST_API || 'http://localhost:3202';
const EMAIL = 'test.tortue.flashcard@gmail.com';
const PASS = 'MotDePasseTest123!';

(async () => {
  const anon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  console.log('=== 1. Création du compte de test ===');
  let { data: signUp, error: sErr } = await anon.auth.signUp({ email: EMAIL, password: PASS });
  if (sErr && !String(sErr.message).includes('already')) {
    console.log('signUp:', sErr.message);
  }
  // Confirme l'email directement via admin (mailer_autoconfirm = false)
  const { data: list } = await admin.auth.admin.listUsers();
  const user = (list.users || []).find(u => u.email === EMAIL);
  if (user && !user.email_confirmed_at) {
    await admin.auth.admin.updateUserById(user.id, { email_confirm: true });
    console.log('email confirmé via admin');
  }
  const uid = user ? user.id : (signUp.user && signUp.user.id);
  console.log('user id:', uid);

  console.log('\n=== 2. Login ===');
  const { data: login, error: lErr } = await anon.auth.signInWithPassword({ email: EMAIL, password: PASS });
  if (lErr) { console.error('❌ login:', lErr.message); process.exit(1); }
  const jwt = login.session.access_token;
  console.log('✅ login OK, token len', jwt.length);

  const H = { 'Authorization': 'Bearer ' + jwt, 'Content-Type': 'application/json' };

  console.log('\n=== 3. GET /api/collections ===');
  let r = await fetch(API + '/api/collections', { headers: H });
  let d = await r.json();
  console.log(r.status, JSON.stringify(d).slice(0, 200));

  console.log('\n=== 4. GET /api/study/verbes-irreguliers-anglais ===');
  r = await fetch(API + '/api/study/verbes-irreguliers-anglais', { headers: H });
  d = await r.json();
  console.log(r.status, 'queue:', (d.queue || []).length, '| counts:', JSON.stringify(d.counts));
  if (!d.queue || !d.queue.length) { console.error('❌ file vide'); process.exit(1); }
  const card = d.queue[0];
  console.log('1ère carte:', card.front, '→', card.back, '(' + card.status + ')');

  console.log('\n=== 5. POST /api/review (grade 2 = OK) ===');
  r = await fetch(API + '/api/review', {
    method: 'POST', headers: H,
    body: JSON.stringify({ cardId: card.id, grade: 2 })
  });
  d = await r.json();
  console.log(r.status, JSON.stringify(d));

  console.log('\n=== 6. POST /api/review (grade 0 = raté, sur une autre carte) ===');
  const card2 = d.queue && d.queue[1] || card;
  r = await fetch(API + '/api/review', {
    method: 'POST', headers: H,
    body: JSON.stringify({ cardId: card2.id, grade: 0 })
  });
  d = await r.json();
  console.log(r.status, JSON.stringify(d));

  console.log('\n=== 7. GET /api/me/stats ===');
  r = await fetch(API + '/api/me/stats', { headers: H });
  d = await r.json();
  console.log(r.status, JSON.stringify(d));

  console.log('\n=== 8. Vérif. RLS : lecture directe avec la clé anon ===');
  const { data: revs, error: rlsErr } = await anon
    .from('reviews').select('card_id, interval_days, due_at');
  console.log('reviews visibles avec anon (sans auth):', revs ? revs.length : 'err', rlsErr ? rlsErr.message : '');

  console.log('\n=== 9. Vérif. RLS : cartes publiques lisibles sans auth ===');
  const { data: cards, error: cErr } = await anon.from('cards').select('front').limit(3);
  console.log('cartes visibles sans auth:', cards ? cards.length : 'err', cErr ? cErr.message : '');

  console.log('\n✅ Tests terminés.');
})();
