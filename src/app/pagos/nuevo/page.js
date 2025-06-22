"use client";

import { useState, useEffect, useRef } from "react";

export default function NuevoPagoPage() {
  const [facturas, setFacturas] = useState([]);
  const [pagos, setPagos] = useState({});
  const [montoEfectivo, setMontoEfectivo] = useState(0);
  const [montoTransferencia, setMontoTransferencia] = useState(0);
  const [chkEfectivo, setChkEfectivo] = useState(false);
  const [chkTransferencia, setChkTransferencia] = useState(false);
  const [banco, setBanco] = useState("");
  const [operacion, setOperacion] = useState("");

  const [clienteBusqueda, setClienteBusqueda] = useState("");
  const [clientesSugeridos, setClientesSugeridos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(-1);

  const searchTimeout = useRef(null);

  const toggleEfectivo = () => setChkEfectivo(!chkEfectivo);
  const toggleTransferencia = () => setChkTransferencia(!chkTransferencia);

  useEffect(() => {
    if (clienteBusqueda.trim() === "") {
      setClientesSugeridos([]);
      setIndiceSeleccionado(-1);
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(() => {
      fetch(`http://localhost:8080/api/clientes?query=${clienteBusqueda}&page=0&size=10`)
        .then((res) => res.json())
        .then((data) => {
          setClientesSugeridos(data.content || []);
          setIndiceSeleccionado(-1);
        })
        .catch((err) => console.error("Error buscando clientes:", err));
    }, 300);
  }, [clienteBusqueda]);

  const handleClienteSeleccionado = (cliente) => {
    setClienteSeleccionado(cliente);
    setClienteBusqueda(`${cliente.nombre} (${cliente.ruc})`);
    setClientesSugeridos([]);

    fetch(`http://localhost:8080/api/facturas/pendientes?clienteId=${cliente.id}`)
      .then((res) => res.json())
      .then((data) => {
        setFacturas(Array.isArray(data) ? data : []);
        setPagos({});
      })
      .catch((err) => console.error("Error cargando facturas pendientes:", err));
  };

  const manejarTeclas = (e) => {
    if (clientesSugeridos.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndiceSeleccionado((prev) => (prev < clientesSugeridos.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndiceSeleccionado((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && indiceSeleccionado >= 0) {
      e.preventDefault();
      handleClienteSeleccionado(clientesSugeridos[indiceSeleccionado]);
    }
  };

  return (
    <div className="container-fluid bg-dark text-white p-2">
      {/* PRIMERA FILA */}
      <div className="row">
        <div className="col-sm-12">
          <div className="border border-success bg-light text-dark p-2 mb-2 rounded">
            <div className="row">
              <div className="col-sm-1 text-center">
                <button className="btn btn-primary btn-sm fw-bold">Crear</button>
              </div>
              <div className="col-sm-2">
                <div className="row g-1">
                  <div className="col-auto">
                    <label className="form-label fw-bold mb-1">Nº Pago</label>
                  </div>
                  <div className="col">
                    <input type="text" className="form-control form-control-sm text-center" value="1000000000" disabled readOnly />
                  </div>
                </div>
              </div>
              <div className="col-sm-3">
                <div className="row g-1">
                  <div className="col-auto">
                    <label className="form-label fw-bold mb-1">Total a Pagar</label>
                  </div>
                  <div className="col">
                    <input type="text" className="form-control form-control-sm text-center bg-black text-info fw-bold" value={Object.values(pagos).reduce((s, v) => s + Number(v || 0), 0).toLocaleString("es-PY")} disabled readOnly />
                  </div>
                </div>
              </div>
              <div className="col-sm-3">
                <div className="row g-1">
                  <div className="col-auto">
                    <label className="form-label fw-bold mb-1">Vuelto</label>
                  </div>
                  <div className="col">
                    <input type="text" className="form-control form-control-sm text-center bg-black text-warning fw-bold" value="0" disabled readOnly />
                  </div>
                </div>
              </div>
              <div className="col-sm-1 text-center">
                <button className="btn btn-danger btn-sm fw-bold">Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEGUNDA FILA */}
      <div className="row">
        <div className="col-sm-12">
          <div className="border border-success bg-light text-dark p-2 mb-2 rounded">
            <div className="row">
              {/* TABLA FACTURAS */}
              <div className="col-sm-8">
                <div className="row mb-2">
                  <div className="col-sm-12 position-relative">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Buscar cliente..."
                      value={clienteBusqueda}
                      onChange={(e) => setClienteBusqueda(e.target.value)}
                      onKeyDown={manejarTeclas}
                    />
                    {clientesSugeridos.length > 0 && (
                      <ul className="list-group position-absolute w-100" style={{ zIndex: 1055 }}>
                        {clientesSugeridos.map((c, idx) => (
                          <li
                            key={c.id}
                            className={`list-group-item list-group-item-action ${idx === indiceSeleccionado ? "active" : ""}`}
                            onClick={() => handleClienteSeleccionado(c)}
                            style={{ cursor: "pointer" }}
                          >
                            {c.nombre} ({c.ruc})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="row mb-2">
                  <div className="col-sm-4">
                    <input
                      type="text"
                      className="form-control form-control-sm text-center"
                      placeholder="RUC"
                      value={clienteSeleccionado?.ruc || ""}
                      disabled
                      readOnly
                    />
                  </div>
                  <div className="col-sm-8">
                    <input
                      type="text"
                      className="form-control form-control-sm text-center"
                      placeholder="Nombre"
                      value={clienteSeleccionado?.nombre || ""}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="table-responsive overflow-auto" style={{ height: "300px" }}>
                    <table className="table table-bordered table-hover table-sm align-middle text-center mb-0">
                      <thead className="table-success sticky-top">
                        <tr>
                          <th scope="col">Selección</th>
                          <th scope="col">Nº Factura</th>
                          <th scope="col">Fecha</th>
                          <th scope="col">Total</th>
                          <th scope="col">Saldo</th>
                          <th scope="col">Pago total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {facturas.length === 0 ? (
                          <tr><td colSpan="6">Sin facturas pendientes</td></tr>
                        ) : (
                          facturas.map((factura) => (
                            <tr key={factura.id}>
                              <td><input type="checkbox" className="form-check-input" /></td>
                              <td>{factura.numeroFactura}</td>
                              <td>{factura.fechaEmision}</td>
                              <td>{factura.total.toLocaleString("es-PY")}</td>
                              <td>{factura.saldo.toLocaleString("es-PY")}</td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm text-end"
                                  value={pagos[factura.id] || ""}
                                  onChange={(e) => setPagos({ ...pagos, [factura.id]: e.target.value })}
                                  onFocus={(e) => e.target.select()}
                                  placeholder="0"
                                />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* MÉTODOS DE PAGO */}
              <div className="col-sm-4">
                <div className="row mb-4">
                  <div className="col-sm-4">
                    <div className="form-check mb-2">
                      <input className="form-check-input" type="checkbox" id="chkEfectivo" checked={chkEfectivo} onChange={toggleEfectivo} />
                      <label className="form-check-label fw-bold" htmlFor="chkEfectivo">Efectivo</label>
                    </div>
                  </div>
                  <div className="col-sm-8">
                    <input type="number" className="form-control form-control-sm text-end" id="montoEfectivo" placeholder="10000000" disabled={!chkEfectivo} value={montoEfectivo} onChange={(e) => setMontoEfectivo(e.target.value)} />
                  </div>
                </div>
                <div className="row mb-2">
                  <div className="col-sm-12">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="chkTransferencia" checked={chkTransferencia} onChange={toggleTransferencia} />
                      <label className="form-check-label fw-bold" htmlFor="chkTransferencia">Transferencia Bancaria</label>
                    </div>
                  </div>
                </div>
                <div className="row mb-2">
                  <div className="col-sm-12">
                    <select className="form-select form-select-sm text-center" id="banco" disabled={!chkTransferencia} value={banco} onChange={(e) => setBanco(e.target.value)}>
                      <option disabled value="">Seleccione banco</option>
                      <option value="Itau">Itaú</option>
                      <option value="Ueno">Ueno</option>
                      <option value="Continental">Continental</option>
                    </select>
                  </div>
                </div>
                <div className="row mb-2">
                  <div className="col-sm-12">
                    <input type="number" className="form-control form-control-sm text-end" id="operacion" placeholder="Nº de Operación" disabled={!chkTransferencia} value={operacion} onChange={(e) => setOperacion(e.target.value)} />
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm-12">
                    <input type="number" className="form-control form-control-sm text-end" id="montoTransferencia" placeholder="Monto transferencia" disabled={!chkTransferencia} value={montoTransferencia} onChange={(e) => setMontoTransferencia(e.target.value)} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
