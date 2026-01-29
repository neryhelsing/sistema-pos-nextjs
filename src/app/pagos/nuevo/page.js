"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";

export default function NuevoPagoPage() {
  const searchParams = useSearchParams();
  const facturaIdFromUrl = searchParams.get("facturaId"); // /pagos/nuevo?facturaId=123
  const facturaIdFocus = facturaIdFromUrl ? Number(facturaIdFromUrl) : null;

  const [facturas, setFacturas] = useState([]);

  // pagos: { [facturaId]: "123.456" (string formateado) }
  const [pagos, setPagos] = useState({});

  // ✅ selección obligatoria por checkbox: { [facturaId]: true/false }
  const [seleccionadas, setSeleccionadas] = useState({});

  // ✅ ahora string para permitir separador de miles mientras escribe
  const [montoEfectivo, setMontoEfectivo] = useState("");
  const [montoTransferencia, setMontoTransferencia] = useState("");

  const [chkEfectivo, setChkEfectivo] = useState(false);
  const [chkTransferencia, setChkTransferencia] = useState(false);

  const [banco, setBanco] = useState("");
  const [operacion, setOperacion] = useState("");

  const [clienteBusqueda, setClienteBusqueda] = useState("");
  const [clientesSugeridos, setClientesSugeridos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(-1);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const searchTimeout = useRef(null);

  // ========= helpers =========
  const soloDigitos = (s) => (s || "").toString().replace(/\D/g, "");

  const formatearMilesPY = (digits) => {
    const d = soloDigitos(digits);
    if (!d) return "";
    return d.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const aNumero = (valorFormateado) => {
    const d = soloDigitos(valorFormateado);
    return d ? Number(d) : 0;
  };

  // ===== Totales calculados (solo facturas seleccionadas) =====
  const totalAPagar = useMemo(() => {
    return Object.entries(pagos).reduce((sum, [facturaId, valor]) => {
      const id = Number(facturaId);
      if (!seleccionadas[id]) return sum;
      return sum + aNumero(valor);
    }, 0);
  }, [pagos, seleccionadas]);

  // ✅ Vuelto en efectivo: montoEntregado - total
  const vueltoEfectivo = chkEfectivo ? aNumero(montoEfectivo) - totalAPagar : 0;

  // ✅ "Efectivo devuelto" en transferencia: montoTransferido - total
  const efectivoDevueltoTransfer = chkTransferencia ? aNumero(montoTransferencia) - totalAPagar : 0;

  // ✅ Solo un método a la vez (tu backend acepta 1 solo enum)
  const toggleEfectivo = () => {
    setChkEfectivo((v) => {
      const next = !v;
      if (next) {
        setChkTransferencia(false);
        setBanco("");
        setOperacion("");
        setMontoTransferencia("");
      } else {
        setMontoEfectivo("");
      }
      return next;
    });
  };

  const toggleTransferencia = () => {
    setChkTransferencia((v) => {
      const next = !v;
      if (next) {
        setChkEfectivo(false);
        setMontoEfectivo("");
      } else {
        setBanco("");
        setOperacion("");
        setMontoTransferencia("");
      }
      return next;
    });
  };

  // ✅ AUTOCARGA: si venimos desde editar factura: /pagos/nuevo?facturaId=123
  useEffect(() => {
    const autoCargarDesdeFactura = async () => {
      if (!facturaIdFromUrl) return;

      try {
        setLoading(true);
        setErrorMsg("");
        setOkMsg("");

        // 1) cargar factura
        const facRes = await fetch(`http://localhost:8080/api/facturas/${facturaIdFromUrl}`);
        if (!facRes.ok) throw new Error("No se pudo cargar la factura.");
        const factura = await facRes.json();

        if (!factura?.clienteId) throw new Error("La factura no tiene clienteId.");

        // 2) cargar cliente
        const cliRes = await fetch(`http://localhost:8080/api/clientes/${factura.clienteId}`);
        if (!cliRes.ok) throw new Error("No se pudo cargar el cliente.");
        const cliente = await cliRes.json();

        setClienteSeleccionado(cliente);
        setClienteBusqueda(`${cliente.nombre} (${cliente.ruc})`);
        setClientesSugeridos([]);
        setIndiceSeleccionado(-1);

        // 3) cargar facturas pendientes del cliente
        const pendRes = await fetch(
          `http://localhost:8080/api/facturas/pendientes?clienteId=${cliente.id}`
        );
        if (!pendRes.ok) throw new Error("No se pudieron cargar facturas pendientes.");
        const pendientes = await pendRes.json();
        const lista = Array.isArray(pendientes) ? pendientes : [];

        setFacturas(lista);

        // ✅ Seleccionar por defecto SOLO la factura actual (checkbox marcado)
        if (facturaIdFocus) {
          setSeleccionadas({ [facturaIdFocus]: true });
        } else {
          setSeleccionadas({});
        }

        // ✅ Pago total debe empezar vacío
        setPagos({});
      } catch (err) {
        console.error("AutoCarga error:", err);
        setErrorMsg(err?.message || "Error cargando datos desde la factura.");
      } finally {
        setLoading(false);
      }
    };

    autoCargarDesdeFactura();
  }, [facturaIdFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Buscar clientes (manual)
  useEffect(() => {
    if (clienteBusqueda.trim() === "") {
      setClientesSugeridos([]);
      setIndiceSeleccionado(-1);
      return;
    }

    // evitar búsqueda cuando fue autocompletado
    if (
      clienteSeleccionado &&
      clienteBusqueda.trim() === `${clienteSeleccionado.nombre} (${clienteSeleccionado.ruc})`
    ) {
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
  }, [clienteBusqueda, clienteSeleccionado]);

  const handleClienteSeleccionado = (cliente) => {
    setErrorMsg("");
    setOkMsg("");
    setClienteSeleccionado(cliente);
    setClienteBusqueda(`${cliente.nombre} (${cliente.ruc})`);
    setClientesSugeridos([]);

    fetch(`http://localhost:8080/api/facturas/pendientes?clienteId=${cliente.id}`)
      .then((res) => res.json())
      .then((data) => {
        const lista = Array.isArray(data) ? data : [];
        setFacturas(lista);
        setPagos({});
        setSeleccionadas({});
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

  // ✅ Ordenar: arriba la factura actual, luego el resto por id DESC
  const facturasOrdenadas = useMemo(() => {
    const arr = Array.isArray(facturas) ? [...facturas] : [];
    arr.sort((a, b) => Number(b.id) - Number(a.id)); // desc por id

    if (!facturaIdFocus) return arr;

    const idx = arr.findIndex((f) => Number(f.id) === Number(facturaIdFocus));
    if (idx > 0) {
      const [foc] = arr.splice(idx, 1);
      arr.unshift(foc);
    }
    return arr;
  }, [facturas, facturaIdFocus]);

  const handleCrearPago = async () => {
    setErrorMsg("");
    setOkMsg("");

    if (!clienteSeleccionado?.id) {
      setErrorMsg("Seleccioná un cliente.");
      return;
    }

    // ✅ SOLO facturas marcadas por checkbox
    const detalles = Object.entries(pagos)
      .map(([facturaId, montoAplicado]) => ({
        facturaId: Number(facturaId),
        montoAplicado: aNumero(montoAplicado),
      }))
      .filter((d) => d.facturaId && d.montoAplicado > 0 && seleccionadas[d.facturaId]);

    if (detalles.length === 0) {
      setErrorMsg("Marcá la casilla y cargá un monto en al menos una factura.");
      return;
    }

    if (!chkEfectivo && !chkTransferencia) {
      setErrorMsg("Elegí un método de pago.");
      return;
    }

    // ✅ validar contra saldo antes de enviar
    for (const d of detalles) {
      const fac = facturas.find((f) => Number(f.id) === Number(d.facturaId));
      if (!fac) {
        setErrorMsg(`Factura no encontrada en la lista: ID ${d.facturaId}`);
        return;
      }
      const saldo = Number(fac.saldo || 0);
      if (d.montoAplicado > saldo) {
        setErrorMsg(
          `El monto supera el saldo en la factura Nº ${fac.numeroFactura || fac.id}. (Saldo: ${saldo.toLocaleString(
            "es-PY"
          )} Gs)`
        );
        return;
      }
    }

    const metodo = chkTransferencia ? "TRANSFERENCIA" : "EFECTIVO";

    if (metodo === "EFECTIVO") {
      const me = aNumero(montoEfectivo);
      if (me <= 0) {
        setErrorMsg("Ingresá el monto entregado.");
        return;
      }
      if (me < totalAPagar) {
        setErrorMsg("El monto entregado no puede ser menor al total a pagar.");
        return;
      }
    }

    if (metodo === "TRANSFERENCIA") {
      if (!banco.trim()) {
        setErrorMsg("Seleccioná un banco.");
        return;
      }
      if (!operacion.toString().trim()) {
        setErrorMsg("Ingresá el N° de operación.");
        return;
      }
      const mt = aNumero(montoTransferencia);
      if (mt <= 0) {
        setErrorMsg("Ingresá el monto transferido.");
        return;
      }
      if (mt < totalAPagar) {
        setErrorMsg("El monto transferido no puede ser menor al total a pagar.");
        return;
      }
    }

    const payload = {
      clienteId: clienteSeleccionado.id,
      metodo,
      ...(metodo === "TRANSFERENCIA"
        ? {
            banco: banco.trim(),
            nOperacion: operacion.toString().trim(),
            montoTransferido: aNumero(montoTransferencia),
          }
        : {
            montoEntregado: aNumero(montoEfectivo),
          }),
      detalles,
    };

    try {
      setLoading(true);

      const res = await fetch("http://localhost:8080/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Error al crear pago.");
      }

      const data = await res.json();

      setOkMsg(
        `Pago creado: Nº ${data.nPago} - Total ${Number(data.totalPagado).toLocaleString("es-PY")} Gs`
      );

      // reset
      setPagos({});
      setSeleccionadas({});
      setMontoEfectivo("");
      setMontoTransferencia("");
      setChkEfectivo(false);
      setChkTransferencia(false);
      setBanco("");
      setOperacion("");

      // refrescar facturas pendientes del cliente
      const f = await fetch(
        `http://localhost:8080/api/facturas/pendientes?clienteId=${clienteSeleccionado.id}`
      );
      const list = await f.json();
      setFacturas(Array.isArray(list) ? list : []);
    } catch (err) {
      setErrorMsg(err?.message || "Error al crear pago.");
      console.error("Error creando pago:", err);
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
                <button className="btn btn-primary btn-sm fw-bold" onClick={handleCrearPago} disabled={loading}>
                  {loading ? "Guardando..." : "Crear"}
                </button>
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

              <div className="col-sm-2 ms-auto text-center">
                <button
                  className="btn btn-danger btn-sm fw-bold"
                  type="button"
                  onClick={() => {
                    setErrorMsg("");
                    setOkMsg("");
                    setPagos({});
                    setSeleccionadas({});
                    setMontoEfectivo("");
                    setMontoTransferencia("");
                    setChkEfectivo(false);
                    setChkTransferencia(false);
                    setBanco("");
                    setOperacion("");
                  }}
                >
                  Eliminar
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
                    <input type="text" className="form-control form-control-sm text-center" placeholder="RUC" value={clienteSeleccionado?.ruc || ""} disabled readOnly />
                  </div>
                  <div className="col-sm-8">
                    <input type="text" className="form-control form-control-sm text-center" placeholder="Nombre" value={clienteSeleccionado?.nombre || ""} disabled readOnly />
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
                        {facturasOrdenadas.length === 0 ? (
                          <tr>
                            <td colSpan="6">Sin facturas pendientes</td>
                          </tr>
                        ) : (
                          facturasOrdenadas.map((factura) => {
                            const id = Number(factura.id);
                            const saldo = Number(factura.saldo || 0);

                            return (
                              <tr key={factura.id}>
                                <td>
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={!!seleccionadas[id]}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setSeleccionadas((prev) => ({ ...prev, [id]: checked }));

                                      if (!checked) {
                                        setPagos((prev) => {
                                          const copy = { ...prev };
                                          delete copy[id];
                                          return copy;
                                        });
                                      }
                                    }}
                                  />
                                </td>

                                <td>{factura.numeroFactura || factura.id}</td>
                                <td>{factura.fechaEmision}</td>
                                <td>{Number(factura.total || 0).toLocaleString("es-PY")}</td>
                                <td>{saldo.toLocaleString("es-PY")}</td>

                                <td>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    className="form-control form-control-sm text-end"
                                    value={pagos[id] ?? ""}
                                    disabled={!seleccionadas[id]}
                                    onFocus={(e) => {
                                      setPagos((prev) => ({ ...prev, [id]: "" }));
                                      setTimeout(() => e.target.select(), 0);
                                    }}
                                    onChange={(e) => {
                                      const raw = e.target.value;

                                      if (raw.trim() === "") {
                                        setPagos((prev) => {
                                          const copy = { ...prev };
                                          delete copy[id];
                                          return copy;
                                        });
                                        return;
                                      }

                                      const digits = soloDigitos(raw);
                                      const formatted = formatearMilesPY(digits);

                                      const num = aNumero(formatted);
                                      const finalNum = num > saldo ? saldo : num;
                                      const finalFormatted = finalNum > 0 ? formatearMilesPY(String(finalNum)) : "";

                                      setPagos((prev) => ({ ...prev, [id]: finalFormatted }));
                                    }}
                                    placeholder="0"
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
                      <input className="form-check-input" type="checkbox" id="chkEfectivo" checked={chkEfectivo} onChange={toggleEfectivo} />
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
                      disabled={!chkEfectivo}
                      value={montoEfectivo}
                      onFocus={(e) => {
                        setMontoEfectivo("");
                        setTimeout(() => e.target.select(), 0);
                      }}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw.trim() === "") {
                          setMontoEfectivo("");
                          return;
                        }
                        const digits = soloDigitos(raw);
                        const formatted = formatearMilesPY(digits);
                        setMontoEfectivo(formatted);
                      }}
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
                      value={Math.max(0, vueltoEfectivo).toLocaleString("es-PY")}
                      disabled
                      readOnly
                    />
                  </div>
                </div>

                <div className="row mb-1">
                  <div className="col-sm-12">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="chkTransferencia" checked={chkTransferencia} onChange={toggleTransferencia} />
                      <label className="form-check-label fw-bold" htmlFor="chkTransferencia">
                        Transferencia Bancaria
                      </label>
                    </div>
                  </div>
                </div>

                <div className="row mb-1">
                  <div className="col-sm-12">
                    <select className="form-select form-select-sm text-center" id="banco" disabled={!chkTransferencia} value={banco} onChange={(e) => setBanco(e.target.value)}>
                      <option disabled value="">
                        Seleccione banco
                      </option>
                      <option value="ITAU">Itaú</option>
                      <option value="UENO">Ueno</option>
                      <option value="CONTINENTAL">Continental</option>
                    </select>
                  </div>
                </div>

                <div className="row mb-1">
                  <div className="col-sm-12">
                    <input
                      type="number"
                      className="form-control form-control-sm text-end"
                      id="operacion"
                      placeholder="Nº de Operación"
                      disabled={!chkTransferencia}
                      value={operacion}
                      onChange={(e) => setOperacion(e.target.value)}
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
                      disabled={!chkTransferencia}
                      value={montoTransferencia}
                      onFocus={(e) => {
                        setMontoTransferencia("");
                        setTimeout(() => e.target.select(), 0);
                      }}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw.trim() === "") {
                          setMontoTransferencia("");
                          return;
                        }
                        const digits = soloDigitos(raw);
                        const formatted = formatearMilesPY(digits);
                        setMontoTransferencia(formatted);
                      }}
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
                      value={Math.max(0, efectivoDevueltoTransfer).toLocaleString("es-PY")}
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
    </div>
  );
}
