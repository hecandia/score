// Prueba el control remoto contra la app nativa corriendo en el simulador:
// Chromium hace de iPhone y habla con el servidor Swift de verdad.
//
//   node test/remoto-simulador.js preparar <archivo>  → escribe en <archivo> los
//       datos de una noche recién empezada (Ana contra Beto), en el formato del
//       almacén nativo, para copiarlos al contenedor de la app en el simulador.
//   node test/remoto-simulador.js probar <codigo>      → juega desde el «iPhone».
//
// No corre en `npm test`: necesita el simulador con la app abierta.
'use strict';
var fs = require('fs');
var path = require('path');
var http = require('http');
var playwright = require('playwright');

var RAIZ = path.join(__dirname, '..');
var CAPTURAS = path.join(__dirname, 'capturas');
var REMOTO = 'http://localhost:8380/';

function comprobar(condicion, mensaje) {
  if (!condicion) { throw new Error('FALLA: ' + mensaje); }
  console.log('ok  ' + mensaje);
}

function servidor() {
  return http.createServer(function (req, res) {
    var ruta = path.join(RAIZ, decodeURIComponent(req.url.split('?')[0]));
    if (/\/$/.test(ruta)) { ruta += 'index.html'; }
    fs.readFile(ruta, function (err, datos) {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200);
      res.end(datos);
    });
  });
}

async function preparar(archivo) {
  var srv = servidor().listen(0);
  var navegador = await playwright.chromium.launch();
  try {
    var pagina = await navegador.newPage({ viewport: { width: 1024, height: 768 } });
    await pagina.addInitScript(function () {
      var d = {};
      window.almacenNativo = {
        getItem: function (k) { return k in d ? d[k] : null; },
        setItem: function (k, v) { d[k] = String(v); },
        removeItem: function (k) { delete d[k]; },
        volcar: function () { return d; }
      };
    });
    await pagina.goto('http://localhost:' + srv.address().port + '/');
    function toca(texto) { return pagina.locator('button').filter({ hasText: texto }).first().click(); }
    await toca('Nueva noche: partido de dos');
    await pagina.fill('#nuevoJugador', 'Ana');
    await toca('Agregar');
    await pagina.fill('#nuevoJugador', 'Beto');
    await toca('Agregar');
    await pagina.locator('[data-accion="elegirBlanca"]', { hasText: 'Ana' }).click();
    await toca('Empezar');
    var datos = await pagina.evaluate(function () { return window.almacenNativo.volcar(); });
    fs.writeFileSync(archivo, JSON.stringify(datos));
    console.log('noche preparada en ' + archivo);
  } finally {
    await navegador.close();
    srv.close();
  }
}

async function probar(codigo) {
  fs.mkdirSync(CAPTURAS, { recursive: true });
  var navegador = await playwright.chromium.launch();
  try {
    var iphone = await navegador.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    function toca(texto) { return iphone.locator('button').filter({ hasText: texto }).first().click(); }
    function pantalla() { return iphone.locator('#app').innerText(); }

    var intruso = await navegador.newPage();
    await intruso.goto(REMOTO + '?t=equivocado');
    await intruso.waitForFunction(function () { return /no es válido/.test(document.body.innerText); });
    comprobar(true, 'sin el código del QR el iPad rechaza la conexión');
    await intruso.close();

    await iphone.goto(REMOTO + '?t=' + codigo);
    await iphone.waitForSelector('[data-accion="salida"]');
    comprobar(/¿Quién sale\?/.test(await pantalla()), 'el iPhone recibe la pantalla del partido en curso');
    await toca('Ana');
    await iphone.waitForSelector('[data-accion="sumar"]');
    for (var i = 0; i < 3; i++) {
      await toca('+1');
      await iphone.waitForFunction(function (n) {
        var el = document.querySelector('.acumulado');
        return el && el.textContent === String(n);
      }, i + 1);
    }
    comprobar(/\+3 por confirmar/.test(await pantalla()), 'cada +1 del iPhone vuelve con el tanteo pendiente del iPad');
    await iphone.screenshot({ path: path.join(CAPTURAS, '9-iphone-control.png') });
    await toca('confirma');
    await iphone.waitForFunction(function () { return /Entrada de Beto/.test(document.body.innerText); });
    comprobar(true, 'confirmar desde el iPhone pasa el turno');
  } finally {
    await navegador.close();
  }
}

var orden = process.argv[2];
var promesa = orden === 'preparar' ? preparar(process.argv[3]) : orden === 'probar' ? probar(process.argv[3]) : null;
if (!promesa) { console.error('uso: node test/remoto-simulador.js preparar <archivo> | probar <codigo>'); process.exit(2); }
promesa.catch(function (e) { console.error(e.message); process.exit(1); });
