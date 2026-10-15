import Foundation
import os

/// Visible en Consola.app (iPad conectado a la Mac) o con `log show`, filtrando
/// por el subsistema: dice si iOS le entregó la TV a la app y quién se conectó.
let registro = Logger(subsystem: "com.hecandia.carambola", category: "pantallas")

/// Une las pantallas. El estado vive sólo en la página del iPad; la TV y el
/// iPhone reciben lo que tienen que mostrar ya armado y nunca guardan nada, así
/// que no pueden quedar desincronizados.
final class Puente {
    static let compartido = Puente()

    weak var principal: ControladorPrincipal?
    private weak var tv: ControladorTV?
    let servidor = ServidorRemoto()
    private(set) var remotos = 0
    /// La hoja del QR, si está abierta, para mostrar quién se conectó.
    weak var hojaRemota: ControladorControlRemoto?

    var hayTV: Bool { tv != nil }

    private init() {
        servidor.alCambiarConectados = { [weak self] n in
            guard let self else { return }
            self.remotos = n
            self.principal?.remotos(n)
            self.hojaRemota?.conectados(n)
        }
        servidor.alRecibirToque = { [weak self] accion, valor in
            self?.principal?.toqueRemoto(accion, valor)
        }
        servidor.arrancar()
    }

    func conectar(tv: ControladorTV) {
        self.tv = tv
        registro.notice("TV conectada")
        principal?.pantallaExterna(true)
    }

    func desconectarTV() {
        tv = nil
        registro.notice("TV desconectada")
        principal?.pantallaExterna(false)
    }

    /// Lo manda la página del iPad cada vez que redibuja, mientras hay TV.
    func tablero(_ html: String) {
        tv?.mostrar(html)
    }

    /// Lo manda la página del iPad cada vez que redibuja, mientras hay iPhones.
    func remoto(_ html: String) {
        servidor.difundir(html)
    }
}
