// routes/stats.js
const express = require("express");
const router = express.Router();
const {db } = require('../config/firebaseAdmin');

// 🔹 Route pour récupérer les statistiques principales
router.get("/", async (req, res) => {
  try {
    // --- 1️⃣ Compter les maisons ---
    const maisonsSnapshot = await db.collection("maisons").get();
    const nbMaisons = maisonsSnapshot.size;

    // --- 2️⃣ Compter les messages ---
    const messagesSnapshot = await db.collection("messages").get();
    const nbMessages = messagesSnapshot.size;

    // --- 3️⃣ Statistiques par localisation ---
    const localisationCount = {};
    maisonsSnapshot.forEach((doc) => {
      const maison = doc.data();
      if (maison.localisation) {
        localisationCount[maison.localisation] =
          (localisationCount[maison.localisation] || 0) + 1;
      }
    });

    const statsLocalisation = Object.keys(localisationCount)
      .map((key) => ({ _id: key, total: localisationCount[key] }))
      .sort((a, b) => b.total - a.total);

    // --- 4️⃣ Statistiques par type de maison ---
    const typeCount = {};
    maisonsSnapshot.forEach((doc) => {
      const maison = doc.data();
      if (maison.type) {
        typeCount[maison.type] = (typeCount[maison.type] || 0) + 1;
      }
    });

    const statsType = Object.keys(typeCount)
      .map((key) => ({ _id: key, total: typeCount[key] }))
      .sort((a, b) => b.total - a.total);

    // --- 5️⃣ Réponse JSON ---
    res.json({
      maisons: nbMaisons,
      messages: nbMessages,
      parLocalisation: statsLocalisation,
      parType: statsType,
    });
  } catch (error) {
    console.error("Erreur lors du calcul des statistiques :", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
