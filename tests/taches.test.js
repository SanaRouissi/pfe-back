const bcrypt = require("bcrypt");
const request = require("supertest");
const app = require("../app");
const empty_database = require("../db_commands/definitions/empty");
const prisma = require("../prisma");
const {login} = require("../routers/auth/login");

const dataCollector = {};
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

beforeAll(async () => {
  await empty_database();
  const { id: mID } = await prisma.marque.create({
    data: {
      nom: "__MARQUE_FOR_TEST",
    },
  });
  const { id: pID } = await prisma.produit.create({
    data: {
      nom: "__JEST_PRODUIT",
      quantite: 60,
      marque: {
        connect: {
          id: mID,
        },
      },
    },
  });
  const {
    id: uID,
    equipe: { id: eID },
  } = await prisma.user.create({
    data: {
      nom: "TEST",
      prenom: "TEST",
      trigramme: "NOONEELSE",
      password: await bcrypt.hash("testpass", 10),
      equipe: {
        create: {
          nom: "TEST_EQUIPE",
        },
      },
    },
    include: {
      equipe: true,
    },
  });
  const { token } = await login({
    password: "testpass",
    trigramme: "NOONEELSE",
  });
  dataCollector.token = token;
  dataCollector.mID = mID;
  dataCollector.pID = pID;
  dataCollector.uID = uID;
  dataCollector.eID = eID;
  console.log(dataCollector);
});

describe("TEST DES TACHES", () => {
  it("Creation d'une tache", async () => {
    const res = await request(app)
      .post("/api/taches")
      .send({
        produit: dataCollector.pID,
        quantite: 6,
      })
      .set("Authorization", dataCollector.token);
    expect(res.statusCode).toBe(200);
    expect(res.body.etat).toBe("EN_COURS");
    expect(res.body.user.id).toBe(dataCollector.uID);
    expect(res.body.produit.id).toBe(dataCollector.pID);
    dataCollector.id = res.body.id;
  });
  it("MAJ d'une tache", async () => {
    const res = await request(app)
      .put("/api/taches/" + dataCollector.id)
      .send({
        etat: "FINIE",
      })
      .set("Authorization", dataCollector.token);
    expect(res.statusCode).toBe(200);
    expect(res.body.etat).toBe("FINIE");
  });
  it("/GET Une tache non appartenante", async () => {
    const res = await request(app).get("/api/taches/" + dataCollector.id);
    expect(res.statusCode).toBe(401);
  });
  it("Retourner une seule tache", async () => {
    const res = await request(app)
      .get("/api/taches/" + dataCollector.id)
      .set("Authorization", dataCollector.token);
    expect(res.statusCode).toBe(200);
    expect(res.body.etat).toBe("FINIE");
  });
  it("Liste des taches", async () => {
    const res = await request(app).get("/api/taches/");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });
  it("Supprime une tache", async () => {
    const res = await request(app).delete("/api/taches/" + dataCollector.id);
    expect(res.statusCode).toBe(200);
  });
});
afterAll(async () => {
  const { mID, eID } = dataCollector;
  await prisma.marque.delete({
    where: {
      id: mID,
    },
  });
  await prisma.equipe.delete({
    where: {
      id: eID,
    },
  });
  server.close();
});
