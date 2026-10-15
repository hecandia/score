/* Control remoto desde el iPhone (sólo con la app nativa del iPad).
   Muestra lo que manda el iPad y le devuelve cada toque: no guarda nada, así
   que no puede desincronizarse. El código de acceso viene en el QR (?t=…). */
(function (raiz) {
  'use strict';

  var doc = raiz.document;
  var codigo = (/[?&]t=([^&]+)/.exec(raiz.location.search) || [])[1] || '';
  // El WebSocket escucha en el puerto siguiente al de esta página.
  var direccion = 'ws://' + raiz.location.hostname + ':' + (parseInt(raiz.location.port, 10) + 1) + '/';
  var ws = null;

  function aviso(texto) {
    var a = doc.getElementById('conexion');
    a.textContent = texto;
    a.style.display = texto ? 'block' : 'none';
  }

  function conectar() {
    aviso('Conectando con el iPad…');
    ws = new raiz.WebSocket(direccion);
    ws.onopen = function () { ws.send(JSON.stringify({ codigo: codigo })); };
    ws.onmessage = function (ev) {
      aviso('');
      doc.getElementById('app').innerHTML = ev.data;
    };
    ws.onclose = function () {
      ws = null;
      aviso('Sin conexión con el iPad. Reintentando…');
      // Con el iPhone bloqueado no se reintenta; al volver, `visibilitychange`.
      if (!doc.hidden) { raiz.setTimeout(conectar, 1500); }
    };
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
    if (!el || el.disabled || !ws || ws.readyState !== 1) { return; }
    ws.send(JSON.stringify({ accion: el.getAttribute('data-accion'), valor: el.getAttribute('data-valor') }));
  }, false);

  doc.addEventListener('visibilitychange', function () {
    if (!doc.hidden && !ws) { conectar(); }
  }, false);

  conectar();
})(this);
