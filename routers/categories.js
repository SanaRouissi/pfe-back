const { PrismaClient } = require("@prisma/client");
const express = require("express");
const { validPage, isAdmin, validEntityID } = require("../middlewares");
const router = express.Router();
const prisma = require("../prisma");

router.get("/", validEntityID({ container: "query", entityName:"produit", paramName: "produit" }), validPage, async (req, res, next) => {
  try {
    const { page } = req;
    const {produit} = req.query
    res.send(
      await prisma.categorie.findMany({
        where:  {
            nom: !req.query.nom
            ? undefined
            :{
              startsWith: req.query.nom,
              mode: "insensitive",
            },
            produits:parseInt(produit) ? {
              some:{
                id: parseInt(produit)
              }
            } : undefined
          },
        take: 20,
        skip: !isNaN(page) ? page * 20 : 0,
        include: {
          _count: {
            select: {
              produits: true,
            },
          },
        },
        orderBy: {
          produits: {
            _count: "desc",
          },
        },
      })
    );
  } catch (error) {
    next(error)
  }
});

router.get(
  "/:id",
  validEntityID({
    entityName: "categorie",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      const categorie = await prisma.categorie.findFirst({
        where: {
          id: parseInt(req.params.id),
        },
        include: {
          _count: {
            select: {
              produits: true
            }
          }
        }
      });
      res.status(!categorie ? 404 : 200).send(!categorie ? {} : categorie);
    } catch (error) {
      next(error)
    }
  }
);

router.post("/", isAdmin, async (req, res, next) => {
  // console.log(req.body)
  try {
    const { nom } = req.body;
    res.send(
      await prisma.categorie.create({
        data: {
          nom,
        },
      })
    )

  } catch (error) {
    next(error)
  }
});

router.put(
  "/:id",
  isAdmin,
  validEntityID({
    entityName: "categorie",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      const { nom } = req.body;
      res.send(
        await prisma.categorie.update({
          where: {
            id: parseInt(req.params.id),
          },
          data: {
            nom,
          },
        })
      );
    } catch (error) {
      next(error)
    }
  }
);

router.delete(
  "/:id",
  isAdmin,
  validEntityID({
    entityName: "categorie",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      await prisma.categorie.delete({
        where: {
          id: parseInt(req.params.id),
        },
      });
      res.status(200).send({});
    } catch (error) {
      next(error)
    }
  }
);

module.exports = router;
