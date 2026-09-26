// Juega una noche en Chromium a tamaño iPad (1024×768), tocando los botones.
// No sustituye probar en el iPad: Chromium no es Safari 9. Deja capturas en test/capturas/.
'use strict';
var http = require('http');
var fs = require('fs');
var path = require('path');
var playwright = require('playwright');

var RAIZ = path.join(__dirname, '..');
var CAPTURAS = path.join(__dirname, 'capturas');
var TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.appcache': 'text/cache-manifest' };

function servidor() {
  return http.createServer(function (req, res) {
    var ruta = path.join(RAIZ, decodeURIComponent(req.url.split('?')[0]));
    if (/\/$/.test(ruta)) { ruta += 'index.html'; }
    fs.readFile(ruta, function (err, datos) {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(ruta)] || 'application/octet-stream' });
      res.end(datos);
    });
  });
}

function comprobar(condicion, mensaje) {
  if (!condicion) { throw new Error('FALLA: ' + mensaje); }
  console.log('ok  ' + mensaje);
}

async function principal() {
  fs.mkdirSync(CAPTURAS, { recursive: true });
  var srv = servidor().listen(0);
  var url = 'http://localhost:' + srv.address().port + '/';
  var navegador = await playwright.chromium.launch();
  var pagina = await navegador.newPage({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
  var respuestasPrompt = [];
  var erroresJs = [];
  pagina.on('pageerror', function (e) { erroresJs.push(e.message); });
  pagina.on('dialog', function (d) { d.accept(respuestasPrompt.shift()); });

  function toca(texto) { return pagina.locator('button, a').filter({ hasText: texto }).first().click(); }
  function texto() { return pagina.locator('#app').innerText(); }
  async function captura(nombre) { await pagina.screenshot({ path: path.join(CAPTURAS, nombre + '.png') }); }

  try {
    await pagina.goto(url);
    await pagina.evaluate(function () { localStorage.clear(); });
    await pagina.reload();
    await captura('1-inicio');

    await toca('Récords');
    var t = await texto();
    comprobar(/Racha de victorias\s*7\s*Francisco/.test(t), 'récords iniciales de Francisco: racha 7');
    comprobar(/Tiro más largo\s*11\s*Francisco/.test(t), 'récords iniciales: tiro 11');
    comprobar(/Récord negro\s*8\s*Francisco/.test(t), 'récords iniciales: récord negro 8');
    await captura('2-records');
    await toca('‹ Inicio');

    await toca('Nueva noche: ronda de tres');
    await pagina.fill('#nuevoJugador', 'Ana');
    await toca('Agregar');
    await pagina.fill('#nuevoJugador', 'Beto');
    await toca('Agregar');
    // Ana y Beto quedan elegidos al agregarlos; falta Francisco.
    await toca('Francisco');
    await toca('Una por una');
    comprobar(await pagina.locator('button', { hasText: 'Empezar' }).isDisabled(), 'no se puede empezar sin el orden de la banda');
    await pagina.locator('.opciones button', { hasText: 'Ana' }).last().click();
    await pagina.locator('.opciones button', { hasText: 'Beto' }).last().click();
    await pagina.locator('.opciones button', { hasText: 'Francisco' }).last().click();
    await captura('3-nueva-noche');
    await toca('Empezar');

    t = await texto();
    comprobar(/Descansa: Francisco/.test(t), 'con el orden Ana, Beto, Francisco descansa Francisco');
    await toca('Ana');

    for (var i = 0; i < 9; i++) { await toca('+1'); }
    comprobar(/La 10\.ª tiene que ser de TRES BANDAS/.test(await texto()), 'rosario: tras 9 libres avisa la de tres bandas');
    await captura('4-partido-tres-bandas');
    await toca('confirma');
    await toca('confirma');  // Beto: sin carambola
    t = await texto();
    comprobar(/Entrada de Ana/.test(t), 'los turnos alternan');
    comprobar(/La 10\.ª tiene que ser de TRES BANDAS/.test(t), 'rosario: la cuenta sigue entre entradas');

    for (i = 0; i < 11; i++) { await toca('+1'); }
    comprobar(await pagina.locator('button.mas').isDisabled() && /11 carambolas/.test(await texto()),
      'una entrada no pasa del límite: con 11 (lo que faltaba) el +1 se desactiva');
    await toca('confirma');

    t = await texto();
    comprobar(/¡Gana Ana!/.test(t), 'Ana gana al llegar a 20');
    comprobar(/Ana iguala el tiro más largo: 11/.test(t), 'aviso: iguala el récord de tiro de Francisco');
    comprobar(/Siguiente: Ana contra Francisco · descansa Beto/.test(t), 'rotación: la ganadora juega contra el que esperaba');
    await captura('5-fin-partido');

    await pagina.reload();
    comprobar(/¡Gana Ana!/.test(await texto()), 'al recargar, la noche sigue donde quedó');

    await toca('Deshacer');
    t = await texto();
    comprobar(/Entrada de Ana/.test(t) && /11 carambolas/.test(t), 'deshacer vuelve a la entrada con su acumulado');
    await toca('confirma');

    await toca('Empezar el siguiente partido');
    await toca('Francisco');
    await toca('confirma');           // Francisco: 0
    for (i = 0; i < 20; i++) { await toca('+1'); }
    await toca('confirma');           // Ana: 20
    t = await texto();
    comprobar(/Siguiente: Francisco contra Beto · descansa Ana/.test(t), 'tras dos seguidos Ana descansa, gane o pierda');

    respuestasPrompt.push('');
    await toca('Terminar la noche');
    await toca('Estadísticas');
    t = await texto();
    comprobar(/Ana\s*2 de 2\s*2 de 2/.test(t), 'estadísticas: Ana 2 de 2 en la semana y en total');
    await captura('6-estadisticas');

    comprobar(erroresJs.length === 0, 'sin errores de JavaScript' + (erroresJs.length ? ': ' + erroresJs.join('; ') : ''));
  } finally {
    await navegador.close();
    srv.close();
  }
}

principal().catch(function (e) { console.error(e.message); process.exit(1); });
