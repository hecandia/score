import UIKit

/// Cáscara nativa del marcador para el iPad mini 4 (iPadOS 15). La app de juego
/// es la misma web de la raíz del repo; lo nativo sólo reparte pantallas y guarda.
/// Qué escena atiende cada pantalla lo declara ios/Info.plist.
@main
final class AppDelegate: UIResponder, UIApplicationDelegate {}

final class EscenaPrincipal: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession,
               options connectionOptions: UIScene.ConnectionOptions) {
        guard let escena = scene as? UIWindowScene else { return }
        registro.notice("escena del iPad")
        let window = UIWindow(windowScene: escena)
        window.rootViewController = ControladorPrincipal()
        window.makeKeyAndVisible()
        self.window = window
    }
}

/// La TV. iOS crea esta escena al conectar la pantalla (cable o AirPlay
/// extendido) y la destruye al desconectarla; con eso el iPad sabe si la hay.
final class EscenaTV: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession,
               options connectionOptions: UIScene.ConnectionOptions) {
        guard let escena = scene as? UIWindowScene else { return }
        registro.notice("escena de pantalla externa: rol \(session.role.rawValue, privacy: .public), \(Int(escena.screen.bounds.width))×\(Int(escena.screen.bounds.height))")
        let window = UIWindow(windowScene: escena)
        let tv = ControladorTV()
        window.rootViewController = tv
        window.isHidden = false
        self.window = window
        Puente.compartido.conectar(tv: tv)
    }

    func sceneDidDisconnect(_ scene: UIScene) {
        Puente.compartido.desconectarTV()
        window = nil
    }
}
