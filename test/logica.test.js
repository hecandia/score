'use strict';
var test = require('node:test');
var assert = require('node:assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');

// Carga logica.js tal como la carga el navegador: un script que cuelga de `this`.
var contexto = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'logica.js'), 'utf8'), contexto);
var L = contexto.Carambola.logica;

// Los objetos creados dentro de vm tienen otro Object.prototype, y
// deepStrictEqual compara prototipos: se normaliza por JSON.
function igual(actual, esperado, mensaje) {
  assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), esperado, mensaje);
}

var fecha = 0;
function partido(a, b, ganador, opciones) {
  opciones = opciones || {};
  fecha++;
  return {
    id: 'p' + fecha, fecha: fecha, nocheId: opciones.noche || 'n1',
    modalidad: opciones.modalidad || 'rosario', formato: opciones.formato || 'ronda3',
    limite: 20, jugadores: [a, b], salida: a, ganador: ganador,
    entradas: opciones.entradas || [{ jugador: ganador, carambolas: 20 }]
  };
}

test('rotación de tres: primer partido según el tiro a la banda', function () {
  var noche = { jugadores: ['A', 'B', 'C'], ordenBanda: ['B', 'C', 'A'] };
  var sig = L.siguienteRonda3(noche, []);
  igual([sig.jugadores, sig.descansa], [['B', 'C'], 'A']);
});

test('rotación de tres: el ganador sigue y tras dos seguidos descansa', function () {
  var noche = { jugadores: ['A', 'B', 'C'], ordenBanda: ['A', 'B', 'C'] };
  var hechos = [partido('A', 'B', 'A')];
  var sig = L.siguienteRonda3(noche, hechos);
  igual([sig.jugadores, sig.descansa], [['A', 'C'], 'B'], 'A gana y juega contra C');

  hechos.push(partido('A', 'C', 'A'));
  sig = L.siguienteRonda3(noche, hechos);
  igual([sig.jugadores, sig.descansa], [['C', 'B'], 'A'], 'A ganó dos seguidos: descansa');
});

test('rotación de tres: cada tres partidos se enfrentan las tres parejas, gane quien gane', function () {
  var noche = { jugadores: ['A', 'B', 'C'], ordenBanda: ['A', 'B', 'C'] };
  // Todas las secuencias posibles de ganadores en 6 partidos.
  for (var mascara = 0; mascara < 64; mascara++) {
    var hechos = [];
    var parejas = [];
    for (var i = 0; i < 6; i++) {
      var sig = L.siguienteRonda3(noche, hechos);
      var gana = sig.jugadores[(mascara >> i) & 1];
      hechos.push(partido(sig.jugadores[0], sig.jugadores[1], gana));
      parejas.push(sig.jugadores.slice().sort().join(''));
    }
    [parejas.slice(0, 3), parejas.slice(3, 6)].forEach(function (ciclo) {
      igual(ciclo.slice().sort(), ['AB', 'AC', 'BC'], 'máscara ' + mascara);
    });
  }
});

test('rotación de tres: nadie juega más de dos partidos seguidos', function () {
  var noche = { jugadores: ['A', 'B', 'C'], ordenBanda: ['A', 'B', 'C'] };
  for (var mascara = 0; mascara < 256; mascara++) {
    var hechos = [];
    for (var i = 0; i < 8; i++) {
      var sig = L.siguienteRonda3(noche, hechos);
      hechos.push(partido(sig.jugadores[0], sig.jugadores[1], sig.jugadores[(mascara >> i) & 1]));
    }
    for (var k = 2; k < hechos.length; k++) {
      ['A', 'B', 'C'].forEach(function (j) {
        var seguidos = [hechos[k - 2], hechos[k - 1], hechos[k]].filter(function (p) {
          return p.jugadores.indexOf(j) >= 0;
        }).length;
        assert.ok(seguidos < 3, j + ' jugó tres seguidos (máscara ' + mascara + ')');
      });
    }
  }
});

test('rosario: la 10.ª, 20.ª… es de tres bandas y la cuenta sigue entre entradas', function () {
  igual(L.rosario(0), { numero: 1, tresBandas: false, libresAntes: 9 });
  igual(L.rosario(5), { numero: 6, tresBandas: false, libresAntes: 4 });
  igual(L.rosario(9), { numero: 10, tresBandas: true, libresAntes: 0 });
  igual(L.rosario(10), { numero: 11, tresBandas: false, libresAntes: 9 });
  assert.strictEqual(L.rosario(19).tresBandas, true);
});

