"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditarPagoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [pago, setPago] = useState(null);

  // ===== Modal motivo anulación =====
  const [showMotivoModal, setShowMotivoModal] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");


  // Helpers
  const soloDigitos = (s) => (s || "").toString().replace(/\D/g, "");
  const formatearMilesPY = (digits) => {
    const d = soloDigitos(digits);
    if (!d) return "";
    return d.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        setErrorMsg("");
        setOkMsg("");

        const res = await fetch(`http://localhost:8080/api/pagos/${id}`);
        if (!res.ok) throw new Error("No se pudo cargar el pago.");
        const data = await res.json();
        setPago(data);
      } catch (e) {
        setErrorMsg(e?.message || "Error cargando el pago.");
      } finally {
        setLoading(false);
      }
    };

    if (id) cargar();
  }, [id]);



  useEffect(() => {
    if (showMotivoModal) {
      document.body.classList.add("modal-open");
      document.body.style.overflow = "hidden";
    } else {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
    }
    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
    };
  }, [showMotivoModal]);





  const totalAPagar = useMemo(() => {
    return Number(pago?.totalPagado || 0);
  }, [pago]);

  // Pintar valores como en tu UI “nuevo”
  const clienteBusqueda = pago ? `${pago.clienteNombre} (${pago.clienteRuc})` : "";

  const chkEfectivo = pago?.metodo === "EFECTIVO";
  const chkTransferencia = pago?.metodo === "TRANSFERENCIA";

  const montoEfectivo = chkEfectivo ? formatearMilesPY(String(Number(pago?.montoEntregado || 0))) : "";
  const vueltoEfectivo = chkEfectivo ? Number(pago?.vuelto || 0) : 0;

  const montoTransferencia = chkTransferencia ? formatearMilesPY(String(Number(pago?.montoTransferido || 0))) : "";
  const efectivoDevueltoTransfer = chkTransferencia ? Number(pago?.efectivoDevuelto || 0) : 0;





  const handleAnular = () => {
    if (!pago?.id) return;
    if (pago.estado === "ANULADO") return;

    const ok = window.confirm("¿Seguro que querés ANULAR este pago?");
    if (!ok) return;

    setMotivoAnulacion("");
    setShowMotivoModal(true);
  };




  const confirmarAnulacion = async () => {
    if (!pago?.id) return;
    if (pago.estado === "ANULADO") return;

    const mot = (motivoAnulacion || "").trim();
    if (!mot) {
      setErrorMsg("Ingresá el motivo de la anulación.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      setOkMsg("");

      const motivoEncoded = encodeURIComponent(mot);

      const res = await fetch(
        `http://localhost:8080/api/pagos/${pago.id}/anular?motivo=${motivoEncoded}`,
        { method: "PUT" }
      );

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Error al anular.");
      }

      setOkMsg("Pago anulado correctamente.");
      setShowMotivoModal(false);
      router.push("/pagos");
    } catch (e) {
      setErrorMsg(e?.message || "Error al anular.");
    } finally {
      setLoading(false);
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
                <button
                  className="btn btn-danger btn-sm fw-bold"
                  onClick={handleAnular}
                  disabled={loading || pago?.estado === "ANULADO"}
                  title={pago?.estado === "ANULADO" ? "Ya está anulado" : "Anular pago"}
                >
                  {loading ? "Procesando..." : "Anular"}
                </button>
              </div>

              <div className="col-sm-2">
                <div className="row g-1">
                  <div className="col-auto">
                    <label className="form-label fw-bold mb-1">Nº Pago</label>
                  </div>
                  <div className="col">
                    <input
                      type="text"
                      className="form-control form-control-sm text-center"
                      value={pago?.nPago || ""}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="col-sm-3">
                <div className="row g-1">
                  <div className="col-auto">
                    <label className="form-label fw-bold mb-1">Total a Pagar</label>
                  </div>
                  <div className="col">
                    <input
                      type="text"
                      className="form-control form-control-sm text-center bg-black text-info fw-bold"
                      value={totalAPagar.toLocaleString("es-PY")}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="col-sm-2">
                <div className="row g-1">
                  <div className="col-auto">
                    <label className="form-label fw-bold mb-1">Estado</label>
                  </div>
                  <div className="col">
                    <input
                      type="text"
                      className={`form-control form-control-sm text-center fw-bold ${
                        pago?.estado === "ANULADO" ? "bg-black text-danger" : "bg-black text-success"
                      }`}
                      value={pago?.estado || ""}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="col-sm-2 ms-auto text-center">
                <button
                  className="btn btn-secondary btn-sm fw-bold"
                  type="button"
                  onClick={() => router.push("/pagos")}
                >
                  Volver
                </button>
              </div>
            </div>

            {errorMsg && <div className="alert alert-danger py-1 mt-2 mb-0">{errorMsg}</div>}
            {okMsg && <div className="alert alert-success py-1 mt-2 mb-0">{okMsg}</div>}
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
                      disabled
                      readOnly
                    />
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-sm-4">
                    <input
                      type="text"
                      className="form-control form-control-sm text-center"
                      placeholder="RUC"
                      value={pago?.clienteRuc || ""}
                      disabled
                      readOnly
                    />
                  </div>
                  <div className="col-sm-8">
                    <input
                      type="text"
                      className="form-control form-control-sm text-center"
                      placeholder="Nombre"
                      value={pago?.clienteNombre || ""}
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
                        {!pago?.detalles?.length ? (
                          <tr>
                            <td colSpan="6">Sin detalles</td>
                          </tr>
                        ) : (
                          pago.detalles.map((d) => {
                            const montoAplicado = Number(d.montoAplicado || 0);
                            return (
                              <tr key={d.facturaId}>
                                <td>
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={true}
                                    disabled
                                    readOnly
                                  />
                                </td>

                                <td>
                                  {d.numeroFactura ? (
                                    <a
                                      href={`/facturas/editar/${d.facturaId}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-decoration-underline"
                                      title="Abrir factura en nueva pestaña"
                                    >
                                      {d.numeroFactura}
                                    </a>
                                  ) : (
                                    d.facturaId
                                  )}
                                </td>

                                <td>{d.fechaEmision || ""}</td>
                                <td>{Number(d.totalFactura || 0).toLocaleString("es-PY")}</td>
                                <td>{Number(d.saldoActual || 0).toLocaleString("es-PY")}</td>

                                <td>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    className="form-control form-control-sm text-end"
                                    value={formatearMilesPY(String(montoAplicado))}
                                    disabled
                                    readOnly
                                  />
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* MÉTODOS DE PAGO */}
              <div className="col-sm-4">
                <div className="row mb-1">
                  <div className="col-sm-4">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="chkEfectivo" checked={chkEfectivo} disabled readOnly />
                      <label className="form-check-label fw-bold" htmlFor="chkEfectivo">
                        Efectivo
                      </label>
                    </div>
                  </div>
                </div>

                <div className="row mb-1">
                  <div className="col-sm-6">
                    <label className="form-label fw-bold">Monto entregado</label>
                  </div>
                  <div className="col-sm-6">
                    <input
                      type="text"
                      inputMode="numeric"
                      className="form-control form-control-sm text-end"
                      id="montoEfectivo"
                      placeholder="0"
                      disabled
                      readOnly
                      value={montoEfectivo}
                    />
                  </div>
                </div>

                <div className="row mb-5">
                  <div className="col-sm-6">
                    <label className="form-label fw-bold">Vuelto</label>
                  </div>
                  <div className="col-sm-6">
                    <input
                      type="text"
                      className="form-control form-control-sm text-center bg-black text-warning fw-bold"
                      value={vueltoEfectivo.toLocaleString("es-PY")}
                      disabled
                      readOnly
                    />
                  </div>
                </div>

                <div className="row mb-1">
                  <div className="col-sm-12">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="chkTransferencia" checked={chkTransferencia} disabled readOnly />
                      <label className="form-check-label fw-bold" htmlFor="chkTransferencia">
                        Transferencia Bancaria
                      </label>
                    </div>
                  </div>
                </div>

                <div className="row mb-1">
                  <div className="col-sm-12">
                    <select className="form-select form-select-sm text-center" id="banco" disabled value={pago?.banco || ""} readOnly>
                      <option value="">{pago?.banco || "Seleccione banco"}</option>
                    </select>
                  </div>
                </div>

                <div className="row mb-1">
                  <div className="col-sm-12">
                    <input
                      type="text"
                      className="form-control form-control-sm text-end"
                      id="operacion"
                      placeholder="Nº de Operación"
                      disabled
                      readOnly
                      value={pago?.nOperacion || ""}
                    />
                  </div>
                </div>

                <div className="row mb-1">
                  <div className="col-sm-6">
                    <label className="form-label fw-bold">Monto transferido</label>
                  </div>
                  <div className="col-sm-6">
                    <input
                      type="text"
                      inputMode="numeric"
                      className="form-control form-control-sm text-end"
                      id="montoTransferencia"
                      placeholder="0"
                      disabled
                      readOnly
                      value={montoTransferencia}
                    />
                  </div>
                </div>

                <div className="row mb-1">
                  <div className="col-sm-6">
                    <label className="form-label fw-bold">Efectivo devuelto</label>
                  </div>
                  <div className="col-sm-6">
                    <input
                      type="text"
                      className="form-control form-control-sm text-center bg-black text-warning fw-bold"
                      value={efectivoDevueltoTransfer.toLocaleString("es-PY")}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
              </div>
              {/* FIN MÉTODOS */}
            </div>
          </div>
        </div>
      </div>



      {/* ===== MODAL MOTIVO ANULACIÓN ===== */}
      {showMotivoModal && (
        <>
          {/* Backdrop */}
          <div
            className="modal-backdrop fade show"
            onClick={() => !loading && setShowMotivoModal(false)}
          />

          {/* Modal */}
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content text-dark">
                <div className="modal-header">
                  <h5 className="modal-title">Motivo de la anulación</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => !loading && setShowMotivoModal(false)}
                    disabled={loading}
                  />
                </div>

                <div className="modal-body">
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Escribí el motivo..."
                    value={motivoAnulacion}
                    onChange={(e) => setMotivoAnulacion(e.target.value)}
                    disabled={loading}
                  />
                  <small className="text-muted">
                    Este motivo se guardará en la BD (motivo_anulacion).
                  </small>
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowMotivoModal(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </button>

                  <button
                    className="btn btn-danger fw-bold"
                    onClick={confirmarAnulacion}
                    disabled={loading}
                  >
                    {loading ? "Anulando..." : "Aceptar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
  
    </div>
  );
}
