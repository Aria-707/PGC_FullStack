let datosActuales = [];
document.querySelectorAll('input[name="asignaturaFiltro"]').forEach(radio => {
  radio.addEventListener("change", () => {
    cargar(JSON.stringify(datosActuales));

  });
});

const firebaseConfig = {
  apiKey: "AIzaSyDF3JbaIXh7niaPJcshu1KnJl9dNGPCUHk",
  authDomain: "asistenciaconreconocimiento.firebaseapp.com",
  projectId: "asistenciaconreconocimiento",
  storageBucket: "asistenciaconreconocimiento.firebasestorage.app",
  messagingSenderId: "973062515655",
  appId: "1:973062515655:web:d249787d1c89a9f27147e2",
  measurementId: "G-PSGDE2EG85"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function guardar(event) {
  event.preventDefault();

  const estudiante = document.getElementById("estudiante").value;
  const estadoAsistencia = document.getElementById("estadoAsistencia").value;
  if (!estadoAsistencia) {
    alert("Por favor selecciona un estado de asistencia.");
    return;
  }
  const data = JSON.stringify({
    estudiante,
    estadoAsistencia
  });

  fetch("/.netlify/functions/asistencia", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: data
  })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error(text || "Error al guardar");
        });
      }
      return response.text();
    })
    .then(result => {
      alert("Asistencia registrada");
      listar();
    })
    .catch(error => {
      alert("Error guardando: " + error.message);
    });
}

function parsearFecha(fechaYhora) {
  if (!fechaYhora) return null;
  
  let fecha;
  
  // Caso 1: Timestamp de Firestore desde API (tiene .seconds)
  if (fechaYhora.seconds) {
    fecha = new Date(fechaYhora.seconds * 1000);
  }
  // Caso 2: Timestamp de Firestore desde listener en tiempo real (es un objeto Timestamp)
  else if (fechaYhora.toDate && typeof fechaYhora.toDate === 'function') {
    fecha = fechaYhora.toDate();
  }
  // Caso 3: String de fecha
  else if (typeof fechaYhora === 'string') {
    fecha = new Date(fechaYhora);
  }
  // Caso 4: Número (timestamp en milisegundos)
  else if (typeof fechaYhora === 'number') {
    fecha = new Date(fechaYhora);
  }
  // Caso 5: Ya es un objeto Date
  else if (fechaYhora instanceof Date) {
    fecha = fechaYhora;
  }
  else {
    console.warn('Formato de fecha no reconocido:', fechaYhora);
    return null;
  }
  
  // Verificar si la fecha es válida
  if (isNaN(fecha.getTime())) {
    console.warn('Fecha inválida generada:', fechaYhora);
    return null;
  }
  
  return fecha;
}

function obtenerSoloFecha(fechaYhora) {
  const fecha = parsearFecha(fechaYhora);
  if (!fecha) return "Sin fecha";
  
  const opciones = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };
  return fecha.toLocaleDateString("es-CO", opciones);
}

function obtenerSoloHora(fechaYhora) {
  const fecha = parsearFecha(fechaYhora);
  if (!fecha) return "Sin hora";
  
  const opciones = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  // Quitamos el espacio antes de am/pm para que sea como "11:00am"
  return fecha
    .toLocaleTimeString("es-CO", opciones)
    .replace(/\s*(a\.m\.|p\.m\.)/, (_, periodo) => periodo.replace(".", ""));
}

