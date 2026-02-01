"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";

export default function EditarFacturaPage() {
  const { id } = useParams();
  const router = useRouter();

  const [tipoFactura, setTipoFactura] = useState("FCC");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [clienteQuery, setClienteQuery] = useState("");
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [clienteSeleccionadoIndex, setClienteSeleccionadoIndex] = useState(-1);

  const [productoQuery, setProductoQuery] = useState("");
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [productoIndex, setProductoIndex] = useState(-1);
  const [cantidad, setCantidad] = useState("");
  const [precioUnitario, setPrecioUnitario] = useState("");


  const cantidadInputRef = useRef(null);
  const productoQueryRef = useRef(null);

  // ✅ Helpers PY: miles con punto (ej: 3000 -> "3.000")
  const formatearMilesPY = (valor) => {
    if (valor === null || valor === undefined) return "";
    const digits = String(valor).replace(/\D/g, ""); // solo números
    if (!digits) return "";
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseMilesPY = (valor) => {
    if (valor === null || valor === undefined) return 0;
    const digits = String(valor).replace(/\D/g, "");
    return digits ? Number(digits) : 0;
  };


  const [detalles, setDetalles] = useState([]);
  const [total, setTotal] = useState(0);
  const [saldo, setSaldo] = useState(0);
  const [montoAplicado, setMontoAplicado] = useState(0); // ✅ NUEVO
  const [detallesOriginales, setDetallesOriginales] = useState("");
  const [facturaOriginal, setFacturaOriginal] = useState(null);

  const [loadingEmitir, setLoadingEmitir] = useState(false);

  // ✅ Bloqueos de edición
  const estadoFactura = (facturaOriginal?.estado || "BORRADOR").toUpperCase();
  const bloqueoTotal = estadoFactura === "EMITIDA";          // EMITIDA: no se cambia nada
  const bloqueoClienteYProductos = montoAplicado > 0;        // con pagos: no tocar cliente ni items

  // ✅ Advertir salida si la factura sigue en BORRADOR (y ya cargó desde backend)
  const advertirSalida = !!facturaOriginal && estadoFactura === "BORRADOR";

  // ✅ Helper: serializa detalles en orden estable para comparar sin falsos positivos
  const serializarDetallesNormalizados = (arr) => {
    const normalizados = (arr || [])
      .map((d) => ({
        productoId: Number(d.productoId),
        cantidad: Number(d.cantidad),
        precioUnitario: Number(d.precioUnitario),
      }))
      .sort((a, b) => a.productoId - b.productoId); // orden fijo

    return JSON.stringify(normalizados);
  };


  // ✅ Helper: formatear fecha dd/MM/yyyy
  const formatearFecha = (fecha) => {
  if (!fecha) return "";

  // Si viene como "YYYY-MM-DD" (DATE), no usar Date() (evita el -1 día por timezone)
  if (typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    const [yyyy, mm, dd] = fecha.split("-");
    return `${dd}/${mm}/${yyyy}`;
  }

  // Si viene con hora (ISO), ahí sí parseamos normal
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
  };


  // ✅ Reutilizable: cargar factura
  const cargarFactura = useCallback(async () => {
    if (!id) return;

    try {
      const res = await axios.get(`http://localhost:8080/api/facturas/${id}`);
      const factura = res.data;

      setTipoFactura(factura.tipo || "FCC");
      setFacturaOriginal(factura);

      const toNum = (v) => (v === null || v === undefined ? 0 : Number(v));

      setTotal(toNum(factura.total));
      setSaldo(toNum(factura.saldo));
      setMontoAplicado(toNum(factura.montoAplicado));


      // 🔄 Obtener datos del cliente
      const clienteRes = await axios.get(
        `http://localhost:8080/api/clientes/${factura.clienteId}`
      );
      setClienteSeleccionado(clienteRes.data);

      // 🔄 Adaptar productos con detalles completos
      const adaptados = await Promise.all(
        (factura.detalles || []).map(async (d) => {
          const prodRes = await axios.get(
            `http://localhost:8080/api/productos/${d.productoId}`
          );
          const producto = prodRes.data;

          return {
            id: producto.id,
            productoId: producto.id,
            codBarra: producto.codigoBarra,
            nombre: producto.nombre,
            precioEditable: producto.precioEditable, // ✅ NUEVO
            cantidad: d.cantidad,
            precioUnitario: d.precioUnitario,
            total: d.cantidad * d.precioUnitario,
          };
        })
      );

      setDetalles(adaptados.reverse());
      // ✅ Guardar "originales" en formato SIMPLE para comparar correctamente
      setDetallesOriginales(serializarDetallesNormalizados(factura.detalles));

      // ✅ saldo ya seteado desde BD arriba
    } catch (err) {
      console.error("Error al cargar factura:", err);
      alert("No se pudo cargar la factura. Verifica que el ID sea válido.");
    }
  }, [id]);

  // 🔁 Cargar datos existentes
  useEffect(() => {
    cargarFactura();
  }, [cargarFactura]);

  // ⚠️ Advertencia al salir si la factura está en BORRADOR
  useEffect(() => {
    if (!advertirSalida) return;

    // 1) Cerrar pestaña / recargar / cambiar URL manual
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ""; // mensaje estándar del navegador
    };

    // 2) Click en enlaces (<a>) dentro de la app (incluye <Link /> de Next)
    const handleDocumentClick = (e) => {
      // Solo botón izquierdo, sin teclas especiales (ctrl/shift/alt/meta)
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      // Buscar el <a> más cercano
      const anchor = e.target?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Ignorar anchors, javascript:, descargas, target=_blank
      if (href.startsWith("#")) return;
      if (href.startsWith("javascript:")) return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;

      // Si es la misma página, no molestar
      const url = new URL(anchor.href, window.location.href);
      if (url.href === window.location.href) return;

      // Confirmación (2 opciones: Quedarme / Continuar)
      const ok = window.confirm(
        "⚠️ Esta factura aún no fue EMITIDA (estado BORRADOR).\n\n" +
          "• ACEPTAR: salir y continuar\n" +
          "• CANCELAR: quedarme en esta página"
      );

      if (!ok) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // 3) Botón Atrás/Adelante del navegador
    // Truco: empujamos un estado al historial y, si intenta volver, confirmamos.
    const pushDummyState = () => {
      try {
        window.history.pushState({ __pos_guard: true }, "", window.location.href);
      } catch {}
    };

    const handlePopState = () => {
      const ok = window.confirm(
        "⚠️ Esta factura aún no fue EMITIDA (estado BORRADOR).\n\n" +
          "• ACEPTAR: salir y continuar\n" +
          "• CANCELAR: quedarme en esta página"
      );

      if (!ok) {
        // Re-poner el estado para permanecer
        pushDummyState();
      }
      // Si OK, dejamos que siga (no bloqueamos)
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true); // captura
    window.addEventListener("popstate", handlePopState);

    // Cargar "trampa" de historial para back/forward
    pushDummyState();

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [advertirSalida]);


  // 🔁 Recalcular total
  useEffect(() => {
    const totalFactura = detalles.reduce((acc, item) => acc + item.total, 0);
    setTotal(totalFactura);
  }, [detalles]);

  // 🔍 Buscar clientes
  useEffect(() => {
    const fetchClientes = async () => {
      if (clienteQuery.length >= 2) {
        try {
          const response = await axios.get("http://localhost:8080/api/clientes", {
            params: { query: clienteQuery, page: 0, size: 10 },
          });
          setClientesFiltrados(response.data.content || []);
        } catch (error) {
          console.error("Error al buscar clientes:", error);
        }
      } else {
        setClientesFiltrados([]);
      }
    };
    fetchClientes();
  }, [clienteQuery]);

  const handleSeleccionarCliente = (cliente) => {
    if (bloqueoTotal || bloqueoClienteYProductos) {
      alert(
        bloqueoTotal
          ? "No se puede modificar: la factura ya está EMITIDA."
          : "No se puede cambiar el cliente: ya hay pagos aplicados."
      );
      return;
    }

    setClienteSeleccionado(cliente);
    setClienteQuery("");
    setClientesFiltrados([]);
    setClienteSeleccionadoIndex(-1);

    setTimeout(() => {
      if (productoQueryRef.current) {
        productoQueryRef.current.focus();
      }
    }, 100);
  };


  // 🔍 Buscar productos
  useEffect(() => {
    const fetchProductos = async () => {
      if (productoQuery.length >= 2) {
        try {
          const response = await axios.get("http://localhost:8080/api/productos", {
            params: { query: productoQuery, page: 0, size: 10 },
          });

          const resultados = response.data.content || [];
          setProductosFiltrados(resultados);

          if (resultados.length === 1 && resultados[0].codigoBarra === productoQuery.trim()) {
            setProductoSeleccionado(resultados[0]);
            setTimeout(() => cantidadInputRef.current?.focus(), 100);
          }
        } catch (error) {
          console.error("Error al buscar productos:", error);
        }
      } else {
        setProductosFiltrados([]);
      }
    };
    fetchProductos();
  }, [productoQuery]);

  const handleSeleccionarProducto = (producto) => {
    setProductoSeleccionado(producto);
    setPrecioUnitario(formatearMilesPY(producto?.precio ?? ""));
    setProductoQuery("");
    setProductosFiltrados([]);
    setProductoIndex(-1);
    setTimeout(() => cantidadInputRef.current?.focus(), 100);
  };

  const handleAgregarProducto = () => {
    // 🚫 No permitir agregar items si hay pagos aplicados o si está EMITIDA
    if (bloqueoTotal || bloqueoClienteYProductos) {
      alert(
        bloqueoTotal
          ? "No se puede modificar: la factura ya está EMITIDA."
          : "No se puede agregar productos: ya hay pagos aplicados."
      );
      return;
    }


    if (!productoSeleccionado || !cantidad || isNaN(cantidad) || cantidad <= 0) return;

    const codBarra = productoSeleccionado.codigoBarra;
    const cantidadNueva = Number(cantidad);

    const yaExiste = detalles.find((item) => item.codBarra === codBarra);

    let nuevosDetalles;
    if (yaExiste) {
      nuevosDetalles = detalles.map((item) => {
        if (item.codBarra === codBarra) {
          const nuevaCantidad = item.cantidad + cantidadNueva;
          const nuevoTotal = nuevaCantidad * item.precioUnitario;
          return { ...item, cantidad: nuevaCantidad, total: nuevoTotal };
        }
        return item;
      });
    } else {
      const pu = parseMilesPY(precioUnitario);
      if (isNaN(pu) || pu <= 0) return;

      const nuevoItem = {
        id: productoSeleccionado.id,
        productoId: productoSeleccionado.id,
        codBarra,
        nombre: productoSeleccionado.nombre,
        precioEditable: productoSeleccionado.precioEditable, // ✅ guardamos flag
        cantidad: cantidadNueva,
        precioUnitario: pu,
        total: pu * cantidadNueva,
      };

      nuevosDetalles = [nuevoItem, ...detalles];
    }

    setDetalles(nuevosDetalles);
    setProductoSeleccionado(null);
    setCantidad("");
    setPrecioUnitario("");
    setTimeout(() => productoQueryRef.current?.focus(), 100);
  };

  const handleEliminarItem = (id) => {
    if (bloqueoTotal || bloqueoClienteYProductos) {
      alert(
        bloqueoTotal
          ? "No se puede modificar: la factura ya está EMITIDA."
          : "No se puede eliminar items: ya hay pagos aplicados."
      );
      return;
    }

    setDetalles(detalles.filter((item) => item.id !== id));
  };



  const handleIrAPagar = () => {
    // ✅ detectar cambios pendientes (detalles vs originales)
    const actualesSerializados = serializarDetallesNormalizados(detalles);
    const productosModificados = actualesSerializados !== detallesOriginales;

    // ✅ detectar si cambió el cliente o el tipo
    const clienteCambiado = clienteSeleccionado?.id !== facturaOriginal?.clienteId;
    const tipoCambiado = tipoFactura !== facturaOriginal?.tipo;

    // ✅ Regla: si hay cambios, debe hacer Update antes de pagar
    if (productosModificados || clienteCambiado || tipoCambiado) {
      alert("Hay cambios en la factura. Primero presioná Update para guardar, y después Pagá.");
      return;
    }

    router.push(`/pagos/nuevo?facturaId=${id}`);
  };




  const handleActualizarFactura = async () => {
    // 🚫 Si está EMITIDA no se puede actualizar nada
    if (bloqueoTotal) {
      alert("No se puede actualizar: la factura ya está EMITIDA.");
      return;
    }


    if (!clienteSeleccionado || detalles.length === 0) {
      alert("Debes seleccionar un cliente y al menos un producto.");
      return;
    }

    const actualesSerializados = serializarDetallesNormalizados(detalles);

    // ✅ comparar ya normalizado (sin problema de orden)
    const productosModificados = actualesSerializados !== detallesOriginales;
    const clienteCambiado = clienteSeleccionado.id !== facturaOriginal?.clienteId;
    const tipoCambiado = tipoFactura !== facturaOriginal?.tipo;


    // ✅ Si hay pagos aplicados, solo permitimos actualizar el TIPO (FCC/FCR)
    if (montoAplicado > 0) {
      if (productosModificados || clienteCambiado) {
        alert("Con pagos aplicados no se puede modificar cliente ni productos. Solo se permite cambiar el tipo (FCC/FCR).");
        return;
      }

      if (!tipoCambiado) {
        alert("No se detectaron cambios.");
        return;
      }
    }



    if (!productosModificados && !clienteCambiado && !tipoCambiado) {
      alert("No se detectaron cambios.");
      return;
    }

    const facturaData = {
      clienteId: clienteSeleccionado.id,
      tipo: tipoFactura,
      total: total,
      fechaEmision: new Date(),
      detalles: detalles.map((item) => ({
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
      })),
    };

    try {
      await axios.put(`http://localhost:8080/api/facturas/${id}`, facturaData);
      alert("Factura actualizada correctamente");
      setDetallesOriginales(actualesSerializados);

      // ✅ volver a cargar para reflejar todo
      await cargarFactura();
      router.refresh();
    } catch (error) {
      console.error("Error al actualizar factura:", error);
      alert("Ocurrió un error al actualizar la factura.");
    }
  };

  // ✅ emitir (FCC o FCR) con validación por saldo/estado (backend manda)
  const handleEmitirFactura = async () => {
    if (facturaOriginal?.estado?.toUpperCase() === "EMITIDA") {
        alert("Esta factura ya está emitida.");
        return;
      }

      if (!id) {
        alert("Primero debes crear la factura antes de emitir.");
        return;
      }

      // ✅ NO permitir emitir si hay cambios sin guardar (Update)
      const actualesSerializados = serializarDetallesNormalizados(detalles);
      const productosModificados = actualesSerializados !== detallesOriginales;
      const clienteCambiado = clienteSeleccionado?.id !== facturaOriginal?.clienteId;
      const tipoCambiado = tipoFactura !== facturaOriginal?.tipo;

      if (productosModificados || clienteCambiado || tipoCambiado) {
        alert("Hay cambios en la factura. Primero presioná Update para guardar, y después Emitir.");
        return;
      }

      // ✅ regla: si quiere emitir en FCC, debe estar pagada completa (saldo 0)
      if (tipoFactura === "FCC" && Number(saldo) > 0) {
        alert("Para emitir en FCC (contado) el saldo debe ser 0. Cargá el pago completo primero.");
        return;
      }
    try {
      setLoadingEmitir(true);

      // ✅ endpoint según tipo
      const url =
        tipoFactura === "FCC"
          ? `http://localhost:8080/api/facturas/${id}/emitir-contado`
          : `http://localhost:8080/api/facturas/${id}/emitir-credito`;

      const res = await axios.post(url);

      alert(`Factura emitida. Nº: ${res.data}`);

      // ✅ volver a cargar para reflejar estado/numero/fecha/saldo/pagado
      await cargarFactura();
      router.refresh();
    } catch (error) {
      console.error("Error al emitir factura:", error);
      const msg =
        error?.response?.data ||
        "Ocurrió un error al emitir la factura. Verifica el estado e intenta nuevamente.";
      alert(msg);
    } finally {
      setLoadingEmitir(false);
    }
  };


  return (
    <div className="container-fluid bg-dark text-white p-2">
      {/* 🟩 CINTA DE OPCIONES */}
      <div className="row mb-2">
        <div className="col-sm-12">
          <div className="border border-success bg-light text-dark p-2 rounded">
            <div className="row">
              <div className="col-sm-3">
                <div className="row g-1">
                  <div className="col-sm-3 text-center">
                    <button
                      className="btn btn-primary btn-sm fw-bold w-100"
                      onClick={handleActualizarFactura}
                      disabled={bloqueoTotal}
                      title={
                        bloqueoTotal
                          ? "Factura EMITIDA: no se puede modificar"
                          : montoAplicado > 0
                          ? "Con pagos aplicados: solo se permite Update para cambiar el tipo (FCC/FCR)"
                          : ""
                      }
                    >
                      Update
                    </button>
                  </div>

                  <div className="col-sm-3 text-center">
                    <button
                      className="btn btn-success btn-sm fw-bold w-100"
                      onClick={handleEmitirFactura}
                      disabled={loadingEmitir || bloqueoTotal}
                    >
                      {loadingEmitir ? "Emitiendo..." : "Emitir"}
                    </button>
                  </div>

                  <div className="col-sm-3 text-center">
                    <button className="btn btn-danger btn-sm fw-bold w-100">Anular</button>
                  </div>

                  <div className="col-sm-3 text-center">
                    <div className="dropdown">
                      <button
                        className="btn btn-secondary btn-sm fw-bold dropdown-toggle w-100"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        disabled={bloqueoTotal}
                      >
                        {tipoFactura}
                      </button>
                      <ul className="dropdown-menu w-100">
                        <li>
                          <button
                            className="dropdown-item"
                            type="button"
                            onClick={() => !bloqueoTotal && setTipoFactura("FCC")}
                          >
                            FCC
                          </button>
                        </li>
                        <li>
                          <button
                            className="dropdown-item"
                            type="button"
                            onClick={() => !bloqueoTotal && setTipoFactura("FCR")}
                          >
                            FCR
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-sm-2">
                <div className="row g-1">
                  <div className="col-auto fw-bold">Estado:</div>
                  <div className="col-sm-6 fw-bold text-center">
                    <input
                      type="text"
                      className="form-control form-control-sm text-center"
                      value={facturaOriginal?.estado || "BORRADOR"}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="col-sm-2">
                <div className="row g-1">
                  <div className="col-auto fw-bold">Draft:</div>
                  <div className="col">
                    <input
                      type="text"
                      className="form-control form-control-sm text-center"
                      value={id || ""}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="col-sm-3">
                <div className="row g-1">
                  <div className="col-auto fw-bold">Factura Nº:</div>
                  <div className="col">
                    <input
                      type="text"
                      className="form-control form-control-sm text-center"
                      value={facturaOriginal?.numeroFactura || ""}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="col-sm-2">
                <div className="row g-1">
                  <div className="col-auto fw-bold">Emisión:</div>
                  <div className="col">
                    <input
                      type="text"
                      className="form-control form-control-sm text-center"
                      value={formatearFecha(facturaOriginal?.fechaEmision)}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🟩 PRIMERA FILA: CLIENTES + MEDIO DE PAGOS */}
      <div className="row mb-2">
        <div className="col-sm-6">
          <div className="border border-success bg-light text-dark p-2 rounded">
            {/* Primera fila: Buscador de cliente */}
            <div className="row mb-2 position-relative">
              <div className="col-sm-12">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Buscar cliente..."
                  disabled={bloqueoTotal || bloqueoClienteYProductos}
                  value={clienteQuery}
                  onChange={(e) => setClienteQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (clientesFiltrados.length === 0) return;
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setClienteSeleccionadoIndex((prev) =>
                        prev < clientesFiltrados.length - 1 ? prev + 1 : 0
                      );
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setClienteSeleccionadoIndex((prev) =>
                        prev > 0 ? prev - 1 : clientesFiltrados.length - 1
                      );
                    } else if (e.key === "Enter" && clienteSeleccionadoIndex >= 0) {
                      handleSeleccionarCliente(clientesFiltrados[clienteSeleccionadoIndex]);
                    }
                  }}
                />

                {clientesFiltrados.length > 0 && (
                  <ul className="list-group position-absolute z-3 w-100">
                    {clientesFiltrados.map((cliente, index) => (
                      <li
                        key={cliente.id}
                        className={`list-group-item list-group-item-action ${
                          index === clienteSeleccionadoIndex ? "active" : ""
                        }`}
                        onClick={() => handleSeleccionarCliente(cliente)}
                        style={{ cursor: "pointer" }}
                      >
                        {cliente.ruc} - {cliente.nombre}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Segunda fila: RUC y Nombre del Cliente */}
            <div className="row g-2">
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
                  placeholder="Nombre del Cliente"
                  value={clienteSeleccionado?.nombre || ""}
                  disabled
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6">
          <div className="border border-success bg-light text-dark p-2 rounded">
            {/* Primera fila: Total y Saldo */}
            <div className="row mb-2">
              {/* Total */}
              <div className="col-sm-6">
                <div className="row">
                  <div className="col-sm-6">
                    <label className="form-label fw-bold mb-1">Total:</label>
                  </div>
                  <div className="col-sm-6">
                    <input
                      type="text"
                      className="form-control form-control-sm text-end bg-black text-info fw-bold"
                      value={total.toLocaleString("es-PY")}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Saldo */}
              <div className="col-sm-6">
                <div className="row">
                  <div className="col-sm-6">
                    <label className="form-label fw-bold mb-1">Saldo:</label>
                  </div>

                  <div className="col-sm-6">
                    <input
                      type="text"
                      className="form-control form-control-sm text-end bg-black text-warning fw-bold"
                      value={saldo.toLocaleString("es-PY")}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Segunda fila: Importe Aplicado y Botón Pagar */}
            <div className="row">
              {/* Importe Aplicado */}
              <div className="col-sm-6">
                <div className="row">
                  <div className="col-sm-6">
                    <label className="form-label fw-bold mb-1">Pagado:</label>
                  </div>

                  <div className="col-sm-6">
                    <input
                      type="text"
                      className="form-control form-control-sm text-end bg-black text-success fw-bold"
                      value={montoAplicado.toLocaleString("es-PY")}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Botón Pagar */}
              <div className="col-sm-6 text-center">
                <button
                  type="button"
                  className="btn btn-dark btn-sm"
                  onClick={handleIrAPagar}
                >
                  Pagar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🟩 SEGUNDA FILA: productos */}
      <div className="row mb-2">
        <div className="col-sm-12">
          <div className="border border-success bg-light text-dark p-2 rounded">
            <div className="row align-items-center">
              <div className="col-8">
                <div className="row mb-3">
                  <div className="col">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Buscar producto por nombre o código barra..."
                      disabled={bloqueoTotal || bloqueoClienteYProductos}
                      value={productoQuery}
                      onChange={(e) => setProductoQuery(e.target.value)}
                      ref={productoQueryRef}
                      onKeyDown={(e) => {
                        if (productosFiltrados.length === 0) return;
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setProductoIndex((prev) =>
                            prev < productosFiltrados.length - 1 ? prev + 1 : 0
                          );
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setProductoIndex((prev) =>
                            prev > 0 ? prev - 1 : productosFiltrados.length - 1
                          );
                        } else if (e.key === "Enter" && productoIndex >= 0) {
                          handleSeleccionarProducto(productosFiltrados[productoIndex]);
                        }
                      }}
                    />
                    {productosFiltrados.length > 0 && (
                      <ul className="list-group position-absolute z-3 w-100">
                        {productosFiltrados.map((p, index) => (
                          <li
                            key={p.id}
                            className={`list-group-item list-group-item-action ${
                              index === productoIndex ? "active" : ""
                            }`}
                            onClick={() => handleSeleccionarProducto(p)}
                            style={{ cursor: "pointer" }}
                          >
                            {p.codigoBarra} - {p.nombre}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="row g-2">
                  <div className="col-3 text-center fw-bold">COD. BARRA</div>
                  <div className="col text-center fw-bold">PRODUCTO</div>
                </div>
                <div className="row g-2">
                  <div className="col-3">
                    <input
                      type="text"
                      className="form-control form-control-sm text-center"
                      value={productoSeleccionado?.codigoBarra || ""}
                      disabled
                      readOnly
                    />
                  </div>
                  <div className="col">
                    <input
                      type="text"
                      className="form-control form-control-sm text-center"
                      value={productoSeleccionado?.nombre || ""}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
              </div>
              <div className="col-2">
                <div className="row mb-3">
                  <div className="col">
                    <input
                      type="number"
                      className="form-control form-control-sm text-center bg-white text-black"
                      placeholder="Cantidad..."
                      min="1"
                      disabled={bloqueoTotal || bloqueoClienteYProductos}
                      value={cantidad}
                      onChange={(e) => setCantidad(e.target.value)}
                      ref={cantidadInputRef}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAgregarProducto();
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col text-center fw-bold">PRECIO UNIDAD</div>
                </div>
                <div className="row">
                  <div className="col">
                    <input
                      type="text"
                      className={`form-control form-control-sm text-center ${
                        productoSeleccionado && !productoSeleccionado.precioEditable ? "text-muted" : ""
                      }`}
                      value={precioUnitario}
                      disabled={
                        !productoSeleccionado ||
                        bloqueoTotal ||
                        bloqueoClienteYProductos ||
                        (productoSeleccionado && !productoSeleccionado.precioEditable)
                      }
                      onFocus={() => {
                        // ✅ si es editable, al hacer click se limpia para escribir directo
                        if (productoSeleccionado?.precioEditable && montoAplicado === 0) setPrecioUnitario("");
                      }}
                      onChange={(e) => {
                        // ✅ permitir escribir y mantener miles con punto
                        const digits = e.target.value.replace(/\D/g, "");
                        setPrecioUnitario(formatearMilesPY(digits));
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="col-2">
                <div className="row">
                  <div className="col text-center">
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={handleAgregarProducto}
                      disabled={bloqueoTotal || bloqueoClienteYProductos}
                      title={montoAplicado > 0 ? "No se puede agregar items: ya hay pagos aplicados" : ""}
                    >
                      Añadir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🟩 TABLA DE PRODUCTOS */}
      <div className="row">
        <div className="col-sm-12">
          <div className="border border-success bg-light text-dark p-2 rounded">
            <div className="table-responsive">
              <table className="table table-bordered table-hover table-sm text-center align-middle mb-0">
                <thead className="table-success">
                  <tr>
                    <th>Nº</th>
                    <th>COD. BARRA</th>
                    <th>PRODUCTO</th>
                    <th>CANT.</th>
                    <th>PRECIO UNIT.</th>
                    <th>TOTAL</th>
                    <th>ACCIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {detalles.map((item, index) => (
                    <tr key={item.id}>
                      <td>{detalles.length - index}</td>
                      <td>{item.codBarra}</td>
                      <td className="text-start">{item.nombre}</td>
                      <td>{item.cantidad}</td>
                      <td>{item.precioUnitario.toLocaleString("es-PY")}</td>
                      <td>{item.total.toLocaleString("es-PY")}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleEliminarItem(item.id)}
                          disabled={bloqueoTotal || bloqueoClienteYProductos}
                        >
                          DEL
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
