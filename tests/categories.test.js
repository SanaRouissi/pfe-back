const request = require("supertest");
const app = require("../app")
const prisma = require("../prisma");

const dataCollector = {}
const PORT = process.env.PORT || 5000
const server = app.listen(PORT
    , () => console.log(`Listening on port ${PORT}`))

describe("TEST DES CATEGORIES", () => {
    it("Creation d'une categorie", async () => {
        const res = await request(app).post("/api/categories").send({
            nom: "JEST_CATEGORY"
        })
        expect(res.statusCode).toBe(200)
        expect(res.body.nom).toBe("JEST_CATEGORY");
        dataCollector.id = res.body.id
    })
    it("MAJ d'une categorie", async () => {
        const res = await request(app).put("/api/categories/" + dataCollector.id).send({
            nom: "UPDATED_JEST"
        })
        expect(res.statusCode).toBe(200)
        expect(res.body.nom).toBe("UPDATED_JEST");
    })
    it("Retourner une seule categorie", async () => {
        const res = await request(app).get("/api/categories/" + dataCollector.id)
        expect(res.statusCode).toBe(200)
        expect(res.body.nom).toBe("UPDATED_JEST");
    })
    it("Liste des categories", async () => {
        const res = await request(app).get("/api/categories/")
        expect(res.statusCode).toBe(200)
        expect(Array.isArray(res.body)).toBeTruthy()
    })
    it("Supprime une categorie", async () => {
        const res = await request(app).delete("/api/categories/" + dataCollector.id)
        expect(res.statusCode).toBe(200)
    })
})
afterAll(async() => {
    server.close()
    // await prisma.categorie.deleteMany()
})