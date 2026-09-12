-- ============================================================
-- Flashcard Tortue — Seed : 100 verbes irréguliers anglais
-- ============================================================
-- Format : base (front) → "prétérit / participe passé" (back)
--          extra = traduction française
--          level : 1 = essentiel, 2 = courant, 3 = avancé
-- ============================================================

with col as (
  select id from public.collections where slug = 'verbes-irreguliers-anglais'
),
data(front, back, extra, level, position) as (
  values
  -- ---------- NIVEAU 1 — essentiels ----------
  ('be',        'was / were | been',        'être',                     1, 1),
  ('have',      'had | had',                'avoir',                    1, 2),
  ('do',        'did | done',               'faire',                    1, 3),
  ('say',       'said | said',              'dire',                     1, 4),
  ('go',        'went | gone',              'aller',                    1, 5),
  ('get',       'got | got/gotten',         'obtenir, devenir',         1, 6),
  ('make',      'made | made',              'fabriquer, faire',         1, 7),
  ('know',      'knew | known',             'savoir, connaître',        1, 8),
  ('think',     'thought | thought',        'penser',                   1, 9),
  ('take',      'took | taken',             'prendre',                  1, 10),
  ('see',       'saw | seen',               'voir',                     1, 11),
  ('come',      'came | come',              'venir',                    1, 12),
  ('flee',      'fled | fled',              'fuir',                     1, 13),
  ('give',      'gave | given',             'donner',                   1, 14),
  ('find',      'found | found',            'trouver',                  1, 15),
  ('tell',      'told | told',              'raconter, dire à',         1, 16),
  ('become',    'became | become',          'devenir',                  1, 17),
  ('leave',     'left | left',              'partir, quitter',          1, 18),
  ('feel',      'felt | felt',              'ressentir',                1, 19),
  ('put',       'put | put',                'poser, mettre',            1, 20),
  ('bring',     'brought | brought',        'apporter',                 1, 21),
  ('begin',     'began | begun',            'commencer',                1, 22),
  ('keep',      'kept | kept',              'garder',                   1, 23),
  ('hold',      'held | held',              'tenir',                    1, 24),
  ('write',     'wrote | written',          'écrire',                   1, 25),
  ('stand',     'stood | stood',            'être debout, supporter',   1, 26),
  ('hear',      'heard | heard',            'entendre',                 1, 27),
  ('let',       'let | let',                'laisser, permettre',       1, 28),
  ('mean',      'meant | meant',            'signifier',                1, 29),
  ('set',       'set | set',                'poser, régler',            1, 30),
  ('meet',      'met | met',                'rencontrer',               1, 31),
  ('run',       'ran | run',                'courir',                   1, 32),
  ('pay',       'paid | paid',              'payer',                    1, 33),
  ('sit',       'sat | sat',                's''asseoir',               1, 34),
  ('speak',     'spoke | spoken',           'parler',                   1, 35),
  ('lie',       'lay | lain',               'être allongé',             1, 36),
  ('lead',      'led | led',                'mener, conduire',          1, 37),
  ('read',      'read | read',              'lire (prononciation !)',   1, 38),
  ('grow',      'grew | grown',             'grandir, pousser',         1, 39),
  ('lose',      'lost | lost',              'perdre',                   1, 40),
  ('fall',      'fell | fallen',            'tomber',                   1, 41),
  ('send',      'sent | sent',              'envoyer',                  1, 42),
  ('build',     'built | built',            'construire',               1, 43),
  ('understand','understood | understood',  'comprendre',               1, 44),
  ('draw',      'drew | drawn',             'dessiner, tirer',          1, 45),
  ('break',     'broke | broken',           'casser',                   1, 46),
  ('spend',     'spent | spent',            'dépenser, passer (temps)', 1, 47),
  ('cut',       'cut | cut',                'couper',                   1, 48),
  ('rise',      'rose | risen',             'se lever, monter',         1, 49),
  ('drive',     'drove | driven',           'conduire',                 1, 50),

  -- ---------- NIVEAU 2 — courants ----------
  ('buy',       'bought | bought',          'acheter',                  2, 51),
  ('wear',      'wore | worn',              'porter (vêtement)',        2, 52),
  ('choose',    'chose | chosen',           'choisir',                  2, 53),
  ('seek',      'sought | sought',          'chercher',                 2, 54),
  ('throw',     'threw | thrown',           'lancer, jeter',            2, 55),
  ('catch',     'caught | caught',          'attraper',                 2, 56),
  ('deal',      'dealt | dealt',            'traiter, distribuer',      2, 57),
  ('win',       'won | won',                'gagner',                   2, 58),
  ('forget',    'forgot | forgotten',       'oublier',                  2, 59),
  ('lay',       'laid | laid',              'poser, étendre',           2, 61),
  ('beat',      'beat | beaten',            'battre',                   2, 62),
  ('bite',      'bit | bitten',             'mordre',                   2, 63),
  ('blow',      'blew | blown',             'souffler',                 2, 64),
  ('burn',      'burnt/burned | burnt',     'brûler',                   2, 65),
  ('dream',     'dreamt/dreamed | dreamt',  'rêver',                    2, 66),
  ('drink',     'drank | drunk',            'boire',                    2, 67),
  ('eat',       'ate | eaten',              'manger',                   2, 68),
  ('fight',     'fought | fought',          'se battre',                2, 69),
  ('fly',       'flew | flown',             'voler (dans les airs)',    2, 70),
  ('forgive',   'forgave | forgiven',       'pardonner',                2, 71),
  ('freeze',    'froze | frozen',           'geler',                    2, 72),
  ('hang',      'hung | hung',              'accrocher, pendre',        2, 73),
  ('hide',      'hid | hidden',             'cacher',                   2, 74),
  ('hit',       'hit | hit',                'frapper',                  2, 75),
  ('hurt',      'hurt | hurt',              'blesser, faire mal',       2, 76),
  ('lend',      'lent | lent',              'prêter',                   2, 77),
  ('light',     'lit | lit',                'allumer, éclairer',        2, 78),
  ('ride',      'rode | ridden',            'monter (à cheval, vélo)',  2, 79),
  ('ring',      'rang | rung',              'sonner',                   2, 80),
  ('sell',      'sold | sold',              'vendre',                   2, 81),
  ('shake',     'shook | shaken',           'secouer',                  2, 82),
  ('shine',     'shone | shone',            'briller',                  2, 83),
  ('shoot',     'shot | shot',              'tirer (arme)',             2, 84),
  ('show',      'showed | shown',           'montrer',                  2, 85),
  ('shut',      'shut | shut',              'fermer',                   2, 86),
  ('sing',      'sang | sung',              'chanter',                  2, 87),
  ('sink',      'sank | sunk',              'couler, sombrer',          2, 88),
  ('sleep',     'slept | slept',            'dormir',                   2, 89),
  ('smell',     'smelt/smelled | smelt',    'sentir (odeur)',           2, 90),
  ('spread',    'spread | spread',          'répandre, étaler',         2, 91),
  ('steal',     'stole | stolen',           'voler (dérober)',          2, 92),
  ('stick',     'stuck | stuck',            'coller, coincer',          2, 93),
  ('strike',    'struck | struck',          'frapper, faire grève',     2, 94),
  ('swear',     'swore | sworn',            'jurer',                    2, 95),
  ('sweep',     'swept | swept',            'balayer',                  2, 96),
  ('swim',      'swam | swum',              'nager',                    2, 97),
  ('tear',      'tore | torn',              'déchirer',                 2, 98),
  ('wake',      'woke | woken',             'se réveiller',             2, 99),
  ('wear out',  'wore out | worn out',      'user, épuiser',            2, 100)
)
insert into public.cards (collection_id, front, back, extra, level, position)
select col.id, data.front, data.back, data.extra, data.level, data.position
from col, data
where not exists (
  select 1 from public.cards c
  where c.collection_id = col.id and c.front = data.front
);

-- Vérification
select c.title, count(k.*) as nb_cartes
from public.collections c
left join public.cards k on k.collection_id = c.id
group by c.title;
