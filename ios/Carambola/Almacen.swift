import Foundation

/// Los datos de la app (jugadores, noches, partidos, pila de deshacer) en un
/// archivo propio, en vez del localStorage del WebView: ahí vive el único
/// historial y no debe depender de cómo trate WebKit el almacenamiento de una
/// página local. El archivo entra en el respaldo del iPad.
///
/// La página lee de forma síncrona (`D.cargar`), así que el contenido se le
/// inyecta completo antes de que cargue, y cada escritura vuelve por mensaje.
final class Almacen {
    private let archivo: URL
    private let cola = DispatchQueue(label: "carambola.almacen")
    private var datos: [String: String]

    init() {
        let soporte = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        try? FileManager.default.createDirectory(at: soporte, withIntermediateDirectories: true)
        archivo = soporte.appendingPathComponent("carambola.json")
        if let contenido = try? Data(contentsOf: archivo),
           let leido = try? JSONSerialization.jsonObject(with: contenido) as? [String: String] {
            datos = leido
        } else {
            datos = [:]
        }
    }

    /// `valor` nulo borra la clave. Escribe con reemplazo atómico: un corte a
    /// media escritura deja el archivo anterior entero.
    func guardar(clave: String, valor: String?) {
        datos[clave] = valor
        let copia = datos
        cola.async { [archivo] in
            guard let contenido = try? JSONSerialization.data(withJSONObject: copia) else { return }
            try? contenido.write(to: archivo, options: .atomic)
        }
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
