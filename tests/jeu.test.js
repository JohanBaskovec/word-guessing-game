'use strict';
// Tests de la logique du jeu. Lancer : node --test tests/
// Les scripts « mots », « aleatoire » et « jeu » sont extraits de index.html
// et exécutés dans un contexte isolé (aucune dépendance, aucun DOM).

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function charger() {
  const contexte = { window: {} };
  vm.createContext(contexte);
  for (const id of ['mots', 'aleatoire', 'jeu']) {
    const m = html.match(new RegExp('<script id="' + id + '">([\\s\\S]*?)</script>'));
    assert.ok(m, 'script ' + id + ' introuvable dans index.html');
    vm.runInContext(m[1], contexte, { filename: id + '.js' });
  }
  return contexte.window.Banger;
}

// Les objets créés dans le contexte vm ont d'autres prototypes : on compare via JSON.
const normalise = (x) => JSON.parse(JSON.stringify(x));
const deepEqual = (a, b, m) => assert.deepStrictEqual(normalise(a), normalise(b), m);
const notDeepEqual = (a, b, m) => assert.notDeepStrictEqual(normalise(a), normalise(b), m);

const B = charger();
const J = B.Jeu;
const R = B.Aleatoire;

// --- Utilitaires de test -----------------------------------------------------

function seeds(n) {
  const r = [];
  for (let i = 0; i < n; i++) r.push('T' + i);
  return r;
}

function compter(cle, couleur) { return cle.filter((c) => c === couleur).length; }

function indicesDe(etat, equipe, couleur) {
  return etat.cle[equipe].map((c, i) => (c === couleur ? i : -1)).filter((i) => i >= 0);
}

// Amène une partie jusqu'au premier écran « indice ».
function demarrer(seed) {
  let e = J.creerPartie(seed);
  e = J.basculerPret(e, 'A', true);
  e = J.basculerPret(e, 'B', true);
  e = J.finCompteARebours(e);
  return J.confirmerPassage(e);
}

// Donne un indice puis passe à l'écran de devinette.
function donnerIndice(e, nombre, mot) {
  e = J.validerIndice(e, mot || 'indicetest', nombre);
  return J.confirmerPassage(e);
}

// Cherche une partie (parmi plusieurs seeds) qui vérifie un prédicat.
function chercher(predicat) {
  for (let i = 0; i < 2000; i++) {
    const e = J.creerPartie('C' + i);
    if (predicat(e)) return e;
  }
  throw new Error('aucune partie ne vérifie le prédicat');
}

function aller(e, ecran) {
  const c = JSON.parse(JSON.stringify(e));
  c.ecran = ecran;
  return c;
}

// --- Liste de mots -----------------------------------------------------------

test('liste de mots : sans doublons, mots simples, taille suffisante', () => {
  const vus = new Map();
  for (const mot of B.MOTS) {
    assert.equal(typeof mot, 'string');
    assert.ok(mot.length >= 2 && mot.length <= 14, 'longueur inattendue : ' + mot);
    assert.ok(!/\s/.test(mot), 'mot composé : ' + mot);
    const n = J.normaliser(mot);
    assert.ok(!vus.has(n), 'doublon : ' + mot + ' / ' + vus.get(n));
    vus.set(n, mot);
  }
  assert.ok(B.MOTS.length >= 1000, 'seulement ' + B.MOTS.length + ' mots');
  assert.equal(typeof B.MOTS_VERSION, 'number');
});

// --- Générateur aléatoire ----------------------------------------------------

test('aléatoire : même seed, mêmes tirages ; seeds différentes, tirages différents', () => {
  const a = R.creerPRNG('ABC123'), b = R.creerPRNG('ABC123'), c = R.creerPRNG('ABC124');
  const sa = [a(), a(), a()], sb = [b(), b(), b()], sc = [c(), c(), c()];
  deepEqual(sa, sb);
  notDeepEqual(sa, sc);
  sa.forEach((x) => assert.ok(x >= 0 && x < 1));
});

test('aléatoire : la seed est insensible à la casse et aux espaces', () => {
  deepEqual(J.creerPartie('abc123'), J.creerPartie(' ABC123 '));
});