function cargar(resultado) {
  let datos;
  try {
    datos = JSON.parse(resultado);
    console.log("Datos parseados:", datos);
  } catch {
    document.getElementById("rta").innerText = "Error cargando datos";
    return;
  }

  let html = `
    <br><br>
    <h2></h2>
    <h2>Listado de Asistencias</h2>
    <table class="tabla-asistencias">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Hora de registro</th>
          <th>Estudiante</th>
          <th>Estado Asistencia</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
  `;

  const filtro = document.querySelector('input[name="asignaturaFiltro"]:checked');
  const asignaturaSeleccionada = filtro ? filtro.value : null;

  datos
    .filter(item => !asignaturaSeleccionada || item.asignatura === asignaturaSeleccionada)
    .forEach(item => {
      // Usar las funciones mejoradas que manejan todos los formatos
      const fechaTexto = obtenerSoloFecha(item.fechaYhora);
      const horaTexto = obtenerSoloHora(item.fechaYhora);
      
      html += `
        <tr>
          <td>${fechaTexto}</td>
          <td>${horaTexto}</td>
          <td>${item.estudiante}</td>
          <td>${item.estadoAsistencia}</td>
          <td>
            <button class="btn-editar" onclick="editar('${item.id}', '${item.estudiante}', '${item.estadoAsistencia}')">Editar</button>
            <button class="btn-eliminar" onclick="eliminar('${item.id}')">Eliminar</button>
          </td>
        </tr>
      `;
    });

  html += `</tbody></table>`;
  document.getElementById("rta").innerHTML = html;
}

function listar(event) {
  if (event) event.preventDefault();

  fetch("/.netlify/functions/asistencia")
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error(text || "Error al listar");
        });
      }
      return response.text();
    })
    .then(result => cargar(result))
    .catch(error => {
      console.error("Error al listar:", error.message);
      alert("Error al listar: " + error.message);
    });
}

function editar(id, estudiante, estadoAsistencia) {
  document.getElementById("editar-id").value = id;
  document.getElementById("editar-estudiante").value = estudiante;
  document.getElementById("editar-estadoAsistencia").value = estadoAsistencia;
  document.getElementById("popup-editar").style.display = "flex";
}

function cerrarPopup() {
  document.getElementById("popup-editar").style.display = "none";
}

function confirmarEdicion(event) {
  event.preventDefault();

  const id = document.getElementById("editar-id").value;
  const nuevoNombre = document.getElementById("editar-estudiante").value;
  const nuevoEstado = document.getElementById("editar-estadoAsistencia").value;

  if (!nuevoNombre || !nuevoEstado) {
    alert("Completa todos los campos.");
    return;
  }

  const body = { estudiante: nuevoNombre, estadoAsistencia: nuevoEstado };
  fetch(`/.netlify/functions/asistencia/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error(text || "Error al actualizar");
        });
      }
      return response.text();
    })
    .then(data => {
      alert("Registro actualizado exitosamente");
      cerrarPopup();
      listar();
    })
    .catch(error => {
      console.error("Error en editar:", error.message);
      alert("Error al actualizar: " + error.message);
    });
}

let idAEliminar = null;

function eliminar(id) {
  // Buscar los datos directamente del DOM
  const fila = [...document.querySelectorAll("button.btn-eliminar")]
    .find(btn => btn.getAttribute("onclick") === `eliminar('${id}')`)
    ?.closest("tr");

  if (!fila) return alert("No se encontró el registro.");

  const [fecha, hora, estudiante, estado] = [...fila.children].map(td => td.textContent);

  // Mostrar resumen
  const resumenDiv = document.getElementById("resumen-eliminar");
  resumenDiv.innerHTML = `
    <p><strong>Estudiante:</strong> ${estudiante}</p>
    <p><strong>Estado:</strong> ${estado}</p>
    <p><strong>Fecha:</strong> ${fecha}</p>
    <p><strong>Hora:</strong> ${hora}</p>
  `;

  // Guardamos el id globalmente y abrimos el popup
  idAEliminar = id;
  document.getElementById("popup-eliminar").style.display = "flex";
}

function confirmarEliminar() {
  if (!idAEliminar) return;

  fetch(`/.netlify/functions/asistencia/${idAEliminar}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" }
  })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error(text || "Error al eliminar");
        });
      }
      return response.text();
    })
    .then(data => {
      alert("Registro eliminado exitosamente");
      cerrarPopupEliminar();
      listar();
    })
    .catch(error => {
      console.error("Error al eliminar:", error.message);
      alert("Error al eliminar: " + error.message);
    });
}

function cerrarPopupEliminar() {
  idAEliminar = null;
  document.getElementById("popup-eliminar").style.display = "none";
}


function escucharCambios() {
  db.collection("asistenciaReconocimiento").onSnapshot(snapshot => {
    datosActuales = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    cargar(JSON.stringify(datosActuales));
  });
}

// Llama a la función al cargar la página
escucharCambios();
