import UIKit
import WebKit

private let verdeMesa = UIColor(red: 0x0b / 255, green: 0x3d / 255, blue: 0x2e / 255, alpha: 1)

/// Carpeta `web/` del bundle: index.html, tv.html, control.html, css/ y js/
/// copiados de la raíz del repo en cada compilación (fase «Copiar la app web»).
var carpetaWeb: URL {
    guard let url = Bundle.main.url(forResource: "web", withExtension: nil) else {
        fatalError("Falta web/ en el bundle: revisar la fase «Copiar la app web»")
    }
    return url
}

/// Un String codificado como JSON es un literal de JavaScript válido; nil da `null`.
func literalJS(_ texto: String?) -> String {
    guard let texto, let datos = try? JSONEncoder().encode(texto) else { return "null" }
    return String(decoding: datos, as: UTF8.self)
}

private func nuevaWeb(_ config: WKWebViewConfiguration) -> WKWebView {
    let web = WKWebView(frame: .zero, configuration: config)
    web.isOpaque = false
    web.backgroundColor = verdeMesa
    web.scrollView.backgroundColor = verdeMesa
    web.scrollView.bounces = false
    web.translatesAutoresizingMaskIntoConstraints = false
    return web
}

/// WKUserContentController retiene a sus manejadores; este intermediario evita
/// el ciclo con el controlador.
private final class Manejador: NSObject, WKScriptMessageHandler {
    weak var destino: WKScriptMessageHandler?
    init(_ destino: WKScriptMessageHandler) { self.destino = destino }
    func userContentController(_ c: WKUserContentController, didReceive mensaje: WKScriptMessage) {
        destino?.userContentController(c, didReceive: mensaje)
    }
}

// MARK: - iPad

/// La app completa, la misma página que en Safari. Es la única que tiene el
/// estado y la única que guarda.
final class ControladorPrincipal: UIViewController, WKScriptMessageHandler, WKNavigationDelegate, WKUIDelegate {
    private let almacen = Almacen()
    private var web: WKWebView!
    private var cargada = false

    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = verdeMesa

        let config = WKWebViewConfiguration()
        let manejador = Manejador(self)
        config.userContentController.add(manejador, name: "almacen")
        config.userContentController.add(manejador, name: "tablero")
        config.userContentController.add(manejador, name: "remoto")
        config.userContentController.add(manejador, name: "controlRemoto")
        web = nuevaWeb(config)
        web.navigationDelegate = self
        web.uiDelegate = self
        view.addSubview(web)
        NSLayoutConstraint.activate([
            web.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            web.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            web.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            web.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])

        Puente.compartido.principal = self
        cargar()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        // Durante la noche la pantalla no se apaga sola.
        UIApplication.shared.isIdleTimerDisabled = true
    }

    /// Carga la página con los datos vigentes inyectados antes que cualquier script.
    private func cargar() {
        cargada = false
        let contenido = web.configuration.userContentController
        contenido.removeAllUserScripts()
        contenido.addUserScript(WKUserScript(source: almacen.scriptInicial(),
                                             injectionTime: .atDocumentStart, forMainFrameOnly: true))
        web.loadFileURL(carpetaWeb.appendingPathComponent("index.html"), allowingReadAccessTo: carpetaWeb)
    }

    func pantallaExterna(_ hay: Bool) {
        // Si la página aún no cargó, se lo dice `didFinish`.
        guard cargada else { return }
        web.evaluateJavaScript("Carambola.app.pantallaExterna(\(hay))")
    }

    func remotos(_ n: Int) {
        guard cargada else { return }
        web.evaluateJavaScript("Carambola.app.remotos(\(n))")
    }

    func toqueRemoto(_ accion: String, _ valor: String?) {
        guard cargada else { return }
        web.evaluateJavaScript("Carambola.app.accionRemota(\(literalJS(accion)), \(literalJS(valor)))")
    }

    private func mostrarControlRemoto() {
        let hoja = ControladorControlRemoto()
        hoja.modalPresentationStyle = .formSheet
        present(hoja, animated: true)
    }

    func userContentController(_ c: WKUserContentController, didReceive mensaje: WKScriptMessage) {
        switch mensaje.name {
        case "almacen":
            guard let cuerpo = mensaje.body as? [String: Any], let clave = cuerpo["clave"] as? String else { return }
            almacen.guardar(clave: clave, valor: cuerpo["valor"] as? String)
        case "tablero":
            if let html = mensaje.body as? String { Puente.compartido.tablero(html) }
        case "remoto":
            if let html = mensaje.body as? String { Puente.compartido.remoto(html) }
        case "controlRemoto":
            mostrarControlRemoto()
        default:
            break
        }
    }

    // MARK: Navegación

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        cargada = true
        if Puente.compartido.hayTV { pantallaExterna(true) }
        if Puente.compartido.remotos > 0 { remotos(Puente.compartido.remotos) }
    }

    /// Si iOS mata el proceso de la página (memoria), se recarga con lo guardado.
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        cargar()
    }

    /// El respaldo se envía con un enlace `mailto:`, que abre Mail.
    func webView(_ webView: WKWebView, decidePolicyFor accion: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if let url = accion.request.url, url.scheme == "mailto" {
            UIApplication.shared.open(url)
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }

    // MARK: alert, confirm y prompt
    // WKWebView no los muestra solo: sin esto, «¿Terminar la noche?» o
    // «Cambiar nombre» no harían nada.

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage mensaje: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alerta = UIAlertController(title: nil, message: mensaje, preferredStyle: .alert)
        alerta.addAction(UIAlertAction(title: "Aceptar", style: .default) { _ in completionHandler() })
        present(alerta, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage mensaje: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alerta = UIAlertController(title: nil, message: mensaje, preferredStyle: .alert)
        alerta.addAction(UIAlertAction(title: "Cancelar", style: .cancel) { _ in completionHandler(false) })
        alerta.addAction(UIAlertAction(title: "Aceptar", style: .default) { _ in completionHandler(true) })
        present(alerta, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt pregunta: String,
                 defaultText: String?, initiatedByFrame frame: WKFrameInfo,
                 completionHandler: @escaping (String?) -> Void) {
        let alerta = UIAlertController(title: nil, message: pregunta, preferredStyle: .alert)
        alerta.addTextField { $0.text = defaultText }
        alerta.addAction(UIAlertAction(title: "Cancelar", style: .cancel) { _ in completionHandler(nil) })
        alerta.addAction(UIAlertAction(title: "Aceptar", style: .default) { _ in
            completionHandler(alerta.textFields?.first?.text)
        })
        present(alerta, animated: true)
    }
}

// MARK: - TV

/// La pantalla externa: sólo muestra el tablero que le manda el iPad.
final class ControladorTV: UIViewController, WKNavigationDelegate {
    private var web: WKWebView!
    private var cargada = false
    private var pendiente: String?

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = verdeMesa
        web = nuevaWeb(WKWebViewConfiguration())
        web.isUserInteractionEnabled = false
        web.navigationDelegate = self
        view.addSubview(web)
        NSLayoutConstraint.activate([
            web.topAnchor.constraint(equalTo: view.topAnchor),
            web.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            web.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            web.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])
        web.loadFileURL(carpetaWeb.appendingPathComponent("tv.html"), allowingReadAccessTo: carpetaWeb)
    }

    func mostrar(_ html: String) {
        guard cargada else { pendiente = html; return }
        web.evaluateJavaScript("mostrar(\(literalJS(html)))")
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        cargada = true
        if let html = pendiente { pendiente = nil; mostrar(html) }
    }
}
