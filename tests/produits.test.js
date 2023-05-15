const request = require("supertest");
const app = require("../app")
const prisma = require("../prisma");
const dataCollector = {}
const PORT = process.env.PORT || 5000
const server = app.listen(PORT, () => console.log(`Listening on port ${PORT}`))

beforeAll(async()=>{
    dataCollector.categories = []
    const {id} = await prisma.marque.create({
        data:{
            nom: "MARQUE_POUR_TEST"
        }
    })
    dataCollector.mID = id
    for(const c of ["PC","PRINTERS","TEST"]){
        const {id: cID} = await prisma.categorie.create({
            data:{
                nom: c
            }
        })
        dataCollector.categories.push(cID)
    }
})

describe("TEST DES PRODUITS", () => {
    it("Creation d'un produit", async () => {
        const res = await request(app).post("/api/produits").send({
            nom: "JEST_PRODUIT",
            quantite: 60,
            marque: dataCollector.mID,
            categories: dataCollector.categories
        })
        expect(res.statusCode).toBe(200)
        expect(res.body.nom).toBe("JEST_PRODUIT");
        expect(res.body.quantite).toBe(60);
        expect(res.body.categories.length).toBe(3)
        dataCollector.id = res.body.id
    })
    it("MAJ d'un produit", async () => {
        const res = await request(app).put("/api/produits/" + dataCollector.id).send({
            nom: "JEST_PRODUIT_MAJ",
            quantite: 30,
            categories: [dataCollector.categories[0],dataCollector.categories[2]]
        })
        console.log([dataCollector.categories[0],dataCollector.categories[2]])
        // console.log(res.body)
        expect(res.statusCode).toBe(200)
        expect(res.body.nom).toBe("JEST_PRODUIT_MAJ");
        expect(res.body.quantite).toBe(30);
        expect(res.body.categories.length).toBe(2)
    })
    it("Retourner un seul produit", async () => {
        const res = await request(app).get("/api/produits/" + dataCollector.id)
        expect(res.statusCode).toBe(200)
        expect(res.body.nom).toBe("JEST_PRODUIT_MAJ");
    })
    it("Liste des produits", async () => {
        const res = await request(app).get("/api/produits/")
        expect(res.statusCode).toBe(200)
        expect(Array.isArray(res.body)).toBeTruthy()
    })
    it("Supprime un produit", async () => {
        const res = await request(app).delete("/api/produits/" + dataCollector.id)
        expect(res.statusCode).toBe(200)
    })
})
afterAll(async() => {
    // await prisma.marque.deleteMany()
    await prisma.marque.delete({
        where:{
            id: dataCollector.mID
        }
    })
    for(const id of dataCollector.categories){
        await prisma.categorie.delete({
            where:{
                id
            }
        })
    }
    server.close()
})