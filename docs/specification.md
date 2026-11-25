# Le Jeu Masterclass, Un Banger : spécification

Ce document décrit précisément le comportement attendu du jeu, ses écrans et son architecture technique.
Les règles côté joueurs sont dans [`regles.md`](regles.md).

Les points marqués **(H)** sont des **hypothèses** prises en l'absence de précision. Ceux qui restent à trancher sont dans la section [Questions ouvertes](#11-questions-ouvertes).

---

## 1. Contraintes générales

| Contrainte | Détail |
|---|---|
| Hors ligne | Le jeu fonctionne sans aucune connexion réseau : aucune ressource externe (pas de CDN, pas de police web, pas d'API). |
| Technologies | HTML, CSS et JavaScript « vanilla » uniquement. Aucun framework, aucune bibliothèque, aucun moteur de jeu, aucune étape de build. |
| Livrable | **Un seul fichier `index.html`** contenant tout (HTML, CSS dans `<style>`, JavaScript dans `<script>`, liste de mots). Pas de PWA dans cette première étape. |
| Ouverture | Le fichier s'ouvre directement dans le navigateur (protocole `file://`), sans serveur. Conséquences : pas de modules ES (`import`/`export`), pas de `fetch`. |
| Appareil | Un seul téléphone partagé, en **mode portrait**. Doit aussi rester utilisable sur tablette et ordinateur. |
| Joueurs | 2 à 99 joueurs ou plus, répartis en équipes A et B. Le jeu ne gère pas les joueurs individuellement. |
| Langue | Interface et mots en **français**. |
| Mode | Coopératif : victoire ou défaite communes. |

---

## 2. Vocabulaire

| Terme | Définition |
|---|---|
| **Seed** | Chaîne qui détermine entièrement la partie (mots, clés, équipe qui commence). Même seed ⇒ même partie. |
| **Grille** | Les 25 mots de la partie, dans un ordre fixe. |
| **Clé d'une équipe** | Pour chacun des 25 mots, sa couleur pour cette équipe : `vert`, `rouge` ou `noir`. Chaque équipe a sa propre clé ; les deux clés ne se recoupent en vert que sur les mots partagés. |
| **Mot partagé** | Mot vert dans **les deux** clés (3 par partie, sans qu'on sache lesquels). Trouvé par une équipe, il compte pour les deux. |
| **Mot vert de X** | Mot que l'équipe X doit faire deviner à l'autre équipe. |
| **Mot noir de X** | Mot mortel de la clé de X : si l'autre équipe le choisit pendant que X fait deviner, la partie est perdue. |
| **Mot rouge de X** | Tout autre mot de la clé de X. |
| **Équipe donneuse** | Équipe qui donne l'indice (elle voit sa clé). |
| **Équipe devineuse** | Équipe qui devine (elle ne voit aucune clé). |
| **Tour** | Un indice donné par une équipe. Les deux équipes se partagent un même compteur de **9 tours**. |
| **Manche** | Un indice + la séquence de propositions de l'équipe devineuse qui suit. |
| **Restants de X** | Nombre de mots verts de X pas encore trouvés par l'autre équipe. |

---

## 3. Génération d'une partie à partir de la seed

### 3.1 Seed

- Générée aléatoirement au lancement d'une nouvelle partie : 6 caractères parmi un alphabet sans ambiguïté (ex. `ABCDEFGHJKMNPQRSTUVWXYZ23456789`).
- Affichée discrètement sur l'écran de préparation, et saisissable pour rejouer une partie précise.
- Elle sert à initialiser un **générateur pseudo-aléatoire déterministe** (une fonction de hachage de chaîne vers un entier 32 bits, puis un PRNG simple de type *mulberry32* ou *sfc32*). `Math.random()` n'est utilisé que pour créer une nouvelle seed, jamais pour la partie elle-même.
- **(H)** La saisie est insensible à la casse (convertie en majuscules).

### 3.2 Tirages (dans cet ordre, toujours le même)

1. **25 mots** distincts tirés dans la liste de mots (mélange de Fisher-Yates, on garde les 25 premiers).
2. **Nombre de mots noirs** : `mA` puis `mB`, chacun tiré dans `{1, 2}`. (Le nombre de mots verts, 9 par équipe, le nombre de mots partagés, 3, et le nombre de tours, 9, sont fixes : aucun tirage.)
3. **Clé de A** : on mélange les indices 0 à 24 ; les 9 premiers sont verts, les `mA` suivants noirs, le reste rouge.
4. **Mots partagés** : on mélange les mots verts de A et on en garde 3.
5. **Verts de B** : on mélange les mots qui ne sont **pas** verts pour A (ils peuvent être noirs ou rouges pour A) et on en garde 6 ; avec les 3 mots partagés, cela fait 9 verts pour B, dont **exactement** 3 sont aussi verts pour A.
6. **Noirs de B** : on mélange les mots qui ne sont pas verts pour B (ils peuvent être verts pour A) et on en garde `mB`.
7. **Tirage à pile ou face** pour l'équipe qui commence.

> L'ordre des tirages fait partie du format : le modifier change les parties associées à chaque seed. La liste de mots est **versionnée** pour la même raison (une seed n'est reproductible qu'avec la même version de la liste), de même que le format de l'état (`versionFormat`, passé à 3 avec les 9 mots par équipe, les 3 mots partagés et les 9 tours communs ; les parties sauvegardées dans un format précédent sont ignorées).

### 3.3 Mots partagés et recoupements des clés

- Exactement **3 mots** sont **verts dans les deux clés** : ce sont les mots partagés. Les joueurs savent qu'il y en a 3, mais pas lesquels : ils ne sont pas signalés dans la vue « faire deviner » (un mot partagé s'affiche vert comme les autres).
- Les autres recoupements restent libres : un mot peut être vert/noir, noir/vert, noir/noir, rouge/vert, etc. Une équipe ne peut donc pas exclure un mot sous prétexte qu'il est rouge ou vert dans sa propre clé.
- Les 9 mots verts de chaque équipe **incluent** les mots partagés. Il y a donc 9 + 9 − 3 = **15 mots verts distincts** à trouver en tout.
- Les joueurs apprennent qu'un mot était partagé au moment où il est trouvé (annonce dans l'écran de résultat, 5.5) ou en voyant baisser le nombre de mots restants de l'autre équipe.

