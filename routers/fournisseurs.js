const express = require("express");
const { validPage, validEntityID } = require("../middlewares");
const router = express.Router();
const prisma = require("../prisma");

router.get("/", validPage, async (req, res, next) => {
  try {
    const { page } = req;
    const { nom, fournisseur } = req.query;
    res.send(
      await prisma.fournisseur.findMany({
        where: {
          id:
            !!fournisseur && !isNaN(fournisseur)
              ? parseInt(fournisseur)
              : undefined,
          nom: !nom
            ? undefined
            : {
                mode: "insensitive",
                contains: nom,
              },
        },
        take: 20,
        skip: !isNaN(page) ? page * 20 : 0,
        include: {
          _count: {
            select: {
              factures: true,
            },
          },
        },
        orderBy: {
          nom: "asc",
        },
      })
    );
  } catch (error) {
    next(error);
  }
});

router.get(
  "/:id",
  validEntityID({
    entityName: "fournisseur",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      const fournisseur = await prisma.fournisseur.findFirst({
        where: {
          id: parseInt(req.params.id),
        },
        include: {
          _count: {
            select: {
              factures: true,
            },
          },
        },
      });
      res.status(!fournisseur ? 404 : 200).send(fournisseur ?? {});
    } catch (error) {
      next(error);
    }
  }
);

router.post("/", async (req, res, next) => {
  try {
    const { nom } = req.body;
    res.send(
      await prisma.fournisseur.create({
        data: {
          nom,
        },
      })
    );
  } catch (error) {
    next(error);
  }
});

router.put(
  "/:id",
  validEntityID({
    entityName: "fournisseur",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      const { nom } = req.body;
      res.send(
        await prisma.fournisseur.update({
          where: {
            id: parseInt(req.params.id),
          },
          data: {
            nom,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/:id",
  validEntityID({
    entityName: "fournisseur",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      await prisma.fournisseur.delete({
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

module.exports = router;
