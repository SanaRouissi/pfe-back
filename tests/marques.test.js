const request = require("supertest");
const app = require("../app")
const prisma = require("../prisma");

const dataCollector = {}
const PORT = process.env.PORT || 5000
const server = app.listen(PORT
    , () => console.log(`Listening on port ${PORT}`))

describe("TEST DES MARQUES", () => {
    it("Creation d'une marque", async () => {
        const res = await request(app).post("/api/marques").send({
            nom: "JEST_MARQUE"
        })
        expect(res.statusCode).toBe(200)
        expect(res.body.nom).toBe("JEST_MARQUE");
        dataCollector.id = res.body.id
    })
    it("MAJ d'une marque", async () => {
        const res = await request(app).put("/api/marques/" + dataCollector.id).send({
            nom: "JEST_MARQUE_MAJ"
        })
        expect(res.statusCode).toBe(200)
        expect(res.body.nom).toBe("JEST_MARQUE_MAJ");
    })
    it("Retourner une seule marque", async () => {
        const res = await request(app).get("/api/marques/" + dataCollector.id)
        expect(res.statusCode).toBe(200)
        expect(res.body.nom).toBe("JEST_MARQUE_MAJ");
    })
    it("Liste des marques", async () => {
        const res = await request(app).get("/api/marques/")
        expect(res.statusCode).toBe(200)
        expect(Array.isArray(res.body)).toBeTruthy()
    })
    it("Supprime une marque", async () => {
        const res = await request(app).delete("/api/marques/" + dataCollector.id)
        expect(res.statusCode).toBe(200)
    })
})
afterAll(async() => {
    // await prisma.marque.deleteMany()
    server.close()
})