const request = require("supertest");
const app = require("../app");
const prisma = require("../prisma");
const bcrypt = require("bcrypt");

const dataCollector = {};
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

beforeAll(async () => {
  const crypted = await bcrypt.hash("SIMPLE_PASS", 10);
  const userCreated = await prisma.user.create({
    data: {
      nom: "test",
      prenom: "test",
      trigramme: "TEST_IPLABEL",
      password: crypted,
      equipe: {
        create: {
          nom: "test_equipe",
        },
      },
    },
    include: {
      equipe: true,
    },
  });
  const {
    id: uID,
    equipe: { id: eID },
  } = userCreated;
  dataCollector.uID = uID;
  dataCollector.eID = eID;
});

describe("TEST D'AUTORISATION", () => {
  it("VALID LOGIN", async () => {
    const res = await request(app).post("/api/auth").send({
      trigramme: "TEST_IPLABEL",
      password: "SIMPLE_PASS",
    });
    expect(res.statusCode).toBe(200);
    expect(typeof res.body.token).toBe("string");
    dataCollector.token = res.body.token;
  });
  it("INVALID LOGIN", async () => {
    const res = await request(app).post("/api/auth").send({
      trigramme: "TEST_IPLABEL",
      password: "SIMPLE_PASS_BUT_WRONG",
    });
    expect(res.statusCode).toBe(401);
  });
  it("LOGOUT", async () => {
    const res = await request(app)
      .delete("/api/auth")
      .set("authorization", dataCollector.token);
    expect(res.statusCode).toBe(200);
    expect(Object.keys(res.body).length).toBe(0);
  });
});
afterAll(async () => {
  server.close();
  await prisma.equipe.delete({
    where: {
      id: dataCollector.eID,
    },
  });
});
