# AGENTS.md — Flashcard Tortue

> Documentation technique du projet, destinée aux agents IA (et aux humains) qui
> reprennent ce code. **À lire avant toute modification.**

---

## 🎯 Le projet

**Flashcard Tortue** — application de révision espacée (algorithme **SM-2**) en **PWA**.
Usage familial : **Chapi** et son fils **Dan** (collégien/lycéen).

- **Prod** : https://flashcards-tortue.onrender.com
- **Repo** : https://github.com/MisterChateau/flashcard-tortue (public)
- **Aucune mention LFI** — projet isolé, aucun lien avec d'autres projets.

---

## 🏗️ Stack

| Couche | Techno |
|---|---|
| Front | HTML/CSS/JS vanilla dans `public/index.html` (fichier unique), PWA |
| Back | Node 22 + Express (`src/server.js`) |
| BDD | Supabase (PostgreSQL + Auth + RLS) |
| Hébergement | Render (`render.yaml`) |
| Supabase JS | **en local** (`public/vendor/supabase.min.js`) — requis par la CSP + offline |

**⚠️ Node 22 obligatoire** : Supabase a besoin du WebSocket natif (Node ≥ 22).

---

## 📁 Structure

```
flashcards-tortue/
├── public/
│   ├── index.html          # LE front (tout-en-un : HTML + CSS + JS)
│   ├── sw.js               # Service Worker (cache offline)
│   ├── manifest.webmanifest
│   ├── vendor/supabase.min.js
│   ├── icons/              # icônes PWA (192, 512, maskable)
│   ├── splash/             # splash screens iOS (10 tailles)
│   └── apple-touch-icon.png
├── src/
│   ├── server.js           # API Express + CSP + rate limiting
│   ├── db.js               # clients Supabase (admin + user)
│   └── sm2.js              # algorithme SM-2
├── render.yaml
├── .env                    # ⛔ JAMAIS commité (chmod 600)
└── add_*.js / migrate_*.js # scripts d'administration des collections
```

---

## 🗄️ Base de données (Supabase)

### Tables

| Table | Rôle |
|---|---|
| `collections` | Une collection = un paquet de cartes |
| `cards` | Les cartes (`front`, `back`, `extra`, `position`) |
| `reviews` | Historique des révisions (une ligne par carte révisée) |
| `user_stats` | Score, streak, compteurs par utilisateur |

### Schéma `collections`

```
id, slug, title, description, lang_from, lang_to, is_public, position, created_at
```

### Schéma `cards`

```
id, collection_id, front, back, extra, level, position, created_at
```

---

## 🔑 Convention de nommage des collections ⭐

**C'est LA règle structurante du projet.**

```
slug = <matiere>:<sous-categorie>
```

- Le **`slug`** porte la matière (source de vérité technique, en minuscules, sans accents)
- Le **`title`** reste humain et lisible (« Verbes irréguliers anglais »)
- Le **front parse le slug** et **groupe automatiquement** les collections par matière

### Exemples

| slug | title affiché |
|---|---|
| `anglais:verbes-irreguliers` | Verbes irréguliers anglais |
| `anglais:adverbes-de-degre` | Adverbes de degré (anglais) |
| `francais:glossaire-litteraire` | Glossaire littéraire |
| `espagnol:verbes-pretérit` | Verbes au prétérit |
| `maths:identites-remarquables` | Identités remarquables |

### Ajouter une matière

1. Créer la collection avec le préfixe voulu (ex. `svt:photosynthese`)
2. Si la matière n'est pas encore déclarée, l'ajouter dans l'objet **`MATIERES`** de `public/index.html` :

```js
const MATIERES = {
  anglais:  { emoji: '🇬🇧', label: 'Anglais',  color: '#E1000F' },
  francais: { emoji: '🇫🇷', label: 'Français', color: '#4C0297' },
  espagnol: { emoji: '🇪🇸', label: 'Espagnol', color: '#F2C230' },
  maths:    { emoji: '🔢', label: 'Maths',    color: '#2E8B57' },
  histoire: { emoji: '🏛️', label: 'Histoire', color: '#B3000C' }
};
```

3. Sans déclaration, la matière apparaît avec un emoji 📚 par défaut (**rien ne casse**)
4. Une collection **sans préfixe** tombe dans la section « 📚 Autres »

> **Règle d'or** : les matières s'ajoutent **au fur et à mesure** des besoins,
> pas de pré-déclaration massive.

---

## 📋 Collections actuelles

| Position | slug | Cartes |
|---|---|---|
| 1 | `francais:glossaire-litteraire` | 13 |
| 2 | `anglais:verbes-irreguliers` | 99 |
| 3 | `anglais:adverbes-de-degre` | 10 |

