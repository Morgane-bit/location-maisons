const admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.firebase_key); // clé Firebase depuis .env

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
