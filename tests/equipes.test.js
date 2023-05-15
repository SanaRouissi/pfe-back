const request = require("supertest");
const app = require("../app")
const prisma = require("../prisma");

const dataCollector = {}
const PORT = process.env.PORT || 5000
const server = app.listen(PORT
    , () => console.log(`Listening on port ${PORT}`))

describe("TEST DES EQUIPES", () => {
    it("Creation d'une equipe", async () => {
        const res = await request(app).post("/api/equipes").send({
            nom: "JEST_EQUIPE"
        })
        expect(res.statusCode).toBe(200)
        expect(res.body.nom).toBe("JEST_EQUIPE");
        dataCollector.id = res.body.id
    })
    it("MAJ d'une equipe", async () => {
        const res = await request(app).put("/api/equipes/" + dataCollector.id).send({
            nom: "UPDATED_JEST"
        })
        expect(res.statusCode).toBe(200)
        expect(res.body.nom).toBe("UPDATED_JEST");
    })
    it("Retourner une seule equipe", async () => {
        const res = await request(app).get("/api/equipes/" + dataCollector.id)
        expect(res.statusCode).toBe(200)
        expect(res.body.nom).toBe("UPDATED_JEST");
    })
    it("Liste des equipes", async () => {
        const res = await request(app).get("/api/equipes/")
        expect(res.statusCode).toBe(200)
        expect(Array.isArray(res.body)).toBeTruthy()
    })
    it("Supprime une equipe", async () => {
        const res = await request(app).delete("/api/equipes/" + dataCollector.id)
        expect(res.statusCode).toBe(200)
    })
})
afterAll(async() => {
    // await prisma.equipe.deleteMany()
    server.close()
})