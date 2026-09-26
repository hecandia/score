/* Persistencia en localStorage, con pila de deshacer.
   Cada acción confirmada se guarda al instante: si el iPad se apaga o se
   cierra Safari, el partido sigue donde quedó. */
(function (raiz) {
  'use strict';

  var C = raiz.Carambola = raiz.Carambola || {};
  var D = {};

  var CLAVE = 'carambola.v1';
  var CLAVE_DESHACER = 'carambola.v1.deshacer';
  var MAX_DESHACER = 40;
  var contador = 0;

  D.id = function (prefijo) {
    contador++;
    return prefijo + '-' + Date.now().toString(36) + contador.toString(36);
  };

  // Récords con los que arrancó la app (2026-09): los tres son de Francisco,
  // en rosario, ronda de tres.
  D.inicial = function () {
    var francisco = 'j-francisco';
    function record(tipo, valor) {
      return { modalidad: 'rosario', formato: 'ronda3', tipo: tipo, jugador: francisco, valor: valor };
    }
    return {
      version: 1,
      jugadores: [{ id: francisco, nombre: 'Francisco' }],
      recordsIniciales: [record('racha', 7), record('tiro', 11), record('negro', 8)],
      noches: [],
      partidos: [],
      actual: null
    };
  };

  function leer(clave) {
    try { return JSON.parse(raiz.localStorage.getItem(clave)); } catch (e) { return null; }
  }

  function escribir(clave, valor) {
    raiz.localStorage.setItem(clave, JSON.stringify(valor));
  }

  D.valido = function (estado) {
    return !!estado && estado.version === 1 &&
      estado.jugadores instanceof Array && estado.partidos instanceof Array &&
      estado.noches instanceof Array && estado.recordsIniciales instanceof Array;
  };

  D.cargar = function () {
    var estado = leer(CLAVE);
    if (D.valido(estado)) { return estado; }
    estado = D.inicial();
    escribir(CLAVE, estado);
    return estado;
  };

  // Un paso de deshacer no guarda la historia entera: Safari da ~5 MB por sitio
  // y 40 copias completas lo agotarían en uno o dos años. Sólo cambian los
  // partidos de noches abiertas (y siempre al final del arreglo), así que basta
  // guardar desde el primero de ellos; lo anterior está congelado.
  function inicioAbierto(estado) {
    var abiertas = {};
    estado.noches.forEach(function (n) { if (!n.cerrada) { abiertas[n.id] = true; } });
    for (var i = 0; i < estado.partidos.length; i++) {
      if (abiertas[estado.partidos[i].nocheId]) { return i; }
    }
    return estado.partidos.length;
  }

  function compactar(estado) {
    var base = inicioAbierto(estado);
    var copia = JSON.parse(JSON.stringify(estado));
    var cola = copia.partidos.slice(base);
    copia.partidos = [];
    return { base: base, cola: cola, resto: copia };
  }

  function expandir(paso, vigente) {
    var estado = paso.resto;
    estado.partidos = vigente.partidos.slice(0, paso.base).concat(paso.cola);
    return estado;
  }

  // `sinDeshacer`: para cambios efímeros (el acumulado de la entrada en curso),
  // que no deben ocupar un paso de la pila.
  D.guardar = function (estado, sinDeshacer) {
    if (!sinDeshacer) {
      var pila = leer(CLAVE_DESHACER) || [];
      pila.push(compactar(leer(CLAVE)));
      if (pila.length > MAX_DESHACER) { pila.shift(); }
      escribir(CLAVE_DESHACER, pila);
    }
    escribir(CLAVE, estado);
  };

  D.puedeDeshacer = function () {
    var pila = leer(CLAVE_DESHACER);
    return !!pila && pila.length > 0;
  };

  D.deshacer = function () {
    var pila = leer(CLAVE_DESHACER) || [];
    var paso = pila.pop();
    if (!paso) { return null; }
    var previo = expandir(paso, leer(CLAVE));
    if (!D.valido(previo)) { return null; }
    escribir(CLAVE_DESHACER, pila);
    escribir(CLAVE, previo);
    return previo;
  };

  D.exportar = function (estado) {
    return JSON.stringify(estado);
  };

  // Importar reemplaza todo y no se deshace (la app pide confirmación antes):
  // la pila compacta sólo sabe revertir la noche abierta.
  D.importar = function (texto) {
    var estado;
    try { estado = JSON.parse(texto); } catch (e) { return null; }
    if (!D.valido(estado)) { return null; }
    escribir(CLAVE, estado);
    escribir(CLAVE_DESHACER, []);
    return estado;
  };

  C.datos = D;
})(this);
