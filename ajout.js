// insertDemandes.js
const admin = require("./config/firebaseAdmin"); // ton fichier Firebase Admin
const db = admin.db;

async function createTestDemande() {
  try {
    const docRef = await db.collection("demandes").add({
      maison: { titre: "Maison Test" },
      nom: "Client Test",
      email: "client@test.com",
      telephone: "123456789",
      message: "Message de test",
      statut: "En attente",
      proprietaireEmail: "wankpomorgane17@gmail.com", // doit correspondre à ton token
      createdAt: new Date()
    });

    console.log("Document créé avec ID :", docRef.id);
    process.exit(0);
  } catch (err) {
    console.error("Erreur création document :", err);
    process.exit(1);
  }
}

createTestDemande();
