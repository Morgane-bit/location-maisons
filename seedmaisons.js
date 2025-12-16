// ajouterProprietaireHash.js
// Usage: node ajouterProprietaireHash.js

const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.join(__dirname, 'location-maison-476fb-firebase-adminsdk-fbsvc-680e2079e2.json'); // ajuste le nom si besoin
const SALT_ROUNDS = 10;

// Vérifie que la clé existe
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error('ERREUR: fichier de clé de service introuvable. Définis GOOGLE_APPLICATION_CREDENTIALS ou place serviceAccountKey.json dans le dossier courant.');
  process.exit(1);
}

try {
  const creds = process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? undefined // admin.credential.applicationDefault() sera utilisé
    : require(SERVICE_ACCOUNT_PATH);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: process.env.GOOGLE_APPLICATION_CREDENTIALS
        ? admin.credential.applicationDefault()
        : admin.credential.cert(creds)
    });
  }
} catch (err) {
  console.error('Erreur initialisation Firebase Admin:', err);
  process.exit(1);
}

const db = admin.firestore();

// --- Données à personnaliser ---
const nouveauProprietaire = {
  nom: "WANKPO Morgane",
  email: "wankpomorgane17@gmail.com",
  telephone: "42009261",
  plainPassword: "Morgane" // CHANGEZ-LE avant d'exécuter
};
// --------------------------------

async function run() {
  try {
    // 1) Vérifier si l'email existe déjà
    const q = await db.collection('proprietaire').where('email', '==', nouveauProprietaire.email).get();
    if (!q.empty) {
      console.error(`Un propriétaire avec l'email ${nouveauProprietaire.email} existe déjà. Abandon.`);
      process.exit(1);
    }

    // 2) Hacher le mot de passe
    const hash = await bcrypt.hash(nouveauProprietaire.plainPassword, SALT_ROUNDS);

    // 3) Préparer l'objet à insérer (ne pas garder plainPassword)
    const doc = {
      nom: nouveauProprietaire.nom,
      email: nouveauProprietaire.email,
      telephone: nouveauProprietaire.telephone,
      password: hash,
      dateCreation: admin.firestore.FieldValue.serverTimestamp()
    };

    // 4) Ajouter dans la collection 'proprietaire'
    const ref = await db.collection('proprietaire').add(doc);
    console.log(`Propriétaire ajouté avec l'ID : ${ref.id}`);
    process.exit(0);
  } catch (err) {
    console.error('Erreur:', err);
    process.exit(1);
  }
}

run();
