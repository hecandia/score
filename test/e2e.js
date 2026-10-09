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

    // Respaldo del arranque limpio, para restaurarlo al final.
    await toca('Respaldo');
    var respaldoInicial = await pagina.inputValue('#exportar');
    await toca('‹ Inicio');

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
    comprobar(await pagina.locator('button', { hasText: 'Empezar' }).isDisabled(), 'no se puede empezar sin elegir la bola blanca');
    await pagina.locator('[data-accion="elegirBlanca"]', { hasText: 'Ana' }).click();
    await captura('3-nueva-noche');
    await toca('Empezar');

    t = await texto();
    comprobar(/Descansa: Francisco/.test(t), 'con el orden Ana, Beto, Francisco descansa Francisco');
    await toca('Ana');

    function bolaDe(nombre) {
      return pagina.locator('.panel', { hasText: nombre }).locator('.bola').getAttribute('class');
    }
    comprobar(/blanca/.test(await bolaDe('Ana')) && /amarilla/.test(await bolaDe('Beto')),
      'bolas: Ana con la blanca que se eligió, Beto con la amarilla');

    for (var i = 0; i < 9; i++) { await toca('+1'); }
    var ana = pagina.locator('.panel', { hasText: 'Ana' });
    comprobar(await ana.locator('.puntos.pendiente').innerText() === '9' && /\+9 por confirmar/.test(await ana.innerText()),
      'el marcador grande muestra el total pendiente, marcado hasta confirmar');
    comprobar(/TRES BANDAS\s*la 10\.ª/.test(await ana.innerText()), 'rosario: tras 9 libres avisa la de tres bandas en el marcador');
    await captura('4-partido-tres-bandas');

    // Cabe sin scroll en el iPad a pantalla completa (768 menos la barra de estado).
    await pagina.setViewportSize({ width: 1024, height: 748 });
    var alturas = await pagina.evaluate(function () {
      function alto(sel) { return Math.round(document.querySelector(sel).getBoundingClientRect().height); }
      return { barra: alto('.barra'), marcador: alto('.marcador'), entrada: alto('.entrada'),
        fondo: Math.round(document.querySelector('.entrada').getBoundingClientRect().bottom) };
    });
    comprobar(alturas.fondo <= 748, 'la pantalla del partido cabe en 748 px: ' + JSON.stringify(alturas));
    await pagina.setViewportSize({ width: 1024, height: 768 });

    await toca('confirma');
    comprobar(await ana.locator('.puntos.pendiente').count() === 0, 'al confirmar, el número deja de estar pendiente');
    await toca('confirma');  // Beto: sin carambola
    t = await texto();
    comprobar(/Entrada de Ana/.test(t), 'los turnos alternan');
    comprobar(/TRES BANDAS\s*la 10\.ª/.test(t), 'rosario: la cuenta sigue entre entradas');

    // Teclado: tras +1 el primer dígito reemplaza; los siguientes se agregan.
    function tecla(d) { return pagina.locator('[data-accion="digito"][data-valor="' + d + '"]'); }
    await toca('+1');
    await toca('+1');
    await tecla(1).click();
    comprobar(/confirma: 1 carambola$/.test(await pagina.locator('button', { hasText: 'confirma' }).innerText()),
      'teclado: tras contar 2 con +1, el dígito 1 reemplaza (no anota 21)');
    comprobar(await tecla(2).isDisabled() && !(await tecla(1).isDisabled()),
      'teclado: 12 pasaría de las 11 que faltan y se desactiva; 11 no');
    await tecla(1).click();
    comprobar(await pagina.locator('button.mas').isDisabled() && /11 carambolas/.test(await texto()),
      'teclado: 1 y 1 anotan 11, lo que faltaba; el +1 se desactiva');
    await pagina.locator('[data-accion="borrar"]').click();
    await tecla(1).click();
    comprobar(/11 carambolas/.test(await texto()), 'teclado: borrar quita el último dígito');
    await toca('confirma');

    t = await texto();
    comprobar(/¡Gana Ana!/.test(t), 'Ana gana al llegar a 20');
    comprobar(/Ana iguala el tiro más largo: 11/.test(t), 'aviso: iguala el récord de tiro de Francisco');
    comprobar(/Siguiente: Ana \(blanca\) contra Francisco \(amarilla\) · descansa Beto/.test(t),
      'rotación: la ganadora sigue con su bola y Francisco entra con la de Beto');
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
    comprobar(/Siguiente: Francisco \(amarilla\) contra Beto \(blanca\) · descansa Ana/.test(t),
      'tras dos seguidos Ana descansa, gane o pierda, y Beto entra con su blanca');

    respuestasPrompt.push('');
    await toca('Terminar la noche');
    await toca('Estadísticas');
    t = await texto();
    comprobar(/Ana\s*2 de 2\s*2 de 2/.test(t), 'estadísticas: Ana 2 de 2 en la semana y en total');
    await captura('6-estadisticas');

    // Restaurar el respaldo inicial deja la app como recién instalada.
    await toca('‹ Inicio');
    await toca('Respaldo');
    await pagina.fill('#importar', respaldoInicial);
    await toca('Restaurar');
    await toca('Estadísticas');
    comprobar(/Todavía no hay partidos/.test(await texto()), 'restaurar: sin partidos');
    await toca('‹ Inicio');
    await toca('Récords');
    t = await texto();
    comprobar(/Tiro más largo\s*11\s*Francisco/.test(t) && !/Ana/.test(t), 'restaurar: récords iniciales y sin rastro de Ana');
    await toca('‹ Inicio');
    await toca('Jugadores');
    comprobar(!/Ana|Beto/.test(await texto()), 'restaurar: los jugadores agregados desaparecen');
    await pagina.reload();
    comprobar(!/Noche en curso/.test(await texto()) && !(await pagina.locator('button', { hasText: 'Deshacer' }).count()),
      'restaurar: sin noche en curso ni deshacer, también tras recargar');

    comprobar(erroresJs.length === 0, 'sin errores de JavaScript' + (erroresJs.length ? ': ' + erroresJs.join('; ') : ''));
  } finally {
    await navegador.close();
    srv.close();
  }
}

principal().catch(function (e) { console.error(e.message); process.exit(1); });
