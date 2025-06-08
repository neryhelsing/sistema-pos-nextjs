export default function Footer() {
  return (
    <footer className="bg-dark text-light py-3 mt-auto">
      <div className="container text-center">
        <p className="mb-0">© {new Date().getFullYear()} Sistema POS Venta y Facturación. Todos los derechos reservados.</p>
        <p>
          Desarrollado por <strong>CASA LEO</strong>. Contacto:{" "}
          <a href="mailto:contacto@casaleo.com" className="text-warning">
            contacto@casaleo.com
          </a>
        </p>
      </div>
    </footer>
  );
}
