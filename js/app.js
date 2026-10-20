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
  // `tecleando`: el siguiente dígito del teclado se agrega en vez de reemplazar.
  // `conTV`: la app nativa avisa si hay una pantalla externa; en Safari nunca la hay.
  // `remotos`: cuántos iPhones están conectados como control remoto.
  var ui = { vista: 'inicio', borrador: null, filtro: { modalidad: 'rosario', formato: 'ronda3' }, tecleando: false,
    conTV: false, remotos: 0 };

  // Canal hacia la app nativa del iPad mini; no existe en Safari.
  function nativo(canal) {
    var m = raiz.webkit && raiz.webkit.messageHandlers;
    return m && m[canal] ? m[canal] : null;
  }

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

  function bola(color) { return '<span class="bola ' + color + '"></span>'; }

  // 'blanca', 'amarilla' o null en partidos anteriores a las bolas.
  function colorDe(p, j) {
    return p.blanca ? (p.blanca === j ? 'blanca' : 'amarilla') : null;
  }

  function conBola(p, j) {
    var color = colorDe(p, j);
    return nombre(j) + (color ? ' (' + color + ')' : '');
  }

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
    var hechos = partidosDe(noche).filter(function (x) { return !!x.ganador; });
    var p = {
      id: D.id('p'), nocheId: noche.id, fecha: Date.now(), formato: noche.formato,
      modalidad: noche.config.modalidad, limite: noche.config.limite, registro: noche.config.registro,
      jugadores: sig.jugadores, descansa: sig.descansa, salida: null, entradas: [], ganador: null,
      blanca: L.bolaBlanca(hechos[hechos.length - 1] || null, sig.jugadores, noche.blanca)
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
      (nativo('controlRemoto') ? boton('controlRemoto', 'Control desde el iPhone') : '') +
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

  // Los que abren la noche: los dos primeros del tiro a la banda, o la pareja.
  function parejaInicial(b) {
    if (b.formato === 'ronda3') { return b.orden.length >= 2 ? b.orden.slice(0, 2) : null; }
    return b.seleccion.length === 2 ? b.seleccion : null;
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

    var pareja = parejaInicial(b);
    if (pareja) {
      html += '<h2>¿Quién tira con la bola blanca?</h2><div class="opciones">' +
        pareja.map(function (id) {
          var color = b.blanca ? (b.blanca === id ? 'blanca' : 'amarilla') : null;
          return boton('elegirBlanca', (color ? bola(color) : '') + nombre(id),
            { valor: id, clase: 'opcion' + (b.blanca === id ? ' elegida' : '') });
        }).join('') + '</div>' +
        (b.formato === 'ronda3' ? '<p class="ayuda">Después, el que entra juega con la bola del que sale.</p>' : '');
    }

    html += formularioConfig(b.config);

    var listo = b.seleccion.length === cupo && (b.formato === 'dos' || b.orden.length === 3) &&
      !!pareja && pareja.indexOf(b.blanca) >= 0;
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

  // «Deshacer» va en la barra: en la pantalla del partido cada renglón de
  // altura es del marcador, que se lee desde la mesa en la TV.
  function encabezado(p) {
    return '<div class="barra">' + boton('ir', '‹ Menú', { valor: 'inicio' }) +
      '<h1>' + MODALIDADES[p.modalidad] + ' a ' + p.limite + '</h1>' +
      (p.descansa ? '<span class="descansa">Descansa: ' + nombre(p.descansa) + '</span>' : '') +
      (D.puedeDeshacer() ? boton('deshacer', '↶ Deshacer', { clase: 'secundario' }) : '') + '</div>';
  }

  // Mientras se anota, el número grande del tirador ya incluye lo de la
  // entrada, marcado como pendiente hasta que confirme.
  function panel(p, j, tirador, acumulado) {
    var activo = j === tirador;
    var pendiente = activo && acumulado > 0;
    var entradas = L.entradasDe(p, j);
    var puntos = L.puntos(p, j);
    var color = colorDe(p, j);
    return '<div class="panel' + (activo ? ' activo' : '') + '">' +
      '<div class="nombre">' + (color ? bola(color) : '') + nombre(j) +
      (activo ? '<span class="tira">TIRA</span>' : '') + '</div>' +
      '<div class="puntos' + (pendiente ? ' pendiente' : '') + '">' + (puntos + (pendiente ? acumulado : 0)) + '</div>' +
      '<div class="estado">' + (activo ? avisoRosario(p, j, acumulado) : '') + '</div>' +
      '<div class="detalle">' + (pendiente
        ? '<span class="por-confirmar">+' + acumulado + ' por confirmar</span>'
        : plural(entradas, 'entrada', 'entradas') +
          ' · promedio ' + (entradas ? (puntos / entradas).toFixed(2) : '0.00') +
          ' · serie mayor ' + L.serieMayor(p, j)) + '</div></div>';
  }

  // El aviso sigue al número del marcador grande, pendiente incluido, en los
  // dos modos: también en «total» se cuenta con +1 mientras se tira.
  function avisoRosario(p, tirador, acumulado) {
    if (p.modalidad !== 'rosario') { return ''; }
    var r = L.rosario(L.puntos(p, tirador) + acumulado);
    if (r.tresBandas) {
      return '<div class="rosario tres">TRES BANDAS<span>la ' + r.numero + '.ª</span></div>';
    }
    return '<div class="rosario">' + (acumulado > 0 || p.registro === 'unoxuno' ? 'Siguiente: libre' : 'La entrada empieza con libres') +
      ' · ' + plural(r.libresAntes, 'libre', 'libres') + ' antes de la de tres bandas</div>';
  }

  function teclado(acumulado, maximo) {
    function tecla(d, clase) {
      return boton('digito', String(d), { valor: d, clase: clase || '',
        desactivado: L.teclear(acumulado, d, ui.tecleando, maximo) === null });
    }
    var html = '';
    for (var d = 1; d <= 9; d++) { html += tecla(d); }
    return '<div class="teclado">' + html + tecla(0, 'cero') +
      boton('borrar', '⌫', { desactivado: acumulado === 0 }) + '</div>';
  }

  // Las piezas del partido las comparten el iPad y el control remoto del iPhone.
  function quienSale(p) {
    return '<h2 class="centro">¿Quién sale?</h2><div class="salida">' +
      p.jugadores.map(function (j) {
        var color = colorDe(p, j);
        return boton('salida', (color ? bola(color) : '') + nombre(j), { valor: j, clase: 'grande' });
      }).join('') + '</div>';
  }

  function juego(p) {
    var tirador = L.tirador(p);
    var contrario = L.otro(p, tirador);
    var acumulado = estado.actual.acumulado;
    var maximo = L.maximoEntrada(p, tirador);

    return '<div class="marcador">' + panel(p, p.jugadores[0], tirador, acumulado) +
      panel(p, p.jugadores[1], tirador, acumulado) + '</div>' +
      '<div class="entrada"><p class="quien">Entrada de <b>' + nombre(tirador) + '</b> · ' +
      (p.registro === 'unoxuno'
        ? nombre(contrario) + ' suma cada carambola; ' + nombre(tirador) + ' confirma al terminar.'
        : 'al terminar el tiro, anota el total de la entrada.') + '</p>' +
      '<div class="controles"><div class="izquierda"><div class="contador">' +
      boton('restar', '−1', { clase: 'menos', desactivado: acumulado === 0 }) +
      '<span class="acumulado">' + acumulado + '</span>' +
      boton('sumar', '+1', { clase: 'mas', desactivado: acumulado >= maximo }) + '</div>' +
      boton('confirmar', acumulado === 0
        ? nombre(tirador) + ' confirma: sin carambola'
        : nombre(tirador) + ' confirma: ' + plural(acumulado, 'carambola', 'carambolas'),
        { clase: 'grande primario' }) + '</div>' +
      teclado(acumulado, maximo) + '</div></div>';
  }

  vistas.partido = function () {
    var p = partidoActual();
    return encabezado(p) + (p.salida ? juego(p) : quienSale(p));
  };

  // --- Tablero de la TV ----------------------------------------------------------

  // Lo que ve la mesa en la pantalla externa. Sigue al partido en curso aunque
  // en el iPad se esté mirando otra pantalla (récords, estadísticas).
  function tablero() {
    var p = partidoActual();
    if (!p) { return '<div class="tv-espera">Carambola</div>'; }
    var html = '<div class="tv-titulo">' + MODALIDADES[p.modalidad] + ' a ' + p.limite +
      (p.descansa ? ' · descansa ' + nombre(p.descansa) : '') + '</div>';
    if (p.ganador) {
      var perdedor = L.otro(p, p.ganador);
      return html + '<div class="ganador">¡Gana ' + nombre(p.ganador) + '!</div>' +
        '<p class="centro resultado">' + L.puntos(p, p.ganador) + ' a ' + L.puntos(p, perdedor) + '</p>' +
        (p.avisos || []).map(function (a) {
          return '<div class="aviso ' + a.tipo + '">' + nombre(a.jugador) + ' ' +
            (a.rompe ? 'rompe' : 'iguala') + ' el ' + NOMBRE_RECORD[a.tipo] + ': ' +
            a.valor + ' ' + TEXTO_RECORD[a.tipo] + '</div>';
        }).join('');
    }
    if (!p.salida) {
      return html + '<div class="tv-salida">' + p.jugadores.map(function (j) {
        var color = colorDe(p, j);
        return '<div>' + (color ? bola(color) : '') + nombre(j) + '</div>';
      }).join('<span>contra</span>') + '</div>';
    }
    var tirador = L.tirador(p);
    var acumulado = estado.actual.acumulado;
    return html + '<div class="marcador">' + panel(p, p.jugadores[0], tirador, acumulado) +
      panel(p, p.jugadores[1], tirador, acumulado) + '</div>';
  }

  // --- Control remoto del iPhone ---------------------------------------------------

  // Desde el iPhone sólo se anota el partido. Preparar la noche, los jugadores y
  // el respaldo piden escribir o confirmar, y eso se hace en el iPad.
  var REMOTAS = { salida: true, sumar: true, restar: true, digito: true, borrar: true,
    confirmar: true, deshacer: true, siguientePartido: true };

  // El iPhone puede mandar un toque de una pantalla que ya cambió (otro tocó el
  // iPad en el medio): sólo se aplica si sigue teniendo sentido.
  function remotaValida(accion, valor) {
    var p = partidoActual();
    if (accion === 'deshacer') { return D.puedeDeshacer(); }
    if (!p) { return false; }
    if (accion === 'salida') { return !p.salida && p.jugadores.indexOf(valor) >= 0; }
    if (accion === 'siguientePartido') { return !!p.ganador; }
    if (accion === 'digito' && !/^[0-9]$/.test(valor)) { return false; }
    return !!p.salida && !p.ganador;
  }

  function remoto() {
    var p = partidoActual();
    if (!p) {
      return '<div class="remoto-espera"><h1>Carambola</h1>' +
        '<p class="ayuda">Empieza la noche en el iPad; aquí aparece el partido para anotarlo.</p></div>';
    }
    var html = '<div class="barra"><h1>' + MODALIDADES[p.modalidad] + ' a ' + p.limite + '</h1>' +
      (D.puedeDeshacer() ? boton('deshacer', '↶ Deshacer', { clase: 'secundario' }) : '') + '</div>';
    if (p.ganador) {
      return html + '<div class="ganador">¡Gana ' + nombre(p.ganador) + '!</div>' +
        '<p class="centro resultado">' + L.puntos(p, p.ganador) + ' a ' + L.puntos(p, L.otro(p, p.ganador)) + '</p>' +
        '<div class="pie">' + boton('siguientePartido',
          nocheActual().formato === 'ronda3' ? 'Empezar el siguiente partido' : 'Otro partido',
          { clase: 'grande primario' }) + '</div>';
    }
    return html + (p.salida ? juego(p) : quienSale(p));
  }

  var TEXTO_RECORD ={ racha: 'victorias seguidas', negro: 'derrotas seguidas', tiro: 'carambolas en una entrada' };
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
      var proximo = { jugadores: sig.jugadores, blanca: L.bolaBlanca(p, sig.jugadores, null) };
      html += '<p class="centro siguiente">Siguiente: ' + conBola(proximo, sig.jugadores[0]) + ' contra ' +
        conBola(proximo, sig.jugadores[1]) + ' · descansa ' + nombre(sig.descansa) + '</p>' +
        boton('siguientePartido', 'Empezar el siguiente partido', { clase: 'grande primario' });
    } else {
      html += boton('siguientePartido', 'Otro partido', { clase: 'grande primario' });
    }
    html += '<div class="opciones centro">' +
      boton('configurar', 'Cambiar modalidad o límite', { clase: 'opcion' }) +
      boton('terminarNoche', 'Terminar la noche', { clase: 'opcion' }) + '</div></div>';
    return html;
  };

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
      '<p class="ayuda">Si el correo sale cortado, copia el texto y pégalo en una nota o un correo. ' +
      'Si no se copia solo, queda seleccionado: toca «Copiar».</p>' +
      '<textarea id="exportar" rows="4" readonly>' + esc(datos) + '</textarea>' +
      boton('seleccionarRespaldo', 'Copiar el texto') +
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
    ui.borrador = { formato: formato, seleccion: [], orden: [], blanca: null, config: ultimaConfig() };
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
    b.blanca = null;
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

  acciones.reiniciarOrden = function () { ui.borrador.orden = []; ui.borrador.blanca = null; };

  acciones.elegirBlanca = function (id) { ui.borrador.blanca = id; };

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
      ordenBanda: b.formato === 'ronda3' ? b.orden.slice() : null, blanca: b.blanca,
      config: b.config, cerrada: false
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

  acciones.digito = function (valor) {
    var p = partidoActual();
    var n = L.teclear(estado.actual.acumulado, parseInt(valor, 10), ui.tecleando, L.maximoEntrada(p, L.tirador(p)));
    if (n === null) { return; }
    estado.actual.acumulado = n;
    ui.tecleando = true;
    guardar(true);
  };

  acciones.borrar = function () {
    estado.actual.acumulado = Math.floor(estado.actual.acumulado / 10);
    ui.tecleando = true;
    guardar(true);
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

  // La app nativa muestra el código QR para abrir el control en el iPhone.
  acciones.controlRemoto = function () {
    nativo('controlRemoto').postMessage('mostrar');
    return false;
  };

  acciones.filtroModalidad = function (valor) { ui.filtro.modalidad = valor; };
  acciones.filtroFormato = function (valor) { ui.filtro.formato = valor; };

  // iOS no muestra una selección hecha por código en un campo readonly, y
  // tampoco respeta select(): se quita readonly mientras se selecciona, con
  // el rango del documento y el del campo, y se restituye para que no salga
  // el teclado. Copiar directo funciona desde iOS 10; en iOS 9 queda el texto
  // seleccionado y basta tocar «Copiar».
  // Devuelve false para no redibujar y perder la selección.
  acciones.seleccionarRespaldo = function () {
    var campo = doc.getElementById('exportar');
    var rango = doc.createRange();
    var seleccion = raiz.getSelection();
    var copiado = false;
    campo.readOnly = false;
    campo.contentEditable = true;
    rango.selectNodeContents(campo);
    seleccion.removeAllRanges();
    seleccion.addRange(rango);
    campo.focus();
    campo.setSelectionRange(0, campo.value.length);
    campo.contentEditable = false;
    campo.readOnly = true;
    try { copiado = doc.execCommand('copy'); } catch (e) { copiado = false; }
    if (copiado) { raiz.alert('Respaldo copiado. Pégalo en una nota o un correo.'); }
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
    var tv = nativo('tablero');
    if (tv && ui.conTV) { tv.postMessage(tablero()); }
    var control = nativo('remoto');
    if (control && ui.remotos > 0) { control.postMessage(remoto()); }
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
    var accion = el.getAttribute('data-accion');
    // Cualquier otra acción (+1, −1, confirmar, deshacer…) cierra el tecleo:
    // el siguiente dígito vuelve a empezar el número.
    if (accion !== 'digito' && accion !== 'borrar') { ui.tecleando = false; }
    if (acciones[accion](el.getAttribute('data-valor')) !== false) { dibujar(); }
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

  C.app = {
    estado: function () { return estado; },
    // La llama la app nativa al conectar o desconectar la TV, también a media
    // entrada: con TV el marcador grande va allá y el iPad se queda con los controles.
    pantallaExterna: function (hay) {
      ui.conTV = !!hay;
      doc.body.className = ui.conTV ? 'con-tv' : '';
      dibujar();
    },
    // La app nativa avisa cuántos iPhones hay conectados; con cero no se les manda nada.
    remotos: function (n) {
      ui.remotos = n;
      dibujar();
    },
    // Un toque en el iPhone. Corre la misma acción que el botón del iPad.
    accionRemota: function (accion, valor) {
      if (REMOTAS[accion] === true && remotaValida(accion, valor)) {
        if (accion !== 'digito' && accion !== 'borrar') { ui.tecleando = false; }
        acciones[accion](valor);
      }
      dibujar();
    }
  };
})(this);
