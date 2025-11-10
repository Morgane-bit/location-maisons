const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { admin, db } = require('../config/firebaseAdmin');
const auth = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// --- Inscription ---
router.post('/register', async (req, res) => {
  let { nom, email, telephone, password } = req.body;
  if (!nom || !email || !telephone || !password)
    return res.status(400).json({ error: 'Tous les champs sont requis' });

  email = email.toLowerCase();
  try {
    const userRef = db.collection('proprietaire').doc(email);
    const docSnap = await userRef.get();
    if (docSnap.exists) return res.status(400).json({ error: 'Email déjà utilisé' });

    const hashed = await bcrypt.hash(password, 10);
    await userRef.set({ nom, email, telephone, password: hashed });

    res.json({ message: 'Propriétaire enregistré avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- Connexion ---
router.post('/login', async (req, res) => {
  let { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

  email = email.toLowerCase();
  try {
    const userRef = db.collection('proprietaire').doc(email);
    const docSnap = await userRef.get();
    if (!docSnap.exists) return res.status(400).json({ error: 'Utilisateur non trouvé' });

    const user = docSnap.data();
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Mot de passe incorrect' });

    const token = jwt.sign({ email: user.email, id: user.email }, JWT_SECRET, { expiresIn: '2h' });

    res.json({ token, nom: user.nom, email: user.email, telephone: user.telephone });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- Profil ---
router.get('/me', auth, async (req, res) => {
  try {
    const docSnap = await db.collection('proprietaire').doc(req.proprietaireEmail).get();
    if (!docSnap.exists) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    const { nom, email, telephone } = docSnap.data();
    res.json({ nom, email, telephone });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- Modifier profil ---
router.put('/update', auth, async (req, res) => {
  const { nom, telephone, password } = req.body;
  try {
    const updateData = { nom, telephone };
    if (password) updateData.password = await bcrypt.hash(password, 10);

    await db.collection('proprietaire').doc(req.proprietaireEmail).update(updateData);
    res.json({ message: 'Profil mis à jour avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- Supprimer compte ---
router.delete('/delete', auth, async (req, res) => {
  try {
    await db.collection('proprietaire').doc(req.proprietaireEmail).delete();

    const maisonsSnap = await db.collection('maisons').where('proprietaire', '==', req.proprietaireId).get();
    const batch = db.batch();
    maisonsSnap.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    res.json({ message: 'Compte et maisons supprimés avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
