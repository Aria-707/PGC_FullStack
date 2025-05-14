const admin = require("../../netlify/functions/firebaseAdmin");

class AsistenciaControlador {
  constructor() {
    this.db = admin.firestore();
    this.collection = this.db.collection("asistenciaReconocimiento");

    this.consultar = this.consultar.bind(this);
    this.ingresar = this.ingresar.bind(this);
    this.actualizar = this.actualizar.bind(this);
    this.borrar = this.borrar.bind(this);
  }

  async consultar(req, res) {
    try {
      const snapshot = await this.collection.get();
      const asistenciaReconocimiento = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(asistenciaReconocimiento);
    } catch (err) {
      res.status(500).send(err.message);
    }
  }

  async ingresar(req, res) {
    try {
      let body = req.body;

      if (Buffer.isBuffer(body)) {
        body = JSON.parse(body.toString("utf8"));
      }

      const nuevaAsistencia = {
        estudiante: body.estudiante,
        estadoAsistencia: body.estadoAsistencia,
        fechaYhora: admin.firestore.Timestamp.now(),
      };

      const ref = await this.collection.add(nuevaAsistencia);
      const nuevoDoc = await ref.get();

      res.status(200).json({ id: ref.id, ...nuevoDoc.data() });
    } catch (err) {
      res.status(500).send("Error en ingresar: " + err.message);
    }
  }

  async actualizar(req, res) {
    try {
      const { id } = req.params;
      let body = req.body;
  
      if (Buffer.isBuffer(body)) {
        body = JSON.parse(body.toString("utf8"));
      }
  
      const datosActualizados = {
        estudiante: body.estudiante,
        estadoAsistencia: body.estadoAsistencia,
      };
  
      await this.collection.doc(id).update(datosActualizados);
      res.status(200).send("Actualizado con éxito");
    } catch (err) {
      res.status(500).send("Error actualizando: " + err.message);
    }
  }
  

  async borrar(req, res) {
    try {
      const { id } = req.params;
      await this.collection.doc(id).delete();
      res.status(200).send("Eliminado con éxito");
    } catch (err) {
      res.status(500).send("Error eliminando: " + err.message);
    }
  }  
}

module.exports = new AsistenciaControlador();