test('aléatoire : melanger est une permutation et entre respecte les bornes', () => {
  const rng = R.creerPRNG('X');
  const m = R.melanger([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], rng);
  deepEqual(m.slice().sort((x, y) => x - y), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const vus = new Set();
  for (let i = 0; i < 500; i++) {
    const v = R.entre(rng, 7, 10);
    assert.ok(v >= 7 && v <= 10);
    vus.add(v);
  }
  assert.equal(vus.size, 4);
});

test('aléatoire : nouvelleSeed produit 6 caractères de l’alphabet', () => {
  for (let i = 0; i < 50; i++) {
    const s = R.nouvelleSeed();
    assert.equal(s.length, 6);
    for (const ch of s) assert.ok(R.ALPHABET.includes(ch));
  }
});

// --- Génération d'une partie -------------------------------------------------

test('partie : même seed => même partie, seeds différentes => parties différentes', () => {
  deepEqual(J.creerPartie('ABC123'), J.creerPartie('ABC123'));
  notDeepEqual(J.creerPartie('ABC123').mots, J.creerPartie('ABC124').mots);
});

test('partie : 25 mots distincts, verts 7-10, noirs 1-2, tours = ⌈verts / 2⌉', () => {
  for (const seed of seeds(300)) {
    const e = J.creerPartie(seed);
    assert.equal(e.mots.length, 25);
    assert.equal(new Set(e.mots).size, 25);
    for (const eq of ['A', 'B']) {
      assert.equal(e.cle[eq].length, 25);
      const v = compter(e.cle[eq], 'vert'), n = compter(e.cle[eq], 'noir');
      assert.ok(v >= 7 && v <= 10, 'verts : ' + v);
      assert.ok(n >= 1 && n <= 2, 'noirs : ' + n);
      assert.equal(compter(e.cle[eq], 'rouge'), 25 - v - n);
      assert.equal(e.tours[eq], Math.ceil(v / 2));
    }
    assert.equal(e.ecran, 'preparation');
  }
});

test('partie : tous les nombres de verts (7 à 10) et de noirs (1 à 2) apparaissent', () => {
  const verts = new Set(), noirs = new Set();
  for (const seed of seeds(300)) {
    const e = J.creerPartie(seed);
    for (const eq of ['A', 'B']) { verts.add(compter(e.cle[eq], 'vert')); noirs.add(compter(e.cle[eq], 'noir')); }
  }
  deepEqual([...verts].sort((x, y) => x - y), [7, 8, 9, 10]);
  deepEqual([...noirs].sort((x, y) => x - y), [1, 2]);
});

test('partie : tours 7→4, 8→4, 9→5, 10→5', () => {
  const vus = {};
  for (const seed of seeds(300)) {
    const e = J.creerPartie(seed);
    for (const eq of ['A', 'B']) vus[compter(e.cle[eq], 'vert')] = e.tours[eq];
  }
  deepEqual(vus, { 7: 4, 8: 4, 9: 5, 10: 5 });
});

test('partie : les deux clés sont indépendantes (toutes les combinaisons de couleurs existent)', () => {
  const combis = new Set();
  for (const seed of seeds(200)) {
    const e = J.creerPartie(seed);
    for (let i = 0; i < 25; i++) combis.add(e.cle.A[i] + '/' + e.cle.B[i]);
  }
  for (const a of ['vert', 'rouge', 'noir']) for (const b of ['vert', 'rouge', 'noir']) {
    assert.ok(combis.has(a + '/' + b), 'combinaison absente : ' + a + '/' + b);
  }
});

test('partie : l’équipe avec le plus de verts commence, pile ou face si égalité', () => {
  const commencent = new Set();
  for (const seed of seeds(400)) {
    const e = J.creerPartie(seed);
    const a = compter(e.cle.A, 'vert'), b = compter(e.cle.B, 'vert');
    if (a > b) assert.equal(e.premiere, 'A');
    else if (b > a) assert.equal(e.premiere, 'B');
    else commencent.add(e.premiere);
  }
  assert.equal(commencent.size, 2, 'en cas d’égalité, A et B doivent chacune pouvoir commencer');
});

test('partie : une seed donne toujours la même partie (régression du format)', () => {
  const e = J.creerPartie('ABC123');
  assert.equal(e.versionMots, B.MOTS_VERSION);
  assert.equal(JSON.stringify(J.creerPartie('ABC123')), JSON.stringify(e));
});

// --- Préparation -------------------------------------------------------------

test('préparation : les deux cases cochées lancent le compte à rebours, décocher l’annule', () => {
  let e = J.creerPartie('P1');
  e = J.basculerPret(e, 'A', true);
  assert.equal(e.ecran, 'preparation');
  e = J.basculerPret(e, 'B', true);
  assert.equal(e.ecran, 'compteARebours');
  e = J.basculerPret(e, 'A', false);
  assert.equal(e.ecran, 'preparation');
  e = J.basculerPret(e, 'A', true);
  e = J.annulerCompteARebours(e);
  assert.equal(e.ecran, 'preparation');
  deepEqual(e.pret, { A: false, B: false });
});

test('préparation : le compte à rebours mène au passage de l’équipe qui commence', () => {
  let e = J.creerPartie('P2');
  e = J.basculerPret(J.basculerPret(e, 'A', true), 'B', true);
  e = J.finCompteARebours(e);
  assert.equal(e.ecran, 'passageDonneuse');
  assert.equal(e.donneuse, e.premiere);
  e = J.confirmerPassage(e);
  assert.equal(e.ecran, 'indice');
});

test('les actions ne modifient jamais l’état d’origine', () => {
  const e = J.creerPartie('P3');
  const copie = JSON.stringify(e);
  J.basculerPret(e, 'A', true);
  assert.equal(JSON.stringify(e), copie);
});

// --- Validation de l'indice --------------------------------------------------

test('indice : un seul mot, non vide, différent des mots de la grille', () => {
  const e = demarrer('I1');
  assert.ok(J.verifierIndice(e, ''));
  assert.ok(J.verifierIndice(e, '   '));
  assert.ok(J.verifierIndice(e, 'deux mots'));
  assert.equal(J.verifierIndice(e, 'rivage'), null);
  assert.equal(J.verifierIndice(e, 'porte-clés'), null);
  assert.equal(J.verifierIndice(e, 'l’eau'), null);
  const mot = e.mots[0];
  assert.ok(J.verifierIndice(e, mot));
  assert.ok(J.verifierIndice(e, mot.toUpperCase()));
  assert.ok(J.verifierIndice(e, '  ' + mot + '  '));
});

test('indice : la comparaison ignore accents et casse (« œuf », « OEUF »)', () => {
  const e = JSON.parse(JSON.stringify(demarrer('I2')));
  e.mots[3] = 'œuf';
  assert.ok(J.verifierIndice(e, 'OEUF'));
  e.mots[3] = 'Égypte';
  assert.ok(J.verifierIndice(e, 'egypte'));
});

test('indice : le nombre est borné par les mots restants de la donneuse', () => {
  const e = demarrer('I3');
  const X = e.donneuse;
  const max = J.restants(e, X);
  assert.throws(() => J.validerIndice(e, 'rivage', max + 1));
  assert.throws(() => J.validerIndice(e, 'rivage', -1));
  assert.throws(() => J.validerIndice(e, 'rivage', 1.5));
  assert.throws(() => J.validerIndice(e, 'deux mots', 1));
  assert.doesNotThrow(() => J.validerIndice(e, 'rivage', max));
  assert.doesNotThrow(() => J.validerIndice(e, 'rivage', 0));
});

test('indice : valider consomme un tour et passe à l’équipe qui devine', () => {
  const e = demarrer('I4');
  const X = e.donneuse;
  const tours = e.tours[X];
  const s = J.validerIndice(e, 'rivage', 2);
  assert.equal(s.tours[X], tours - 1);
  assert.equal(s.ecran, 'passageDevineuse');
  deepEqual(s.indice, { mot: 'rivage', nombre: 2, trouvesCetteManche: 0 });
  assert.equal(s.historique.length, 1);
  assert.equal(s.historique[0].equipe, X);
});

// --- Devinette ---------------------------------------------------------------

test('devinette : on ne peut pas sélectionner une carte trouvée ou déjà proposée à tort', () => {
  let e = demarrer('D1');
  const X = e.donneuse, Y = J.autre(X);
  const v = indicesDe(e, X, 'vert');
  e = donnerIndice(e, 2);
  e = J.selectionner(e, v[0]);
  assert.equal(e.selection, v[0]);
  e = J.selectionner(e, v[0]);
  assert.equal(e.selection, null);
  e = J.selectionner(e, v[0]);
  e = J.validerSelection(e);
  deepEqual(e.trouves[X], [v[0]]);
  assert.equal(J.peutSelectionner(e, v[0]), false);
  assert.equal(J.selectionner(e, v[0]).selection, null);
  assert.ok(J.peutSelectionner(e, v[1]));
  assert.equal(e.erreurs[Y].length, 0);
});

test('devinette : un mot vert est un succès et la devineuse continue', () => {
  let e = demarrer('D2');
  const X = e.donneuse;
  const v = indicesDe(e, X, 'vert');
  e = donnerIndice(e, 2);
  e = J.validerSelection(J.selectionner(e, v[0]));
  assert.equal(e.ecran, 'devinette');
  assert.equal(e.retour.couleur, 'vert');
  assert.equal(e.retour.suite, 'continue');
  assert.equal(e.indice.trouvesCetteManche, 1);
  assert.equal(J.restants(e, X), v.length - 1);
});

test('devinette : mot bonus, on peut trouver nombre + 1 mots puis la manche s’arrête', () => {
  let e = chercher((p) => {
    const X = (p.premiere);
    return compter(p.cle[X], 'vert') >= 4;
  });
  e = J.confirmerPassage(J.finCompteARebours(J.basculerPret(J.basculerPret(e, 'A', true), 'B', true)));
  const X = e.donneuse, Y = J.autre(X);
  const v = indicesDe(e, X, 'vert');
  e = donnerIndice(e, 2);
  e = J.validerSelection(J.selectionner(e, v[0]));
  e = J.validerSelection(J.selectionner(e, v[1]));
  assert.equal(e.ecran, 'devinette', 'le mot bonus reste possible');
  e = J.validerSelection(J.selectionner(e, v[2]));
  assert.equal(e.ecran, 'passageDonneuse', '3 mots trouvés avec « 2 » : la manche est finie');
  assert.equal(e.retour.suite, 'fin-manche');
  assert.equal(e.trouves[X].length, 3);
  assert.equal(e.donneuse, Y, 'c’est ensuite à l’équipe qui devinait de faire deviner');
});

test('devinette : avec « 0 », une seule proposition est possible', () => {
  let e = demarrer('D3');
  const X = e.donneuse;
  const v = indicesDe(e, X, 'vert');
  e = donnerIndice(e, 0);
  e = J.validerSelection(J.selectionner(e, v[0]));
  assert.notEqual(e.ecran, 'devinette');
  assert.equal(e.trouves[X].length, 1);
});

test('devinette : un mot rouge devient gris, fin de la manche', () => {
  let e = demarrer('D4');
  const X = e.donneuse, Y = J.autre(X);
  const r = indicesDe(e, X, 'rouge')[0];
  e = donnerIndice(e, 3);
  e = J.validerSelection(J.selectionner(e, r));
  assert.equal(e.retour.couleur, 'rouge');
  deepEqual(e.erreurs[Y], [r]);
  assert.equal(e.ecran, 'passageDonneuse');
  assert.equal(e.retour.suite, 'fin-manche');
});

test('devinette : un mot noir fait perdre immédiatement', () => {
  let e = demarrer('D5');
  const X = e.donneuse;
  const n = indicesDe(e, X, 'noir')[0];
  e = donnerIndice(e, 1);
  e = J.validerSelection(J.selectionner(e, n));
  assert.equal(e.ecran, 'fin');
  assert.equal(e.resultat.type, 'defaite');
  assert.equal(e.resultat.cause, 'noir');
  assert.equal(e.resultat.mot, e.mots[n]);
  assert.equal(e.retour.suite, 'defaite');
});

test('devinette : seule la clé de la donneuse compte', () => {
  const e = chercher((p) => {
    const X = p.premiere, Y = J.autre(X);
    return p.cle[X].some((c, i) => c === 'rouge' && p.cle[Y][i] === 'vert');
  });
  let s = J.confirmerPassage(J.finCompteARebours(J.basculerPret(J.basculerPret(e, 'A', true), 'B', true)));
  const X = s.donneuse, Y = J.autre(X);
  const i = s.cle[X].findIndex((c, k) => c === 'rouge' && s.cle[Y][k] === 'vert');
  s = donnerIndice(s, 1);
  s = J.validerSelection(J.selectionner(s, i));
  assert.equal(s.retour.couleur, 'rouge');
  deepEqual(s.erreurs[Y], [i]);
});

test('devinette : arrêter de deviner, même avant toute proposition', () => {
  let e = demarrer('D6');
  const X = e.donneuse, Y = J.autre(X);
  e = donnerIndice(e, 1);
  e = J.arreter(e);
  assert.equal(e.ecran, 'passageDonneuse');
  assert.equal(e.historique[0].arretVolontaire, true);
  assert.equal(e.historique[0].propositions.length, 0);
  assert.equal(e.donneuse, Y);
});

test('devinette : valider sans sélection est impossible', () => {
  const e = donnerIndice(demarrer('D7'), 1);
  assert.throws(() => J.validerSelection(e));
});

// --- Enchaînement des manches ------------------------------------------------

test('enchaînement : l’équipe qui a fini de deviner fait deviner si elle a des mots restants', () => {
  let e = demarrer('E1');
  const X = e.donneuse, Y = J.autre(X);
  e = J.arreter(donnerIndice(e, 1));
  assert.equal(e.ecran, 'passageDonneuse');
  assert.equal(e.donneuse, Y);
});

test('enchaînement : si la devineuse n’a plus de mots, la donneuse rejoue', () => {
  let e = demarrer('E2');
  const X = e.donneuse, Y = J.autre(X);
  // La devineuse Y n'a plus aucun mot à faire deviner (tous trouvés par X).
  e.trouves[Y] = indicesDe(e, Y, 'vert');
  e = J.arreter(donnerIndice(e, 1));
  assert.equal(e.donneuse, X);
  assert.equal(e.ecran, 'passageDonneuse');
});

test('enchaînement : la manche s’arrête quand la donneuse n’a plus de mots restants', () => {
  let e = demarrer('E3');
  const X = e.donneuse;
  const v = indicesDe(e, X, 'vert');
  e.trouves[X] = v.slice(0, v.length - 1);
  e.tours[J.autre(X)] = 5;
  e = donnerIndice(e, 1);
  e = J.validerSelection(J.selectionner(e, v[v.length - 1]));
  assert.notEqual(e.ecran, 'devinette');
});

test('victoire : tous les mots verts des deux équipes trouvés', () => {
  let e = demarrer('V1');
  const X = e.donneuse, Y = J.autre(X);
  const vX = indicesDe(e, X, 'vert');
  e.trouves[X] = vX.slice(0, vX.length - 1);
  e.trouves[Y] = indicesDe(e, Y, 'vert');
  e = donnerIndice(e, 1);
  e = J.validerSelection(J.selectionner(e, vX[vX.length - 1]));
  assert.equal(e.ecran, 'fin');
  assert.equal(e.resultat.type, 'victoire');
  assert.equal(e.retour.suite, 'victoire');
});

test('un mot vert des deux côtés est suivi séparément pour chaque équipe', () => {
  const e0 = chercher((p) => p.cle.A.some((c, i) => c === 'vert' && p.cle.B[i] === 'vert'));
  let e = J.confirmerPassage(J.finCompteARebours(J.basculerPret(J.basculerPret(e0, 'A', true), 'B', true)));
  const X = e.donneuse, Y = J.autre(X);
  const i = e.cle[X].findIndex((c, k) => c === 'vert' && e.cle[Y][k] === 'vert');
  e = J.validerSelection(J.selectionner(donnerIndice(e, 1), i));
  assert.ok(e.trouves[X].includes(i));
  assert.ok(!e.trouves[Y].includes(i), 'le mot n’est pas trouvé pour l’autre clé');
  assert.equal(J.restants(e, Y), J.nbVerts(e, Y));
});

test('défaite immédiate : une équipe n’a plus de tours alors qu’il lui reste des mots', () => {
  let e = demarrer('T1');
  const X = e.donneuse;
  e.tours[X] = 1;
  e = J.arreter(donnerIndice(e, 1));
  assert.equal(e.tours[X], 0);
  assert.equal(e.ecran, 'fin');
  deepEqual(e.resultat, { type: 'defaite', cause: 'tours', equipe: X });
});

test('défaite immédiate : même si c’est l’autre équipe qui n’a plus de tours', () => {
  let e = demarrer('T2');
  const X = e.donneuse, Y = J.autre(X);
  e.tours[Y] = 0;
  e = J.arreter(donnerIndice(e, 1));
  assert.equal(e.ecran, 'fin');
  assert.equal(e.resultat.equipe, Y);
});

test('pas de défaite par tours si l’équipe a tout fait trouver avec son dernier tour', () => {
  let e = demarrer('T3');
  const X = e.donneuse, Y = J.autre(X);
  const vX = indicesDe(e, X, 'vert');
  e.tours[X] = 1;
  e.trouves[X] = vX.slice(0, vX.length - 1);
  e.trouves[Y] = indicesDe(e, Y, 'vert').slice(0, 1);
  e = donnerIndice(e, 1);
  e = J.validerSelection(J.selectionner(e, vX[vX.length - 1]));
  assert.equal(e.ecran, 'passageDonneuse');
  assert.equal(e.donneuse, Y);
});

test('une partie complète se termine toujours (par victoire ou défaite)', () => {
  // Joueurs « parfaits » : trouvent tous leurs verts un par un, dans l'ordre.
  for (const seed of seeds(60)) {
    let e = demarrer(seed);
    let garde = 0;
    while (e.ecran !== 'fin') {
      assert.ok(garde++ < 100, 'la partie ne se termine pas');
      if (e.ecran === 'passageDonneuse') e = J.confirmerPassage(e);
      else if (e.ecran === 'indice') {
        e = J.confirmerPassage(J.validerIndice(e, 'indice' + garde, Math.min(2, J.restants(e, e.donneuse))));
      } else if (e.ecran === 'devinette') {
        const X = e.donneuse;
        const v = indicesDe(e, X, 'vert').find((i) => !e.trouves[X].includes(i));
        e = J.validerSelection(J.selectionner(e, v));
      }
    }
    assert.ok(['victoire', 'defaite'].includes(e.resultat.type));
  }
});

test('abandon : la partie se termine par une défaite', () => {
  const e = J.abandonner(demarrer('A1'));
  assert.equal(e.ecran, 'fin');
  assert.equal(e.resultat.cause, 'abandon');
  assert.throws(() => J.abandonner(e));
});

// --- Sauvegarde et reprise ---------------------------------------------------

test('reprise : un écran qui révèle une clé est remplacé par un écran de passage', () => {
  let e = demarrer('S1');
  assert.equal(e.ecran, 'indice');
  assert.equal(J.reprendre(e).ecran, 'passageDonneuse');
  e = donnerIndice(e, 1);
  assert.equal(e.ecran, 'devinette');
  assert.equal(J.reprendre(e).ecran, 'passageDevineuse');
  const prep = J.basculerPret(J.basculerPret(J.creerPartie('S2'), 'A', true), 'B', true);
  assert.equal(prep.ecran, 'compteARebours');
  const r = J.reprendre(prep);
  assert.equal(r.ecran, 'preparation');
  deepEqual(r.pret, { A: false, B: false });
});

test('reprise : l’état survit à une sérialisation JSON et est reconnu valide', () => {
  const e = donnerIndice(demarrer('S3'), 2);
  const relu = JSON.parse(JSON.stringify(e));
  assert.equal(J.etatValide(relu), true);
  assert.equal(J.reprendre(relu).indice.mot, 'indicetest');
});

test('reprise : les états incompatibles ou corrompus sont refusés', () => {
  const e = J.creerPartie('S4');
  assert.equal(J.etatValide(e), true);
  assert.equal(J.etatValide(null), false);
  assert.equal(J.etatValide({}), false);
  assert.equal(J.etatValide(Object.assign({}, e, { versionFormat: 999 })), false);
  assert.equal(J.etatValide(Object.assign({}, e, { versionMots: 999 })), false);
  assert.equal(J.etatValide(Object.assign({}, e, { mots: ['a'] })), false);
  assert.equal(J.etatValide(Object.assign({}, e, { ecran: 'nimportequoi' })), false);
  assert.equal(J.etatValide(Object.assign({}, e, { ecran: 'devinette', donneuse: 'A', indice: null })), false);
});
