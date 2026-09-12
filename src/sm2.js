/**
 * Flashcard Tortue — Algorithme SM-2 (répétition espacée)
 *
 * Notes (grade) envoyées par l'utilisateur :
 *   0 = Raté        → reset : on révise à nouveau aujourd'hui / demain
 *   1 = Difficile   → intervalle court
 *   2 = OK          → intervalle normal
 *   3 = Facile      → intervalle long
 *
 * SM-2 classique : ease (facteur de facilité) borné [1.3, 2.8],
 * intervalle suivant = intervalle × ease.
 */

const MIN_EASE = 1.3;
const MAX_EASE = 2.8;

/**
 * Calcule le nouvel état d'une carte après une révision.
 * @param {{ease:number, interval_days:number, repetitions:number, lapses:number}} cur
 * @param {number} grade  0..3
 * @returns {{ease:number, interval_days:number, repetitions:number, lapses:number, points:number}}
 */
function schedule(cur, grade) {
  let ease = Number(cur.ease) || 2.5;
  let interval = Number(cur.interval_days) || 0;
  let reps = Number(cur.repetitions) || 0;
  let lapses = Number(cur.lapses) || 0;
  let points = 0;

  if (grade === 0) {
    // Échec : on repart de zéro, léger malus de facilité
    reps = 0;
    lapses += 1;
    interval = 0;           // dû immédiatement (revu dans la même session)
    ease = Math.max(MIN_EASE, ease - 0.2);
    points = 1;             // petite consolation pour l'effort
  } else {
    reps += 1;

    // Ajustement de la facilité selon la note
    if (grade === 1) ease = Math.max(MIN_EASE, ease - 0.15);
    else if (grade === 3) ease = Math.min(MAX_EASE, ease + 0.1);

    if (reps === 1) {
      interval = grade === 1 ? 1 : (grade === 2 ? 1 : 3);
    } else if (reps === 2) {
      interval = grade === 1 ? 3 : (grade === 2 ? 6 : 10);
    } else {
      const factor = grade === 1 ? 1.2 : (grade === 2 ? ease : ease * 1.3);
      interval = Math.round(interval * factor);
    }

    interval = Math.max(1, Math.min(interval, 365)); // borne 1 an
    points = grade === 1 ? 5 : (grade === 2 ? 10 : 15);
  }

  return { ease, interval_days: interval, repetitions: reps, lapses, points };
}

/** Date d'échéance à partir de maintenant + intervalle (jours). */
function nextDue(intervalDays) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + intervalDays);
  return d.toISOString();
}

/** Clé de jour UTC (YYYY-MM-DD) pour la série (streak). */
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

module.exports = { schedule, nextDue, todayKey, MIN_EASE, MAX_EASE };
