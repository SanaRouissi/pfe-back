const express = require("express");
const { validPage, validEntityID, isAdmin } = require("../middlewares");
const router = express.Router();
const prisma = require("../prisma");

router.get("/", validPage, async (req, res, next) => {
  try {
    const { page } = req;
    res.send(
      await prisma.equipe.findMany({
        where: !req.query.nom
          ? undefined
          : {
            nom: {
              startsWith: req.query.nom,
              mode: "insensitive",
            },
          },
        take: 20,
        skip: !isNaN(page) ? page * 20 : 0,
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: {
          users: {
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
    entityName: "equipe",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      const equipe = await prisma.equipe.findFirst({
        where: {
          id: parseInt(req.params.id),
        },
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
      });
      res.status(!equipe ? 404 : 200).send(equipe ?? {});
    } catch (error) {
      next(error)
    }
  }
);

router.post("/", isAdmin, async (req, res, next) => {
  try {
    const { nom } = req.body;
    res.send(
      await prisma.equipe.create({
        data: {
          nom,
        },
      })
    );
  } catch (error) {
    next(error)
  }
});

router.put(
  "/:id",
  isAdmin,
  validEntityID({
    entityName: "equipe",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      const { nom } = req.body;
      res.send(
        await prisma.equipe.update({
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
    entityName: "equipe",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      await prisma.equipe.delete({
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
