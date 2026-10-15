import Foundation
import Network

/// El control remoto del iPhone, servido por el iPad en la red local, sin
/// internet. Dos puertos: HTTP para la página (control.html y lo que carga) y
/// WebSocket para el ida y vuelta: el iPad manda la pantalla ya armada y el
/// iPhone devuelve cada toque. El iPhone no guarda nada.
///
/// Cualquiera en la red puede abrir la página, pero sin el código que va en el
/// QR el WebSocket no acepta toques.
final class ServidorRemoto {
    static let puertoPagina: UInt16 = 8380
    static let puertoCanal: UInt16 = 8381

    /// Lo que puede pedir el iPhone por HTTP; nada más del bundle se sirve.
    private static let archivos: [String: String] = [
        "control.html": "text/html; charset=utf-8",
        "css/app.css": "text/css",
        "css/control.css": "text/css",
        "js/control.js": "text/javascript",
        "icono.png": "image/png",
    ]

    let codigo: String
    /// Se llaman en el hilo principal.
    var alCambiarConectados: ((Int) -> Void)?
    var alRecibirToque: ((String, String?) -> Void)?

    private let cola = DispatchQueue(label: "carambola.remoto")
    private var escuchas: [NWListener] = []
    private var conectados: [ObjectIdentifier: NWConnection] = [:]
    private var ultimaPantalla = ""

    init() {
        // Un código por instalación: el QR impreso o fotografiado sigue valiendo.
        let clave = "codigoControlRemoto"
        if let guardado = UserDefaults.standard.string(forKey: clave) {
            codigo = guardado
        } else {
            let letras = Array("abcdefghjkmnpqrstuvwxyz23456789")
            codigo = String((0..<8).map { _ in letras.randomElement()! })
            UserDefaults.standard.set(codigo, forKey: clave)
        }
    }

    func arrancar() {
        do {
            let pagina = try NWListener(using: .tcp, on: NWEndpoint.Port(rawValue: Self.puertoPagina)!)
            pagina.newConnectionHandler = { [weak self] c in self?.atenderPagina(c) }

            let parametros = NWParameters.tcp
            let websocket = NWProtocolWebSocket.Options()
            websocket.autoReplyPing = true
            parametros.defaultProtocolStack.applicationProtocols.insert(websocket, at: 0)
            let canal = try NWListener(using: parametros, on: NWEndpoint.Port(rawValue: Self.puertoCanal)!)
            canal.newConnectionHandler = { [weak self] c in self?.atenderCanal(c) }

            escuchas = [pagina, canal]
            for escucha in escuchas {
                escucha.stateUpdateHandler = { estado in
                    if case .failed(let error) = estado {
                        registro.error("control remoto: no se pudo escuchar: \(error.localizedDescription, privacy: .public)")
                    }
                }
                escucha.start(queue: cola)
            }
            registro.notice("control remoto escuchando en \(Self.puertoPagina) y \(Self.puertoCanal)")
        } catch {
            registro.error("control remoto: \(error.localizedDescription, privacy: .public)")
        }
    }

    /// La pantalla del iPhone, armada por la página del iPad (Carambola.app, función remoto).
    func difundir(_ html: String) {
        cola.async {
            self.ultimaPantalla = html
            for c in self.conectados.values { self.enviar(html, a: c) }
        }
    }

    // MARK: Página (HTTP)

    private func atenderPagina(_ c: NWConnection) {
        c.start(queue: cola)
        c.receive(minimumIncompleteLength: 1, maximumLength: 16_384) { [weak self] datos, _, _, _ in
            guard let self, let datos, let pedido = String(data: datos, encoding: .utf8) else { c.cancel(); return }
            self.responder(pedido, a: c)
        }
    }

    private func responder(_ pedido: String, a c: NWConnection) {
        // «GET /ruta?consulta HTTP/1.1»: sólo importa la ruta.
        let partes = pedido.split(separator: " ", maxSplits: 2)
        var ruta = partes.count > 1 && partes[0] == "GET" ? String(partes[1]) : ""
        ruta = String(ruta.split(separator: "?", maxSplits: 1).first ?? "")
        ruta = ruta.hasPrefix("/") ? String(ruta.dropFirst()) : ruta
        if ruta.isEmpty { ruta = "control.html" }

        var cuerpo = Data()
        var cabecera: String
        if let tipo = Self.archivos[ruta], let contenido = try? Data(contentsOf: carpetaWeb.appendingPathComponent(ruta)) {
            cuerpo = contenido
            cabecera = "HTTP/1.1 200 OK\r\nContent-Type: \(tipo)\r\n"
        } else {
            cuerpo = Data("No existe".utf8)
            cabecera = "HTTP/1.1 404 Not Found\r\nContent-Type: text/plain; charset=utf-8\r\n"
        }
        // Sin caché: al actualizar la app del iPad, el iPhone ve la versión nueva.
        cabecera += "Content-Length: \(cuerpo.count)\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n"
        c.send(content: Data(cabecera.utf8) + cuerpo, completion: .contentProcessed { _ in c.cancel() })
    }

