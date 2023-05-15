const { PrismaClient } = require("@prisma/client");
const express = require("express");
const { validPage, validEntityID, isAdmin } = require("../middlewares");
const router = express.Router();
const prisma = require("../prisma");

router.get("/", validPage, async (req, res, next) => {
  try {
    const { page } = req;
    const { nom, marque } = req.query;
    res.send(
      await prisma.marque.findMany({
        where: {
          id: !!marque && !isNaN(marque) ? parseInt(marque) : undefined,
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
              produits: true,
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
    entityName: "marque",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      const marque = await prisma.marque.findFirst({
        where: {
          id: parseInt(req.params.id),
        },
        include: {
          _count: {
            select: {
              produits: true,
            },
          },
        },
      });
      res.status(!marque ? 404 : 200).send(marque ?? {});
    } catch (error) {
      next(error);
    }
  }
);

router.post("/", isAdmin, async (req, res, next) => {
  try {
    const { nom } = req.body;
    res.send(
      await prisma.marque.create({
        data: {
          nom,
        },
        include: {
          _count: {
            select: {
              produits: true,
            },
          },
        },
      })
    );
  } catch (error) {
    next(error);
  }
});

router.put(
  "/:id",
  isAdmin,
  validEntityID({
    entityName: "marque",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      const { nom } = req.body;
      res.send(
        await prisma.marque.update({
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
  isAdmin,
  validEntityID({
    entityName: "marque",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      await prisma.marque.delete({
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
