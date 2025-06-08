"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function NuevoClientePage() {
  const router = useRouter();
  const [cliente, setCliente] = useState({
    nombre: "",
    ruc: "",
    telefono: "",
    direccion: "", // Ahora puede estar vacío
    ciudad: "", // Ahora puede estar vacío
  });

  const [error, setError] = useState("");

  // Manejar cambios en los campos
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCliente({ ...cliente, [name]: value });
  };

  // Validar campos obligatorios
  const validarCampos = () => {
    if (!cliente.nombre || !cliente.ruc || !cliente.telefono) {
      setError("Los campos Nombre, RUC y Teléfono son obligatorios.");
      return false;
    }
    if (cliente.ruc.length > 20) {
      setError("El RUC no puede tener más de 20 caracteres.");
      return false;
    }
    if (cliente.telefono.length > 15) {
      setError("El teléfono no puede tener más de 15 caracteres.");
      return false;
    }
    if (cliente.direccion && cliente.direccion.length > 255) {
      setError("La dirección no puede tener más de 255 caracteres.");
      return false;
    }
    if (cliente.ciudad && cliente.ciudad.length > 100) {
      setError("La ciudad no puede tener más de 100 caracteres.");
      return false;
    }
    setError("");
    return true;
  };

  // Verificar si el RUC ya existe en la base de datos
  const verificarRuc = async (ruc) => {
    if (!ruc || ruc.trim() === "") return true; // Permitir vacío

    try {
      const response = await axios.get(`http://localhost:8080/api/clientes?query=${ruc}`);
      if (response.data.content.length > 0) {
        setError("El RUC ya está registrado.");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error verificando RUC:", error);
      return false;
    }
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    const rucValido = await verificarRuc(cliente.ruc);
    if (!rucValido) return;

    if (!validarCampos()) return;

    try {
      await axios.post("http://localhost:8080/api/clientes", cliente);
      alert("Cliente agregado con éxito");
      router.push("/clientes");
    } catch (error) {
      setError("Hubo un error al agregar el cliente.");
      console.error("Error:", error);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <h2 className="text-center mb-4">Agregar Nuevo Cliente</h2>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} className="card p-4 shadow">
            <div className="mb-3">
              <label className="form-label">Nombre</label>
              <input
                type="text"
                className="form-control"
                name="nombre"
                value={cliente.nombre}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">RUC</label>
              <input
                type="text"
                className="form-control"
                name="ruc"
                value={cliente.ruc}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Teléfono</label>
              <input
                type="text"
                className="form-control"
                name="telefono"
                value={cliente.telefono}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Dirección (Opcional)</label>
              <input
                type="text"
                className="form-control"
                name="direccion"
                value={cliente.direccion}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Ciudad (Opcional)</label>
              <input
                type="text"
                className="form-control"
                name="ciudad"
                value={cliente.ciudad}
                onChange={handleChange}
              />
            </div>

            {/* Botones de Guardar y Cancelar */}
            <div className="d-flex justify-content-between">
              <button type="submit" className="btn btn-success">
                Guardar Cliente
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => router.push("/clientes")}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