test('partido: turnos alternados, ganador al llegar al límite y tope por entrada', function () {
  var p = { jugadores: ['A', 'B'], salida: 'B', entradas: [], ganador: null, limite: 20 };
  assert.strictEqual(L.tirador(p), 'B');
  L.anotar(p, 5);
  assert.strictEqual(L.tirador(p), 'A');
  L.anotar(p, 0);
  L.anotar(p, 13);
  assert.strictEqual(L.maximoEntrada(p, 'B'), 2);
  L.anotar(p, 0);
  L.anotar(p, 2);
  assert.strictEqual(p.ganador, 'B');
  assert.strictEqual(L.tirador(p), null);
  assert.strictEqual(L.serieMayor(p, 'B'), 13);
});

test('teclado: el primer dígito reemplaza, los siguientes se agregan, nunca pasa del máximo', function () {
  assert.strictEqual(L.teclear(3, 5, false, 20), 5, 'tras contar con +1, teclear empieza de nuevo');
  assert.strictEqual(L.teclear(1, 2, true, 20), 12);
  assert.strictEqual(L.teclear(1, 2, true, 11), null, '12 pasa de lo que falta');
  assert.strictEqual(L.teclear(0, 0, false, 11), 0);
});

test('bolas: el que sigue conserva la suya y el que entra toma la del que salió', function () {
  // El ejemplo de Héctor: H blanca contra F amarilla; pierde F, entra O.
  var p1 = { jugadores: ['H', 'F'], blanca: 'H' };
  assert.strictEqual(L.bolaBlanca(null, ['H', 'F'], 'H'), 'H', 'primer partido: la elegida al empezar');
  assert.strictEqual(L.bolaBlanca(p1, ['H', 'O'], null), 'H', 'H sigue con la blanca; O toma la amarilla de F');
  var p2 = { jugadores: ['H', 'O'], blanca: 'H' };
  assert.strictEqual(L.bolaBlanca(p2, ['O', 'F'], null), 'F', 'sale H: F entra con la blanca');
  assert.strictEqual(L.bolaBlanca(p1, ['H', 'F'], null), 'H', 'partido de dos: cada uno conserva la suya');
  assert.strictEqual(L.bolaBlanca({ jugadores: ['H', 'F'] }, ['H', 'O'], null), null, 'noche sin bolas');

  // En una ronda entera, cada partido tiene una blanca y una amarilla.
  var noche = { jugadores: ['A', 'B', 'C'], ordenBanda: ['A', 'B', 'C'] };
  for (var mascara = 0; mascara < 64; mascara++) {
    var hechos = [];
    for (var i = 0; i < 6; i++) {
      var sig = L.siguienteRonda3(noche, hechos);
      var previo = hechos[hechos.length - 1] || null;
      var blanca = L.bolaBlanca(previo, sig.jugadores, 'B');
      assert.ok(sig.jugadores.indexOf(blanca) >= 0, 'máscara ' + mascara + ', partido ' + i);
      if (previo) {
        var sigue = sig.jugadores.filter(function (j) { return previo.jugadores.indexOf(j) >= 0; })[0];
        assert.strictEqual(blanca === sigue, previo.blanca === sigue, 'el que sigue conserva su bola');
      }
      var p = partido(sig.jugadores[0], sig.jugadores[1], sig.jugadores[(mascara >> i) & 1]);
      p.blanca = blanca;
      hechos.push(p);
    }
  }
});

var INICIALES = [
  { modalidad: 'rosario', formato: 'ronda3', tipo: 'racha', jugador: 'F', valor: 7 },
  { modalidad: 'rosario', formato: 'ronda3', tipo: 'tiro', jugador: 'F', valor: 11 },
  { modalidad: 'rosario', formato: 'ronda3', tipo: 'negro', jugador: 'F', valor: 8 }
];

test('récords: arrancan con los iniciales y las cuatro tablas existen', function () {
  var t = L.records([], INICIALES);
  assert.strictEqual(Object.keys(t).length, 4);
  assert.strictEqual(t['rosario|ronda3'].racha.valor, 7);
  assert.strictEqual(t['rosario|ronda3'].negro.jugador, 'F');
  assert.strictEqual(t['tresbandas|ronda3'].racha, null);
});

