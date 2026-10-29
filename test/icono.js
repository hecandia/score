// Genera los íconos a partir del mismo dibujo:
// - icono.png (152×152, el tamaño de pantalla de inicio del iPad retina), para la web;
// - el AppIcon de la app nativa (1024×1024; Xcode saca de ahí los demás tamaños).
// Uso: node test/icono.js
'use strict';
var path = require('path');
var playwright = require('playwright');

function html(lado) {
  return '<html><body style="margin:0">' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + lado + '" height="' + lado + '" viewBox="0 0 152 152">' +
    '<rect width="152" height="152" fill="#0b3d2e"/>' +
    '<circle cx="50" cy="96" r="24" fill="#f4f1e8"/>' +
    '<circle cx="102" cy="96" r="24" fill="#f2c14e"/>' +
    '<circle cx="76" cy="52" r="24" fill="#c0392b"/>' +
    '</svg></body></html>';
}

var RAIZ = path.join(__dirname, '..');
var SALIDAS = [
  { lado: 152, archivo: path.join(RAIZ, 'icono.png') },
  { lado: 1024, archivo: path.join(RAIZ, 'ios', 'Carambola', 'Assets.xcassets', 'AppIcon.appiconset', 'icono-1024.png') }
];

(async function () {
  var navegador = await playwright.chromium.launch();
  for (var i = 0; i < SALIDAS.length; i++) {
    var s = SALIDAS[i];
    var pagina = await navegador.newPage({ viewport: { width: s.lado, height: s.lado } });
    await pagina.setContent(html(s.lado));
    await pagina.screenshot({ path: s.archivo });
    await pagina.close();
    console.log(path.relative(RAIZ, s.archivo) + ' generado');
  }
  await navegador.close();
})();
