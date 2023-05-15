const express = require("express");
const { validPage, validEntityID } = require("../middlewares");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const router = express.Router();
// const prisma = require("../prisma");

//paginate demandes restock
router.get("/", validPage, async (req, res, next) => {
  try {
    const { page } = req;
    const { user, quantite, fulfilled, produit } = req.query;
    const result = await prisma.demande_restock.findMany({
      where: {
        user: user
          ? {
              id: user && isNaN(parseInt(user)) ? parseInt(user) : undefined,
            }
          : undefined,
        produit: !produit
          ? undefined
          : {
              nom: {
                startsWith: produit.replace(/\+/g, ""),
                mode: "insensitive",
              },
            },
        quantite: !isNaN(parseInt(quantite)) ? parseInt(quantite) : undefined,
        fulfilled:
          !fulfilled ||
          isNaN(parseInt(fulfilled)) ||
          ![0, 1].includes(parseInt(fulfilled))
            ? undefined
            : parseInt(fulfilled) == 0
            ? false
            : true,
      },
      take: 20,
      skip: !isNaN(page) ? page * 20 : 0,
      include: {
        produit: true,
        user: {
          include: {
            equipe: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });
    res.send(result);
  } catch (error) {
    next(error);
  }
});

// delete demande restock
router.delete(
  "/:id",
  validEntityID({
    entityName: "demande_restock",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      await prisma.demande_restock.delete({
        where: {
          id: parseInt(req.params.id),
        },
      });
      res.send({});
    } catch (error) {
      next(error);
    }
  }
);

// create demande restock
router.post(
  "/",
  validEntityID({
    entityName: "produit",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      const data = await prisma.demande_restock.create({
        data: {
          quantite: req.body.quantite,
          produit: {
            connect: {
              id: req.body.produit,
            },
          },
          user: {
            connect: {
              id: parseInt(req.user.id),
            },
          },
        },
        include: {
          produit: true,
          user: {
            include: {
              equipe: true,
            },
          },
        },
      });
      res.send(data);
    } catch (error) {
      next(error);
    }
  }
);

// set demande restock as fulfilled
router.put(
  "/:id",
  validEntityID({
    entityName: "demande_restock",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      const prod = await prisma.produit.findFirst({
        where:{
          demandes_de_restock:{
            some:{
              id: parseInt(req.params.id)
            }
          }
        },
        include:{
          demandes_de_restock:{
            where:{
              id: parseInt(req.params.id)
            }
          }
        }
      })
      await prisma.$transaction([
        prisma.demande_restock.update({
          where: {
            id: parseInt(req.params.id),
          },
          data: {
            fulfilled: true,
          },
        }),
        prisma.produit.update({
          where:{
            id: prod.id
          },
          data:{
            quantite:{
              increment: prod.demandes_de_restock.at(0).quantite
            }
          }
        })
      ]);
      res.send({});
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
