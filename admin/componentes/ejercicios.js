const fs = require('fs');
const path = require('path');
const errores = [];
let bd;

function revisarCompilacion(ruta, respuesta) {
  const rutaArchivos = path.resolve(ruta, 'www');
  const info = fs.lstatSync(rutaArchivos);

  if (info.isDirectory()) {
    const archivos = fs.readdirSync(rutaArchivos);

    if (archivos.includes('index.html')) {
      // Usa package.json pero no necesita compilación
      respuesta.compilado = true;
      respuesta.rutaArchivos = rutaArchivos;
    } else {
      errores.push(`No hay archivo index.html en ${rutaArchivos}`);
    }
  }
}

function extraerInfo(ruta) {
  const archivos = fs.readdirSync(ruta);
  const respuesta = {
    tipo: 'fa-folder',
  };

  if (archivos.includes('package.json')) {
    const datos = JSON.parse(fs.readFileSync(path.resolve(ruta, 'package.json')));

    if (datos['scripts']) {
      respuesta.scripts = datos.scripts;
      if (datos.scripts['build']) {
        // Es proyecto con compilador
        respuesta.tipo = 'fa-yarn';
        respuesta.script = datos.scripts.build;
        respuesta.compilado = false;
      } else if (archivos.includes('www')) {
        revisarCompilacion(ruta, respuesta);
      } else {
        errores.push(`No hay carpeta wwww en ${ruta}`);
      }
    } else {
    }
  } else {
    revisarCompilacion(ruta, respuesta);
  }

  return respuesta;
}

function extraerEntradas(ruta, nombreEjercicio) {
  const usuarios = fs.readdirSync(ruta);
  const entradas = [];

  usuarios.forEach((usuario) => {
    const rutaEntrada = path.resolve(ruta, usuario);
    const infoEntrada = fs.lstatSync(rutaEntrada);

    if (infoEntrada.isDirectory()) {
      entradas.push({
        usuario: usuario,
        ruta: rutaEntrada,
        info: extraerInfo(rutaEntrada),
        fecha: infoEntrada.birthtime,
      });
    }
  });

  if (entradas.length) {
    entradas.forEach((entrada) => {
      const id = `${entrada.usuario}-${nombreEjercicio}`;
      const existe = bd.findOne({ id: id });

      if (!existe) {
        console.log('Nueva entrada:', id);
        bd.insert({
          id: id,
          ejercicio: nombreEjercicio,
          usuario: entrada.usuario,
          ruta: entrada.ruta,
          fecha: entrada.fecha,
        });
      } else if (existe.exportada) {
        entrada.exportada = true;
      }
    });
  }

  return entradas;
}

function extraerEjercicios(rutaInicial, baseDeDatos) {
  bd = baseDeDatos;
  const nombres = fs.readdirSync(rutaInicial);
  const rutas = [];

  nombres.forEach((nombreEjercicio) => {
    const ruta = path.resolve(rutaInicial, nombreEjercicio);
    const info = fs.lstatSync(ruta);

    if (info.isDirectory()) {
      const entradas = extraerEntradas(ruta, nombreEjercicio);
      rutas.push({ nombre: nombreEjercicio, ruta: ruta, entradas: entradas });
    }
  });

  return { rutas: rutas, errores: errores };
}

module.exports = extraerEjercicios;
