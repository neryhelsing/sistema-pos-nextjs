"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function NuevoProductoPage() {
  const router = useRouter();
  const [producto, setProducto] = useState({
    codigoBarra: "",
    nombre: "",
    precio: "",
    cantidad: "",
    gravado: "", // Ahora está vacío por defecto
  });

  const [error, setError] = useState("");

  // Manejar cambios en los campos
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProducto({ ...producto, [name]: value });
  };

  // Validar campos obligatorios
  const validarCampos = () => {
    if (!producto.nombre || !producto.precio || !producto.cantidad || !producto.gravado) {
      setError("Todos los campos son obligatorios.");
      return false;
    }
    if (isNaN(producto.precio) || isNaN(producto.cantidad)) {
      setError("El precio y la cantidad deben ser números.");
      return false;
    }
    setError("");
    return true;
  };

  // Verificar si el código de barra ya existe en la base de datos
  const verificarCodigoBarra = async (codigoBarra) => {
    if (!codigoBarra || codigoBarra.trim() === "") return true; // Permitir vacío

    try {
      const response = await axios.get(`http://localhost:8080/api/productos?query=${codigoBarra}`);
      if (response.data.content.length > 0) {
        setError("El código de barra ya está registrado.");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error verificando código de barra:", error);
      return false;
    }
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    const codigoValido = await verificarCodigoBarra(producto.codigoBarra);
    if (!codigoValido) return;

    if (!validarCampos()) return;

    try {
      await axios.post("http://localhost:8080/api/productos", producto);
      alert("Producto agregado con éxito");
      router.push("/productos");
    } catch (error) {
      setError("Hubo un error al agregar el producto.");
      console.error("Error:", error);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <h2 className="text-center mb-4">Agregar Nuevo Producto</h2>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} className="card p-4 shadow">
            <div className="mb-3">
              <label className="form-label">Código de Barra</label>
              <input
                type="text"
                className="form-control"
                name="codigoBarra"
                value={producto.codigoBarra}
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
              <label className="form-label">Gravado</label>
              <select
                className="form-select"
                name="gravado"
                value={producto.gravado}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione un porcentaje</option> {/* Ahora el usuario debe seleccionar */}
                <option value="5">5%</option>
                <option value="10">10%</option>
              </select>
            </div>

            {/* Botones de Guardar y Cancelar */}
            <div className="d-flex justify-content-between">
              <button type="submit" className="btn btn-success">
                Guardar Producto
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
