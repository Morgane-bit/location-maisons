// routes/demandes.js
const express = require('express');
const router = express.Router();
const { db } = require('../config/firebaseAdmin');
const auth = require('../middleware/auth'); // middleware JWT

// --- Récupérer tous les messages pour le propriétaire connecté ---
router.get('/mes-demandes', auth, async (req, res) => {
  console.log("Email du token :", req.proprietaireEmail);
  const proprietaireEmail = req.proprietaireEmail;
  if (!proprietaireEmail) {
    return res.status(400).json({ error: "Propriétaire non identifié" });
  }

  try {
    // Récupérer les messages pour cet email de propriétaire
    const snapshot = await db.collection('messages')
      .where('proprietaireEmail', '==', proprietaireEmail)
      .orderBy('createdAt', 'desc')
      .get();

    // Si aucun message, renvoyer tableau vide
    const messages = snapshot.empty ? [] : snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
    res.json(messages);
  } catch (err) {
    console.error("Erreur récupération messages :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// --- Ajouter un nouveau message (ex: depuis un formulaire client) ---
router.post('/ajouter', async (req, res) => {
  const { maisonId, nomClient, email, telephone, message, proprietaireEmail } = req.body;

  if (!maisonId || !nomClient || !email || !telephone || !message || !proprietaireEmail) {
    return res.status(400).json({ error: "Champs obligatoires manquants" });
  }

  try {
    const newDoc = await db.collection('messages').add({
      maisonId,
      nomClient,
      email,
      telephone,
      message,
      proprietaireEmail,
      statut: "En attente",
      createdAt: new Date()
    });

    res.json({ success: true, message: "Message envoyé avec succès", id: newDoc.id });
  } catch (err) {
    console.error("Erreur création message :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

  // routes/demandes.js
router.delete('/:id', auth, async (req, res) => {
  const id = req.params.id;
  try {
    const docRef = db.collection('messages').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Demande non trouvée" });

    await docRef.delete();
    res.json({ message: "Demande supprimée avec succès" });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// --- Répondre à un message ---
router.put('/:id/repondre', auth, async (req, res) => {
  const { id } = req.params;
  const { message, statut } = req.body;

  try {
    const docRef = db.collection('messages').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return res.status(404).json({ error: "Demande non trouvée" });

    await docRef.update({
      reponse: message,
      statut: statut || 'Répondu',
      updatedAt: new Date()
    });

    res.json({ message: "Statut mis à jour avec succès" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


module.exports = router;
