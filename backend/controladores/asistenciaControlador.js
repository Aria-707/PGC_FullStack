
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

  // ✅ Método helper para parsear body
  parseBody(req) {
    try {
      if (Buffer.isBuffer(req.body)) {
        return JSON.parse(req.body.toString("utf8"));
      } else if (typeof req.body === "string") {
        return JSON.parse(req.body);
      } else {
        return req.body;
      }
    } catch (error) {
      throw new Error("Error parsing request body: " + error.message);
    }
  }

  async consultar(req, res) {
    try {
      const snapshot = await this.collection.get();
      const asistenciaReconocimiento = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(asistenciaReconocimiento);
    } catch (err) {
      console.error("🔥 Error en consultar:", err);
      res.status(500).send("Error consultando: " + err.message);
    }
  }

  async ingresar(req, res) {
    try {
      const body = this.parseBody(req);

      if (!body.estudiante || !body.estadoAsistencia) {
        return res.status(400).send("Faltan campos requeridos: estudiante y estadoAsistencia");
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
      console.error("🔥 Error en ingresar:", err);
      res.status(500).send("Error ingresando: " + err.message);
    }
  }
  
  async actualizar(req, res) {
    try {
      // ✅ Usar el método helper para parsear body
      const body = this.parseBody(req);
      const { estudiante, estadoAsistencia } = body;
      const { id } = req.params;

      console.log("📝 Datos recibidos para actualizar:", { id, estudiante, estadoAsistencia });

      // ✅ Validación mejorada
      if (!id) {
        return res.status(400).send("ID es requerido");
      }

      if (!estudiante || !estadoAsistencia) {
        return res.status(400).send("Faltan campos requeridos: estudiante y estadoAsistencia");
      }

      const docRef = this.collection.doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return res.status(404).send("No se encontró el registro con ID: " + id);
      }

      // ✅ CORRECCIÓN: Solo actualizar los campos que cambiaron, preservar fechaYhora
      const updateData = { 
        estudiante, 
        estadoAsistencia 
        // NO incluimos fechaYhora para que se mantenga la original
      };
      await docRef.update(updateData);
      
      // ✅ Obtener el documento actualizado con todos sus campos
      const updatedDoc = await docRef.get();
      const fullData = updatedDoc.data();
      
      console.log("✅ Documento actualizado exitosamente:", id);
      res.status(200).json({ 
        message: "Actualizado con éxito", 
        id, 
        ...fullData 
      });
    } catch (err) {
      console.error("🔥 Error en actualizar:", err);
      res.status(500).send("Error actualizando: " + err.message);
    }
  }
  
  async borrar(req, res) {
    try {
      const { id } = req.params;
      
      console.log("🗑️ Intentando eliminar documento con ID:", id);

      if (!id) {
        return res.status(400).send("ID es requerido");
      }

      const docRef = this.collection.doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return res.status(404).send("No se encontró el registro con ID: " + id);
      }

      await docRef.delete();
      console.log("✅ Documento eliminado exitosamente:", id);
      res.status(200).json({ message: "Eliminado con éxito", id });
    } catch (err) {
      console.error("🔥 Error en borrar:", err);
      res.status(500).send("Error eliminando: " + err.message);
    }
  }
}

module.exports = new AsistenciaControlador();
