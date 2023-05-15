const prisma = require("../../prisma");

const entities = [
  "user",
  "produit",
  "equipe",
  "marque",
  "categorie",
  "facture",
  "fournisseur",
  "token",
  "tache",
];

const empty_database = async () => {
  for (const a of entities) {
    await prisma[a].deleteMany();
  }
};

module.exports = empty_database