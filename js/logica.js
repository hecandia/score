/* Reglas del juego: rotación, rosario, récords y estadísticas.
   Sin DOM ni localStorage, para poder probarlas fuera del navegador.
   ES5 estricto: el iPad corre Safari 9 (iOS 9.3.6). */
(function (raiz) {
  'use strict';

  var C = raiz.Carambola = raiz.Carambola || {};
  var L = {};

  // --- Partido -------------------------------------------------------------

  L.otro = function (partido, jugador) {
    return partido.jugadores[0] === jugador ? partido.jugadores[1] : partido.jugadores[0];
  };

  L.puntos = function (partido, jugador) {
    var total = 0;
    partido.entradas.forEach(function (e) {
      if (e.jugador === jugador) { total += e.carambolas; }
    });
    return total;
  };

  L.entradasDe = function (partido, jugador) {
    return partido.entradas.filter(function (e) { return e.jugador === jugador; }).length;
  };

  L.serieMayor = function (partido, jugador) {
    var mayor = 0;
    partido.entradas.forEach(function (e) {
      if (e.jugador === jugador && e.carambolas > mayor) { mayor = e.carambolas; }
    });
    return mayor;
  };

  // Las entradas alternan a partir de quien sale.
  L.tirador = function (partido) {
    if (!partido.salida || partido.ganador) { return null; }
    return partido.entradas.length % 2 === 0 ? partido.salida : L.otro(partido, partido.salida);
  };

  // Una entrada no puede pasar del límite del partido.
  L.maximoEntrada = function (partido, jugador) {
    return Math.max(0, partido.limite - L.puntos(partido, jugador));
  };

  // Rosario: la carambola 10.ª, 20.ª, 30.ª… de cada jugador tiene que ser de tres bandas.
  // La cuenta es acumulativa entre entradas: sólo depende del total que ya lleva.
  L.rosario = function (total) {
    var resto = total % 10;
    return { numero: total + 1, tresBandas: resto === 9, libresAntes: 9 - resto };
  };

  // Asienta la entrada del tirador y declara ganador si alcanzó el límite.
  L.anotar = function (partido, carambolas) {
    var jugador = L.tirador(partido);
    partido.entradas.push({ jugador: jugador, carambolas: carambolas });
    if (L.puntos(partido, jugador) >= partido.limite) { partido.ganador = jugador; }
    return jugador;
  };

  // --- Rotación de la ronda de tres ----------------------------------------
  // El ganador juega contra el que espera; tras dos partidos seguidos descansa,
  // gane o pierda. El primer partido lo define el tiro a la banda.

  L.siguienteRonda3 = function (noche, partidosNoche) {
    var hechos = partidosNoche.filter(function (p) { return !!p.ganador; });
    var orden = noche.ordenBanda;
    if (!hechos.length) {
      return { jugadores: [orden[0], orden[1]], descansa: orden[2] };
    }
    var ultimo = hechos[hechos.length - 1];
    var ganador = ultimo.ganador;
    var perdedor = L.otro(ultimo, ganador);
    var espera = noche.jugadores.filter(function (j) {
      return ultimo.jugadores.indexOf(j) < 0;
    })[0];
    var seguidos = 0;
    for (var i = hechos.length - 1; i >= 0 && hechos[i].jugadores.indexOf(ganador) >= 0; i--) {
      seguidos++;
    }
    var sigue = seguidos >= 2 ? perdedor : ganador;
    return { jugadores: [sigue, espera], descansa: sigue === ganador ? perdedor : ganador };
  };

  // --- Récords -------------------------------------------------------------
  // Una tabla por modalidad y formato. Racha y récord negro cuentan sólo los
  // partidos de cada jugador (descansar no corta) y siguen de una noche a otra.

  L.clave = function (modalidad, formato) { return modalidad + '|' + formato; };

  L.TABLAS = [
    { modalidad: 'rosario', formato: 'ronda3' },
    { modalidad: 'tresbandas', formato: 'ronda3' },
    { modalidad: 'rosario', formato: 'dos' },
    { modalidad: 'tresbandas', formato: 'dos' }
  ];

  // Ante un empate conserva al primero que lo logró.
  function mejor(actual, candidato) {
    return (!actual || candidato.valor > actual.valor) ? candidato : actual;
  }

  L.records = function (partidos, iniciales) {
    var tablas = {};
    function tabla(clave) {
      if (!tablas[clave]) { tablas[clave] = { racha: null, negro: null, tiro: null, actuales: {} }; }
      return tablas[clave];
    }
    L.TABLAS.forEach(function (t) { tabla(L.clave(t.modalidad, t.formato)); });

    (iniciales || []).forEach(function (r) {
      var t = tabla(L.clave(r.modalidad, r.formato));
      t[r.tipo] = mejor(t[r.tipo], { valor: r.valor, jugador: r.jugador, inicial: true });
    });

    partidos.forEach(function (p) {
      if (!p.ganador) { return; }
      var t = tabla(L.clave(p.modalidad, p.formato));
      p.jugadores.forEach(function (j) {
        var a = t.actuales[j] || (t.actuales[j] = { victorias: 0, derrotas: 0 });
        if (p.ganador === j) {
          a.victorias++;
          a.derrotas = 0;
          t.racha = mejor(t.racha, { valor: a.victorias, jugador: j, fecha: p.fecha });
        } else {
          a.derrotas++;
          a.victorias = 0;
          t.negro = mejor(t.negro, { valor: a.derrotas, jugador: j, fecha: p.fecha });
        }
      });
      p.entradas.forEach(function (e) {
        if (e.carambolas > 0) {
          t.tiro = mejor(t.tiro, { valor: e.carambolas, jugador: e.jugador, fecha: p.fecha });
        }
      });
    });
    return tablas;
  };

  // Compara los récords de antes y después de un partido recién terminado.
  // Sólo avisa contra un récord existente: una tabla vacía no se «rompe».
  L.avisos = function (antes, despues, partido) {
    var clave = L.clave(partido.modalidad, partido.formato);
    var previo = antes[clave];
    var actual = despues[clave];
    var avisos = [];

    function comparar(tipo, jugador, valor) {
      var r = previo[tipo];
      if (!r || valor < r.valor) { return; }
      avisos.push({ tipo: tipo, jugador: jugador, valor: valor, rompe: valor > r.valor });
    }

    var ganador = partido.ganador;
    var perdedor = L.otro(partido, ganador);
    comparar('racha', ganador, actual.actuales[ganador].victorias);
    comparar('negro', perdedor, actual.actuales[perdedor].derrotas);
    partido.jugadores.forEach(function (j) {
      var serie = L.serieMayor(partido, j);
      if (serie > 0) { comparar('tiro', j, serie); }
    });
    return avisos;
  };

  // --- Estadísticas --------------------------------------------------------

  // Lunes 00:00 hora local de la semana de `fecha` (ms).
  L.inicioSemana = function (fecha) {
    var d = new Date(fecha);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (d.getDay() + 6) % 7);
    return d.getTime();
  };

  L.estadisticas = function (partidos, filtro, ahora) {
    var desde = L.inicioSemana(ahora);
    var porJugador = {};
    var elegidos = partidos.filter(function (p) {
      return p.ganador && p.modalidad === filtro.modalidad && p.formato === filtro.formato;
    });
    elegidos.forEach(function (p) {
      p.jugadores.forEach(function (j) {
        var s = porJugador[j] || (porJugador[j] = {
          jugados: 0, ganados: 0, jugadosSemana: 0, ganadosSemana: 0,
          carambolas: 0, entradas: 0, serie: 0
        });
        var gano = p.ganador === j;
        s.jugados++;
        if (gano) { s.ganados++; }
        if (p.fecha >= desde) {
          s.jugadosSemana++;
          if (gano) { s.ganadosSemana++; }
        }
        s.carambolas += L.puntos(p, j);
        s.entradas += L.entradasDe(p, j);
        s.serie = Math.max(s.serie, L.serieMayor(p, j));
      });
    });
    Object.keys(porJugador).forEach(function (j) {
      var s = porJugador[j];
      s.promedio = s.entradas ? s.carambolas / s.entradas : 0;
    });
    return { porJugador: porJugador, partidos: elegidos };
  };

  C.logica = L;
})(this);
