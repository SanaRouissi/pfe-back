//deps
const express = require("express")
const app = express()
const dotenv = require("dotenv")
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");


dotenv.config()
// app.use(morgan("dev"))
app.use(
  cors({
    origin: [process.env.FRONT_END],
    allowedHeaders: ["*"],
  })
);
app.use(express.json({limit: "50mb"}))
app.use(bodyParser.urlencoded({limit: "50mb"}));

app.use("/api", require("./routers/api"))

module.exports = app