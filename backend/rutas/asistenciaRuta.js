const express = require("express");
const router = express.Router();
const controlador = require("../controladores/asistenciaControlador.js");

router.post("/", controlador.ingresar);
router.get("/", controlador.consultar);
router.put("/:id", controlador.actualizar);
router.delete("/:id", controlador.borrar);
module.exports = router;
