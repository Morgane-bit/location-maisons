// backend/config/firebaseAdmin.js
const admin = require('firebase-admin');
const serviceAccount = require('../location-maison-476fb-firebase-adminsdk-fbsvc-680e2079e2.json'); // Chemin vers ta clé Firebase Admin

// Vérifie si l'app n'est pas déjà initialisée
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore(); // Firestore
const auth = admin.auth();    // Auth

module.exports = { admin, db, auth };
