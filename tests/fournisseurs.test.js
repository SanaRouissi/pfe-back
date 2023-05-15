const request = require("supertest");
const app = require("../app")
const prisma = require("../prisma");

const dataCollector = {}
const PORT = process.env.PORT || 5000
const server = app.listen(PORT
    , () => console.log(`Listening on port ${PORT}`))

describe("TEST DES FOURNISSEURS", () => {
    it("Creation d'un fournisseur", async () => {
        const res = await request(app).post("/api/fournisseurs").send({
            nom: "JEST_FOURNISSEUR"
        })
        expect(res.statusCode).toBe(200)
        expect(res.body.nom).toBe("JEST_FOURNISSEUR");
        dataCollector.id = res.body.id
    })
    it("MAJ d'un fournisseur", async () => {
        const res = await request(app).put("/api/fournisseurs/" + dataCollector.id).send({
            nom: "JEST_FOURNISSEUR_MAJ"
        })
        expect(res.statusCode).toBe(200)
        expect(res.body.nom).toBe("JEST_FOURNISSEUR_MAJ");
    })
    it("Retourner un seul fournisseur", async () => {
        const res = await request(app).get("/api/fournisseurs/" + dataCollector.id)
        expect(res.statusCode).toBe(200)
        expect(res.body.nom).toBe("JEST_FOURNISSEUR_MAJ");
    })
    it("Liste des fournisseurs", async () => {
        const res = await request(app).get("/api/fournisseurs/")
        expect(res.statusCode).toBe(200)
        expect(Array.isArray(res.body)).toBeTruthy()
    })
    it("Supprime un fournisseur", async () => {
        const res = await request(app).delete("/api/fournisseurs/" + dataCollector.id)
        expect(res.statusCode).toBe(200)
    })
})
afterAll(async() => {
    // await prisma.fournisseur.deleteMany()
    server.close()
})