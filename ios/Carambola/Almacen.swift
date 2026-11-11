import Foundation

/// Los datos de la app (jugadores, noches, partidos, pila de deshacer) en un
/// archivo propio, en vez del localStorage del WebView: ahí vive el único
/// historial y no debe depender de cómo trate WebKit el almacenamiento de una
/// página local. El archivo entra en el respaldo del iPad.
///
/// La página lee de forma síncrona (`D.cargar`), así que el contenido se le
/// inyecta completo antes de que cargue, y cada escritura vuelve por mensaje.
///
/// Además deja una copia del historial en Documentos, que la app Archivos
/// muestra en «En mi iPad › Carambola»: respaldar es copiar ese archivo a
/// iCloud Drive. Es sólo una copia; el historial vivo sigue en Application Support.
final class Almacen {
    /// La clave del estado de juego (js/datos.js). Su valor es el mismo texto
    /// que da la pantalla de Respaldo, así que la copia se restaura igual.
    static let claveEstado = "carambola.v1"
    static let nombreCopia = "Carambola-respaldo.json"

    private let archivo: URL
    private let copia: URL
    private let cola = DispatchQueue(label: "carambola.almacen")
    private var datos: [String: String]
    /// Cada +1 guarda el estado; la copia se escribe cuando se dejó de anotar un momento.
    private var copiaPendiente: DispatchWorkItem?

    init() {
        let soporte = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        try? FileManager.default.createDirectory(at: soporte, withIntermediateDirectories: true)
        archivo = soporte.appendingPathComponent("carambola.json")
        let documentos = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        copia = documentos.appendingPathComponent(Almacen.nombreCopia)
        if let contenido = try? Data(contentsOf: archivo),
           let leido = try? JSONSerialization.jsonObject(with: contenido) as? [String: String] {
            datos = leido
        } else {
            datos = [:]
        }
        // Al abrir, la copia queda al día aunque no se anote nada (p. ej. recién instalada).
        programarCopia(espera: 0)
    }

    /// `valor` nulo borra la clave. Escribe con reemplazo atómico: un corte a
    /// media escritura deja el archivo anterior entero.
    func guardar(clave: String, valor: String?) {
        datos[clave] = valor
        let copiaDatos = datos
        cola.async { [archivo] in
            guard let contenido = try? JSONSerialization.data(withJSONObject: copiaDatos) else { return }
            try? contenido.write(to: archivo, options: .atomic)
        }
        if clave == Almacen.claveEstado { programarCopia(espera: 3) }
    }

    /// El texto del respaldo: el estado de juego tal cual, sin la pila de deshacer.
    var textoRespaldo: String? { datos[Almacen.claveEstado] }

    private func programarCopia(espera: Double) {
        copiaPendiente?.cancel()
        guard let texto = textoRespaldo else { return }
        let trabajo = DispatchWorkItem { [copia] in
            try? Data(texto.utf8).write(to: copia, options: .atomic)
        }
        copiaPendiente = trabajo
        cola.asyncAfter(deadline: .now() + espera, execute: trabajo)
    }

    /// Define `window.almacenNativo` con la interfaz de localStorage que usa
    /// js/datos.js. Se arma de nuevo en cada carga de la página, con lo vigente.
    func scriptInicial() -> String {
        let json = (try? JSONSerialization.data(withJSONObject: datos))
            .flatMap { String(data: $0, encoding: .utf8) } ?? "{}"
        return """
        (function () {
          var d = \(json);
          var canal = window.webkit.messageHandlers.almacen;
          window.almacenNativo = {
            getItem: function (k) { return Object.prototype.hasOwnProperty.call(d, k) ? d[k] : null; },
            setItem: function (k, v) { v = String(v); d[k] = v; canal.postMessage({ clave: k, valor: v }); },
            removeItem: function (k) { delete d[k]; canal.postMessage({ clave: k, valor: null }); }
          };
        })();
        """
    }
}