### 3.4 Nombre de tours

Les deux équipes se partagent **9 tours** : chaque indice donné, par l'une ou l'autre équipe, consomme un tour du même compteur. Il faut donc trouver 15 mots en 9 indices au plus, soit environ 1,7 mot par indice.

### 3.5 Équipe qui commence

Les deux équipes ayant le même nombre de mots verts, l'équipe qui commence est **tirée au sort** (étape 7 de 3.2).

### 3.6 « Changer les mots »

Génère une **nouvelle seed** et donc une partie entièrement nouvelle (mots, nombres de verts/noirs, clés, équipe qui commence). Les cases « prête » des deux équipes sont décochées.

---

## 4. Liste de mots

- Intégrée à `index.html` (un tableau de chaînes) avec un numéro de version.
- Uniquement des **noms communs** et **noms propres** **très connus de tous**, adultes comme enfants (ex. : *chat*, *maison*, *soleil*, *pomme*, *Paris*, *Napoléon*, *Lune*…).
- À éviter : mots rares, techniques, régionaux, argotiques, vulgaires ou choquants, mots composés de plusieurs mots si possible.
- Pas de doublons (comparaison insensible à la casse et aux accents).
- Taille : environ **1 500 mots** (version 2 ; la version 1 en comptait 682), pour limiter les répétitions d'une partie à l'autre. Un test vérifie l'absence de doublons et un minimum de 1 000 mots.
- Les noms de couleurs (rouge, vert, noir…) sont exclus de la liste, pour ne pas les confondre avec les couleurs des cartes.
- Longueur : majoritairement des mots courts ou moyens ; les mots longs (> 12 lettres) sont acceptés mais rares, car ils occupent une ligne entière.

---

## 5. Déroulement : machine à états

```
             ┌──────────────┐  A et B prêtes   ┌─────────────┐
  démarrage ─► PRÉPARATION  ├─────────────────►│ COMPTE À    │
             └──────┬───────┘◄─────────────────┤ REBOURS 3 s │
                ▲   │         une case décochée └──────┬──────┘
                └───┘ « Changer les mots »             │
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
                              │      manche finie     │   mot noir / victoire / tours épuisés
                              └───────────────────────┤──────────────────────────┐
                                                      │                          ▼
                                                      │                 ┌────────────────┐
                                                      └────────────────►│ FIN DE PARTIE  │
                                                                        └────────────────┘
```

### 5.1 PRÉPARATION

