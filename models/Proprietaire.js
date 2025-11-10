// models/Proprietaire.js
const { db } = require("../config/firebase");
const bcrypt = require("bcryptjs");

class Proprietaire {
  constructor({ id, nom, email, telephone, password, createdAt, updatedAt }) {
    this.id = id;
    this.nom = nom;
    this.email = email;
    this.telephone = telephone;
    this.password = password;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  // --- Sauvegarder un nouveau propriétaire ---
  async save() {
    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    const docRef = await db.collection("proprietaires").add({
      nom: this.nom,
      email: this.email,
      telephone: this.telephone,
      password: this.password,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });

    this.id = docRef.id;
    return this;
  }

  // --- Comparer mot de passe ---
  async comparePassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  // --- Trouver un propriétaire par email ---
  static async findByEmail(email) {
    const snapshot = await db
      .collection("proprietaires")
      .where("email", "==", email)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return new Proprietaire({ id: doc.id, ...doc.data() });
  }

  // --- Trouver par ID ---
  static async findById(id) {
    const doc = await db.collection("proprietaires").doc(id).get();
    if (!doc.exists) return null;
    return new Proprietaire({ id: doc.id, ...doc.data() });
  }

  // --- Mettre à jour le propriétaire ---
  async update(data) {
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
    }
    data.updatedAt = new Date();
    await db.collection("proprietaires").doc(this.id).update(data);
    Object.assign(this, data);
    return this;
  }

  // --- Supprimer le propriétaire ---
  async delete() {
    await db.collection("proprietaires").doc(this.id).delete();
  }
}

module.exports = Proprietaire;
