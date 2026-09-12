/**
 * Flashcard Tortue — Couche base de données Supabase
 *
 * 🔒 Deux clients :
 *   - `anonClient`      : clé anon publique, utilisée pour VALIDER le token JWT
 *                         de l'utilisateur (auth.getUser).
 *   - `adminClient`     : clé service_role, utilisée côté serveur uniquement
 *                         pour lire les cartes publiques et écrire les révisions
 *                         après avoir vérifié l'identité de l'utilisateur.
 *
 * La RLS protège les tables : même avec la clé anon, un utilisateur ne peut
 * accéder qu'à ses propres lignes de `reviews` et `user_stats`.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL) console.error('❌ Variable SUPABASE_URL requise.');

const adminClient = createClient(
  SUPABASE_URL,
  SERVICE_KEY || ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const anonClient = createClient(
  SUPABASE_URL,
  ANON_KEY || SERVICE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

if (!SERVICE_KEY) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY manquante — fallback sur anon. Configurez-la !');
}

/**
 * Vérifie un JWT Supabase et retourne l'utilisateur, ou null.
 * @param {string} authHeader  En-tête "Authorization: Bearer <jwt>"
 */
async function getUserFromRequest(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const jwt = authHeader.slice(7).trim();
  if (!jwt) return null;
  try {
    const { data, error } = await anonClient.auth.getUser(jwt);
    if (error || !data || !data.user) return null;
    return data.user;
  } catch (e) {
    console.error('getUserFromRequest:', e.message);
    return null;
  }
}

module.exports = { adminClient, anonClient, getUserFromRequest };
