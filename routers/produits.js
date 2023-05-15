const { PrismaClient } = require("@prisma/client");
const express = require("express");
const { validPage, validEntityID, isAdmin } = require("../middlewares");
const router = express.Router();
const prisma = require("../prisma");

router.get("/", validPage, async (req, res, next) => {
  try {
    const { page } = req;
    const {
      produit,
      nom,
      categories,
      marque,
      gt = 0,
      lt = 99999,
      order = "asc",
      orderBy = "nom",
    } = req.query;
    const result = await prisma.produit.findMany({
      where: {
        id: !!produit && !isNaN(produit) ? parseInt(produit) : undefined,
        nom: !nom
          ? undefined
          : {
              mode: "insensitive",
              contains: nom,
            },
        categories:
          !categories || categories.split(",").some((e) => isNaN(e))
            ? undefined
            : {
                some: {
                  OR: categories.split(",").map((e) => ({
                    id: parseInt(e),
                  })),
                },
              },
        marque: isNaN(marque)
          ? undefined
          : {
              id: parseInt(marque),
            },
        quantite: {
          gt: !gt || isNaN(gt) ? undefined : parseInt(gt),
          lt: !lt || isNaN(lt) ? undefined : parseInt(lt),
        },
      },
      take: 20,
      skip: !isNaN(page) ? page * 20 : 0,
      include: {
        categories: true,
        marque: true,
        images: true,
      },
      orderBy: {
        [orderBy]: order,
      },
    });
    res.send(result);
  } catch (error) {
    next(error);
  }
});

//when logged in and u're not admin, get ur data
//admin has an account too, this works for him too
router.get("/user/", validPage, async (req, res, next) => {
  try {
    const { page } = req.query;
    const produit = await prisma.produit.findMany({
      where: {
        taches: {
          some: {
            user: {
              id: parseInt(req.user.id),
            },
          },
        },
      },
      include: {
        images: true,
        marque: true,
        taches: true,
      },
      distinct: "id",
      orderBy: {
        nom: "asc",
      },
      skip: isNaN(page) ? 0 : parseInt(page) * 20,
      take: 20,
    });
    res.send(produit);
  } catch (error) {
    next(error);
  }
});

//if u're an admin, u can get other peeps data
router.get("/user/:id", isAdmin, validPage, async (req, res, next) => {
  try {
    const { page } = req.query;
    const produit = await prisma.produit.findMany({
      where: {
        taches: {
          some: {
            user: {
              id: parseInt(req.params.id),
            },
          },
        },
      },
      include: {
        images: true,
        marque: true,
        taches: true,
      },
      distinct: "id",
      skip: isNaN(page) ? 0 : parseInt(page) * 20,
      take: 20,
    });
    res.send(produit);
  } catch (error) {
    next(error);
  }
});

router.get(
  "/:id",
  validEntityID({
    entityName: "produit",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      const produit = await prisma.produit.findFirst({
        where: {
          id: parseInt(req.params.id),
        },
        include: {
          categories: true,
          marque: true,
          images: true,
        },
      });
      res.status(!produit ? 404 : 200).send(produit ?? {});
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/",
  validEntityID({
    container: "body",
    entityName: "marque",
    paramName: "marque",
  }),
  isAdmin,
  async (req, res, next) => {
    try {
      const { nom, quantite, marque, categories, images } = req.body;
      if (!Array.isArray(categories) || !categories.length)
        throw {
          message: "You have not provided a list of categories",
          status: 400,
        };
      res.send(
        await prisma.produit.create({
          data: {
            nom,
            quantite,
            marque: {
              connect: {
                id: marque,
              },
            },
            categories: {
              connect: categories.map((e) => ({
                id: e,
              })),
            },
            images: !Array.isArray(images)
              ? undefined
              : {
                  create: images.map((e) => ({
                    path: e,
                  })),
                },
          },
          include: {
            categories: true,
            marque: true,
            images: true,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:id",
  isAdmin,
  validEntityID({
    entityName: "produit",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      const { nom, categories, marque, quantite, images } = req.body;
      res.send(
        await prisma.produit.update({
          where: {
            id: parseInt(req.params.id),
          },
          data: {
            nom,
            quantite,
            categories:
              !categories ||
              !Array.isArray(categories) ||
              categories.some((e) => isNaN(e))
                ? undefined
                : {
                    set: categories.map((e) => ({ id: e })),
                  },
            marque: !marque
              ? undefined
              : {
                  connect: {
                    id: marque,
                  },
                },
            images: !images
              ? undefined
              : {
                  deleteMany: {},
                  createMany: {
                    data: images.map((e) => ({ path: e })),
                  },
                },
          },
          include: {
            categories: true,
            marque: true,
            images: true,
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
    entityName: "produit",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      await prisma.produit.delete({
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

//demande restock
router.put(
  "/:id/restock",
  validEntityID({
    entityName: "produit",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      const data = await (new PrismaClient()).demande_restock.create({
        data: {
          quantite: req.body.quantite,
          produit: {
            connect:{
              id: parseInt(req.params.id)
            }
          },
          user:{
            connect:{
              id: parseInt(req.user.id)
            }
          }
        },
        include: {
          
        },
      });
      res.send(data);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
