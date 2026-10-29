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

  // Teclado numérico: el primer dígito reemplaza lo anotado y los siguientes
  // se agregan a la derecha. Devuelve null si el número pasaría del máximo.
  L.teclear = function (actual, digito, continuar, maximo) {
    var n = continuar ? actual * 10 + digito : digito;
    return n <= maximo ? n : null;
  };

  // Bolas: el que sigue en la mesa conserva la suya y el que entra toma la del
  // que salió. Devuelve quién tira con la blanca; `inicial` vale para el primer
  // partido de la noche. Null si no se sabe (noches anteriores a las bolas).
  L.bolaBlanca = function (anterior, jugadores, inicial) {
    if (!anterior) { return inicial || null; }
    if (!anterior.blanca) { return null; }
    if (jugadores.indexOf(anterior.blanca) >= 0) { return anterior.blanca; }
    return jugadores.filter(function (j) { return anterior.jugadores.indexOf(j) < 0; })[0] || null;
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

  // `menor`: perder con menos carambolas. Es el único récord en que gana el
  // número más bajo; se guarda con el límite del partido («2 de 50»).
  L.MENOR_ES_MEJOR = { menor: true };

  function supera(tipo, valor, actual) {
    return L.MENOR_ES_MEJOR[tipo] ? valor < actual : valor > actual;
  }

  // Ante un empate conserva al primero que lo logró.
  function mejor(tipo, actual, candidato) {
    return (!actual || supera(tipo, candidato.valor, actual.valor)) ? candidato : actual;
  }

  L.records = function (partidos, iniciales) {
    var tablas = {};
    function tabla(clave) {
      if (!tablas[clave]) { tablas[clave] = { racha: null, negro: null, tiro: null, menor: null, actuales: {} }; }
      return tablas[clave];
    }
    L.TABLAS.forEach(function (t) { tabla(L.clave(t.modalidad, t.formato)); });

    (iniciales || []).forEach(function (r) {
      var t = tabla(L.clave(r.modalidad, r.formato));
      t[r.tipo] = mejor(r.tipo, t[r.tipo], { valor: r.valor, jugador: r.jugador, limite: r.limite, inicial: true });
    });

    partidos.forEach(function (p) {
      if (!p.ganador) { return; }
      var t = tabla(L.clave(p.modalidad, p.formato));
      p.jugadores.forEach(function (j) {
        var a = t.actuales[j] || (t.actuales[j] = { victorias: 0, derrotas: 0 });
        if (p.ganador === j) {
          a.victorias++;
          a.derrotas = 0;
          t.racha = mejor('racha', t.racha, { valor: a.victorias, jugador: j, fecha: p.fecha });
        } else {
          a.derrotas++;
          a.victorias = 0;
          t.negro = mejor('negro', t.negro, { valor: a.derrotas, jugador: j, fecha: p.fecha });
          t.menor = mejor('menor', t.menor, { valor: L.puntos(p, j), jugador: j, fecha: p.fecha, limite: p.limite });
        }
      });
      p.entradas.forEach(function (e) {
        if (e.carambolas > 0) {
          t.tiro = mejor('tiro', t.tiro, { valor: e.carambolas, jugador: e.jugador, fecha: p.fecha });
        }
      });
    });
    return tablas;
  };

  // Récords que el partido por empezar puede igualar o romper, para la TV:
  // la racha del que gane y el récord negro del que pierda.
  L.enJuego = function (tablas, partido) {
    var t = tablas[L.clave(partido.modalidad, partido.formato)];
    var lista = [];
    partido.jugadores.forEach(function (j) {
      var a = t.actuales[j] || { victorias: 0, derrotas: 0 };
      [['racha', a.victorias + 1], ['negro', a.derrotas + 1]].forEach(function (par) {
        var r = t[par[0]];
        if (r && par[1] >= r.valor) {
          lista.push({ tipo: par[0], jugador: j, valor: par[1], record: r.valor, rompe: par[1] > r.valor });
        }
      });
    });
    return lista;
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
      if (!r || supera(tipo, r.valor, valor)) { return; }
      avisos.push({ tipo: tipo, jugador: jugador, valor: valor, rompe: valor !== r.valor, limite: partido.limite });
    }

    var ganador = partido.ganador;
    var perdedor = L.otro(partido, ganador);
    comparar('racha', ganador, actual.actuales[ganador].victorias);
    comparar('negro', perdedor, actual.actuales[perdedor].derrotas);
    comparar('menor', perdedor, L.puntos(partido, perdedor));
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

  // --- Cara a cara ---------------------------------------------------------
  // Igual que los récords, cada cifra se acota a una modalidad y un formato.

  function delFiltro(partidos, filtro) {
    return partidos.filter(function (p) {
      return p.ganador && p.modalidad === filtro.modalidad && p.formato === filtro.formato;
    });
  }

  // matriz[a][b] = partidos que `a` le ganó a `b`.
  L.caraACara = function (partidos, filtro) {
    var matriz = {};
    delFiltro(partidos, filtro).forEach(function (p) {
      var perdedor = L.otro(p, p.ganador);
      var fila = matriz[p.ganador] || (matriz[p.ganador] = {});
      fila[perdedor] = (fila[perdedor] || 0) + 1;
      var otra = matriz[perdedor] || (matriz[perdedor] = {});
      otra[p.ganador] = otra[p.ganador] || 0;
    });
    return matriz;
  };

  // El historial de un par: lo que la TV muestra antes y después de su partido.
  // No hay «partido con más carambolas»: el ganador siempre termina en el
  // límite. Lo que distingue es ganar en pocas entradas y perder cerca.
  L.duelo = function (partidos, a, b, filtro) {
    var lista = delFiltro(partidos, filtro).filter(function (p) {
      return p.jugadores.indexOf(a) >= 0 && p.jugadores.indexOf(b) >= 0;
    });
    var d = { jugados: lista.length, ultimos: [], racha: null, por: {} };
    [a, b].forEach(function (j) {
      d.por[j] = { ganados: 0, carambolas: 0, entradas: 0, promedio: 0, serie: 0, rapida: null, cerrada: null };
    });
    lista.forEach(function (p) {
      var perdedor = L.otro(p, p.ganador);
      [a, b].forEach(function (j) {
        var x = d.por[j];
        x.carambolas += L.puntos(p, j);
        x.entradas += L.entradasDe(p, j);
        x.serie = Math.max(x.serie, L.serieMayor(p, j));
      });
      var g = d.por[p.ganador];
      var entradas = L.entradasDe(p, p.ganador);
      g.ganados++;
      if (!g.rapida || entradas < g.rapida.entradas) { g.rapida = { entradas: entradas, fecha: p.fecha }; }
      var pd = d.por[perdedor];
      var puntos = L.puntos(p, perdedor);
      if (!pd.cerrada || puntos > pd.cerrada.carambolas) {
        pd.cerrada = { carambolas: puntos, limite: p.limite, fecha: p.fecha };
      }
      d.racha = d.racha && d.racha.jugador === p.ganador
        ? { jugador: p.ganador, valor: d.racha.valor + 1 }
        : { jugador: p.ganador, valor: 1 };
    });
    [a, b].forEach(function (j) {
      var x = d.por[j];
      x.promedio = x.entradas ? x.carambolas / x.entradas : 0;
    });
    d.ultimos = lista.slice(-5).map(function (p) { return p.ganador; });
    return d;
  };

  C.logica = L;
})(this);
