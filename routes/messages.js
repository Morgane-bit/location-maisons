const express = require("express");
const router = express.Router();
const { db } = require("../config/firebaseAdmin");
const auth = require("../middleware/auth");
const nodemailer = require("nodemailer");
require("dotenv").config();

// --- Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error("❌ Erreur SMTP :", error);
    } else {
        console.log("✅ SMTP Gmail prêt à envoyer des emails");
    }
});

// --- Envoi d’un message client (depuis la page réservation)
router.post("/", async (req, res) => {
    try {
        const { maisonId, nomClient, email, telephone, message } = req.body;

        if (!maisonId || !nomClient || !email || !telephone || !message) {
            return res.status(400).json({ success: false, error: "Champs obligatoires manquants" });
        }

        const maisonDoc = await db.collection("maisons").doc(maisonId).get();
        if (!maisonDoc.exists) return res.status(404).json({ success: false, error: "Maison introuvable" });

        const maisonData = maisonDoc.data();
        const proprietaireEmail = maisonData.proprietaire;
        if (!proprietaireEmail) return res.status(400).json({ success: false, error: "Maison sans propriétaire assigné" });

        await db.collection("messages").add({
            maisonId,
            nomClient,
            email,
            telephone,
            message,
            proprietaireEmail,
            from: "client",
            statut: "non-traite",
            createdAt: new Date(),
        });

        return res.json({ success: true, message: "Votre message a été envoyé au propriétaire avec succès !" });

    } catch (err) {
        console.error("Erreur message:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// --- Récupérer les messages du propriétaire
router.get("/", auth, async (req, res) => {
    try {
        const messagesSnap = await db
            .collection("messages")
            .where("proprietaireEmail", "==", req.proprietaireEmail)
            .orderBy("createdAt", "desc")
            .get();

        const result = await Promise.all(
            messagesSnap.docs.map(async (doc) => {
                const msg = doc.data();
                const maisonDoc = await db.collection("maisons").doc(msg.maisonId).get();
                return {
                    _id: doc.id,
                    maison: maisonDoc.exists ? maisonDoc.data().titre : "Maison supprimée",
                    nomClient: msg.nomClient,
                    email: msg.email,
                    telephone: msg.telephone || "",
                    message: msg.message,
                    statut: msg.statut || "non-traite",
                    from: msg.from,
                    date: msg.createdAt ? msg.createdAt.toDate() : null,
                };
            })
        );

        return res.json(result);

    } catch (err) {
        console.error("Erreur récupération messages:", err);
        return res.status(500).json({ error: err.message });
    }
});

// --- Répondre à un message ET envoyer un mail
router.put("/:id/reponse", auth, async (req, res) => {
    try {
        const { reponse } = req.body;
        if (!reponse) return res.status(400).json({ success: false, error: "Réponse manquante" });

        const msgDoc = await db.collection("messages").doc(req.params.id).get();
        if (!msgDoc.exists) return res.status(404).json({ error: "Message introuvable" });

        const msg = msgDoc.data();
        if (msg.proprietaireEmail !== req.proprietaireEmail) 
            return res.status(403).json({ error: "Non autorisé" });

        await db.collection("messages").doc(req.params.id).update({
            reponseProprietaire: reponse,
            statut: "traite",
            updatedAt: new Date(),
        });

        await transporter.sendMail({
            from: `"Propriétaire" <${process.env.GMAIL_USER}>`,
            to: msg.email,
            subject: `Réponse à votre message concernant ${msg.maisonId}`,
            text: reponse
        });

        return res.json({
            success: true,
            message: "Réponse enregistrée, message traité et email envoyé au client",
        });

    } catch (err) {
        console.error("Erreur réponse:", err);
        return res.status(500).json({ error: err.message });
    }
});

// --- Supprimer un message
router.delete("/:id", auth, async (req, res) => {
    try {
        const msgDoc = await db.collection("messages").doc(req.params.id).get();
        if (!msgDoc.exists) return res.status(404).json({ success: false, error: "Message introuvable" });

        const msg = msgDoc.data();
        if (msg.proprietaireEmail !== req.proprietaireEmail)
            return res.status(403).json({ success: false, error: "Non autorisé" });

        await db.collection("messages").doc(req.params.id).delete();

        return res.json({ success: true, message: "Message supprimé avec succès !" });

    } catch (err) {
        console.error("Erreur suppression message:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
