/**
 * Flashcard Tortue — Serveur Express
 *
 * Routes API :
 *   GET  /health                              : healthcheck
 *   GET  /api/config                          : config publique (URL + anon key Supabase)
 *   GET  /api/collections                     : liste des collections publiques
 *   GET  /api/collections/:slug/cards         : cartes d'une collection
 *   GET  /api/study/:slug                     : file de révision du jour (auth)
 *   POST /api/review                          : enregistrer une révision (auth) → SM-2
 *   GET  /api/me/stats                        : statistiques de l'utilisateur (auth)
 *   GET  /api/me/reviews                      : progression complète (auth)
 *   GET  /                                    : front (PWA)
 */

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { adminClient, getUserFromRequest } = require('./db');
const { schedule, nextDue, todayKey } = require('./sm2');

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '256kb' }));

// 🔒 Sécurité : pas de referrer, pas d'embed, CSP stricte.
// Supabase est servi en local (/vendor/) → aucun script tiers, ça marche offline.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  },
  referrerPolicy: { policy: 'no-referrer' },
  crossOriginEmbedderPolicy: false
}));

// 🔒 Rate limiting — volontairement généreux pour un usage familial.
// Le vrai garde-fou anti-spam, c'est la confirmation email de Supabase.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/config',
  message: { error: 'Trop de requêtes. Réessayez dans quelques minutes.' }
});
app.use('/api/', limiter);

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de révisions d\'un coup. Réessayez dans une minute.' }
});

// ---------- Config publique ----------
app.get('/health', (req, res) => res.json({ ok: true, app: 'flashcards-tortue' }));

app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
  });
});

// ---------- Collections ----------
app.get('/api/collections', async (req, res) => {
  const { data, error } = await adminClient
    .from('collections')
    .select('id, slug, title, description, lang_from, lang_to, position')
    .eq('is_public', true)
    .order('position', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });

  // Compteur de cartes par collection
  const withCounts = await Promise.all((data || []).map(async (c) => {
    const { count } = await adminClient
      .from('cards')
      .select('id', { count: 'exact', head: true })
      .eq('collection_id', c.id);
    return { ...c, cards_count: count || 0 };
  }));

  res.json({ collections: withCounts });
});