test('récords: descansar no corta la racha, perder sí; cada tabla por separado', function () {
  var ps = [
    partido('A', 'B', 'A'),
    partido('A', 'C', 'A'),
    partido('C', 'B', 'C'),        // A descansa: su racha sigue en 2
    partido('A', 'C', 'A'),        // 3
    partido('A', 'B', 'A', { formato: 'dos' }),       // otra tabla: no suma
    partido('A', 'B', 'A', { modalidad: 'tresbandas' }), // otra tabla: no suma
    partido('A', 'B', 'B')         // se corta
  ];
  var t = L.records(ps, [])['rosario|ronda3'];
  assert.strictEqual(t.racha.valor, 3);
  assert.strictEqual(t.racha.jugador, 'A');
  igual(t.actuales.A, { victorias: 0, derrotas: 1 });
  assert.strictEqual(L.records(ps, [])['rosario|dos'].racha.valor, 1);
});

test('récords: las rachas siguen de una noche a otra', function () {
  var ps = [partido('A', 'B', 'A', { noche: 'n1' }), partido('A', 'B', 'A', { noche: 'n2' })];
  assert.strictEqual(L.records(ps, [])['rosario|ronda3'].racha.valor, 2);
});

test('avisos: rompe, iguala y récord negro contra el récord previo', function () {
  var previos = [];
  // F lleva 7 derrotas; series cortas para no tocar el récord de tiro (11).
  for (var i = 0; i < 7; i++) {
    previos.push(partido('F', 'B', 'B', { entradas: [{ jugador: 'B', carambolas: 5 }] }));
  }
  var antes = L.records(previos, INICIALES);
  var octavo = partido('F', 'B', 'B', { entradas: [{ jugador: 'B', carambolas: 11 }, { jugador: 'F', carambolas: 3 }] });
  var despues = L.records(previos.concat([octavo]), INICIALES);
  var avisos = L.avisos(antes, despues, octavo);
  var negro = avisos.filter(function (a) { return a.tipo === 'negro'; })[0];
  var tiro = avisos.filter(function (a) { return a.tipo === 'tiro'; })[0];
  igual([negro.jugador, negro.valor, negro.rompe], ['F', 8, false], 'iguala las 8 de Francisco');
  igual([tiro.jugador, tiro.valor, tiro.rompe], ['B', 11, false]);

  var noveno = partido('F', 'B', 'B', { entradas: [{ jugador: 'B', carambolas: 12 }] });
  avisos = L.avisos(despues, L.records(previos.concat([octavo, noveno]), INICIALES), noveno);
  assert.ok(avisos.some(function (a) { return a.tipo === 'negro' && a.valor === 9 && a.rompe; }));
  assert.ok(avisos.some(function (a) { return a.tipo === 'tiro' && a.valor === 12 && a.rompe; }));
});

test('avisos: una tabla vacía no se «rompe»', function () {
  var p = partido('A', 'B', 'A', { modalidad: 'tresbandas' });
  igual(L.avisos(L.records([], INICIALES), L.records([p], INICIALES), p), []);
});

function ganaA20(ganador, perdedor, puntosPerdedor, entradasGanador, opciones) {
  var entradas = [];
  for (var i = 0; i < entradasGanador; i++) {
    entradas.push({ jugador: ganador, carambolas: i === entradasGanador - 1 ? 20 - (entradasGanador - 1) : 1 });
    if (i < entradasGanador - 1) {
      entradas.push({ jugador: perdedor, carambolas: i === 0 ? puntosPerdedor : 0 });
    }
  }
  return partido(ganador, perdedor, ganador, Object.assign({ entradas: entradas }, opciones || {}));
}

test('récord de perder con menos carambolas: gana el número más bajo y guarda el límite', function () {
  var ps = [ganaA20('A', 'B', 5, 3), ganaA20('B', 'C', 2, 3), ganaA20('A', 'C', 2, 3), ganaA20('A', 'B', 9, 3)];
  var t = L.records(ps, INICIALES)['rosario|ronda3'];
  igual([t.menor.jugador, t.menor.valor, t.menor.limite], ['C', 2, 20], 'empate en 2: se queda el primero');
  assert.strictEqual(t.negro.valor, 8, 'el récord negro de derrotas seguidas no cambia');

  var cero = ganaA20('B', 'A', 0, 2);
  var avisos = L.avisos(L.records(ps, INICIALES), L.records(ps.concat([cero]), INICIALES), cero);
  var menor = avisos.filter(function (a) { return a.tipo === 'menor'; })[0];
  igual([menor.jugador, menor.valor, menor.rompe, menor.limite], ['A', 0, true, 20], 'perder en cero rompe el récord');

  var iguala = ganaA20('A', 'B', 2, 2);
  avisos = L.avisos(L.records(ps, INICIALES), L.records(ps.concat([iguala]), INICIALES), iguala);
  assert.ok(avisos.some(function (a) { return a.tipo === 'menor' && a.valor === 2 && !a.rompe; }), 'perder con 2 lo iguala');

  var lejos = ganaA20('A', 'B', 15, 2);
  avisos = L.avisos(L.records(ps, INICIALES), L.records(ps.concat([lejos]), INICIALES), lejos);
  assert.ok(!avisos.some(function (a) { return a.tipo === 'menor'; }), 'perder con 15 no avisa');
});