- Affiche les 25 mots sur fond neutre, **sans aucune couleur de clé**.
- Affiche aussi, pour information, le nombre de mots à faire deviner sous chaque case « prête » (« 9 mots »), et le rappel « 9 tours en tout, pour les deux équipes · 3 mots partagés ».
- Bouton **« Changer les mots »** (voir 3.6).
- Affichage discret de la seed, avec possibilité d'en saisir une.
- Deux cases à cocher : **« Équipe A prête »** et **« Équipe B prête »**.
- Quand les deux sont cochées → COMPTE À REBOURS.

### 5.2 COMPTE À REBOURS

- Affiche 3, 2, 1 (une seconde chacun).
- Un bouton **« Annuler »** arrête le compte à rebours, **décoche les deux cases** et revient en PRÉPARATION (le compte à rebours masque les cases elles-mêmes).
- À la fin → PASSAGE vers l'équipe qui commence (3.5).

### 5.3 PASSAGE (écran de transition)

- Écran **opaque** qui ne montre **aucune information secrète** : seulement « Tour de l'équipe X » (donneuse) ou « Au tour de l'équipe Y » (devineuse), un bouton **« Prêt »** et un rappel du score (mots restants de chaque équipe, tours restants communs).
- Il existe pour que l'appareil puisse être passé sans que l'autre équipe voie l'écran. Il apparaît **à chaque changement de rôle**, même si c'est la même équipe qui garde le téléphone (passage de « devine » à « fait deviner »).
- Il porte la couleur de l'équipe concernée (A en bleu, B en ambre) et ne laisse rien de la grille dans le DOM.
- Un lien discret **« Abandonner la partie »** (avec confirmation) permet de sortir d'une partie en cours : tout le monde perd (cause « abandon »). Il n'existe que sur les écrans de passage.

### 5.4 INDICE (équipe donneuse X)

Affichage des 25 cartes avec la clé de X :

| Mot | Apparence |
|---|---|
| Vert de X, pas encore trouvé | Fond **vert** |
| Vert de X, déjà trouvé par Y | Fond vert atténué + coche ✓, non interactif |
| Rouge de X | Fond **rouge** |
| Rouge de X déjà proposé à tort par Y | **(H)** Fond rouge atténué + croix ✗ |
| Noir de X | Fond **noir**, texte blanc, ☠ |

En bas de l'écran :

- champ texte **« Indice »** ;
- sélecteur du **nombre** de mots : de **0** aux restants de X (**(H)** gros boutons −/+ ou rangée de pastilles, adaptés au doigt) ;
- rappel « Tours restants : k » ;
- bouton **« Valider »**, actif uniquement si l'indice est valide.

Validation de l'indice :

