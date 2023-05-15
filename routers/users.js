const express = require("express");
const bcrypt = require("bcrypt");
const { validPage, validEntityID, isAdmin } = require("../middlewares");
const router = express.Router();
const prisma = require("../prisma");

router.get("/", validPage, async (req, res, next) => {
  try {
    const { page } = req;
    const { nom, prenom, equipe, trigramme } = req.query;
    res.send(
      await prisma.user.findMany({
        where: {
          equipe: equipe
            ? {
                nom: {
                  mode: "insensitive",
                  contains: equipe,
                },
              }
            : undefined,
          trigramme: !trigramme
            ? undefined
            : {
                mode: "insensitive",
                contains: trigramme,
              },
          nom: !nom
            ? undefined
            : {
                mode: "insensitive",
                contains: nom,
              },
          prenom: !prenom
            ? undefined
            : {
                mode: "insensitive",
                contains: prenom,
              },
        },
        select: {
          id: true,
          nom: true,
          prenom: true,
          trigramme: true,
          equipe: true,
          image: true,
        },
        take: 20,
        skip: !isNaN(page) ? page * 20 : 0,
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
  "/@:trigramme",
  validEntityID({
    entityName: "user",
    container: "params",
    paramName: "trigramme",
    isTrigramme: true,
  }),
  async (req, res, next) => {
    try {
      const user = await prisma.user.findFirst({
        where: {
          trigramme: req.params.trigramme,
        },
        select: {
          id: true,
          nom: true,
          prenom: true,
          trigramme: true,
          equipe: true,
          image: true,
        },
      });
      res.status(!user ? 404 : 200).send(user ?? {});
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/:id",
  validEntityID({
    entityName: "user",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      const user = await prisma.user.findFirst({
        where: {
          id: parseInt(req.params.id),
        },
        select: {
          id: true,
          nom: true,
          prenom: true,
          trigramme: true,
          equipe: true,
          image: true,
        },
      });
      res.status(!user ? 404 : 200).send(user ?? {});
    } catch (error) {
      next(error);
    }
  }
);

router.post("/", isAdmin, async (req, res, next) => {
  try {
    const { nom, prenom, password, image, trigramme, equipe } = req.body;
    const pass = await bcrypt.hash(password, 10);
    res.send(
      await prisma.user.create({
        data: {
          nom,
          prenom,
          trigramme,
          equipe: {
            connect: {
              id: parseInt(equipe),
            },
          },
          image: !image
            ? undefined
            : {
                create: {
                  path: image,
                },
              },
          password: pass,
        },
        select: {
          id: true,
          nom: true,
          prenom: true,
          trigramme: true,
          equipe: true,
          image: true,
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
    entityName: "user",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      const { equipe, nom, prenom, trigramme } = req.body;
      res.send(
        await prisma.user.update({
          where: {
            id: parseInt(req.params.id),
          },
          data: {
            nom,
            prenom,
            trigramme,
            equipe: isNaN(equipe)
              ? undefined
              : {
                  connect: {
                    id: parseInt(equipe),
                  },
                },
          },
          select: {
            id: true,
            nom: true,
            prenom: true,
            trigramme: true,
            equipe: true,
            image: true,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/",
  //check if old password is same as provided to be able to modify current password
  async (req, res, next) => {
    try {
      if (!req.body.password) next();
      else {
        const { password } = await prisma.user.findFirst({
          where: {
            id: parseInt(req.user.id),
          },
          select: {
            password: true,
          },
        });
        const same = await bcrypt.compare(req.body.oldPassword, password);
        if(!same) throw new Error()
        next()
      }
    } catch (error) {
      res.status(401).send({ message: "Unmatching old password" })
    }
  },
  async (req, res, next) => {
    try {
      const { id } = req.user;
      const { image, password } = req.body;
      const crypted = password ? await bcrypt.hash(password, 10) : undefined;
      res.send(
        await prisma.user.update({
          where: {
            id,
          },
          data: {
            password: crypted,
            image:
              image === undefined
                ? undefined
                : {
                    create:
                      image === null
                        ? undefined
                        : {
                            path: image,
                          },
                    delete: image === null ? true : undefined,
                  },
          },
          select: {
            id: true,
            nom: true,
            prenom: true,
            trigramme: true,
            equipe: true,
            image: true,
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
    entityName: "user",
    container: "params",
    paramName: "id",
  }),
  async (req, res, next) => {
    try {
      const {isAdmin} = await prisma.user.findFirst({
        where:{
          id: parseInt(req.params.id)
        },
        select:{
          isAdmin: true
        }
      })
      if(isAdmin) throw {message: "Cannot delete an admin account", status: 403}
      await prisma.user.delete({
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