test('récords en juego: la racha y el récord negro que el partido puede alcanzar', function () {
  var previos = [];
  for (var i = 0; i < 7; i++) { previos.push(partido('F', 'B', 'B', { entradas: [{ jugador: 'B', carambolas: 5 }] })); }
  var lista = L.enJuego(L.records(previos, INICIALES), partido('F', 'B', null));
  igual(lista.map(function (x) { return [x.tipo, x.jugador, x.valor, x.rompe]; }),
    [['negro', 'F', 8, false], ['racha', 'B', 8, true]], 'F iguala el negro de 8 si pierde; B rompe la racha de 7 si gana');
  igual(L.enJuego(L.records([], INICIALES), partido('A', 'C', null)), []);
});

test('cara a cara: quién le ganó a quién, por modalidad y formato', function () {
  var ps = [partido('A', 'B', 'A'), partido('A', 'C', 'C'), partido('B', 'A', 'A'),
    partido('A', 'B', 'B', { formato: 'dos' })];
  var m = L.caraACara(ps, { modalidad: 'rosario', formato: 'ronda3' });
  igual(m, { A: { B: 2, C: 0 }, B: { A: 0 }, C: { A: 1 } });
});

test('duelo: historial del par, últimos cinco, racha, victoria más rápida y derrota más cerrada', function () {
  var ps = [
    ganaA20('A', 'B', 5, 4),
    ganaA20('B', 'A', 18, 6),
    ganaA20('A', 'C', 3, 2),                         // otro par: no cuenta
    ganaA20('A', 'B', 12, 3),
    ganaA20('A', 'B', 7, 5, { modalidad: 'tresbandas' }), // otra modalidad
    ganaA20('A', 'B', 19, 5)
  ];
  var d = L.duelo(ps, 'A', 'B', { modalidad: 'rosario', formato: 'ronda3' });
  assert.strictEqual(d.jugados, 4);
  igual([d.por.A.ganados, d.por.B.ganados], [3, 1]);
  igual(d.ultimos, ['A', 'B', 'A', 'A']);
  igual(d.racha, { jugador: 'A', valor: 2 });
  assert.strictEqual(d.por.A.rapida.entradas, 3);
  igual([d.por.A.cerrada.carambolas, d.por.A.cerrada.limite], [18, 20]);
  assert.strictEqual(d.por.B.cerrada.carambolas, 19);
  assert.strictEqual(d.por.B.rapida.entradas, 6);
  assert.strictEqual(d.por.A.serie, 18, 'la última entrada de la victoria en 3, empatada con su derrota');
  assert.strictEqual(d.por.A.promedio, 78 / 17);

  var vacio = L.duelo([], 'A', 'B', { modalidad: 'rosario', formato: 'ronda3' });
  igual([vacio.jugados, vacio.racha, vacio.por.A.rapida], [0, null, null]);
});

test('estadísticas: ganados en la semana y en total, promedio por entrada, filtro', function () {
  var lunes = new Date(2026, 8, 21, 20, 0).getTime();     // lunes 21 sep 2026
  var domingoAntes = new Date(2026, 8, 20, 20, 0).getTime();
  var p1 = partido('A', 'B', 'A', { entradas: [{ jugador: 'A', carambolas: 12 }, { jugador: 'B', carambolas: 4 }, { jugador: 'A', carambolas: 8 }] });
  p1.fecha = domingoAntes;
  var p2 = partido('A', 'B', 'B', { entradas: [{ jugador: 'A', carambolas: 2 }, { jugador: 'B', carambolas: 20 }] });
  p2.fecha = lunes;
  var otro = partido('A', 'B', 'A', { modalidad: 'tresbandas' });
  var s = L.estadisticas([p1, p2, otro], { modalidad: 'rosario', formato: 'ronda3' }, new Date(2026, 8, 25, 12, 0).getTime());
  assert.strictEqual(s.partidos.length, 2);
  var a = s.porJugador.A;
  igual([a.jugados, a.ganados, a.jugadosSemana, a.ganadosSemana], [2, 1, 1, 0]);
  assert.strictEqual(a.promedio, 22 / 3);
  assert.strictEqual(a.serie, 12);
});
