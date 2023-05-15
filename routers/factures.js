const { PrismaClient } = require("@prisma/client");
const express = require("express");
const { validPage, validEntityID } = require("../middlewares");
const router = express.Router();
const prisma = require("../prisma");

router.get("/", validPage, async (req, res, next) => {
  try {
    const { page } = req;
    const {
      statut,
      fournisseur,
      fournisseurID,
      gt,
      lt,
      order = "desc",
      orderBy = "created_at",
    } = req.query;
    res.send(
      await prisma.facture.findMany({
        where: {
          statut: statut ?? undefined,
          fournisseur: {
            nom: !fournisseur
              ? undefined
              : {
                  mode: "insensitive",
                  contains: fournisseur,
                },
            id:
              !!fournisseurID && !isNaN(fournisseurID)
                ? parseInt(fournisseurID)
                : undefined,
          },
          montant: {
            gt: !gt || isNaN(gt) ? undefined : parseInt(gt),
            lt: !lt || isNaN(lt) ? undefined : parseInt(lt),
          },
        },
        include: {
          fournisseur: true,
        },
        take: 20,
        skip: !isNaN(page) ? page * 20 : 0,
        orderBy: {
          [orderBy]: order,
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
    entityName: "facture",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      const facture = await prisma.facture.findFirst({
        where: {
          id: parseInt(req.params.id),
        },
        include: {
          fournisseur: true,
        },
      });
      res.status(!facture ? 404 : 200).send(facture ?? {});
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/fournisseur/:id",
  validEntityID({
    entityName: "fournisseur",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      const factures = await prisma.facture.findMany({
        where: {
          fournisseur: {
            id: parseInt(req.params.id),
          },
        },
        include: {
          fournisseur: true,
        },
      });
      res.send(factures);
    } catch (error) {
      next(error);
    }
  }
);

router.post("/", async (req, res, next) => {
  try {
    const { fournisseur, montant } = req.body;
    res.send(
      await prisma.facture.create({
        data: {
          montant,
          fournisseur: {
            connect: {
              id: fournisseur,
            },
          },
        },
        include:{
          fournisseur: true
        }
      })
    );
  } catch (error) {
    next(error);
  }
});

router.put(
  "/:id",
  validEntityID({
    entityName: "facture",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      const { statut = "PAYEE", montant } = req.body;
      res.send(
        await prisma.facture.update({
          where: {
            id: parseInt(req.params.id),
          },
          data: {
            statut,
            montant,
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
    entityName: "facture",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      await prisma.facture.delete({
        where: {
          id: parseInt(req.params.id),
        },
      });
      res.status(200).send({});
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