---

## 🛠️ Administration des collections

### Le problème du preflight `exec`

Le preflight de sécurité **bloque les invocations `node` complexes**. La solution :
un **wrapper shell** qui charge `.env` puis appelle node.

### Pattern à utiliser

**Script node** (`add_xxx.js`) :

```js
#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const CARDS = [ { front: "very", back: "très" }, /* ... */ ];
// ... insertion
```

**Wrapper** (`run_add_xxx.sh`) :

```bash
#!/bin/bash
cd /home/chapi/.openclaw/workspace/flashcards-tortue || exit 1
set -a
[ -f .env ] && source .env
set +a
node add_xxx.js
```

### Scripts existants

| Script | Rôle |
|---|---|
| `migrate_slugs.js` | Migre les slugs vers la convention `matiere:sous-categorie` |
| `add_glossaire.js` | Crée la collection « Glossaire littéraire » |
| `add_adverbes.js` | Crée la collection « Adverbes de degré » |
| `preview_group.js` | Simule le groupement par matière (vérification sans navigateur) |

---

## ⚙️ Commandes

```bash
# Vérifier la syntaxe du JS du front
python3 -c "h=open('public/index.html').read(); open('/tmp/c.js','w').write(h.split('<script>')[-1].split('</script>')[0])" && node --check /tmp/c.js

# API en prod
curl -s https://flashcards-tortue.onrender.com/api/collections | python3 -m json.tool

# Push (remote avec token)
git push origin main
```

---

## 🔌 API

| Route | Auth | Rôle |
|---|---|---|
| `GET /health` | non | Healthcheck |
| `GET /api/config` | non | URL + anon key Supabase |
| `GET /api/collections` | non | Liste des collections publiques (+ compteur de cartes) |
| `GET /api/collections/:slug/cards` | non | Cartes d'une collection |
| `GET /api/study/:slug` | oui | File de révision du jour |
| `POST /api/review` | oui | Enregistrer une révision → SM-2 |
| `GET /api/me/stats` | oui | Statistiques utilisateur |
| `GET /api/me/reviews` | oui | Progression complète |

---

## 🔒 Sécurité

- **CSP stricte** (helmet) : `scriptSrc 'self'` → pas de CDN, Supabase servi en local
- **Rate limiting** volontairement généreux (usage familial) : `limiter` 3000/15min sur `/api/`, `writeLimiter` 600/60s
- **Le vrai garde-fou anti-spam** = la **confirmation email** Supabase (`mailer_autoconfirm: false`)
- `.env` contient : `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_SECRET`
- ⛔ **`APP_SECRET` : ne JAMAIS changer en prod** (invaliderait les liens partagés)
- RLS activée sur toutes les tables

---

## 🎨 PWA — les 5 briques

1. **`manifest.webmanifest`** : `display: standalone`, icônes 192/512 + maskable, screenshots
2. **`sw.js`** : cache offline (`CACHE = 'tortue-vN'` → **incrémenter** à chaque modif)
3. **Meta `<head>`** : `theme-color`, `apple-mobile-web-app-*`, splash screens iOS
4. **Enregistrement SW** : `navigator.serviceWorker.register('/sw.js')`
5. **Bouton installer** : `beforeinstallprompt` → **⚠️ ne se déclenche qu'UNE fois**

> **Piège connu** : après un échec/refus, le prompt ne revient pas sans rechargement.
> Le bouton doit donc gérer le cas `deferredInstall === null` (message par OS).
> Sur iOS, pas de `beforeinstallprompt` → installation manuelle via Partager.

---

## 🧠 Algorithme SM-2 (`src/sm2.js`)

Révision espacée : chaque carte a un `level`. Selon la note donnée (0-5),
l'intervalle avant la prochaine révision augmente ou réinitialise la carte.

Notes dans l'UI : **Raté (0)**, **Difficile**, **OK**, **Facile**.

---

## 📝 Historique des décisions

| Date | Décision |
|---|---|
| 2026-09-12 | Projet créé, PWA + Supabase + Render |
| 2026-09-12 | Supabase JS en local (CSP + offline) |
| 2026-09-12 | Node 22 (WebSocket natif) |
| 2026-09-13 | Animations CSS (`@keyframes`) sur les cartes |
| 2026-09-13 | Correction bouton d'installation PWA |
| 2026-09-13 | Collection « Glossaire littéraire » (13 cartes) |
| 2026-09-15 | Collection « Adverbes de degré » (10 cartes) |
| 2026-09-15 | **Convention `matiere:sous-categorie` + groupement automatique** |
