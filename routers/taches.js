const { PrismaClient, Prisma } = require("@prisma/client");
const express = require("express");
const {
  validPage,
  validEntityID,
  prodAvailable,
  isAdmin,
} = require("../middlewares");
const router = express.Router();
const prisma = require("../prisma");

router.get("/", validPage, async (req, res, next) => {
  try {
    const { page } = req;
    //on ignore la partie user dans querypath si on est pas un admin
    //on voit seulement nos taches, sinon, un admin pourra tout voir
    const { user, produit, etat, trigramme } = req.query;
    res.send(
      await prisma.tache.findMany({
        where: {
          etat,
          user: {
            id:
              (req.user?.isAdmin && !!user && !isNaN(user)) ||
              (!req.user?.isAdmin && !isNaN(req.user?.id))
                ? parseInt(!req.user?.isAdmin ? req.user?.id : user)
                : undefined,
            trigramme:
              req.user?.isAdmin && !!trigramme
                ? {
                    startsWith: trigramme,
                  }
                : undefined,
          },
          produit: !isNaN(produit)
            ? {
                id: parseInt(produit),
              }
            : undefined,
        },
        take: 20,
        skip: !isNaN(page) ? page * 20 : 0,
        include: {
          user: {
            select: {
              nom: true,
              prenom: true,
            },
          },
          produit: true,
        },
        orderBy: {
          created_at: "desc",
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
    entityName: "tache",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      const tache = await prisma.tache.findFirst({
        where: {
          id: parseInt(req.params.id),
        },
      });
      //on pourra voir cette tache si elle est le notre
      //sinon un 401
      if (req.user?.isAdmin || tache.userID === req.user?.id)
        res.status(!tache ? 404 : 200).send(tache ?? {});
      else
        res.status(401).send({
          error: true,
          message: "You do not own this task to visualize",
        });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/",
  validEntityID({
    container: "body",
    entityName: "produit",
    paramName: "produit",
  }),
  //on valide que ce produit est encore valide
  prodAvailable({ container: "body", paramName: "produit" }),
  async (req, res, next) => {
    try {
      const { produit, quantite } = req.body;
      const { taches } = await prisma.produit.update({
        where: {
          id: parseInt(produit),
        },
        data: {
          taches: {
            create: {
              user: {
                connect: {
                  id: parseInt(req.user.id),
                },
              },
              quantite,
            },
          },
          quantiteEnTachesEnCours: {
            increment: quantite,
          },
        },
        select: {
          taches: {
            orderBy: { id: "desc" },
            include: {
              produit: true,
              user: {
                select: {
                  id: true,
                  nom: true,
                  prenom: true,
                  trigramme: true,
                  equipe: true,
                  isAdmin: true,
                },
              },
            },
          },
        },
      });
      res.send(taches.at(0));
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:id",
  isAdmin,
  validEntityID({
    entityName: "tache",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      const { etat, rejectReason } = req.body;
      //update once at a time
      if (etat === "EN_COURS") throw new Error("Etat EN_COURS est invalide");
      const { quantite, etat: etat_in_db } = await prisma.tache.findFirst({
        where: {
          id: parseInt(req.params.id),
        },
      });
      if (etat_in_db !== "EN_COURS")
        throw {
          message: "This task has already been answered",
          status: 409,
        };
      const data = await prisma.tache.update({
        where: {
          id: parseInt(req.params.id),
        },
        data: {
          produit: {
            update: {
              quantite:
                etat === "FINIE"
                  ? {
                      //if done, quantity is given
                      decrement: quantite,
                    }
                  : undefined,
              quantiteEnTachesEnCours: {
                decrement: quantite,
              },
            },
          },
          etat,
          rejectReason: etat === "REJETEE" ? rejectReason : undefined,
        },
        include: {
          produit: true,
        },
      });
      res.send(data);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/:id",
  validEntityID({
    entityName: "tache",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      const tache = await prisma.tache.findFirst({
        where: {
          id: parseInt(req.params.id),
        },
      });
      //only admin or user can delete task
      if (!req.user?.isAdmin && tache.userID !== req.user?.id) {
        res.status(401).send({});
        return;
      }
      //when deleting a task that is still on hold, reset product availability
      if (tache.etat === "EN_COURS") {
        const { produitID } = tache;
        await prisma.produit.update({
          where: {
            id: produitID,
          },
          data: {
            quantite: {
              increment: tache.quantite,
            },
            quantiteEnTachesEnCours: {
              decrement: tache.quantite,
            },
          },
        });
      }
      await prisma.tache.delete({
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
