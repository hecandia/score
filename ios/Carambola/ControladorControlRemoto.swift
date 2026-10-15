import UIKit
import CoreImage.CIFilterBuiltins

/// La hoja que abre «Control desde el iPhone»: el QR con la dirección del iPad
/// y su código de acceso, y cuántos iPhones están conectados.
final class ControladorControlRemoto: UIViewController {
    private let estado = UILabel()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        Puente.compartido.hojaRemota = self

        let titulo = UILabel()
        titulo.text = "Control desde el iPhone"
        titulo.font = .preferredFont(forTextStyle: .title1)

        let ayuda = UILabel()
        ayuda.numberOfLines = 0
        ayuda.textAlignment = .center
        ayuda.font = .preferredFont(forTextStyle: .body)

        let imagen = UIImageView()
        imagen.layer.magnificationFilter = .nearest
        imagen.contentMode = .scaleAspectFit

        let enlace = UILabel()
        enlace.font = .monospacedSystemFont(ofSize: 15, weight: .regular)
        enlace.textColor = .secondaryLabel

        if let url = Puente.compartido.servidor.enlace() {
            ayuda.text = "Apunta la cámara del iPhone a este código y toca el aviso para abrirlo en Safari. " +
                "El iPhone y el iPad tienen que estar en la misma red Wi-Fi."
            imagen.image = Self.qr(url)
            enlace.text = url
        } else {
            ayuda.text = "El iPad no está conectado a una red Wi-Fi. Conéctalo a la misma red que el iPhone y vuelve a abrir esta pantalla."
        }

        estado.font = .preferredFont(forTextStyle: .headline)
        conectados(Puente.compartido.remotos)

        let cerrar = UIButton(type: .system)
        cerrar.setTitle("Cerrar", for: .normal)
        cerrar.titleLabel?.font = .preferredFont(forTextStyle: .title3)
        cerrar.addAction(UIAction { [weak self] _ in self?.dismiss(animated: true) }, for: .touchUpInside)

        let pila = UIStackView(arrangedSubviews: [titulo, ayuda, imagen, enlace, estado, cerrar])
        pila.axis = .vertical
        pila.alignment = .center
        pila.spacing = 16
        pila.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(pila)
        NSLayoutConstraint.activate([
            pila.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            pila.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            pila.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 24),
            pila.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor, constant: -24),
            ayuda.widthAnchor.constraint(lessThanOrEqualToConstant: 420),
            imagen.widthAnchor.constraint(equalToConstant: 260),
            imagen.heightAnchor.constraint(equalToConstant: 260),
        ])
    }

    func conectados(_ n: Int) {
        estado.text = n == 0 ? "Ningún iPhone conectado" : n == 1 ? "1 iPhone conectado" : "\(n) iPhones conectados"
        estado.textColor = n == 0 ? .secondaryLabel : .systemGreen
    }

    private static func qr(_ texto: String) -> UIImage? {
        let filtro = CIFilter.qrCodeGenerator()
        filtro.message = Data(texto.utf8)
        filtro.correctionLevel = "M"
        guard let salida = filtro.outputImage?.transformed(by: CGAffineTransform(scaleX: 10, y: 10)),
              let imagen = CIContext().createCGImage(salida, from: salida.extent) else { return nil }
        return UIImage(cgImage: imagen)
    }
}
