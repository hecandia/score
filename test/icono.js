// Genera icono.png (152×152, el tamaño de pantalla de inicio del iPad retina).
// Uso: node test/icono.js
'use strict';
var path = require('path');
var playwright = require('playwright');

var HTML = '<html><body style="margin:0">' +
  '<svg xmlns="http://www.w3.org/2000/svg" width="152" height="152" viewBox="0 0 152 152">' +
  '<rect width="152" height="152" fill="#0b3d2e"/>' +
  '<circle cx="50" cy="96" r="24" fill="#f4f1e8"/>' +
  '<circle cx="102" cy="96" r="24" fill="#f2c14e"/>' +
  '<circle cx="76" cy="52" r="24" fill="#c0392b"/>' +
  '</svg></body></html>';

(async function () {
  var navegador = await playwright.chromium.launch();
  var pagina = await navegador.newPage({ viewport: { width: 152, height: 152 } });
  await pagina.setContent(HTML);
  await pagina.screenshot({ path: path.join(__dirname, '..', 'icono.png') });
  await navegador.close();
  console.log('icono.png generado');
})();
