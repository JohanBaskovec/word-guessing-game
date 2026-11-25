# Règles du jeu

## En bref

Deux équipes, **A** et **B**, un seul téléphone, 25 mots à l'écran.
Chaque équipe connaît en secret ses propres **mots à faire deviner** et doit les faire trouver à l'**autre** équipe en donnant des indices d'un seul mot.
Le jeu est **coopératif** : soit tout le monde gagne, soit tout le monde perd.

## Matériel et joueurs

- Un téléphone (ou une tablette) avec le jeu ouvert, qu'on se passe.
- Au moins 2 joueurs, sans limite haute, répartis en deux équipes A et B (au moins un joueur par équipe).
  Le jeu ne demande ni le nombre de joueurs ni leurs noms.

## Mise en place

Le jeu tire au hasard, à partir d'une **seed** (graine) :

- **25 mots** connus de tous (noms communs ou noms propres) ;
- pour **chaque équipe**, une **clé secrète** :
  - **7 à 10 mots verts** : les mots que cette équipe doit faire deviner à l'autre ;
  - **1 ou 2 mots noirs (mortels)** : si l'autre équipe les choisit, la partie est perdue ;
  - tous les autres mots sont **rouges** : ils ne sont pas à faire deviner.

Les deux équipes n'ont pas forcément le même nombre de mots verts (par exemple 10 pour A et 8 pour B).

### Nombre de tours

Chaque équipe dispose d'un nombre limité de **tours**, c'est-à-dire d'indices qu'elle peut donner :
**tours = nombre de mots verts ÷ 2, arrondi au supérieur**.

| Mots verts | Tours |
|---|---|
| 7 | 4 |
| 8 | 4 |
| 9 | 5 |
| 10 | 5 |

## Étape 1 : préparation

1. Les 25 mots s'affichent (sans couleurs). Tout le monde peut les regarder.
2. Si un mot est inconnu de quelqu'un, n'importe quelle équipe peut appuyer sur **« Changer les mots »** : une nouvelle partie est tirée.
3. Chaque équipe coche sa case **« Équipe A prête »** / **« Équipe B prête »**.
4. Quand les deux cases sont cochées, un compte à rebours de **3 secondes** démarre.
5. Le message **« Tour de l'équipe X »** apparaît : l'équipe X prend le téléphone et appuie sur **« Prêt »**.

## Étape 2 : la partie

Les équipes alternent entre deux rôles : **faire deviner** et **deviner**.

### Faire deviner (équipe X)

1. L'équipe X voit les 25 mots avec **sa** clé : verts (à faire deviner), rouges (à éviter), noirs (mortels).
   Les mots verts déjà trouvés par l'autre équipe sont signalés.
2. Elle choisit **un mot indice** et l'écrit.
3. Elle choisit **combien de mots** cet indice doit faire trouver (entre 0 et le nombre de mots verts qu'il lui reste).
4. Elle appuie sur **« Valider »**. Cela consomme **un tour** de l'équipe X.
5. Un écran **« Au tour de l'équipe Y »** apparaît : on passe le téléphone à l'équipe Y, qui appuie sur **« Prêt »**.

### Deviner (équipe Y)

1. L'équipe Y voit les 25 mots **sur fond blanc**, sauf :
   - les mots qu'elle a déjà **trouvés** : la carte est vide (blanche, sans texte) ;
   - les mots qu'elle a déjà choisis **à tort** : fond **gris**.
2. L'indice et le nombre sont affichés en bas de l'écran.
3. L'équipe touche un mot, puis appuie sur **« Valider »**. Trois cas :
   - **Mot vert (correct)** : bravo ! La carte disparaît.
     - Si c'était le dernier mot annoncé pour cet indice, l'équipe Y arrête de deviner.
     - Sinon, elle peut continuer à deviner.
   - **Mot rouge (incorrect)** : la carte devient grise et l'équipe Y arrête de deviner pour ce tour.
   - **Mot noir (mortel)** : **la partie est perdue pour tout le monde**.

### Qui fait deviner ensuite ?

Quand l'équipe Y a fini de deviner :

- si l'équipe Y a encore des mots à faire deviner **et** des tours, c'est à elle de faire deviner ;
- sinon, si l'équipe X a encore des mots à faire deviner **et** des tours, c'est de nouveau à l'équipe X ;
- sinon, la partie est terminée.

Une équipe qui n'a plus de tours ne peut plus faire deviner.

## Fin de la partie

- **Victoire** 🎉 : tous les mots verts des **deux** équipes ont été trouvés.
- **Défaite** :
  - un mot **mortel** a été choisi ;
  - ou plus aucune équipe ne peut faire deviner (plus de tours) alors qu'il reste des mots à trouver.

À la fin, les clés des deux équipes sont révélées et on peut lancer une nouvelle partie.
