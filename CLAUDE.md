# CLAUDE.md

Consignes pour les agents de code qui travaillent sur **Le Jeu Masterclass, Un Banger**.

## Le projet

Jeu de mots coopératif, en français, joué sur un seul téléphone que deux équipes (A et B) se passent.
Les règles et le comportement attendu sont décrits dans :

- [`docs/regles.md`](docs/regles.md) : les règles, côté joueurs ;
- [`docs/specification.md`](docs/specification.md) : la **source de vérité** (écrans, machine à états, génération par seed, mise en page, architecture, tests).

Lire la spécification avant toute modification. En cas de doute ou de contradiction, demander à l'utilisateur plutôt que d'inventer une règle.

## Phase actuelle

**Première version jouable écrite** : `index.html` (jeu complet) et `tests/jeu.test.js` (tests de la logique). Les prochaines modifications doivent respecter la spécification ; toute évolution des règles passe d'abord par la documentation (voir « Quand les règles changent »).

## Contraintes non négociables

- **Hors ligne** : aucune requête réseau, aucune ressource externe (CDN, polices web, images distantes, API).
- **HTML + CSS + JavaScript « vanilla » uniquement** : aucun framework, aucune bibliothèque, aucun moteur de jeu, aucun `npm install`, aucune étape de build.
- **Un seul fichier livré : `index.html`**, qui contient le CSS, le JavaScript et la liste de mots.
- Doit fonctionner ouvert directement en **`file://`** : pas de modules ES (`import`/`export`), pas de `fetch`, scripts classiques partageant un seul espace de noms global (`window.Banger`).
- **Pas de PWA** dans cette première étape (ni manifeste ni *service worker*).
- Pensé pour un **téléphone en portrait** : les 25 cartes tiennent à l'écran **sans défilement**, cibles tactiles d'au moins 44 × 44 px.
- `Math.random()` sert **uniquement** à créer une nouvelle seed. Tout le reste de la partie dérive de la seed par un PRNG déterministe, avec un ordre de tirage fixe (spécification, section 3.2).

## Organisation du code

- `index.html` est découpé en blocs `<script id="…">` : `mots`, `aleatoire`, `jeu`, `sauvegarde`, `affichage`.
- `mots`, `aleatoire` et `jeu` ne touchent **ni au DOM ni à `localStorage`** : fonctions pures (état + action → nouvel état), testables avec Node.
- L'état est un objet sérialisable en JSON (spécification, section 6). Il est sauvegardé dans `localStorage` après chaque action ; tous les accès à `localStorage` sont protégés par `try/catch`.
- Une reprise de partie commence toujours sur un **écran de passage**, jamais sur un écran qui révèle une clé.
- Tests de développement (non livrés aux joueurs) dans `tests/`, lancés avec **`node --test`** (sans argument : Node 22 n'accepte pas un dossier) : `tests/jeu.test.js` extrait les scripts `mots`, `aleatoire` et `jeu` de `index.html` et les exécute via `node:vm`. Aucune dépendance. Les objets issus du contexte `vm` ont d'autres prototypes : comparer via JSON (voir `deepEqual` dans le fichier de test).

## Conventions

- Tout est en **français** : interface, documentation, messages de commit, commentaires et identifiants (`equipe`, `donneuse`, `tours`, `trouves`…), en reprenant le vocabulaire de la spécification (section 2).
- Textes de l'interface avec une typographie française correcte (accents, espaces avant `:` `!` `?`, guillemets « »).
- Liste de mots : noms communs ou propres **très connus de tous**, sans doublons (insensible à la casse et aux accents), rien de vulgaire ou de choquant. Toute modification de la liste **incrémente sa version**, car une seed n'est reproductible qu'avec la même version.
- Ne pas changer l'ordre des tirages aléatoires sans le documenter : cela change toutes les parties associées aux seeds existantes.

## Quand les règles changent

Mettre à jour **dans la même modification** : `docs/regles.md`, `docs/specification.md` (y compris le récapitulatif chiffré et les questions ouvertes), puis le code et les tests s'ils existent.

## Vérifier son travail

- `node --test` doit passer.
- Ouvrir `index.html` dans un navigateur sans réseau, faire une partie complète et vérifier qu'aucune carte ne déborde et qu'il n'y a pas de défilement, sur plusieurs tailles de téléphone (ex. 360 × 640, 390 × 844, 430 × 932), avec les mots les plus longs de la liste.
- Vérifier qu'aucun écran de passage ne laisse voir une clé.
