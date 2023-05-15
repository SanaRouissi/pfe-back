const request = require("supertest");
const app = require("../app")
const prisma = require("../prisma");

const dataCollector = {}
const PORT = process.env.PORT || 5000
const server = app.listen(PORT
    , () => console.log(`Listening on port ${PORT}`))

beforeAll(async()=>{
    const {id} = await prisma.fournisseur.create({
        data: {
            nom: "TEST_POUR_FACTURES"
        }
    })
    dataCollector.fID = id
})

describe("TEST DES FACTURES", () => {
    it("Creation d'une facture", async () => {
        const res = await request(app).post("/api/factures").send({
            fournisseur: dataCollector.fID,
            montant: 30
        })
        expect(res.statusCode).toBe(200)
        expect(res.body.montant).toBe(30);
        dataCollector.id = res.body.id
    })
    it("MAJ d'une facture", async () => {
        const res = await request(app).put("/api/factures/" + dataCollector.id).send({
            montant: 60
        })
        expect(res.statusCode).toBe(200)
        expect(res.body.montant).toBe(60);
    })
    it("Retourner une seule facture", async () => {
        const res = await request(app).get("/api/factures/" + dataCollector.id)
        expect(res.statusCode).toBe(200)
        expect(res.body.montant).toBe(60);
    })
    it("Liste des factures", async () => {
        const res = await request(app).get("/api/factures/")
        expect(res.statusCode).toBe(200)
        expect(Array.isArray(res.body)).toBeTruthy()
    })
    it("Liste des factures d'un fournisseur", async () => {
        const res = await request(app).get("/api/factures/fournisseur/" + dataCollector.fID)
        expect(res.statusCode).toBe(200)
        expect(Array.isArray(res.body) && res.body.find(e=>e.id === dataCollector.id)).toBeTruthy();
    })
    it("Supprime une facture", async () => {
        const res = await request(app).delete("/api/factures/" + dataCollector.id)
        expect(res.statusCode).toBe(200)
    })
})
afterAll(async() => {
    // await prisma.facture.deleteMany()
    await prisma.fournisseur.delete({
        where:{
            id: dataCollector.fID
        }
    })
    server.close()
})