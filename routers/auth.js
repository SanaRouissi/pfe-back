const express = require("express");
const { isUser } = require("../middlewares");
const router = express.Router();
const prisma = require("../prisma");
const {login, generateToken} = require("./auth/login");

router.post("/", async (req, res, next) => {
  try {
    res.send(await login(req.body));
  } catch (error) {
    console.log(error.message)
    if (error.code) next(error);
    else
      res.status(401).send({
        error: true,
        message: "Invalid credentials",
      });
  }
});

router.delete("/", isUser, async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    const token = await prisma.token.findFirst({
      where: {
        value: authorization,
      },
    });
    await prisma.token.update({
      where: {
        id: token.id,
      },
      data: {
        isBlacklisted: true,
      },
    });
    res.send({});
  } catch (error) {
    if (error.code) next(error);
    res.status(500).send({
      error: true,
      message: process.env.NODE_ENV === "DEV" ? error.message : undefined,
    });
  }
});

router.get("/", isUser, async (req, res) => {
  //user updated from db
  const {user: _} = req
  const __ = await prisma.user.findFirst({
    where: {
      id: parseInt(req.user.id),
    },
    select:{
      image: true,
      nom: true,
      prenom: true,
      equipe: true,
      isAdmin: true,
      id: true,
      trigramme: true
    }
  });
  const create_new_token = (_.nom != __.nom || _.prenom != __.prenom || _.equipe.nom !== __.equipe.nom || _.image?.path !== __.image?.path)
  res.status(200).send({
    success: true,
    token: create_new_token ? await generateToken({user: __}) : undefined
  });
});

module.exports = router;
