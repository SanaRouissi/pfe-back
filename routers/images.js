const express = require("express");
const router = express.Router();
const prisma = require("../prisma");
const { default: axios } = require("axios");
const { PrismaClient } = require("@prisma/client");

router.post("/", async (req, res, next) => {
  try {
    const { images = [] } = req.body;
    const headers = {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    };
    const uploaded = (
      await Promise.allSettled(
        images.map(async (image) => {
          const { data } = await axios.post(
            "https://api.imgbb.com/1/upload?key=" + process.env.BB_IMG_KEY,
            {
              image,
            },
            headers
          );
          return data;
        })
      )
    ).map((e) => e.value);
    
    if (uploaded.some((e) => !e))
      throw {
        error: true,
        message: `${
          uploaded.length === 0 ? "Your file" : "Some of your files"
        } could not be uploaded`,
      };
    res.send(uploaded.map((e) => e.data.url));
  } catch (error) {
    next({
      message: process.env.NODE_ENV === "DEV" ? error.message : undefined,
      status: error.status || 400,
      stack: process.env.NODE_ENV === "DEV" ? error.stack : undefined,
    });
  }
});

module.exports = router;
