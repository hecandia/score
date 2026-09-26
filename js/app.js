/* Interfaz: pantallas, eventos y flujo de la noche.
   ES5 estricto (Safari 9). Todo se redibuja desde el estado en cada acción. */
(function (raiz) {
  'use strict';

  var C = raiz.Carambola;
  var L = C.logica;
  var D = C.datos;
  var doc = raiz.document;

  var MODALIDADES = { rosario: 'Rosario', tresbandas: 'Tres bandas' };
  var FORMATOS = { ronda3: 'Ronda de tres', dos: 'Partido de dos' };
  var REGISTROS = { total: 'Total por entrada', unoxuno: 'Una por una' };
  var LIMITES = [20, 30, 50];
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
    'septiembre', 'octubre', 'noviembre', 'diciembre'];

  var estado = D.cargar();
  var ui = { vista: 'inicio', borrador: null, filtro: { modalidad: 'rosario', formato: 'ronda3' } };

  // --- Utilidades ------------------------------------------------------------

  function esc(texto) {
    return String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function buscar(lista, id) {
    for (var i = 0; i < lista.length; i++) { if (lista[i].id === id) { return lista[i]; } }
    return null;
  }

  function nombre(id) {
    var j = buscar(estado.jugadores, id);
    return j ? esc(j.nombre) : '—';
  }

  function fechaLarga(ms) {
    var d = new Date(ms);
    return DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()] + ' de ' + d.getFullYear();
  }

  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

  function boton(accion, texto, opciones) {
    opciones = opciones || {};
    return '<button class="' + (opciones.clase || '') + '"' +
      ' data-accion="' + accion + '"' +
      (opciones.valor !== undefined ? ' data-valor="' + esc(opciones.valor) + '"' : '') +
      (opciones.desactivado ? ' disabled' : '') + '>' + texto + '</button>';
  }

  function opciones(accion, catalogo, elegido) {
    return Object.keys(catalogo).map(function (k) {
      return boton(accion, catalogo[k], { valor: k, clase: 'opcion' + (k === elegido ? ' elegida' : '') });
    }).join('');
  }

  function guardar(sinDeshacer) {
    try {
      D.guardar(estado, sinDeshacer);
    } catch (e) {
      raiz.alert('No se pudo guardar en el iPad. Revisa que Safari no esté en navegación privada.');
    }
  }

  function nocheActual() {
    return estado.actual ? buscar(estado.noches, estado.actual.nocheId) : null;
  }

  function partidoActual() {
    return estado.actual ? buscar(estado.partidos, estado.actual.partidoId) : null;
  }

  function partidosDe(noche) {
    return estado.partidos.filter(function (p) { return p.nocheId === noche.id; });
  }

  function terminados(excepto) {
    return estado.partidos.filter(function (p) { return p.ganador && p !== excepto; });
  }

  function ultimaConfig() {
    var n = estado.noches[estado.noches.length - 1];
    return n ? JSON.parse(JSON.stringify(n.config)) : { modalidad: 'rosario', limite: 20, registro: 'total' };
  }

  // --- Flujo de la noche -------------------------------------------------------

  function crearPartido(noche) {
    var sig = noche.formato === 'ronda3'
      ? L.siguienteRonda3(noche, partidosDe(noche))
      : { jugadores: noche.jugadores.slice(), descansa: null };
    var p = {
      id: D.id('p'), nocheId: noche.id, fecha: Date.now(), formato: noche.formato,
      modalidad: noche.config.modalidad, limite: noche.config.limite, registro: noche.config.registro,
      jugadores: sig.jugadores, descansa: sig.descansa, salida: null, entradas: [], ganador: null
    };
    estado.partidos.push(p);
    estado.actual = { nocheId: noche.id, partidoId: p.id, acumulado: 0 };
  }

  function cerrarNoche() {
    var noche = nocheActual();
    if (noche) {
      noche.cerrada = true;
      var p = partidoActual();
      if (p && !p.ganador) { estado.partidos.splice(estado.partidos.indexOf(p), 1); }
    }
    estado.actual = null;
  }

  // Las pantallas del partido se derivan del estado, así sobreviven a una
  // recarga y a un deshacer.
  function vistaDeJuego() {
    var p = partidoActual();
    if (!p) { return 'inicio'; }
    return p.ganador ? 'finPartido' : 'partido';
  }

  // --- Pantallas ---------------------------------------------------------------

  var vistas = {};

  vistas.inicio = function () {
    var noche = nocheActual();
    var html = '<h1>Carambola</h1>';
    if (noche) {
      html += '<div class="tarjeta">' +
        '<p>Noche en curso: ' + FORMATOS[noche.formato].toLowerCase() + ' · ' +
        noche.jugadores.map(nombre).join(', ') + '</p>' +
        boton('continuar', 'Continuar la noche', { clase: 'grande primario' }) + '</div>';
    }
    html += '<div class="menu">' +
      boton('nuevaNoche', 'Nueva noche: ronda de tres', { valor: 'ronda3', clase: 'grande' }) +
      boton('nuevaNoche', 'Nueva noche: partido de dos', { valor: 'dos', clase: 'grande' }) +
      boton('ir', 'Récords', { valor: 'records', clase: 'grande' }) +
      boton('ir', 'Estadísticas', { valor: 'estadisticas', clase: 'grande' }) +
      boton('ir', 'Jugadores', { valor: 'jugadores' }) +
      boton('ir', 'Respaldo', { valor: 'respaldo' }) +
      '</div>';
    return html;
  };

  function formularioConfig(config) {
    var limite = LIMITES.map(function (n) {
      return boton('limite', String(n), { valor: n, clase: 'opcion' + (config.limite === n ? ' elegida' : '') });
    }).join('');
    var otro = LIMITES.indexOf(config.limite) < 0;
    limite += boton('limite', otro ? 'Otro: ' + config.limite : 'Otro…',
      { valor: 'otro', clase: 'opcion' + (otro ? ' elegida' : '') });
    return '<h2>Modalidad</h2><div class="opciones">' + opciones('modalidad', MODALIDADES, config.modalidad) + '</div>' +
      '<h2>A cuántas carambolas</h2><div class="opciones">' + limite + '</div>' +
      '<h2>Cómo se anota cada entrada</h2><div class="opciones">' + opciones('registro', REGISTROS, config.registro) + '</div>' +
      '<p class="ayuda">' + (config.registro === 'unoxuno'
        ? 'El contrario suma cada carambola al momento; el que tira confirma al terminar su entrada.'
        : 'Al terminar cada entrada se anota el total de carambolas.') + '</p>';
  }

  vistas.nuevaNoche = function () {
    var b = ui.borrador;
    var cupo = b.formato === 'ronda3' ? 3 : 2;
    var html = '<div class="barra">' + boton('ir', '‹ Inicio', { valor: 'inicio' }) +
      '<h1>' + FORMATOS[b.formato] + '</h1></div>';

    html += '<h2>Jugadores (elige ' + cupo + ')</h2><div class="opciones">' +
      estado.jugadores.map(function (j) {
        return boton('elegirJugador', esc(j.nombre),
          { valor: j.id, clase: 'opcion' + (b.seleccion.indexOf(j.id) >= 0 ? ' elegida' : '') });
      }).join('') + '</div>' +
      '<div class="agregar"><input id="nuevoJugador" type="text" placeholder="Nombre de un jugador nuevo" autocapitalize="words">' +
      boton('agregarJugador', 'Agregar') + '</div>';

    if (b.formato === 'ronda3' && b.seleccion.length === 3) {
      html += '<h2>Orden del tiro a la banda</h2>' +
        '<p class="ayuda">Toca a los jugadores del más cerca al más lejos. Los dos primeros abren; el tercero descansa.</p>' +
        '<div class="opciones">' + b.seleccion.map(function (id) {
          var pos = b.orden.indexOf(id);
          return boton('ordenBanda', (pos >= 0 ? (pos + 1) + '.º · ' : '') + nombre(id),
            { valor: id, clase: 'opcion' + (pos >= 0 ? ' elegida' : '') });
        }).join('') + boton('reiniciarOrden', 'Reiniciar orden', { clase: 'opcion secundario' }) + '</div>';
    }

    html += formularioConfig(b.config);

    var listo = b.seleccion.length === cupo && (b.formato === 'dos' || b.orden.length === 3);
    html += '<div class="pie">' + boton('empezarNoche', 'Empezar', { clase: 'grande primario', desactivado: !listo }) + '</div>';
    return html;
  };

  vistas.configurar = function () {
    return '<div class="barra">' + boton('ir', '‹ Volver', { valor: 'finPartido' }) +
      '<h1>Cambiar configuración</h1></div>' +
      '<p class="ayuda">Aplica a los siguientes partidos de esta noche.</p>' +
      formularioConfig(ui.borrador.config) +
      '<div class="pie">' + boton('guardarConfig', 'Guardar', { clase: 'grande primario' }) + '</div>';
  };

  function encabezado(p) {
    return '<div class="barra">' + boton('ir', '‹ Menú', { valor: 'inicio' }) +
      '<h1>' + MODALIDADES[p.modalidad] + ' a ' + p.limite + '</h1>' +
      (p.descansa ? '<span class="descansa">Descansa: ' + nombre(p.descansa) + '</span>' : '') + '</div>';
  }

  function panel(p, j, activo) {
    var entradas = L.entradasDe(p, j);
    var puntos = L.puntos(p, j);
    return '<div class="panel' + (activo ? ' activo' : '') + '">' +
      '<div class="nombre">' + nombre(j) + '</div>' +
      '<div class="puntos">' + puntos + '</div>' +
      '<div class="detalle">' + plural(entradas, 'entrada', 'entradas') +
      ' · promedio ' + (entradas ? (puntos / entradas).toFixed(2) : '0.00') +
      ' · serie mayor ' + L.serieMayor(p, j) + '</div></div>';
  }

  function avisoRosario(p, tirador, acumulado) {
    if (p.modalidad !== 'rosario') { return ''; }
    var enVivo = p.registro === 'unoxuno';
    var r = L.rosario(L.puntos(p, tirador) + (enVivo ? acumulado : 0));
    if (r.tresBandas) {
      return '<div class="rosario tres">La ' + r.numero + '.ª tiene que ser de TRES BANDAS</div>';
    }
    return '<div class="rosario">' + (enVivo ? 'Siguiente: libre' : 'Esta entrada empieza con libres') +
      ' · ' + plural(r.libresAntes, 'libre', 'libres') + ' antes de la de tres bandas</div>';
  }

  vistas.partido = function () {
    var p = partidoActual();
    var html = encabezado(p);
    if (!p.salida) {
      return html + '<h2 class="centro">¿Quién sale?</h2><div class="salida">' +
        p.jugadores.map(function (j) { return boton('salida', nombre(j), { valor: j, clase: 'grande' }); }).join('') +
        '</div>' + pieDeshacer();
    }
    var tirador = L.tirador(p);
    var contrario = L.otro(p, tirador);
    var acumulado = estado.actual.acumulado;
    var maximo = L.maximoEntrada(p, tirador);

    html += '<div class="marcador">' + panel(p, p.jugadores[0], tirador === p.jugadores[0]) +
      panel(p, p.jugadores[1], tirador === p.jugadores[1]) + '</div>';

    html += '<div class="entrada"><h2>Entrada de ' + nombre(tirador) + '</h2>' +
      avisoRosario(p, tirador, acumulado) +
      '<p class="ayuda">' + (p.registro === 'unoxuno'
        ? nombre(contrario) + ' suma cada carambola; ' + nombre(tirador) + ' confirma al terminar.'
        : 'Al terminar el tiro, anota el total de la entrada.') + '</p>' +
      '<div class="contador">' +
      boton('restar', '−1', { clase: 'menos', desactivado: acumulado === 0 }) +
      '<span class="acumulado">' + acumulado + '</span>' +
      boton('sumar', '+1', { clase: 'mas', desactivado: acumulado >= maximo }) + '</div>' +
      boton('confirmar', acumulado === 0
        ? nombre(tirador) + ' confirma: sin carambola'
        : nombre(tirador) + ' confirma: ' + plural(acumulado, 'carambola', 'carambolas'),
        { clase: 'grande primario' }) + '</div>';
    return html + pieDeshacer();
  };

  var TEXTO_RECORD = { racha: 'victorias seguidas', negro: 'derrotas seguidas', tiro: 'carambolas en una entrada' };
  var NOMBRE_RECORD = { racha: 'racha de victorias', negro: 'récord negro', tiro: 'tiro más largo' };

  vistas.finPartido = function () {
    var p = partidoActual();
    var noche = nocheActual();
    var perdedor = L.otro(p, p.ganador);
    var html = encabezado(p) + '<div class="ganador">¡Gana ' + nombre(p.ganador) + '!</div>' +
      '<p class="centro resultado">' + L.puntos(p, p.ganador) + ' a ' + L.puntos(p, perdedor) +
      ' en ' + plural(Math.ceil(p.entradas.length / 2), 'entrada', 'entradas') + '</p>';

    (p.avisos || []).forEach(function (a) {
      html += '<div class="aviso ' + a.tipo + '">' + nombre(a.jugador) + ' ' +
        (a.rompe ? 'rompe' : 'iguala') + ' el ' + NOMBRE_RECORD[a.tipo] + ': ' +
        a.valor + ' ' + TEXTO_RECORD[a.tipo] + '</div>';
    });

    var tabla = L.records(terminados(), estado.recordsIniciales)[L.clave(p.modalidad, p.formato)];
    html += '<p class="centro">' + p.jugadores.map(function (j) {
      var a = tabla.actuales[j];
      return nombre(j) + ' lleva ' + (a.victorias
        ? plural(a.victorias, 'victoria seguida', 'victorias seguidas')
        : plural(a.derrotas, 'derrota seguida', 'derrotas seguidas'));
    }).join(' · ') + '</p>';

    html += '<div class="pie">';
    if (noche.formato === 'ronda3') {
      var sig = L.siguienteRonda3(noche, partidosDe(noche));
      html += '<p class="centro siguiente">Siguiente: ' + nombre(sig.jugadores[0]) + ' contra ' +
        nombre(sig.jugadores[1]) + ' · descansa ' + nombre(sig.descansa) + '</p>' +
        boton('siguientePartido', 'Empezar el siguiente partido', { clase: 'grande primario' });
    } else {
      html += boton('siguientePartido', 'Otro partido', { clase: 'grande primario' });
    }
    html += '<div class="opciones centro">' +
      boton('configurar', 'Cambiar modalidad o límite', { clase: 'opcion' }) +
      boton('terminarNoche', 'Terminar la noche', { clase: 'opcion' }) + '</div></div>';
    return html + pieDeshacer();
  };

  function pieDeshacer() {
    return D.puedeDeshacer()
      ? '<div class="deshacer">' + boton('deshacer', '↶ Deshacer lo último', { clase: 'secundario' }) + '</div>'
      : '';
  }

  vistas.records = function () {
    var tablas = L.records(terminados(), estado.recordsIniciales);
    var html = '<div class="barra">' + boton('ir', '‹ Inicio', { valor: 'inicio' }) + '<h1>Récords</h1></div>';
    html += '<div class="rejilla">';
    L.TABLAS.forEach(function (t) {
      var r = tablas[L.clave(t.modalidad, t.formato)];
      function fila(tipo, titulo) {
        var x = r[tipo];
        return '<tr class="' + tipo + '"><td>' + titulo + '</td><td class="valor">' + (x ? x.valor : '—') +
          '</td><td>' + (x ? nombre(x.jugador) : '') + '</td></tr>';
      }
      var rachas = Object.keys(r.actuales).filter(function (j) {
        return r.actuales[j].victorias || r.actuales[j].derrotas;
      }).map(function (j) {
        var a = r.actuales[j];
        return nombre(j) + ': ' + (a.victorias ? a.victorias + ' ganados' : a.derrotas + ' perdidos');
      });
      html += '<div class="tarjeta"><h2>' + MODALIDADES[t.modalidad] + ' · ' + FORMATOS[t.formato].toLowerCase() + '</h2>' +
        '<table>' + fila('racha', 'Racha de victorias') + fila('tiro', 'Tiro más largo') +
        fila('negro', 'Récord negro') + '</table>' +
        (rachas.length ? '<p class="ayuda">Rachas actuales: ' + rachas.join(' · ') + '</p>' : '') + '</div>';
    });
    return html + '</div>';
  };

  vistas.estadisticas = function () {
    var f = ui.filtro;
    var s = L.estadisticas(estado.partidos, f, Date.now());
    var html = '<div class="barra">' + boton('ir', '‹ Inicio', { valor: 'inicio' }) + '<h1>Estadísticas</h1></div>' +
      '<div class="opciones">' + opciones('filtroModalidad', MODALIDADES, f.modalidad) + '</div>' +
      '<div class="opciones">' + opciones('filtroFormato', FORMATOS, f.formato) + '</div>';

    var ids = Object.keys(s.porJugador);
    if (!ids.length) {
      return html + '<p class="ayuda">Todavía no hay partidos terminados en esta combinación.</p>';
    }
    ids.sort(function (a, b) { return s.porJugador[b].ganados - s.porJugador[a].ganados; });
    html += '<table class="estadisticas"><tr><th>Jugador</th><th>Ganados esta semana</th>' +
      '<th>Ganados en total</th><th>Promedio por entrada</th><th>Serie mayor</th></tr>' +
      ids.map(function (j) {
        var x = s.porJugador[j];
        return '<tr><td>' + nombre(j) + '</td><td>' + x.ganadosSemana + ' de ' + x.jugadosSemana + '</td>' +
          '<td>' + x.ganados + ' de ' + x.jugados + '</td><td>' + x.promedio.toFixed(2) + '</td>' +
          '<td>' + x.serie + '</td></tr>';
      }).join('') + '</table>';

    html += '<h2>Historial</h2>';
    var porNoche = [];
    var indice = {};
    s.partidos.forEach(function (p) {
      if (!(p.nocheId in indice)) { indice[p.nocheId] = porNoche.length; porNoche.push({ fecha: p.fecha, partidos: [] }); }
      porNoche[indice[p.nocheId]].partidos.push(p);
    });
    porNoche.reverse().forEach(function (n) {
      html += '<div class="tarjeta"><h3>' + fechaLarga(n.fecha) + '</h3><ol>' +
        n.partidos.map(function (p) {
          var a = p.jugadores[0], b = p.jugadores[1];
          return '<li>' + nombre(a) + ' ' + L.puntos(p, a) + ' – ' + L.puntos(p, b) + ' ' + nombre(b) +
            ' · gana ' + nombre(p.ganador) + '</li>';
        }).join('') + '</ol></div>';
    });
    return html;
  };

  vistas.jugadores = function () {
    return '<div class="barra">' + boton('ir', '‹ Inicio', { valor: 'inicio' }) + '<h1>Jugadores</h1></div>' +
      '<table>' + estado.jugadores.map(function (j) {
        return '<tr><td>' + esc(j.nombre) + '</td><td>' +
          boton('renombrar', 'Cambiar nombre', { valor: j.id, clase: 'secundario' }) + '</td></tr>';
      }).join('') + '</table>' +
      '<div class="agregar"><input id="nuevoJugador" type="text" placeholder="Nombre de un jugador nuevo" autocapitalize="words">' +
      boton('agregarJugador', 'Agregar') + '</div>';
  };

  vistas.respaldo = function () {
    var datos = D.exportar(estado);
    return '<div class="barra">' + boton('ir', '‹ Inicio', { valor: 'inicio' }) + '<h1>Respaldo</h1></div>' +
      '<p class="ayuda">Los datos viven sólo en este iPad. Envíate una copia de vez en cuando: ' +
      'si se borran los datos de Safari, con ella se recupera todo.</p>' +
      '<a class="boton grande primario" href="mailto:?subject=' + encodeURIComponent('Respaldo carambola ' + fechaLarga(Date.now())) +
      '&body=' + encodeURIComponent(datos) + '">Enviar copia por correo</a>' +
      '<p class="ayuda">Si el correo sale cortado, selecciona el texto, cópialo y pégalo en una nota o un correo:</p>' +
      '<textarea id="exportar" rows="4" readonly>' + esc(datos) + '</textarea>' +
      boton('seleccionarRespaldo', 'Seleccionar el texto') +
      '<h2>Restaurar una copia</h2>' +
      '<p class="ayuda">Pega el texto completo de un respaldo. Reemplaza todo lo que hay en el iPad.</p>' +
      '<textarea id="importar" rows="6"></textarea>' +
      boton('importar', 'Restaurar', { clase: 'grande' });
  };

  // --- Acciones ----------------------------------------------------------------

  var acciones = {};

  acciones.ir = function (vista) {
    ui.vista = vista === 'finPartido' ? vistaDeJuego() : vista;
  };

  acciones.continuar = function () { ui.vista = vistaDeJuego(); };

  acciones.nuevaNoche = function (formato) {
    if (nocheActual() && !raiz.confirm('Hay una noche en curso. ¿Terminarla y empezar otra?')) { return; }
    ui.borrador = { formato: formato, seleccion: [], orden: [], config: ultimaConfig() };
    ui.vista = 'nuevaNoche';
  };

  acciones.elegirJugador = function (id) {
    var b = ui.borrador;
    var cupo = b.formato === 'ronda3' ? 3 : 2;
    var i = b.seleccion.indexOf(id);
    if (i >= 0) {
      b.seleccion.splice(i, 1);
    } else if (b.seleccion.length < cupo) {
      b.seleccion.push(id);
    }
    b.orden = [];
  };

  acciones.agregarJugador = function () {
    var campo = doc.getElementById('nuevoJugador');
    var texto = campo.value.replace(/^\s+|\s+$/g, '');
    if (!texto) { return; }
    var repetido = estado.jugadores.filter(function (j) {
      return j.nombre.toLowerCase() === texto.toLowerCase();
    }).length;
    if (repetido) { raiz.alert('Ya hay un jugador con ese nombre.'); return; }
    var j = { id: D.id('j'), nombre: texto };
    estado.jugadores.push(j);
    guardar();
    var b = ui.borrador;
    if (ui.vista === 'nuevaNoche' && b.seleccion.length < (b.formato === 'ronda3' ? 3 : 2)) {
      b.seleccion.push(j.id);
      b.orden = [];
    }
  };

  acciones.renombrar = function (id) {
    var j = buscar(estado.jugadores, id);
    var texto = raiz.prompt('Nuevo nombre', j.nombre);
    if (texto && texto.replace(/\s/g, '')) {
      j.nombre = texto.replace(/^\s+|\s+$/g, '');
      guardar();
    }
  };

  acciones.ordenBanda = function (id) {
    var orden = ui.borrador.orden;
    if (orden.indexOf(id) < 0) { orden.push(id); }
  };

  acciones.reiniciarOrden = function () { ui.borrador.orden = []; };

  acciones.modalidad = function (valor) { ui.borrador.config.modalidad = valor; };
  acciones.registro = function (valor) { ui.borrador.config.registro = valor; };

  acciones.limite = function (valor) {
    if (valor !== 'otro') { ui.borrador.config.limite = parseInt(valor, 10); return; }
    var n = parseInt(raiz.prompt('¿A cuántas carambolas?', ui.borrador.config.limite), 10);
    if (n > 0) { ui.borrador.config.limite = n; }
  };

  acciones.empezarNoche = function () {
    var b = ui.borrador;
    if (nocheActual()) { cerrarNoche(); }
    var noche = {
      id: D.id('n'), fecha: Date.now(), formato: b.formato, jugadores: b.seleccion.slice(),
      ordenBanda: b.formato === 'ronda3' ? b.orden.slice() : null, config: b.config, cerrada: false
    };
    estado.noches.push(noche);
    crearPartido(noche);
    guardar();
    ui.vista = 'partido';
  };

  acciones.salida = function (id) {
    partidoActual().salida = id;
    guardar();
  };

  acciones.sumar = function () {
    var p = partidoActual();
    if (estado.actual.acumulado < L.maximoEntrada(p, L.tirador(p))) {
      estado.actual.acumulado++;
      guardar(true);
    }
  };

  acciones.restar = function () {
    if (estado.actual.acumulado > 0) {
      estado.actual.acumulado--;
      guardar(true);
    }
  };

  acciones.confirmar = function () {
    var p = partidoActual();
    var antes = L.records(terminados(p), estado.recordsIniciales);
    L.anotar(p, estado.actual.acumulado);
    estado.actual.acumulado = 0;
    if (p.ganador) {
      p.avisos = L.avisos(antes, L.records(terminados(), estado.recordsIniciales), p);
    }
    guardar();
    ui.vista = vistaDeJuego();
  };

  acciones.siguientePartido = function () {
    crearPartido(nocheActual());
    guardar();
    ui.vista = 'partido';
  };

  acciones.configurar = function () {
    ui.borrador = { config: JSON.parse(JSON.stringify(nocheActual().config)) };
    ui.vista = 'configurar';
  };

  acciones.guardarConfig = function () {
    nocheActual().config = ui.borrador.config;
    guardar();
    ui.vista = vistaDeJuego();
  };

  acciones.terminarNoche = function () {
    if (!raiz.confirm('¿Terminar la noche? La ronda empieza de cero la próxima vez; las rachas se conservan.')) { return; }
    cerrarNoche();
    guardar();
    ui.vista = 'inicio';
  };

  acciones.deshacer = function () {
    var previo = D.deshacer();
    if (previo) { estado = previo; }
    ui.vista = vistaDeJuego();
  };

  acciones.filtroModalidad = function (valor) { ui.filtro.modalidad = valor; };
  acciones.filtroFormato = function (valor) { ui.filtro.formato = valor; };

  // iOS 9 no respeta select() en un textarea; hace falta el rango explícito.
  // Devuelve false para no redibujar y perder la selección.
  acciones.seleccionarRespaldo = function () {
    var campo = doc.getElementById('exportar');
    campo.focus();
    campo.setSelectionRange(0, campo.value.length);
    return false;
  };

  acciones.importar = function () {
    var texto = doc.getElementById('importar').value;
    if (!texto) { return; }
    if (!raiz.confirm('Esto reemplaza todos los datos del iPad por los del respaldo. ¿Continuar?')) { return; }
    var nuevo = D.importar(texto);
    if (!nuevo) { raiz.alert('El texto no es un respaldo válido.'); return; }
    estado = nuevo;
    raiz.alert('Respaldo restaurado.');
    ui.vista = 'inicio';
  };

  // --- Arranque ----------------------------------------------------------------

  function dibujar() {
    doc.getElementById('app').innerHTML = vistas[ui.vista]();
  }

  function destinoAccion(nodo) {
    while (nodo && nodo !== doc) {
      if (nodo.getAttribute && nodo.getAttribute('data-accion')) { return nodo; }
      nodo = nodo.parentNode;
    }
    return null;
  }

  doc.addEventListener('click', function (ev) {
    var el = destinoAccion(ev.target);
    if (!el || el.disabled) { return; }
    if (acciones[el.getAttribute('data-accion')](el.getAttribute('data-valor')) !== false) { dibujar(); }
  }, false);

  // Versión nueva descargada por AppCache: se aplica al tocar el aviso.
  if (raiz.applicationCache) {
    raiz.applicationCache.addEventListener('updateready', function () {
      var aviso = doc.getElementById('actualizacion');
      aviso.style.display = 'block';
      aviso.onclick = function () { raiz.location.reload(); };
    }, false);
  }

  ui.vista = vistaDeJuego();
  dibujar();

  C.app = { estado: function () { return estado; } };
})(this);
