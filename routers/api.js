const express = require("express");
const { isUser, isAdmin } = require("../middlewares");
const router = express.Router();


//no priv
router.use("/auth", require("./auth"))

//admin priv.
router.use("/factures", isUser, isAdmin, require("./factures"));
router.use("/fournisseurs", isUser, isAdmin, require("./fournisseurs"));
router.use("/marques", isUser, require("./marques"));
router.use("/users", isUser, require("./users"));
router.use("/equipes", isUser, require("./equipes"));
router.use("/demande_restocks", isUser, require("./restock"));

//user priv.
router.use("/categories", isUser, require("./categories"));
router.use("/produits", isUser, require("./produits"));
router.use("/images", isUser, require("./images"));
router.use("/count", isUser, require("./count"));
router.use("/taches", isUser, require("./taches"));

//error handler
router.use((error, req, res, next) => {
    console.log(error.message)
    res.status(error.status || 500).send({
        error: true,
        message: process.env.NODE_ENV === "DEV" && error.meta ? error.meta : error.message,
        code: error.code
    })
})

module.exports = router;
