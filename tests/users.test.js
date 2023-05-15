const request = require("supertest");
const app = require("../app");
const empty_database = require("../db_commands/definitions/empty");
const prisma = require("../prisma");

const dataCollector = {}
const PORT = process.env.PORT || 5000
const server = app.listen(PORT
    , () => console.log(`Listening on port ${PORT}`))

beforeAll(async()=>{
    await empty_database()
    const {id: eID1} = await prisma.equipe.create({
        data:{
            nom: "EQUIPE_POUR_TEST_1"
        }
    })
    const {id: eID2} = await prisma.equipe.create({
        data:{
            nom: "EQUIPE_POUR_TEST_2"
        }
    })
    dataCollector.eID1 = eID1
    dataCollector.eID2 = eID2
})

describe("TEST DES USERS", () => {
    it("Creation d'un user", async () => {
        const res = await request(app).post("/api/users").send({
            nom: "JEST_USER_NOM",
            prenom: "JEST_USER_PRENOM",
            password: "SIMPLE_PASS",
            trigramme: "JTU", //jest test user => JTU
            equipe: dataCollector.eID1
        })
        expect(res.statusCode).toBe(200)
        expect(res.body.nom).toBe("JEST_USER_NOM");
        expect(res.body.prenom).toBe("JEST_USER_PRENOM");
        dataCollector.id = res.body.id
    })
    it("Trigramme unique", async () => {
        const res = await request(app).post("/api/users").send({
            nom: "JEST_USER_NOM",
            prenom: "JEST_USER_PRENOM",
            password: "SIMPLE_PASS",
            trigramme: "JTU", //jest test user => JTU
            equipe: dataCollector.eID2
        })
        expect(res.statusCode).toBe(500)
    })
    it("MAJ d'un user", async () => {
        const res = await request(app).put("/api/users/" + dataCollector.id).send({
            nom: "JEST_USER_NOM_MAJ",
            equipe: dataCollector.eID2
        })
        expect(res.statusCode).toBe(200)
        expect(res.body.nom).toBe("JEST_USER_NOM_MAJ");
        expect(res.body.equipe.id).toBe(dataCollector.eID2);
    })
    it("Retourner un seul user", async () => {
        const res = await request(app).get("/api/users/" + dataCollector.id)
        expect(res.statusCode).toBe(200)
        expect(res.body.equipe.id).toBe(dataCollector.eID2);
    })
    it("Retourner un seul user par trigramme", async () => {
        const res = await request(app).get("/api/users/@JTU")
        expect(res.statusCode).toBe(200)
        expect(res.body.equipe.id).toBe(dataCollector.eID2);
    })
    it("Liste des users", async () => {
        const res = await request(app).get("/api/users/")
        expect(res.statusCode).toBe(200)
        expect(Array.isArray(res.body)).toBeTruthy()
    })
    it("Supprime un user", async () => {
        const res = await request(app).delete("/api/users/" + dataCollector.id)
        expect(res.statusCode).toBe(200)
    })
})
afterAll(async() => {
    // await prisma.marque.deleteMany()
    server.close()
})