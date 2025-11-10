// models/Maison.js
const { db } = require("../config/firebase");

class Maison {
  constructor({ id, titre, localisation, type, prix, description, proprietaire, images, createdAt, updatedAt }) {
    this.id = id;
    this.titre = titre;
    this.localisation = localisation;
    this.type = type; // studio, appartement, villa, duplex, chambre
    this.prix = prix;
    this.description = description || '';
    this.proprietaire = proprietaire; // id du propriétaire
    this.images = images || []; // URLs
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  // --- Créer une maison ---
  async save() {
    const docRef = await db.collection("maisons").add({
      titre: this.titre,
      localisation: this.localisation,
      type: this.type,
      prix: this.prix,
      description: this.description,
      proprietaire: this.proprietaire,
      images: this.images,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    });
    this.id = docRef.id;
    return this;
  }

  // --- Mettre à jour une maison ---
  async update(data) {
    data.updatedAt = new Date();
    await db.collection("maisons").doc(this.id).update(data);
    Object.assign(this, data);
    return this;
  }

  // --- Supprimer une maison ---
  async delete() {
    await db.collection("maisons").doc(this.id).delete();
  }

  // --- Récupérer une maison par ID ---
  static async findById(id) {
    const doc = await db.collection("maisons").doc(id).get();
    if (!doc.exists) return null;
    return new Maison({ id: doc.id, ...doc.data() });
  }

  // --- Récupérer toutes les maisons, option filtre ---
  static async findAll(filters = {}) {
    let query = db.collection("maisons");

    if (filters.localisation) {
      query = query.where("localisation", "==", filters.localisation);
    }
    if (filters.type) {
      query = query.where("type", "==", filters.type);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => new Maison({ id: doc.id, ...doc.data() }));
  }

  // --- Récupérer les maisons d’un propriétaire ---
  static async findByProprietaire(proprietaireId) {
    const snapshot = await db.collection("maisons")
      .where("proprietaire", "==", proprietaireId)
      .get();
    return snapshot.docs.map(doc => new Maison({ id: doc.id, ...doc.data() }));
  }
}

module.exports = Maison;
