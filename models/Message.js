// models/Message.js
const { db } = require("../config/firebase");

class Message {
  constructor({ id, maison, nomClient, email, telephone, message, reponseProprietaire, statut, from, createdAt, updatedAt }) {
    this.id = id;
    this.maison = maison; // id de la maison
    this.nomClient = nomClient || '';
    this.email = email || '';
    this.telephone = telephone || '';
    this.message = message || '';
    this.reponseProprietaire = reponseProprietaire || '';
    this.statut = statut || 'en_attente'; // en_attente ou traite
    this.from = from || 'client'; // client ou proprietaire
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  // --- Créer un message ---
  async save() {
    const docRef = await db.collection("messages").add({
      maison: this.maison,
      nomClient: this.nomClient,
      email: this.email,
      telephone: this.telephone,
      message: this.message,
      reponseProprietaire: this.reponseProprietaire,
      statut: this.statut,
      from: this.from,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    });
    this.id = docRef.id;
    return this;
  }

  // --- Mettre à jour un message ---
  async update(data) {
    data.updatedAt = new Date();
    await db.collection("messages").doc(this.id).update(data);
    Object.assign(this, data);
    return this;
  }

  // --- Supprimer un message ---
  async delete() {
    await db.collection("messages").doc(this.id).delete();
  }

  // --- Récupérer un message par ID ---
  static async findById(id) {
    const doc = await db.collection("messages").doc(id).get();
    if (!doc.exists) return null;
    return new Message({ id: doc.id, ...doc.data() });
  }

  // --- Récupérer tous les messages pour une maison ---
  static async findByMaison(maisonId) {
    const snapshot = await db.collection("messages")
      .where("maison", "==", maisonId)
      .orderBy("createdAt", "asc")
      .get();
    return snapshot.docs.map(doc => new Message({ id: doc.id, ...doc.data() }));
  }

  // --- Récupérer tous les messages d’un client ---
  static async findByClient(email) {
    const snapshot = await db.collection("messages")
      .where("email", "==", email)
      .orderBy("createdAt", "asc")
      .get();
    return snapshot.docs.map(doc => new Message({ id: doc.id, ...doc.data() }));
  }

  // --- Récupérer tous les messages d’un propriétaire ---
  static async findByProprietaire(proprietaireId, maisonsIds = []) {
    const snapshot = await db.collection("messages")
      .where("maison", "in", maisonsIds)
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map(doc => new Message({ id: doc.id, ...doc.data() }));
  }
}

module.exports = Message;