- non vide après suppression des espaces en début et en fin ;
- un seul mot (pas d'espace ; **(H)** tiret et apostrophe autorisés) ;
- différent de chacun des 25 mots de la grille (comparaison insensible à la casse et aux accents).
- Si l'indice est refusé, un court message explique pourquoi.

À la validation : le compteur `tours` diminue de 1, l'indice et le nombre sont mémorisés, puis PASSAGE vers Y.

### 5.5 DEVINETTE (équipe devineuse Y)

Affichage des 25 cartes, **sans aucune clé** :

| Mot | Apparence | Sélectionnable |
|---|---|---|
| Déjà trouvé par Y | Carte **blanche vide** (emplacement conservé pour que la grille ne bouge pas) | Non |
| Déjà proposé à tort par Y | Fond **gris** | Non |
| Tous les autres | Fond **blanc** | Oui |

Une erreur reste grise pour toujours : un mot rouge dans la clé de X ne deviendra jamais vert pour X, donc Y n'a aucune raison de le reproposer.

En bas de l'écran : l'**indice**, le **nombre** annoncé, et la progression de la manche, par exemple « 1 trouvé — encore 2 possibles (dont 1 bonus) ».

**Limite de la manche** : Y peut trouver au plus **nombre + 1** mots (avec 0 : au plus 1 mot ; avec 3 : au plus 4 mots).

Interaction :

1. Toucher une carte la **sélectionne** (contour épais). Toucher une autre carte déplace la sélection ; toucher la carte sélectionnée la désélectionne.
2. **« Valider »** (actif seulement si une carte est sélectionnée) révèle le résultat selon la **clé de X** :

| Résultat | Effet |
|---|---|
| **Vert de X** | Retour visuel positif. La carte devient blanche vide pour Y. Restants de X −1. **Si le mot est aussi vert dans la clé de Y (mot partagé)**, il est aussi marqué trouvé pour Y : restants de Y −1, et l'écran de résultat l'annonce (« Mot partagé ! Il comptait aussi pour l'équipe Y. »). Si les restants de A **et** de B valent 0 → **VICTOIRE**. Sinon, si la limite nombre + 1 est atteinte ou si les restants de X valent 0 → fin de manche. Sinon, Y continue. |
| **Rouge de X** | Retour visuel négatif. La carte devient grise pour Y. Fin de manche. |
| **Noir de X** | **DÉFAITE** immédiate. |

3. Un bouton **« Arrêter de deviner »**, disponible à tout moment de la manche, y compris avant la première proposition, permet à Y de la terminer volontairement.

Un mot partagé trouvé est marqué trouvé **pour les deux équipes** : il devient une carte vide pour Y, et quand Y fait deviner à son tour, il apparaît dans sa vue comme un mot vert déjà trouvé (atténué, ✓), non sélectionnable. Un mot n'est jamais compté deux fois.

Hors mots partagés, seule la clé de **X** compte pendant la manche : la couleur du mot dans la clé de Y n'a aucun effet (un mot rouge ou noir pour Y reste un mot vert pour X, etc.).

**Écran de résultat** : après chaque « Valider », un écran plein format affiche pendant ≈ 1,6 s (ou jusqu'au toucher, après 0,4 s) le mot choisi sur fond vert, rouge ou noir (« Bravo ! », « Raté… », « Mot mortel ! ») et la suite : « Vous pouvez continuer. », « Fin de votre tour. », « C'était le dernier mot ! » ou la défaite. La logique avance immédiatement ; seul l'affichage attend.

### 5.6 Fin de manche : défaite par tours épuisés, puis enchaînement

Soit X la donneuse et Y la devineuse de la manche qui se termine.

1. **Défaite** s'il reste des mots verts à trouver (pour l'une ou l'autre équipe) et que le compteur de tours est à **0**. Message : « Plus de tours ». Le dernier tour est donc toujours joué en entier (indice, puis propositions de l'équipe qui devine) avant que la défaite soit prononcée.
2. Sinon, si les restants de Y sont supérieurs à 0 → Y devient donneuse.
3. Sinon → X redevient donneuse (ses restants sont forcément supérieurs à 0, sinon la victoire aurait déjà été déclarée).

Dans les cas 2 et 3, il reste forcément au moins un tour, grâce à la vérification 1.

### 5.7 FIN DE PARTIE

- Message de **victoire** (« Youpi, tout le monde a gagné ! ») ou de **défaite** avec la cause (« Mot mortel : *X* » / « Plus de tours »).
- Révélation des deux clés (bascule A/B ou affichage côte à côte), avec les mots trouvés (✓), les erreurs (✗) et les mots partagés (⇄), et le nombre de mots partagés de la partie.
- Récapitulatif : indices donnés par chaque équipe et mots trouvés pour chacun.
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
| `cle.A`, `cle.B` | 25 valeurs `vert`/`rouge`/`noir` | Les deux clés ; elles ont exactement 3 mots verts en commun (les mots partagés). |
| `tours` | nombre | Tours restants, communs aux deux équipes (9 au départ). |
| `trouves.A`, `trouves.B` | listes d'indices | Verts de A (resp. B) déjà trouvés : par l'autre équipe, ou via un mot partagé trouvé par l'une ou l'autre. Un mot partagé figure dans les deux listes. Ce sont aussi les cartes vides dans la vue « deviner » de B (resp. A). |
| `erreurs.A`, `erreurs.B` | listes d'indices | Mots que A (resp. B) a proposés à tort en devinant (gris dans sa vue). |
| `pret.A`, `pret.B` | booléens | Cases de préparation. |
| `ecran` | énumération | `preparation`, `compteARebours`, `passageDonneuse`, `indice`, `passageDevineuse`, `devinette`, `fin`. |
| `donneuse` | `A` / `B` | Équipe qui fait deviner dans la manche courante. |
| `indice` | objet ou vide | `{ mot, nombre, trouvesCetteManche }`. |
| `selection` | indice ou vide | Carte sélectionnée en devinette. |
| `historique` | liste | Indices donnés : `{ equipe, mot, nombre, propositions: [{ indice, resultat, partage }], arretVolontaire }`. |
| `resultat` | vide / `victoire` / `defaite` | Avec la cause de la défaite. |

La **logique du jeu** (fonctions pures : état + action → nouvel état) est séparée de l'**affichage**, ce qui permet de la tester sans navigateur (voir 8.5).

---

## 7. Interface et mise en page

### 7.1 Principes

- Mode **portrait**, toute l'interface tient dans la hauteur de l'écran (`100dvh`) : **aucun défilement** pendant la partie.
- Structure verticale : bandeau d'état fin en haut → grille (prend tout l'espace restant) → zone d'action en bas (indice, nombre, boutons).
- Cibles tactiles : chaque carte et chaque bouton mesure **au moins 44 × 44 px**.
- Désactiver le zoom au double-tap et la sélection de texte sur les cartes ; pas d'effet de survol nécessaire.
- Quand le clavier s'ouvre pour saisir l'indice, la zone de saisie et le bouton « Valider » restent visibles (la grille peut être temporairement réduite ou masquée).

### 7.2 Grille de cartes adaptative

Objectif : un mot long peut occuper une ligne à lui seul, deux mots courts (ou plus) partagent une ligne, et les 25 cartes tiennent à l'écran.

- Les cartes sont disposées en **flux qui passe à la ligne** (`flex-wrap`), dans l'ordre de la grille.
- Chaque carte a une largeur de base égale à la largeur de son mot (+ marges intérieures) et **s'étire** pour remplir la ligne (`flex-grow`), de sorte que chaque ligne est pleine.
- Un mot n'est **jamais coupé** au milieu.
- **Ajustement de la taille du texte** : au chargement et à chaque redimensionnement ou rotation, on cherche la plus grande taille de police (recherche dichotomique entre un minimum, ~14 px, et un maximum, ~28 px) pour laquelle la grille tient dans la hauteur disponible. Tous les mots utilisent la même taille.
- Si un mot dépasse la largeur de l'écran même à la taille minimale, seule sa carte réduit sa police.
- L'emplacement d'une carte trouvée est conservé (carte vide) pour que la grille ne se réorganise pas pendant la partie.
- **(H)** La disposition est la même sur tous les écrans (préparation, indice, devinette), pour que les joueurs retrouvent les mots au même endroit.

### 7.3 Couleurs et accessibilité

| État | Fond | Texte | Symbole |
|---|---|---|---|
| Neutre (préparation, devinette) | blanc | noir | — |
| Vert (à faire deviner) | vert | contraste suffisant | — |
| Vert trouvé (vue donneuse) | vert atténué | — | ✓ |
| Rouge (à ne pas faire deviner) | rouge | blanc | — |
| Rouge proposé à tort (vue donneuse) | rouge atténué | — | ✗ |
| Noir (mortel) | noir | blanc | ☠ |
| Erreur (vue devineuse) | gris | gris foncé | — |
| Trouvé (vue devineuse) | blanc, sans texte | — | — |
| Sélectionné | inchangé | — | contour épais |

- Les symboles complètent les couleurs pour les personnes daltoniennes (le couple rouge/vert est le cas le plus fréquent).
- Contraste texte/fond conforme WCAG AA.

### 7.4 Retours visuels

- Proposition correcte : brève animation positive (≈ 1 s) avant de rendre la main.
- Proposition incorrecte ou mortelle : animation distincte, puis message explicite.
- **(H)** Vibration courte (`navigator.vibrate`) si disponible ; aucun son par défaut.

---

## 8. Architecture technique

### 8.1 Un seul fichier

Tout tient dans **`index.html`**, organisé en sections clairement délimitées :

| Section | Contenu |
|---|---|
| `<style>` | Mise en page et couleurs |
| Structure HTML | Un conteneur par écran ; un seul visible à la fois |
| `<script id="mots">` | Liste de mots + version |
| `<script id="aleatoire">` | Hachage de la seed, PRNG, mélange, génération de seed |
| `<script id="jeu">` | Logique pure : création de partie, actions, règles, conditions de fin. Aucun accès au DOM ni à `localStorage`. |
| `<script id="sauvegarde">` | Lecture / écriture de l'état dans `localStorage` |
| `<script id="affichage">` | Rendu des écrans, ajustement de la grille, gestion des événements, démarrage |

- Scripts classiques (pas de modules), partageant un espace de noms global unique (ex. `window.Banger`).
- Pas de PWA (ni manifeste ni *service worker*) dans cette première étape.

### 8.2 Fonctionnement hors ligne

- Aucune requête réseau, aucune ressource externe ; polices système uniquement.
- Le fichier peut être copié sur le téléphone et ouvert localement, ou servi par n'importe quel hébergement statique.

### 8.3 Sauvegarde

- L'état est enregistré dans `localStorage` après chaque action, pour reprendre la partie après un rechargement accidentel, une mise en veille ou un appel.
- Au démarrage, si une sauvegarde compatible existe, la partie reprend sur un **écran de passage** (jamais directement sur une vue qui révèle une clé).
- Si `localStorage` est indisponible (navigation privée, `file://` sur certains navigateurs…), le jeu fonctionne normalement, sans reprise. Tous les accès sont protégés par `try/catch`.
- **(H, optionnel)** API *Screen Wake Lock* pour empêcher la mise en veille de l'écran pendant la partie, si le navigateur la propose.

### 8.4 Compatibilité

- Navigateurs mobiles récents : Safari iOS, Chrome Android, Firefox, Samsung Internet.
- Aucune fonctionnalité indispensable ne doit dépendre d'une API absente d'un de ces navigateurs.

### 8.5 Tests

- Les scripts `mots`, `aleatoire` et `jeu` sont indépendants du DOM.
- Un script de test de développement, `tests/jeu.test.js`, non livré aux joueurs, lit `index.html`, extrait ces trois scripts et les exécute avec Node (`node:vm` et `node:test`, intégrés à Node, sans dépendance) : `node --test` (sans argument).
- Cas à couvrir :
  - même seed ⇒ même partie ; seeds différentes ⇒ parties différentes ;
  - 25 mots distincts ; dans chaque clé, exactement 9 verts et 1 à 2 noirs (1 et 2 apparaissent), sans recouvrement à l'intérieur d'une clé ;
  - exactement 3 mots verts en commun entre les deux clés, soit 15 mots verts distincts ;
  - les autres combinaisons de couleurs entre clés (vert/noir, noir/noir…) apparaissent aussi ;
  - mot partagé : trouvé par une équipe, il compte pour les deux (restants, victoire, jamais compté deux fois) ; mot non partagé : seule la clé de la donneuse avance ;
  - 9 tours au départ, partagés : l'indice de chaque équipe consomme le même compteur ;
  - équipe qui commence : tirée au sort (A et B peuvent chacune commencer) ;
  - nombre annoncé borné par les restants de la donneuse ; limite nombre + 1 en devinette, y compris avec 0 ;
  - fin de manche : erreur, limite atteinte, restants de la donneuse à 0, arrêt volontaire ;
  - enchaînements de la section 5.6 ;
  - victoire, défaite par mot noir, défaite par tours épuisés (après le dernier tour joué en entier), pas de défaite si le dernier mot est trouvé avec le dernier tour ;
  - validation de l'indice ;
  - liste de mots sans doublons (insensible à la casse et aux accents).
- Vérification visuelle de la mise en page sur plusieurs tailles d'écran de téléphone (ex. 320 × 568, 360 × 640, 390 × 844, 430 × 932), en particulier avec les mots les plus longs. Contrôlée dans Chromium avec Playwright : aucune carte ne déborde, ni la grille ni la page ne défilent, la police descend à 14 px et la hauteur des cartes à 32 px au minimum sur les très petits écrans (320 × 568 ; 44 px sur 360 × 640 et plus grand).

---

## 9. Hors périmètre (pour l'instant)

- PWA / installation comme application.
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
| Mots verts par équipe | 9, mots partagés inclus (15 mots verts distincts en tout) |
| Mots noirs par équipe | 1 à 2 (indépendants pour A et B) |
| Mots partagés (verts des deux côtés) | 3, lesquels est inconnu des joueurs ; trouvés par une équipe, ils comptent pour les deux |
| Autres recoupements entre les clés | Libres (vert/noir, noir/noir, rouge/vert…) |
| Tours | 9 en tout, communs aux deux équipes |
| Nombre annoncé avec un indice | 0 aux restants de la donneuse |
| Mots trouvables par manche | au plus nombre + 1 |
| Équipe qui commence | Tirée au sort |
| Compte à rebours de départ | 3 s |

---

## 11. Questions ouvertes

Aucune pour l'instant.

Décisions récentes :

- **Paramètres de la partie** (remplacent les tirages 7 à 10 mots, 0 à 4 mots partagés et ⌈n/2⌉ tours par équipe) : 9 mots verts par équipe, 3 mots partagés, 9 tours en tout communs aux deux équipes. Les mots noirs restent à 1 ou 2 par équipe.
- **Mots partagés** : verts pour les deux équipes ; trouvé par une équipe, un mot partagé compte pour les deux. Le jeu l'annonce au moment où il est trouvé.
- L'équipe qui devine peut appuyer sur « Arrêter de deviner » **avant toute proposition** (elle passe alors son tour).
