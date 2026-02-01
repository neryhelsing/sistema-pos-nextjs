"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";

export default function EditarProductoPage() {
  const router = useRouter();
  const { id } = useParams();
  const [producto, setProducto] = useState({
    codigoBarra: "",
    nombre: "",
    precio: "",
    cantidad: "",
    precioEditable: false, // ✅ boolean por defecto
    gravado: "10",
  });



  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarProducto = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/productos/${id}`);
        setProducto(response.data);
        setCargando(false);
      } catch (error) {
        setError("Error cargando el producto.");
        console.error("Error:", error);
        setCargando(false);
      }
    };

    if (id) {
      cargarProducto();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "precioEditable") {
      setProducto({ ...producto, [name]: value === "true" });
      return;
    }

    setProducto({ ...producto, [name]: value });
  };


  const validarCampos = () => {
    if (!producto.nombre || !producto.precio || !producto.cantidad) {
      setError("Todos los campos son obligatorios excepto el código de barra.");
      return false;
    }
    if (isNaN(producto.precio) || isNaN(producto.cantidad)) {
      setError("El precio y la cantidad deben ser números.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarCampos()) return;

    try {
      await axios.put(`http://localhost:8080/api/productos/${id}`, producto);
      alert("Producto actualizado con éxito");
      router.push("/productos");
    } catch (error) {
      setError("Hubo un error al actualizar el producto.");
      console.error("Error:", error);
    }
  };

  if (cargando) {
    return <div className="container mt-5 text-center"><h3>Cargando producto...</h3></div>;
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <h2 className="text-center mb-4">Editar Producto</h2>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} className="card p-4 shadow">
            <div className="mb-3">
              <label className="form-label">Código de Barra</label>
              <input
                type="text"
                className="form-control"
                name="codigoBarra"
                value={producto.codigoBarra || ""}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Nombre</label>
              <input
                type="text"
                className="form-control"
                name="nombre"
                value={producto.nombre}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Precio</label>
              <input
                type="number"
                className="form-control"
                name="precio"
                value={producto.precio}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Cantidad</label>
              <input
                type="number"
                className="form-control"
                name="cantidad"
                value={producto.cantidad}
                onChange={handleChange}
                required
              />
            </div>


            <div className="mb-3">
              <label className="form-label">Editable (precio)</label>
              <select
                className="form-select"
                name="precioEditable"
                value={String(producto.precioEditable ?? false)}
                onChange={handleChange}
                required
              >
                <option value="false">No</option>
                <option value="true">Si</option>
              </select>
            </div>



            <div className="mb-3">
              <label className="form-label">Gravado</label>
              <select
                className="form-select"
                name="gravado"
                value={producto.gravado}
                onChange={handleChange}
                required
              >
                <option value="5">5%</option>
                <option value="10">10%</option>
              </select>
            </div>

            {/* Botones de Guardar y Cancelar */}
            <div className="d-flex justify-content-between">
              <button type="submit" className="btn btn-primary">
                Guardar Cambios
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => router.push("/productos")}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
