const express = require("express");
const { isAdmin } = require("../middlewares");
const router = express.Router();
const prisma = require("../prisma");

const entities = [
  "user",
  "produit",
  "equipe",
  "marque",
  "categorie",
  "facture",
  "fournisseur",
  "tache",
  "demande_restock",
];

// const relationWithMany = [
//   ["produit", "categorie"],
//   ["categorie", "produit"],
//   ["facture", "fournisseur"],
//   ["produit", "marque"],
// ];

router.get("/", async (req, res, next) => {
  try {
    const toUse = !req.user?.isAdmin ? ["tache", "produit"] : entities;
    const data = (
      await Promise.all(
        toUse.map(async (e) => {
          const isUser =
            e === "tache"
              ? {
                  where: {
                    user: {
                      id: parseInt(req.user.id),
                    },
                  },
                }
              : {
                  where: {
                    taches: {
                      some: {
                        user: {
                          id: parseInt(req.user.id),
                        },
                      },
                    },
                  },
                };
          const count = await prisma[e].count(req.user?.isAdmin ? {} : isUser);
          return count;
        })
      )
    ).reduce((tot, next, i) => {
      // console.log(tot, next, toUse[i]);
      return (tot = { ...tot, [toUse[i]]: next });
    }, {});
    res.send(data);
  } catch (error) {
    // console.log(error)
    next(error);
  }
});

router.get("/:entity", async (req, res, next) => {
  try {
    if (!entities.includes(req.params.entity))
      throw new Error("No such entity exists");
    if (!req.user.isAdmin && !["tache", "produit"].includes(req.params.entity))
      throw new Error("Users cannot access this resource");
    res.send({ total: await prisma[req.params.entity].count({}) });
  } catch (error) {
    // console.log(error)
    next(error);
  }
});

router.get("/:e1/:id/:e2", isAdmin, async (req, res, next) => {
  try {
    const { e1, e2, id } = req.params;
    if (e2 === "produit") throw new Error("Cannot proceed with this request");
    if ([e1, e2].some((e) => !entities.includes(e)))
      throw new Error("Some of provided entities don't exist");
    // const manyRelation = relationWithMany.find((e) => e[0] == e1 && e[1] == e2);
    const fnName = `${e2}s`;
    const result = await prisma[e1]
      .findFirst({ where: { id: parseInt(id) } })
      [fnName]();
    if ([null, undefined].includes(result))
      throw { message: `No such ${e1} exists`, status: 404 };
    // console.log(`${e2}${!manyRelation ? "" : "s"}`)
    // console.log(fnName, entity1)
    res.send({
      total: result.length,
    });
  } catch (error) {
    next({
      message: "Cannot proceed with this operation, server error",
      status: 500,
    });
  }
});
module.exports = router;
