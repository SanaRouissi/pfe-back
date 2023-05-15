const jwt = require("jsonwebtoken");
const prisma = require("./prisma");

module.exports = {
  /**
   * VERIFY A PRODUCT QUANTITY > 0
   */
  prodAvailable:
    ({ container, paramName }) =>
    async (req, res, next) => {
      try {
        if (!req.body.quantite || isNaN(req.body.quantite))
          throw new Error("QNT");
        const prod = await prisma.produit.findFirst({
          where: {
            id: parseInt(req[container][paramName]),
          },
          select: {
            quantite: true,
            quantiteEnTachesEnCours: true,
          },
        });
        if (
          prod.quantite > 0 &&
          prod.quantiteEnTachesEnCours + req.body.quantite <= prod.quantite
        )
          next();
        else throw new Error("AVL");
      } catch (error) {
        res.status(400).send({
          error: true,
          message:
            error.message == "QNT"
              ? "Valeur quantite non valide"
              : "Product unavailable",
        });
      }
    },
  /**
   * VERIFY A USER IS AN ADMIN
   */
  isAdmin: async (req, res, next) => {
    //si c admin
    if (req.user?.isAdmin || process.env.API_ALLOW_ADMIN == "TRUE") next();
    //sinon
    else {
      res.status(401).send({
        error: true,
        message: "An admin account authorization is missing",
      });
    }
  },
  /**
   * VERIFY A PROVIDED USER TOKEN IS VALID (NOT BLACKLISTED && SIGNATURES MATCH)
   */
  isUser: async (req, res, next) => {
    try {
      //si on est en train de développer, laisser nous passer
      if (
        (process.env.API_ALLOW_USER == "TRUE" ||
          process.env.API_ALLOW_ADMIN == "TRUE") &&
        !req.headers.authorization
      )
        next();
      //sinon vérifier le token fourni
      else {
        const header_token = req.headers.authorization;
        const token = await prisma.token.findFirst({
          where: {
            value: header_token,
          },
        });
        if (
          token.isBlacklisted &&
          !(
            process.env.API_ALLOW_USER == "TRUE" ||
            process.env.API_ALLOW_ADMIN == "TRUE"
          )
        )
          throw new Error();
        req.user = jwt.verify(header_token, process.env.JWT_SECRET, {
          ignoreExpiration: true,
        });
        next();
      }
    } catch (error) {
      res.status(401).send({
        error: true,
        message: "Unauthorized",
      });
    }
  },
  /**
   * VERIFY A PAGE NUMBER CAN ONLY BE AN INT
   */
  validPage: (req, res, next) => {
    //si le numéro de la page (pour pagination) est (définie et non pas un nombre)
    if (isNaN(req.query.page) && req.query.page !== undefined)
      res.status(400).send({ error: true, message: "Invalid page number" });
    //ca va laisse passer
    else {
      req.page = req.query.page || 0;
      next();
    }
  },
  /**
   * @param entityName ["user","categorie","marque","produit","fournisseur","facture","tache","equipe"]
   * @param container ["query","body","params"]
   * @param paramName value variable name
   */
  validEntityID:
    //pour les IDs fournies dans les requetes, vérifier qu'elles existent dans la base


      ({
        entityName,
        container,
        paramName,
        isTrigramme = false,
        required = false,
      }) =>
      async (req, res, next) => {
        try {
          const id = req[container][paramName];
          if (!id && required)
            throw new Error(`A valid ${entityName} is required`);
          if (!id && !required) next();
          else {
            //si c pas un nombre
            if (
              (isNaN(id) && !isTrigramme) ||
              (isTrigramme && typeof id !== "string")
            )
              throw new Error();
            const isValid = await prisma[entityName].findFirst({
              where: {
                [isTrigramme && entityName == "user" ? "trigramme" : "id"]:
                  isTrigramme && entityName == "user" ? id : parseInt(id),
              },
            });
            //si ca existe et valide
            if (!!isValid) next();
            else throw new Error();
          }
        } catch (error) {
          res.status(404).send({
            error: true,
            message: error.message || `Invalid ${entityName} supplied`,
          });
        }
      },
};
