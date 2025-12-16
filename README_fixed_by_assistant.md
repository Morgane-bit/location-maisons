# Corrections appliquées automatiquement

Principales modifications:

- Suppression des fichiers de clé de service détectés du ZIP.
- Ajout de `config/firebaseAdmin.js` pour initialiser firebase-admin côté serveur.
- Mise à jour de `routes/proprietaire.js` pour utiliser `admin.auth()` et Firestore.
- Ajout de `.gitignore` pour éviter de committer les clés et fichiers sensibles.
- Ajout d'un `package.json` minimal si absent.

⚠️ **Important**: Comme la clé de service a été retirée du projet, tu DOIS **rotater** la clé dans la console Firebase/Google Cloud et ensuite fournir la nouvelle clé via la variable d'environnement `GOOGLE_APPLICATION_CREDENTIALS` ou via un secret manager.
