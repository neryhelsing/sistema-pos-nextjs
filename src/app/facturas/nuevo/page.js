"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function NuevaFacturaPage() {
  // Contado - Crédito
  const [tipoFactura, setTipoFactura] = useState("FCC"); // 🔵 Estado para Contado/Crédito

  // Cliente
  const [clienteQuery, setClienteQuery] = useState("");
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [clienteSeleccionadoIndex, setClienteSeleccionadoIndex] = useState(-1);

  // Totales
  const [importe, setImporte] = useState(0);
  const [total, setTotal] = useState(0);
  const [metodoPago, setMetodoPago] = useState("");
  const [codigoOperacion, setCodigoOperacion] = useState("");

  // Producto
  const [productoQuery, setProductoQuery] = useState("");
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [productoIndex, setProductoIndex] = useState(-1);
  const [cantidad, setCantidad] = useState("");
  const cantidadInputRef = useRef(null);
  const productoQueryRef = useRef(null); // ✅ Nuevo ref para el input de búsqueda de productos


  // Detalles agregados
  const [detalles, setDetalles] = useState([]);

  // Buscar clientes
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

  // Buscar productos
  useEffect(() => {
    const fetchProductos = async () => {
      if (productoQuery.length >= 2) {
        try {
          const response = await axios.get("http://localhost:8080/api/productos", {
            params: { query: productoQuery, page: 0, size: 10 },
          });

          const resultados = response.data.content || [];
          setProductosFiltrados(resultados);

          if (resultados.length === 1) {
  const prod = resultados[0];
  if (prod.codigoBarra === productoQuery.trim()) {
    setProductoSeleccionado(prod);
    setTimeout(() => {
      setProductoQuery("");
      setProductoIndex(-1);
      if (cantidadInputRef.current) {
        cantidadInputRef.current.focus();
      }
    }, 100);
  }
}

        } catch (error) {
          console.error("Error al buscar productos:", error);
          setProductosFiltrados([]);
        }
      } else {
        setProductosFiltrados([]);
      }
    };

    fetchProductos();
  }, [productoQuery]);


  // Calcular total
  useEffect(() => {
    const totalFactura = detalles.reduce((acc, item) => acc + item.total, 0);
    setTotal(totalFactura);
  }, [detalles]);

  const handleSeleccionarCliente = (cliente) => {
  setClienteSeleccionado(cliente);
  setClienteQuery("");
  setClientesFiltrados([]);
  setClienteSeleccionadoIndex(-1);

  // ✅ Enfocar automáticamente en el input de búsqueda de productos
  setTimeout(() => {
    if (productoQueryRef.current) {
      productoQueryRef.current.focus();
    }
  }, 100);
};


  const handleSeleccionarProducto = (producto) => {
  setProductoSeleccionado(producto);
  setProductoQuery("");
  setProductosFiltrados([]);
  setProductoIndex(-1);

  setTimeout(() => {
    if (cantidadInputRef.current) {
      cantidadInputRef.current.focus(); // ✅ foco al input de cantidad
    }
  }, 100); // pequeño delay para asegurar que el render se complete
};


    const handleAgregarProducto = () => {
      if (!productoSeleccionado || !cantidad || isNaN(cantidad) || cantidad <= 0) return;

      const codBarra = productoSeleccionado.codigoBarra;
      const cantidadNueva = Number(cantidad);

      const yaExiste = detalles.find((item) => item.codBarra === codBarra);

      let nuevosDetalles;
      if (yaExiste) {
        // ✅ Si ya existe, actualizamos cantidad y total
        nuevosDetalles = detalles.map((item) => {
          if (item.codBarra === codBarra) {
            const nuevaCantidad = item.cantidad + cantidadNueva;
            const nuevoTotal = nuevaCantidad * item.precioUnitario;
            return { ...item, cantidad: nuevaCantidad, total: nuevoTotal };
          }
          return item;
        });
      } else {
        // ✅ Si no existe, agregamos nuevo producto
        const totalItem = productoSeleccionado.precio * cantidadNueva;
        const nuevoItem = {
          id: Date.now() + Math.random(),
          productoId: productoSeleccionado.id, // ← ✅ ESTE CAMPO ES NECESARIO
          codBarra: codBarra,
          nombre: productoSeleccionado.nombre,
          cantidad: cantidadNueva,
          precioUnitario: productoSeleccionado.precio,
          total: totalItem,
        };
        nuevosDetalles = [nuevoItem, ...detalles]; // ✅ Agregar al inicio en vez de al final
      }

      setDetalles(nuevosDetalles);
      setProductoSeleccionado(null);
      setCantidad("");

      // ✅ Volver a enfocar el input de búsqueda de productos
      setTimeout(() => {
        if (productoQueryRef.current) {
          productoQueryRef.current.focus();
        }
      }, 100);
    };



  const handleEliminarItem = (id) => {
    setDetalles(detalles.filter((item) => item.id !== id));
  };



    const router = useRouter();

    const handleCrearFactura = async () => {
      if (!clienteSeleccionado || detalles.length === 0) {
        alert("Debes seleccionar un cliente y al menos un producto.");
        return;
      }

      const facturaData = {
        numeroFactura: "", // Puede ser un código temporal o generado en backend
        fechaEmision: new Date().toISOString(), // formato ISO
        clienteId: clienteSeleccionado?.id, // debe ser un número válido
        total: total, // asegúrate de que sea número, no string
        estado: "Borrador", // o "Emitido"
        tipo: tipoFactura, // "FCC" o "FCR"
        detalles: detalles.map((p) => ({
            productoId: p.productoId,
            cantidad: p.cantidad,
            precioUnitario: p.precioUnitario,
        }))
      };

      try {
        const response = await axios.post("http://localhost:8080/api/facturas", facturaData);
        const id = response.data;
        router.push(`/facturas/editar/${id}`);
      } catch (error) {
        console.error("Error al guardar la factura:", error);
        alert("Ocurrió un error al guardar la factura.");
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
                                      onClick={handleCrearFactura}
                                    >
                                      Crear
                                    </button>
                                </div>

                                <div className="col-sm-3 text-center">
                                    <button className="btn btn-success btn-sm fw-bold w-100">Emitir</button>
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
                                    >
                                      {tipoFactura}
                                    </button>
                                    <ul className="dropdown-menu w-100">
                                      <li>
                                        <button
                                          className="dropdown-item"
                                          type="button"
                                          onClick={() => setTipoFactura("FCC")}
                                        >
                                          FCC
                                        </button>
                                      </li>
                                      <li>
                                        <button
                                          className="dropdown-item"
                                          type="button"
                                          onClick={() => setTipoFactura("FCR")}
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
                                      value="Borrador"
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
                                      value="100000"
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
                                      value="100000"
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
                                      value="26/04/2025"
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
                          value={clienteQuery}
                          onChange={(e) => setClienteQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (clientesFiltrados.length === 0) return;
                            if (e.key === "ArrowDown") {
                              e.preventDefault();
                              setClienteSeleccionadoIndex((prev) => (prev < clientesFiltrados.length - 1 ? prev + 1 : 0));
                            } else if (e.key === "ArrowUp") {
                              e.preventDefault();
                              setClienteSeleccionadoIndex((prev) => (prev > 0 ? prev - 1 : clientesFiltrados.length - 1));
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
                                className={`list-group-item list-group-item-action ${index === clienteSeleccionadoIndex ? "active" : ""}`}
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
                                      className="form-control form-control-sm text-center bg-black text-info fw-bold"
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
                                      className="form-control form-control-sm text-end"
                                      placeholder="10000000"
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
                                      className="form-control form-control-sm text-end"
                                      placeholder="10000000"
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
                              onClick={() => {
                                alert("Primero debe crear la factura antes de cargar un pago.");
                              }}
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
                      value={productoQuery}
                      onChange={(e) => setProductoQuery(e.target.value)} 
                      ref={productoQueryRef}
                      onKeyDown={(e) => {
                        if (productosFiltrados.length === 0) return;
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setProductoIndex((prev) => (prev < productosFiltrados.length - 1 ? prev + 1 : 0));
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setProductoIndex((prev) => (prev > 0 ? prev - 1 : productosFiltrados.length - 1));
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
                            className={`list-group-item list-group-item-action ${index === productoIndex ? "active" : ""}`}
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
                    <input type="text" className="form-control form-control-sm text-center" value={productoSeleccionado?.codigoBarra || ""} disabled readOnly />
                  </div>
                  <div className="col">
                    <input type="text" className="form-control form-control-sm text-center" value={productoSeleccionado?.nombre || ""} disabled readOnly />
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
                      value={cantidad}
                      onChange={(e) => setCantidad(e.target.value)}
                      ref={cantidadInputRef}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAgregarProducto(); // ✅ Añade directamente al presionar Enter
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
                      className="form-control form-control-sm text-center"
                      value={productoSeleccionado?.precio?.toLocaleString("es-PY") || ""}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
              </div>
              <div className="col-2">
                <div className="row">
                  <div className="col text-center">
                    <button className="btn btn-warning btn-sm" onClick={handleAgregarProducto}>
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
                        <button className="btn btn-sm btn-danger" onClick={() => handleEliminarItem(item.id)}>DEL</button>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}