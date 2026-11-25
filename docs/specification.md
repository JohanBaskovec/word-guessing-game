# Spécification

Ce document décrit précisément le comportement attendu du jeu, ses écrans et son architecture technique.
Les règles côté joueurs sont dans [`regles.md`](regles.md).

Les points marqués **(H)** sont des **hypothèses** prises en l'absence de précision. Ils sont repris dans la section [Questions ouvertes](#11-questions-ouvertes) et pourront changer.

---

## 1. Contraintes générales

| Contrainte | Détail |
|---|---|
| Hors ligne | Le jeu fonctionne sans aucune connexion réseau : aucune ressource externe (pas de CDN, pas de police web, pas d'API). |
| Technologies | HTML, CSS et JavaScript « vanilla » uniquement. Aucun framework, aucune bibliothèque, aucun moteur de jeu, aucune étape de build. |
| Ouverture | **(H)** Le jeu s'ouvre en double-cliquant sur `index.html` (protocole `file://`). Conséquences : pas de modules ES (`import`/`export`), pas de `fetch` de fichiers locaux ; la liste de mots est un fichier `.js` classique. |
| Appareil | Un seul téléphone partagé, en **mode portrait**. Doit aussi rester utilisable sur tablette et ordinateur. |
| Joueurs | 2 à 99 joueurs ou plus, répartis en équipes A et B. Le jeu ne gère pas les joueurs individuellement **(H)**. |
| Langue | Interface et mots en **français** **(H)**. |
| Mode | Coopératif : victoire ou défaite communes. |

---

## 2. Vocabulaire

| Terme | Définition |
|---|---|
| **Seed** | Chaîne qui détermine entièrement la partie (mots, clés, équipe qui commence). Même seed ⇒ même partie. |
| **Grille** | Les 25 mots de la partie, dans un ordre fixe. |
| **Clé d'une équipe** | Pour chacun des 25 mots, sa couleur pour cette équipe : `vert`, `rouge` ou `noir`. Chaque équipe a sa propre clé. |
| **Mot vert de X** | Mot que l'équipe X doit faire deviner à l'autre équipe. |
| **Mot noir de X** | Mot mortel de la clé de X : si l'autre équipe le choisit pendant que X fait deviner, la partie est perdue. |
| **Mot rouge de X** | Tout autre mot de la clé de X. |
| **Équipe donneuse** | Équipe qui donne l'indice (elle voit sa clé). |
| **Équipe devineuse** | Équipe qui devine (elle ne voit aucune clé). |
| **Tour** | Un indice donné par une équipe. Chaque équipe a un nombre de tours limité. |
| **Manche** | Un indice + la séquence de propositions de l'équipe devineuse qui suit. |

---

## 3. Génération d'une partie à partir de la seed

### 3.1 Seed

- **(H)** Générée aléatoirement au lancement d'une nouvelle partie : 6 caractères parmi un alphabet sans ambiguïté (ex. `ABCDEFGHJKMNPQRSTUVWXYZ23456789`).
- **(H)** Affichée discrètement sur l'écran de préparation, et saisissable pour rejouer une partie précise.
- Elle sert à initialiser un **générateur pseudo-aléatoire déterministe** (une fonction de hachage de chaîne vers un entier 32 bits, puis un PRNG simple de type *mulberry32* ou *sfc32*). `Math.random()` n'est utilisé que pour créer une nouvelle seed, jamais pour la partie elle-même.

### 3.2 Tirages (dans cet ordre, toujours le même)

1. **25 mots** distincts tirés dans la liste de mots (mélange de Fisher-Yates, on garde les 25 premiers).
2. **Nombre de mots verts** : `nA` et `nB`, chacun tiré uniformément dans `{7, 8, 9, 10}`, indépendamment.
3. **Nombre de mots noirs** : `mA` et `mB`, chacun tiré dans `{1, 2}`, indépendamment.
4. **Attribution des couleurs** : on mélange les indices 0 à 24, puis on prend dans l'ordre `nA` verts de A, `nB` verts de B, `mA` noirs de A, `mB` noirs de B. **(H)** Ces quatre ensembles sont **disjoints** (voir 3.3).
5. **Équipe qui commence** à faire deviner : **(H)** tirée au sort (A ou B).

> L'ordre des tirages fait partie du format : le modifier change les parties associées à chaque seed. La liste de mots est **versionnée** pour la même raison (une seed n'est reproductible qu'avec la même version de la liste).

### 3.3 Clés

- Clé de A : verts de A → `vert`, noirs de A → `noir`, tout le reste (y compris les verts et noirs de B) → `rouge`.
- Clé de B : symétrique.
- Avec les maxima (10 + 10 + 2 + 2 = 24 ≤ 25), l'attribution disjointe est toujours possible : il reste entre 1 et 9 mots rouges pour les deux équipes.

### 3.4 Nombre de tours

`tours[X] = ⌈nX / 2⌉` → 7 → 4, 8 → 4, 9 → 5, 10 → 5.

### 3.5 « Changer les mots »

Génère une **nouvelle seed** et donc une partie entièrement nouvelle (mots, nombres de verts/noirs, clés, équipe qui commence). Les cases « prête » des deux équipes sont décochées.

---

## 4. Liste de mots

- Fichier dédié (ex. `js/mots.js`) exposant un tableau de chaînes et un numéro de version.
- Uniquement des **noms communs** et **noms propres** **très connus de tous**, adultes comme enfants (ex. : *chat*, *maison*, *soleil*, *pomme*, *Paris*, *Napoléon*, *Lune*…).
- À éviter : mots rares, techniques, régionaux, argotiques, vulgaires ou choquants, homographes trop piégeux, mots composés de plusieurs mots si possible.
- Pas de doublons (comparaison insensible à la casse et aux accents).
- Taille visée **(H)** : **400 à 600 mots**, pour limiter les répétitions d'une partie à l'autre.
- Longueur : majoritairement des mots courts ou moyens ; les mots longs (> 12 lettres) sont acceptés mais rares, car ils occupent une ligne entière.

---

## 5. Déroulement : machine à états

```
                     ┌───────────────────────────── « Changer les mots » ─┐
                     ▼                                                    │
             ┌──────────────┐  A et B prêtes   ┌─────────────┐            │
  démarrage ─► PRÉPARATION  ├─────────────────►│ COMPTE À    │            │
             └──────────────┘◄─────────────────┤ REBOURS 3 s │            │
                     │        une case décochée └──────┬──────┘            │
                     └─────────────────────────────────┼───────────────────┘
                                                       ▼
                                          ┌────────────────────────┐
                              ┌──────────►│ PASSAGE : donneuse X   │  « Tour de l'équipe X » + [Prêt]
                              │           └───────────┬────────────┘
                              │                       ▼
                              │           ┌────────────────────────┐
                              │           │ INDICE (X voit sa clé) │  saisie indice + nombre + [Valider]
                              │           └───────────┬────────────┘
                              │                       ▼
                              │           ┌────────────────────────┐
                              │           │ PASSAGE : devineuse Y  │  « Au tour de l'équipe Y » + [Prêt]
                              │           └───────────┬────────────┘
                              │                       ▼
                              │           ┌────────────────────────┐
                              │           │ DEVINETTE (Y)          │  toucher un mot + [Valider], répété
                              │           └───────────┬────────────┘
                              │      manche finie     │        mot noir / victoire / plus de tours
                              └───────────────────────┤──────────────────────────────┐
                                                      │                              ▼
                                                      │                     ┌────────────────┐
                                                      └────────────────────►│ FIN DE PARTIE  │
                                                                            └────────────────┘
```

### 5.1 PRÉPARATION

- Affiche les 25 mots sur fond neutre, **sans aucune couleur de clé**.
- **(H)** Affiche aussi, pour information : « Équipe A : 9 mots à faire deviner, 5 tours », idem pour B.
- Bouton **« Changer les mots »** (voir 3.5).
- Deux cases à cocher : **« Équipe A prête »** et **« Équipe B prête »**.
- Quand les deux sont cochées → COMPTE À REBOURS.

### 5.2 COMPTE À REBOURS

- Affiche 3, 2, 1 (une seconde chacun).
- **(H)** Décocher une case pendant le compte à rebours l'annule et revient en PRÉPARATION.
- À la fin → PASSAGE vers l'équipe qui commence.

### 5.3 PASSAGE (écran de transition)

- Écran **opaque** qui ne montre **aucune information secrète** : seulement « Tour de l'équipe X » (donneuse) ou « Au tour de l'équipe Y » (devineuse), un bouton **« Prêt »** et, éventuellement, un rappel du score (mots restants / tours restants par équipe).
- Il existe pour que l'appareil puisse être passé sans que l'autre équipe voie l'écran. Il apparaît **à chaque changement de rôle**, même si c'est la même équipe qui garde le téléphone (passage de « devine » à « fait deviner »).

### 5.4 INDICE (équipe donneuse X)

Affichage des 25 cartes avec la clé de X :

| Mot | Apparence |
|---|---|
| Vert de X, pas encore trouvé | Fond **vert** |
| Vert de X, déjà trouvé par Y | **(H)** Fond vert atténué + coche ✓, non interactif |
| Rouge de X | Fond **rouge** |
| Rouge de X déjà proposé à tort par Y | **(H)** Fond rouge atténué / barré |
| Noir de X | Fond **noir**, texte blanc |

En bas de l'écran :

- champ texte **« Indice »** ;
- sélecteur du **nombre** de mots : de **0** au nombre de verts de X restant à trouver (**(H)** gros boutons −/+ ou rangée de pastilles, adaptés au doigt) ;
- rappel « Tours restants : k » ;
- bouton **« Valider »**, actif uniquement si l'indice est valide.

Validation de l'indice **(H)** :

- non vide après suppression des espaces en début/fin ;
- un seul mot (pas d'espace ; tiret et apostrophe autorisés) ;
- différent de chacun des 25 mots de la grille (comparaison insensible à la casse et aux accents).

À la validation : `tours[X]` diminue de 1, l'indice et le nombre sont mémorisés, puis PASSAGE vers Y.

### 5.5 DEVINETTE (équipe devineuse Y)

Affichage des 25 cartes, **sans aucune clé** :

| Mot | Apparence | Sélectionnable |
|---|---|---|
| Déjà trouvé par Y (vert de X ou d'une manche précédente) | Carte **blanche vide** (emplacement conservé pour que la grille ne bouge pas) | Non |
| Déjà proposé à tort par Y | Fond **gris** | **(H)** Non |
| Tous les autres | Fond **blanc** | Oui |

En bas de l'écran : l'**indice**, le **nombre** annoncé, la progression de la manche (ex. « 1 / 3 trouvé »).

Interaction :

1. Toucher une carte la **sélectionne** (contour épais). Toucher une autre carte déplace la sélection ; toucher la carte sélectionnée la désélectionne.
2. **« Valider »** (actif seulement si une carte est sélectionnée) révèle le résultat selon la **clé de X** :

| Résultat | Effet |
|---|---|
| **Vert de X** | Retour visuel positif. La carte devient blanche vide. `trouvés[X]` +1. Si tous les verts de X **et** de Y sont trouvés → **VICTOIRE**. Sinon, si le nombre annoncé est atteint → fin de manche. Sinon, Y continue. |
| **Rouge de X** | Retour visuel négatif. La carte devient grise pour Y. Fin de manche. |
| **Noir de X** | **DÉFAITE** immédiate. |

3. **(H)** Un bouton **« Arrêter de deviner »** permet à Y de terminer la manche volontairement après au moins une proposition (ou à tout moment).

**Cas du nombre 0** : voir [question ouverte n° 1](#11-questions-ouvertes). **(H)** En attendant : avec 0, Y peut proposer autant de mots qu'elle veut jusqu'à une erreur ou un arrêt volontaire.

### 5.6 Fin de manche : qui fait deviner ensuite

Soit X la donneuse et Y la devineuse de la manche qui se termine. On note `restants[E]` le nombre de verts de E non encore trouvés.

1. Si `restants[Y] > 0` et `tours[Y] > 0` → Y devient donneuse.
2. Sinon, si `restants[X] > 0` et `tours[X] > 0` → X redevient donneuse.
3. Sinon → **DÉFAITE** (« Plus de tours »).

**(H)** Détection anticipée de la défaite : dès qu'une équipe a `restants > 0` et `tours = 0`, la victoire est devenue impossible. Voir [question ouverte n° 3](#11-questions-ouvertes) : on peut soit terminer la partie immédiatement, soit laisser l'autre équipe finir ses tours.

### 5.7 FIN DE PARTIE

- Message de **victoire** (« Youpi, tout le monde a gagné ! ») ou de **défaite** avec la cause (« Mot mortel : *X* » / « Plus de tours »).
- Révélation des deux clés (onglets ou bascule A/B), avec les mots trouvés et les erreurs.
- Récapitulatif : indices donnés par chaque équipe.
- Bouton **« Nouvelle partie »** → nouvelle seed, retour en PRÉPARATION.

---

## 6. Modèle de données de l'état

L'état complet est un objet sérialisable en JSON (pour la sauvegarde, voir 8.3).

| Champ | Type | Description |
|---|---|---|
| `versionFormat` | nombre | Version du format de l'état (pour ignorer une sauvegarde incompatible). |
| `versionMots` | nombre | Version de la liste de mots utilisée. |
| `seed` | chaîne | Seed de la partie. |
| `mots` | 25 chaînes | La grille. |
| `cle.A`, `cle.B` | 25 valeurs `vert`/`rouge`/`noir` | Les deux clés. |
| `tours.A`, `tours.B` | nombres | Tours restants. |
| `trouves.A`, `trouves.B` | listes d'indices | Verts de A (resp. B) déjà trouvés par l'autre équipe. |
| `erreurs.A`, `erreurs.B` | listes d'indices | Mots que A (resp. B) a proposés à tort en devinant (affichés en gris dans sa vue). |
| `pret.A`, `pret.B` | booléens | Cases de préparation. |
| `ecran` | énumération | `preparation`, `compteARebours`, `passageDonneuse`, `indice`, `passageDevineuse`, `devinette`, `fin`. |
| `donneuse` | `A` / `B` | Équipe qui fait deviner dans la manche courante. |
| `indice` | objet ou vide | `{ mot, nombre, trouvesCetteManche }`. |
| `selection` | indice ou vide | Carte sélectionnée en devinette. |
| `historique` | liste | Indices donnés : `{ equipe, mot, nombre, propositions: [{ indice, resultat }] }`. |
| `resultat` | vide / `victoire` / `defaite` | Avec la cause de la défaite. |

La **logique du jeu** (fonctions pures : état + action → nouvel état) est séparée de l'**affichage**, ce qui permet de la tester sans navigateur.

---

## 7. Interface et mise en page

### 7.1 Principes

- Mode **portrait**, toute l'interface tient dans la hauteur de l'écran (`100dvh`) : **aucun défilement** pendant la partie.
- Structure verticale : bandeau d'état fin en haut → grille (prend tout l'espace restant) → zone d'action en bas (indice, nombre, boutons).
- Cibles tactiles : chaque carte et chaque bouton mesure **au moins 44 × 44 px** (recommandation d'accessibilité tactile).
- Désactiver le zoom au double-tap et la sélection de texte sur les cartes ; pas d'effet de survol nécessaire.

### 7.2 Grille de cartes adaptative

Objectif : un mot long peut occuper une ligne à lui seul, deux (ou plus) mots courts partagent une ligne, et les 25 cartes tiennent à l'écran.

- Les cartes sont disposées en **flux qui passe à la ligne** (`flex-wrap`), dans l'ordre de la grille.
- Chaque carte a une largeur de base égale à la largeur de son mot (+ marges intérieures) et **s'étire** pour remplir la ligne (`flex-grow`), de sorte que chaque ligne est pleine et lisible.
- Un mot n'est **jamais coupé** au milieu.
- **Ajustement de la taille du texte** : au chargement et à chaque redimensionnement / rotation, on cherche la plus grande taille de police (recherche dichotomique entre un minimum, ~14 px, et un maximum, ~28 px) pour laquelle la grille tient dans la hauteur disponible. Tous les mots utilisent la même taille.
- Si un mot dépasse la largeur de l'écran même à la taille minimale, seule sa carte réduit sa police.
- L'emplacement d'une carte trouvée est conservé (carte vide) pour que la grille ne se réorganise pas pendant la partie.
- **(H)** La disposition est calculée une fois par partie et reste identique pour tous les écrans (préparation, indice, devinette), pour que les joueurs retrouvent les mots au même endroit.

### 7.3 Couleurs et accessibilité

| État | Fond | Texte | Symbole **(H)** |
|---|---|---|---|
| Neutre (préparation, devinette) | blanc | noir | — |
| Vert (à faire deviner) | vert | noir ou blanc selon contraste | — |
| Vert trouvé (vue donneuse) | vert atténué | — | ✓ |
| Rouge (à ne pas faire deviner) | rouge | blanc | — |
| Noir (mortel) | noir | blanc | ☠ |
| Erreur (vue devineuse) | gris | gris foncé | — |
| Trouvé (vue devineuse) | blanc, sans texte | — | — |
| Sélectionné | inchangé | — | contour épais |

- **(H)** Les symboles complètent les couleurs pour les personnes daltoniennes (le couple rouge/vert est le cas le plus fréquent).
- Contraste texte/fond conforme WCAG AA.

### 7.4 Retours visuels

- Proposition correcte : brève animation positive (≈ 1 s) avant de rendre la main.
- Proposition incorrecte ou mortelle : animation distincte, puis message explicite.
- **(H)** Vibration courte (`navigator.vibrate`) si disponible ; aucun son par défaut.

---

## 8. Architecture technique

### 8.1 Fichiers prévus **(H)**

```
index.html          Structure des écrans
css/style.css       Mise en page et couleurs
js/mots.js          Liste de mots + version
js/aleatoire.js     Hachage de la seed, PRNG, mélange, génération de seed
js/jeu.js           Logique pure : création de partie, actions, règles, conditions de fin
js/affichage.js     Rendu des écrans, ajustement de la grille, gestion des événements
js/sauvegarde.js    Lecture / écriture de l'état dans localStorage
```

- Scripts classiques chargés dans l'ordre par des balises `<script>` (pas de modules), partageant un seul espace de noms global (ex. `window.Jeu`) pour rester compatibles avec `file://`.
- Variante possible : **tout réunir dans un unique `index.html`** pour faciliter la copie sur un téléphone.

### 8.2 Fonctionnement hors ligne

- Aucune requête réseau, aucune ressource externe ; polices système uniquement.
- **(H, optionnel)** Rendre le jeu installable comme application (PWA : `manifest.json` + *service worker* qui met les fichiers en cache). Cela nécessite que le jeu soit servi une première fois en HTTPS (ou `localhost`) ; en `file://`, le jeu fonctionne sans cette couche.

### 8.3 Sauvegarde

- **(H)** L'état est enregistré dans `localStorage` après chaque action, pour reprendre la partie après un rechargement accidentel, une mise en veille ou un appel.
- Au démarrage, si une sauvegarde compatible existe, la partie reprend sur un **écran de passage** (jamais directement sur une vue qui révèle une clé).
- Si `localStorage` est indisponible (navigation privée…), le jeu fonctionne normalement, sans reprise.
- **(H, optionnel)** API *Screen Wake Lock* pour empêcher la mise en veille de l'écran pendant la partie, si le navigateur la propose.

### 8.4 Compatibilité

- Navigateurs mobiles récents : Safari iOS, Chrome Android, Firefox, Samsung Internet.
- Aucune fonctionnalité indispensable ne doit dépendre d'une API absente d'un de ces navigateurs.

### 8.5 Tests

- La logique (`aleatoire.js`, `jeu.js`) est indépendante du DOM et testable avec une simple page `tests.html` ou avec Node, sans bibliothèque de test.
- Cas à couvrir :
  - même seed ⇒ même partie ; seeds différentes ⇒ parties différentes ;
  - 7 ≤ nX ≤ 10, 1 ≤ mX ≤ 2, ensembles disjoints, 25 mots distincts ;
  - calcul des tours (7→4, 8→4, 9→5, 10→5) ;
  - nombre annoncé borné par les verts restants ;
  - enchaînements de fin de manche (5.6), y compris quand une équipe a fini ses mots ou n'a plus de tours ;
  - victoire, défaite par mot noir, défaite par épuisement des tours ;
  - reprise d'une sauvegarde.

---

## 9. Hors périmètre (pour l'instant)

- Jeu en réseau ou sur plusieurs appareils.
- Comptes, scores en ligne, classement.
- Minuteur pour donner un indice ou deviner.
- Autres langues que le français.
- Mode paysage optimisé (il doit fonctionner, sans être optimisé).

---

## 10. Récapitulatif des règles chiffrées

| Paramètre | Valeur |
|---|---|
| Mots dans la grille | 25 |
| Mots verts par équipe | 7 à 10 (indépendants pour A et B) |
| Mots noirs par équipe | 1 à 2 (indépendants pour A et B) |
| Tours par équipe | ⌈verts / 2⌉ |
| Nombre annoncé avec un indice | 0 à verts restants de la donneuse |
| Compte à rebours de départ | 3 s |

---

## 11. Questions ouvertes

| # | Question | Hypothèse actuelle |
|---|---|---|
| 1 | Que signifie le nombre **0** ? (Dans d'autres jeux, « 0 » veut dire « aucun de mes mots n'est lié à cet indice » et autorise un nombre illimité de propositions.) | Propositions illimitées jusqu'à une erreur ou un arrêt volontaire. |
| 2 | Un même mot peut-il avoir une couleur dans les deux clés (ex. vert pour A **et** vert, ou noir, pour B) ? | Non : verts et noirs de A et de B sont tous disjoints. |
| 3 | Quand une équipe n'a plus de tours mais encore des mots à faire deviner, la victoire est impossible : la partie s'arrête-t-elle tout de suite ? | Oui, défaite immédiate « Plus de tours ». |
| 4 | Quelle équipe commence ? | Tirée au sort par la seed. |
| 5 | L'équipe qui devine peut-elle s'arrêter volontairement avant d'avoir trouvé le nombre annoncé ? Peut-elle tenter un mot de plus que le nombre annoncé ? | Arrêt volontaire : oui. Mot bonus : non. |
| 6 | Dans la vue « deviner », les mots déjà trouvés par **l'autre** équipe doivent-ils aussi apparaître comme cartes vides ? | Non, seuls ceux trouvés par l'équipe qui devine (conformément à la demande initiale). |
| 7 | Contraintes sur l'indice (un seul mot, différent des mots de la grille) : le jeu doit-il les vérifier ? | Oui (5.4). |
| 8 | La seed doit-elle être visible et saisissable par les joueurs ? | Oui, discrètement, sur l'écran de préparation. |
| 9 | Distribution : un fichier ouvert directement (`file://`), une PWA installable, ou les deux ? | Fichier ouvert directement ; PWA optionnelle. |
| 10 | Sauvegarde automatique de la partie en cours ? | Oui (`localStorage`). |
| 11 | Faut-il afficher le nombre de mots et de tours de chaque équipe dès la préparation ? | Oui. |
| 12 | Nom du jeu ? | À définir. |