async function getCollectionBySlug(slug) {
  const { data, error } = await adminClient
    .from('collections')
    .select('*')
    .eq('slug', slug)
    .eq('is_public', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

app.get('/api/collections/:slug/cards', async (req, res) => {
  try {
    const col = await getCollectionBySlug(req.params.slug);
    if (!col) return res.status(404).json({ error: 'Collection introuvable.' });

    const { data, error } = await adminClient
      .from('cards')
      .select('id, front, back, extra, level, position')
      .eq('collection_id', col.id)
      .order('position', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });

    res.json({ collection: col, cards: data || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- File de révision du jour (auth requise) ----------
app.get('/api/study/:slug', async (req, res) => {
  const user = await getUserFromRequest(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Authentification requise.' });

  try {
    const col = await getCollectionBySlug(req.params.slug);
    if (!col) return res.status(404).json({ error: 'Collection introuvable.' });

    const { data: cards, error: cErr } = await adminClient
      .from('cards')
      .select('id, front, back, extra, level, position')
      .eq('collection_id', col.id)
      .order('position', { ascending: true });
    if (cErr) return res.status(500).json({ error: cErr.message });

    const { data: reviews, error: rErr } = await adminClient
      .from('reviews')
      .select('card_id, ease, interval_days, repetitions, lapses, due_at, last_grade')
      .eq('user_id', user.id);
    if (rErr) return res.status(500).json({ error: rErr.message });

    const byCard = new Map((reviews || []).map(r => [r.card_id, r]));
    const now = Date.now();

    const due = [];
    const fresh = [];
    for (const c of (cards || [])) {
      const r = byCard.get(c.id);
      if (!r) fresh.push(c);
      else if (new Date(r.due_at).getTime() <= now) due.push({ ...c, review: r });
    }

    // Les cartes déjà dues d'abord, puis les nouvelles (limitées à 20 par session)
    const queue = [
      ...due.map(c => ({ ...c, status: 'due' })),
      ...fresh.slice(0, 20).map(c => ({ ...c, status: 'new' }))
    ];

    res.json({
      collection: col,
      queue,
      counts: { due: due.length, new: fresh.length, total: (cards || []).length, seen: (reviews || []).length }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- Enregistrer une révision ----------
app.post('/api/review', writeLimiter, async (req, res) => {
  const user = await getUserFromRequest(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Authentification requise.' });

  const { cardId, grade, elapsedMs } = req.body || {};
  const g = Number(grade);
  if (!cardId || ![0, 1, 2, 3].includes(g)) {
    return res.status(400).json({ error: 'cardId et grade (0-3) requis.' });
  }

  try {
    // État actuel de la carte pour cet utilisateur
    const { data: existing } = await adminClient
      .from('reviews')
      .select('ease, interval_days, repetitions, lapses')
      .eq('user_id', user.id)
      .eq('card_id', cardId)
      .maybeSingle();

    const cur = existing || { ease: 2.5, interval_days: 0, repetitions: 0, lapses: 0 };
    const next = schedule(cur, g);

    const row = {
      user_id: user.id,
      card_id: cardId,
      ease: next.ease,
      interval_days: next.interval_days,
      repetitions: next.repetitions,
      lapses: next.lapses,
      due_at: nextDue(next.interval_days),
      last_grade: g,
      last_seen_at: new Date().toISOString()
    };

    const { error: upErr } = await adminClient
      .from('reviews')
      .upsert(row, { onConflict: 'user_id,card_id' });
    if (upErr) return res.status(500).json({ error: upErr.message });

    // Mise à jour des stats (score, total, streak)
    const { data: stats } = await adminClient
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const today = todayKey();
    let score = (stats?.score || 0) + next.points;
    let total = (stats?.total_reviews || 0) + 1;
    let streak = stats?.streak_days || 0;
    let best = stats?.best_streak || 0;

    if (stats?.last_activity !== today) {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yKey = yesterday.toISOString().slice(0, 10);
      if (stats?.last_activity === yKey) streak += 1;
      else if (stats?.last_activity) streak = 1;
      else streak = 1;
      best = Math.max(best, streak);
    }

    await adminClient.from('user_stats').upsert({
      user_id: user.id,
      score, total_reviews: total, streak_days: streak,
      best_streak: best, last_activity: today,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    res.json({
      ok: true,
      schedule: {
        interval_days: next.interval_days,
        due_at: row.due_at,
        ease: next.ease,
        repetitions: next.repetitions
      },
      gained: next.points,
      stats: { score, total_reviews: total, streak_days: streak, best_streak: best }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- Stats & progression ----------
app.get('/api/me/stats', async (req, res) => {
  const user = await getUserFromRequest(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Authentification requise.' });

  const { data, error } = await adminClient
    .from('user_stats')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });

  res.json({
    email: user.email,
    stats: data || { score: 0, total_reviews: 0, streak_days: 0, best_streak: 0 }
  });
});

app.get('/api/me/reviews', async (req, res) => {
  const user = await getUserFromRequest(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Authentification requise.' });

  const { data, error } = await adminClient
    .from('reviews')
    .select('card_id, ease, interval_days, repetitions, lapses, due_at, last_grade, last_seen_at')
    .eq('user_id', user.id);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ reviews: data || [] });
});

// ---------- Front statique ----------
app.use(express.static(path.join(__dirname, '..', 'public'), {
  setHeaders(res, filePath) {
    if (filePath.endsWith('sw.js')) res.setHeader('Cache-Control', 'no-cache');
    if (filePath.endsWith('.webmanifest')) res.setHeader('Content-Type', 'application/manifest+json');
  }
}));

app.get(/^\/(?!api|health).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const PORT = process.env.PORT || 3200;
app.listen(PORT, () => {
  console.log(`🐢 Flashcard Tortue en écoute sur le port ${PORT}`);
});
