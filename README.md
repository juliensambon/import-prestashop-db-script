<h1>Script node pour importer une base de données prestashop en local.</h1>

Pour installer:

- npm install
- npm link

npm link permet de créer un path vers import.js (import-prestashop-db), 
c'est possible de changer ce nom dans le package.json > bin

Ensuite il faudra aller dans config > db.config.js pour configurer les accès à notre mysql

la commande import-prestashop-db --help est disponible afin d'avoir plus d'info sur les options du script.

Exemple d'import :
import-prestashop-db --db prestashop -s ~/Downloads/prestashop.sql -d dev-prestashop --disable-modules=cdc_googletagmanager second_module

Pour ceux sur windows il faudra faire "node import-prestashop-db ..."


Le mot de passe de l'utilisateur mysql sera demandé pour importer.
