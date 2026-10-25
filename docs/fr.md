# GIOŚ

La qualité de l'air mesurée par les stations officielles du
[GIOŚ](https://powietrze.gios.gov.pl), l'inspection générale polonaise de
l'environnement (Główny Inspektorat Ochrony Środowiska) : l'indice polonais de
qualité de l'air et les polluants, station par station, heure par heure.

Non affilié au GIOŚ. Les données viennent de son API ouverte
(`api.gios.gov.pl`), utilisées telles que le GIOŚ les publie.

## Ce que fait l'intégration

- Lit les stations du GIOŚ que vous choisissez (10 au plus), sans compte ni
  clé.
- Crée **un appareil par station** : l'indice polonais de qualité de l'air
  (0 à 5) et son niveau en toutes lettres, les polluants que mesure la station
  (PM2.5, PM10, NO₂, O₃, SO₂, CO, benzène) et l'âge des données.
- Ajoute un widget **Qualité de l'air GIOŚ**, deux déclencheurs de scène
  (**qualité de l'air dégradée**, **retour à la normale**) et une action de
  scène **Obtenir la qualité de l'air**.
- Trouve une station par son nom ou sa ville, ou les plus proches de votre
  maison.

Lecture seule : l'intégration ne fait que lire des données publiques.

## Prérequis

- Gladys Assistant 5.3.0 ou plus récent.
- Un accès Internet de Gladys vers `api.gios.gov.pl`.
- Pour chercher autour de votre maison : sa position, dans **Paramètres →
  Maisons**.

## Configuration

### Choisir les stations

1. Ouvrez l'onglet **Configuration** de l'intégration.
2. Cliquez sur **Trouver une station** : saisissez un nom ou une ville
   (`Kraków`, `Gdansk` : les accents sont facultatifs), ou laissez vide pour
   lister les stations les plus proches de votre maison, avec leur distance.
3. Recopiez les numéros voulus dans **Stations**, séparés par des virgules :
   par exemple `530, 401`. Enregistrez.
4. Dans l'onglet **Découverte**, ajoutez les stations à Gladys.

La [carte des stations](https://powietrze.gios.gov.pl/pjp/current) les montre
toutes.

### Autres réglages

- **Relevé** : toutes les 30 minutes (par défaut) ou toutes les heures. Le
  GIOŚ publie des moyennes horaires, un peu après chaque heure : lire plus
  souvent n'apporterait rien.
- **Langue** : langue des noms de fonctionnalités (fixés à l'ajout d'un
  appareil : choisissez-la d'abord) et des textes de scène. Français par
  défaut.

Le bouton **Vérifier les stations** lit toutes les stations tout de suite et
dit ce que chacune répond.

## Appareils

Un appareil par station, nommé `GIOŚ <station>`.

| Fonctionnalité                      | Valeurs                                        |
| ----------------------------------- | ---------------------------------------------- |
| Indice de qualité de l'air          | 0 à 5 (indice polonais, ci-dessous)            |
| Qualité de l'air                    | le niveau en toutes lettres, dans votre langue |
| PM2.5, PM10, NO₂, O₃, SO₂, CO, C₆H₆ | µg/m³, moyenne horaire                         |
| Âge de la mesure                    | minutes depuis l'heure des dernières données   |

Seuls les polluants que mesure la station sont créés. Le CO et le benzène
n'ont pas de type dédié en µg/m³ dans Gladys : ils apparaissent comme des
valeurs simples, nommées par leur formule.

L'**indice polonais de qualité de l'air** (Polski indeks jakości powietrza) a
six niveaux : 0 Très bon (Bardzo dobry), 1 Bon (Dobry), 2 Modéré
(Umiarkowany), 3 Passable (Dostateczny), 4 Mauvais (Zły), 5 Très mauvais
(Bardzo zły). Le GIOŚ le calcule à partir des PM2.5, PM10, NO₂, O₃ et SO₂ : le
pire des cinq le fixe.

Une valeur de plus de 3 heures n'est plus publiée comme actuelle : Gladys
garde la dernière avec sa date, et le widget indique que les données sont
périmées.

## Widget

**Qualité de l'air GIOŚ** :

- avec une station choisie : jusqu'à quatre tuiles de polluants, le niveau de
  l'indice en couleur (vert, orange, rouge) et l'âge des données ;
- sans : une ligne par station, son niveau en couleur.

## Scènes

### Déclencheur : GIOŚ : qualité de l'air dégradée

Se déclenche quand l'indice d'une station passe à **Modéré** ou pire, ou
s'aggrave encore (Modéré puis Mauvais déclenche deux fois). Filtres : la
station, et le **nouveau niveau** : cochez les niveaux à partir de votre seuil
(par exemple Mauvais et Très mauvais). Informations pour les actions : nom de
la station, niveau, son indice, l'indice précédent, le polluant qui fixe le
niveau, un résumé tout prêt.

### Déclencheur : GIOŚ : retour à la normale

Se déclenche quand l'indice revient à **Bon** ou **Très bon** après une
dégradation. Filtres : la station, et le pire niveau atteint par la
dégradation (cochez les mêmes niveaux que ci-dessus pour apparier les deux
scènes). Informations : le nouveau niveau, le pire niveau atteint, un résumé.

Le premier indice lu après l'installation fixe le niveau de départ et ne
déclenche rien ; un redémarrage ne déclenche pas deux fois le même changement.

### Action : GIOŚ : obtenir la qualité de l'air

La qualité de l'air d'une station, ou de la station dont l'indice est le pire
: résumé, niveau, indice, polluant, PM2.5, PM10, NO₂, O₃ et âge des données,
pour les actions suivantes (un message, une condition).

## Exemples de scènes

- **Fermer les fenêtres** : déclencheur _qualité de l'air dégradée_ avec les
  niveaux Mauvais et Très mauvais → envoyer `{{triggerEvent.data.summary}}` et
  couper la ventilation.
- **De l'air** : déclencheur _retour à la normale_ avec les mêmes niveaux →
  envoyer « Vous pouvez rouvrir les fenêtres ».
- **Point du matin** : à 7 h 30, action _obtenir la qualité de l'air_ sans
  station, puis envoyer son résumé dans le message du matin.
- **Purificateur** : quand la fonctionnalité PM2.5 de votre station dépasse
  25 µg/m³, allumer le purificateur d'air.

## Dépannage

- **« Aucune station »** sur l'écran de configuration : saisissez au moins un
  numéro de station dans **Stations**.
- **« pas une station du GIOŚ »** dans la vérification : le numéro n'est pas
  dans la liste du GIOŚ ; utilisez **Trouver une station**.
- **Pas de PM2.5 sur une station qui en mesure** : certaines stations n'ont
  qu'un capteur PM2.5 manuel, dont le GIOŚ publie les résultats des semaines
  plus tard. Seuls les capteurs automatiques, horaires, sont lus.
- **« L'API du GIOŚ ne répond pas »** : les valeurs sont gardées et relues au
  relevé suivant. L'onglet Journaux signale l'erreur une fois, et sa fin.
- **Indice de qualité de l'air sans valeur** : le GIOŚ ne donne pas d'indice
  pour cette heure (« Brak indeksu »), par exemple après une panne de mesure.
- Détails dans l'onglet **Journaux** de l'intégration (`LOG_LEVEL=debug` pour
  plus).

## Limites

- Données horaires, publiées par le GIOŚ un peu après chaque heure : la
  dernière heure manque souvent, et les valeurs ont 1 à 2 heures de retard.
- Ce sont des mesures, pas des prévisions.
- Le GIOŚ limite son API (1500 requêtes par minute sur les données actuelles,
  2 par minute sur la liste des stations) : l'intégration lit 10 stations au
  plus, une requête par polluant, et la liste des stations une fois par jour.
- Les déclencheurs suivent l'indice horaire du GIOŚ tel qu'il est publié : un
  indice qui hésite entre deux niveaux déclenche à chaque changement.