    // MARK: Canal (WebSocket)

    private func atenderCanal(_ c: NWConnection) {
        c.stateUpdateHandler = { [weak self] estado in
            switch estado {
            case .failed, .cancelled: self?.quitar(c)
            default: break
            }
        }
        c.start(queue: cola)
        recibir(c)
    }

    private func recibir(_ c: NWConnection) {
        c.receiveMessage { [weak self] datos, contexto, _, error in
            guard let self else { return }
            let metadatos = contexto?.protocolMetadata(definition: NWProtocolWebSocket.definition) as? NWProtocolWebSocket.Metadata
            if error != nil || metadatos?.opcode == .close {
                c.cancel()
                return
            }
            if let datos, let mensaje = try? JSONSerialization.jsonObject(with: datos) as? [String: Any] {
                self.procesar(mensaje, de: c)
            }
            self.recibir(c)
        }
    }

    private func procesar(_ mensaje: [String: Any], de c: NWConnection) {
        let id = ObjectIdentifier(c)
        guard conectados[id] != nil else {
            // El primer mensaje es el código del QR.
            guard mensaje["codigo"] as? String == codigo else {
                enviar("<p class=\"ayuda\">El código no es válido. Vuelve a escanear el código del iPad.</p>", a: c) { c.cancel() }
                return
            }
            conectados[id] = c
            if !ultimaPantalla.isEmpty { enviar(ultimaPantalla, a: c) }
            avisarConectados()
            return
        }
        guard let accion = mensaje["accion"] as? String else { return }
        let valor = mensaje["valor"] as? String
        DispatchQueue.main.async { self.alRecibirToque?(accion, valor) }
    }

    private func quitar(_ c: NWConnection) {
        if conectados.removeValue(forKey: ObjectIdentifier(c)) != nil { avisarConectados() }
    }

    private func avisarConectados() {
        let n = conectados.count
        registro.notice("control remoto: \(n) conectados")
        DispatchQueue.main.async { self.alCambiarConectados?(n) }
    }

    private func enviar(_ texto: String, a c: NWConnection, despues: (() -> Void)? = nil) {
        let metadatos = NWProtocolWebSocket.Metadata(opcode: .text)
        let contexto = NWConnection.ContentContext(identifier: "pantalla", metadata: [metadatos])
        c.send(content: Data(texto.utf8), contentContext: contexto, isComplete: true,
               completion: .contentProcessed { _ in despues?() })
    }

    // MARK: Dirección para el QR

    /// La IPv4 del iPad en el Wi-Fi, o nil si no está en una red. En el iPad el
    /// Wi-Fi es en0; en el simulador la red es la de la Mac, donde puede ser otra
    /// en*, así que en0 va primero y si no, la primera en* con dirección.
    static func direccionLocal() -> String? {
        var lista: UnsafeMutablePointer<ifaddrs>?
        guard getifaddrs(&lista) == 0, let primera = lista else { return nil }
        defer { freeifaddrs(lista) }
        var porInterfaz: [String: String] = [:]
        for nodo in sequence(first: primera, next: { $0.pointee.ifa_next }) {
            let interfaz = nodo.pointee
            let nombre = String(cString: interfaz.ifa_name)
            guard let direccion = interfaz.ifa_addr, direccion.pointee.sa_family == UInt8(AF_INET),
                  nombre.hasPrefix("en") else { continue }
            var texto = [CChar](repeating: 0, count: Int(NI_MAXHOST))
            if getnameinfo(direccion, socklen_t(direccion.pointee.sa_len), &texto, socklen_t(texto.count),
                           nil, 0, NI_NUMERICHOST) == 0 {
                porInterfaz[nombre] = String(cString: texto)
            }
        }
        return porInterfaz["en0"] ?? porInterfaz.keys.sorted().first.flatMap { porInterfaz[$0] }
    }

    func enlace() -> String? {
        guard let ip = Self.direccionLocal() else { return nil }
        return "http://\(ip):\(Self.puertoPagina)/?t=\(codigo)"
    }
}
