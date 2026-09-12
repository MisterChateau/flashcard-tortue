# 🐢 Flashcard Tortue

Application de révision par **répétition espacée (SM-2)** — PWA installable, synchro cloud.

Première collection : **les verbes irréguliers anglais** (100 verbes).

## Stack

- **Front** : PWA vanilla JS (installable sur mobile), charte graphique rouge/violet/crème
- **Back** : Node + Express (Render)
- **Base + Auth** : Supabase (Postgres + RLS + email/password)

## Fonctionnalités

- 🔐 Comptes email/mot de passe (Supabase Auth) — progression privée par utilisateur (RLS)
- 🧠 Répétition espacée SM-2 : notation **Raté / Difficile / OK / Facile** avec intervalles adaptatifs
- 📊 Score cumulé, total de révisions, série de jours consécutifs (streak)
- 📲 PWA installable (manifest + service worker, mode hors-ligne pour l'interface)
- 🗂️ Architecture multi-collections (prête pour d'autres matières)
- 🤫 `robots.txt` en `Disallow` — app non indexée

## Déploiement

### 1. Supabase

1. Créer un projet sur https://supabase.com/dashboard
2. **SQL Editor** → coller et exécuter `supabase_schema.sql` (tables + RLS + collection)
3. Coller et exécuter `seed_verbes.sql` (les 100 verbes)
4. **Settings → API** → noter :
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ secrète)

> Alternative au SQL : `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.js`

### 2. Render

1. Nouveau **Web Service** depuis le repo GitHub
2. `render.yaml` est fourni — ou configuration manuelle :
   - Build : `npm install`
   - Start : `node src/server.js`
3. Variables d'environnement à renseigner :
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 3. Auth Supabase (optionnel)

- **Authentication → Providers → Email** : désactiver « Confirm email » pour un login immédiat
- **Authentication → URL Configuration** : ajouter l'URL Render en `Site URL`

## Développement local

```bash
npm install
cp .env.example .env      # renseigner les 3 variables
node --watch src/server.js
# → http://localhost:3200
```

## Schéma des données

| Table | Rôle |
|---|---|
| `collections` | Collections publiques de cartes |
| `cards` | Cartes (front / back / extra / niveau) |
| `reviews` | État SM-2 par utilisateur × carte (ease, intervalle, échéance) |
| `user_stats` | Score, total de révisions, série de jours |

**RLS** : `reviews` et `user_stats` sont strictement privées (`auth.uid() = user_id`).
`collections` et `cards` sont en lecture publique.

## Routes API

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/health` | — | Healthcheck |
| GET | `/api/config` | — | URL + anon key Supabase |
| GET | `/api/collections` | — | Liste des collections |
| GET | `/api/collections/:slug/cards` | — | Cartes d'une collection |
| GET | `/api/study/:slug` | ✅ | File de révision du jour |
| POST | `/api/review` | ✅ | Enregistrer une révision (SM-2) |
| GET | `/api/me/stats` | ✅ | Statistiques utilisateur |
| GET | `/api/me/reviews` | ✅ | Progression complète |

## Ajouter une collection

```sql
insert into public.collections (slug, title, description, position)
values ('ma-nouvelle-collection', 'Titre', 'Description', 2);

insert into public.cards (collection_id, front, back, extra, level, position)
select id, 'recto', 'verso', 'complément', 1, 1
from public.collections where slug = 'ma-nouvelle-collection';
```

L'app la détecte automatiquement (aucun code à modifier).
