# Le Jeu Masterclass, Un Banger : règles du jeu

## En bref

Deux équipes, **A** et **B**, un seul téléphone, 25 mots à l'écran.
Chaque équipe connaît en secret ses propres **mots à faire deviner** et doit les faire trouver à l'**autre** équipe en donnant des indices d'un seul mot.
Le jeu est **coopératif** : soit tout le monde gagne, soit tout le monde perd.

## Matériel et joueurs

- Un téléphone (ou une tablette) avec le jeu ouvert, qu'on se passe.
- Au moins 2 joueurs, sans limite haute, répartis en deux équipes A et B (au moins un joueur par équipe).
  Le jeu ne demande ni le nombre de joueurs ni leurs noms.

## Configuration de la partie

Avant de commencer, le bouton **« ⚙ Réglages »** de l'écran de préparation permet de choisir :

- le **nom de chaque équipe** (16 caractères au plus, deux noms différents) : à la place de « Équipe A » et « Équipe B » dans tout le jeu ;
- le **nombre de mots noirs** par équipe, de 0 à 6 (3 par défaut) ;
- les **noms propres** à utiliser, par catégorie : pays et continents, villes, régions / fleuves / monuments / planètes, personnalités, personnages et légendes, marques / films / jeux / fêtes. Une catégorie décochée n'est plus tirée ; les noms communs restent toujours.

Valider les réglages génère une nouvelle grille. Ils sont conservés pour les parties suivantes.

## Mise en place

Le jeu tire au hasard, à partir d'une **seed** (graine) :

- **25 mots** connus de tous (noms communs ou noms propres) ;
- pour **chaque équipe**, une **clé secrète** :
  - **9 mots verts** : les mots que cette équipe doit faire deviner à l'autre ;
  - **3 mots noirs (mortels)** par défaut (réglable de 0 à 6) : si l'autre équipe en choisit un, la partie est perdue ;
  - tous les autres mots sont **rouges** : ils ne sont pas à faire deviner.

**Les deux clés se recoupent.** Un mot peut être vert pour une équipe et noir pour l'autre, noir pour les deux, rouge pour l'une et vert pour l'autre… Ce n'est pas parce qu'un mot est rouge ou vert pour votre équipe qu'il l'est aussi pour l'autre !

### Les mots partagés

**3 mots** sont verts **pour les deux équipes** : ce sont les **mots partagés**. Personne ne sait lesquels.

Quand une équipe trouve un mot partagé, il compte **pour les deux équipes** : l'autre équipe n'aura plus à le faire deviner. Il disparaît de la grille pour tout le monde, et le nombre de mots restants à faire deviner de l'équipe qui devine baisse aussi.

Les 9 mots verts de chaque équipe **incluent** ses mots partagés : il y a donc **15 mots** à trouver en tout (9 + 9 − 3).

### Nombre de tours

Les deux équipes se partagent **9 tours** : chaque fois qu'une équipe donne un indice, un tour est consommé, quelle que soit l'équipe. Il faut donc trouver les 15 mots en 9 indices au plus.

## Étape 1 : préparation

1. Les 25 mots s'affichent (sans couleurs). Tout le monde peut les regarder.
2. Si un mot est inconnu de quelqu'un, n'importe quelle équipe peut appuyer sur **« Changer les mots »** : une nouvelle partie est tirée.
3. Chaque équipe coche sa case **« Équipe A prête »** / **« Équipe B prête »**.
4. Quand les deux cases sont cochées, un compte à rebours de **3 secondes** démarre.
5. Le message **« Tour de l'équipe X »** apparaît : l'équipe X prend le téléphone et appuie sur **« Prêt »**.
   L'équipe qui commence est tirée au sort.

## Étape 2 : la partie

Les équipes alternent entre deux rôles : **faire deviner** et **deviner**.

### Faire deviner (équipe X)

1. L'équipe X voit les 25 mots avec **sa** clé : verts (à faire deviner), rouges (à éviter), noirs (mortels).
   Les mots verts déjà trouvés par l'autre équipe sont signalés.
2. Elle choisit **un mot indice** et l'écrit. L'indice doit être un seul mot, différent des 25 mots de la grille.
3. Elle choisit **combien de mots** cet indice doit faire trouver (entre 0 et le nombre de mots verts qu'il lui reste).
4. Elle appuie sur **« Valider »**. Cela consomme **un des 9 tours** communs.
5. Un écran **« Au tour de l'équipe Y »** apparaît : on passe le téléphone à l'équipe Y, qui appuie sur **« Prêt »**.

### Deviner (équipe Y)

1. L'équipe Y voit les 25 mots **sur fond blanc**, sauf :
   - les mots qu'elle a déjà **trouvés** : la carte est vide (blanche, sans texte) ;
   - les mots qu'elle a déjà choisis **à tort** : fond **gris**.
2. L'indice et le nombre sont affichés en bas de l'écran.
3. L'équipe Y peut trouver **jusqu'à une fois de plus que le nombre annoncé** (avec « 2 », elle peut trouver jusqu'à 3 mots ; avec « 0 », jusqu'à 1 mot).
4. L'équipe touche un mot, puis appuie sur **« Valider »**. Trois cas :
   - **Mot vert (correct)** : bravo ! La carte disparaît et l'équipe peut continuer, jusqu'à la limite ci-dessus. Si c'est un **mot partagé**, le jeu l'annonce : il compte aussi pour l'équipe Y.
   - **Mot rouge (incorrect)** : la carte devient grise et l'équipe Y arrête de deviner pour ce tour.
   - **Mot noir (mortel)** : **la partie est perdue pour tout le monde**.
5. À tout moment, même avant sa première proposition, l'équipe Y peut appuyer sur **« Arrêter de deviner »** pour finir son tour sans prendre de risque.

### Qui fait deviner ensuite ?

Quand l'équipe Y a fini de deviner :

- si l'équipe Y a encore des mots à faire deviner, c'est à elle de faire deviner ;
- sinon, c'est de nouveau à l'équipe X.

Le dernier tour est toujours joué en entier : l'indice, puis les propositions de l'équipe qui devine.

## Fin de la partie

- **Victoire** 🎉 : tous les mots verts des **deux** équipes ont été trouvés. Tout le monde a gagné, youpi !
- **Défaite** :
  - un mot **mortel** a été choisi ;
  - ou il n'y a **plus de tours** (le neuvième indice est donné et joué) alors qu'il reste des mots à trouver.
  - ou les joueurs **abandonnent** (lien « Abandonner la partie » sur les écrans où l'on se passe le téléphone).

À la fin, les clés des deux équipes sont révélées (avec le nombre de mots partagés) et on peut lancer une nouvelle partie.
