const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// --- Multer config ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// --- GET toutes les maisons avec filtres ---
router.get("/", async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { localisation, type } = req.query; // On récupère les filtres du frontend

    let query = db.collection("maisons");

    // Filtrage par localisation
    if (localisation) {
      query = query.where("localisation", "==", localisation);
    }

    // Filtrage par type
    if (type) {
      query = query.where("type", "==", type);
    }

    const snapshot = await query.get();
    const maisons = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      images: doc.data().images || []
    }));

    res.json(maisons);
  } catch (err) {
    console.error("Erreur GET /maisons :", err);
    res.status(500).json({ error: err.message });
  }
});

// --- GET maisons du propriétaire ---
router.get("/mes-maisons", auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const snapshot = await db.collection("maisons")
      .where("proprietaire", "==", req.proprietaireId)
      .get();
    const maisons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), images: doc.data().images || [] }));
    res.json(maisons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- GET maison par ID ---
router.get("/:id", auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const doc = await db.collection("maisons").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Maison introuvable" });
    const maison = doc.data();
    if (maison.proprietaire !== req.proprietaireId) return res.status(403).json({ error: "Non autorisé" });
    res.json({ id: doc.id, ...maison, images: maison.images || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- POST créer maison ---
router.post("/", auth, upload.array("media"), async (req, res) => {
  try {
    const { titre, localisation, type, prix, description } = req.body;
    if (!titre || !localisation || !type || !prix) return res.status(400).json({ error: "Champs manquants" });
    const prixNumber = parseFloat(prix);
    if (isNaN(prixNumber)) return res.status(400).json({ error: "Prix invalide" });
    const images = req.files.map(f => f.filename) || [];
    const maisonData = { titre, localisation, type, prix: prixNumber, description: description || "", proprietaire: req.proprietaireId, images, createdAt: new Date(), updatedAt: new Date() };
    const db = req.app.locals.db;
    const docRef = await db.collection("maisons").add(maisonData);
    res.json({ success: true, message: "Maison ajoutée !", id: docRef.id, maison: maisonData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PUT modifier maison ---
// --- PUT modifier maison ---
router.put("/:id", auth, upload.array("media"), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const docRef = db.collection("maisons").doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Maison introuvable" });

    const maison = doc.data();
    if (maison.proprietaire !== req.proprietaireId)
      return res.status(403).json({ error: "Non autorisé" });

    // --- Récupérer données du front ---
    const { titre, localisation, type, prix, description, removedImages } = req.body;

    // --- Mettre à jour les champs ---
    const updatedData = {
      titre: titre || maison.titre,
      localisation: localisation || maison.localisation,
      type: type || maison.type,
      prix: prix ? parseFloat(prix) : maison.prix,
      description: description || maison.description,
      updatedAt: new Date(),
    };

    // --- Gestion des images ---
    let currentImages = maison.images || [];

    // Parse removedImages si c'est une string JSON
    let removed = [];
    if (removedImages) {
      removed = Array.isArray(removedImages) ? removedImages : JSON.parse(removedImages);
    }

    // Supprimer les images demandées
    removed.forEach(img => {
      const index = currentImages.indexOf(img);
      if (index > -1) currentImages.splice(index, 1);
      const filePath = path.join(__dirname, "..", "uploads", img);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    // Ajouter les nouvelles images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => f.filename);
      currentImages = [...currentImages, ...newImages];
    }

    updatedData.images = currentImages;

    // --- Mettre à jour la maison dans la DB ---
    await docRef.update(updatedData);

    res.json({
      success: true,
      message: "Maison modifiée avec succès",
      maison: updatedData,
    });

  } catch (err) {
    console.error("Erreur PUT /maisons/:id :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// --- DELETE maison ---
router.delete("/:id", auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const docRef = db.collection("maisons").doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Maison introuvable" });

    const maison = doc.data();
    if (maison.proprietaire !== req.proprietaireId) return res.status(403).json({ error: "Non autorisé" });

    // Supprimer images du serveur
    (maison.images || []).forEach(img => {
      const filePath = path.join(__dirname, "..", "uploads", img);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await docRef.delete();
    res.json({ success: true, message: "Maison supprimée" });
  } catch (err) {
    console.error("Erreur DELETE /maisons/:id :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
