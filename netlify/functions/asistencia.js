const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");

const app = express();
const asistenciaRuta = require("../../backend/rutas/asistenciaRuta.js");

app.use(cors());
app.use(express.json());
app.use("/.netlify/functions/asistencia", asistenciaRuta);

module.exports.handler = serverless(app);
