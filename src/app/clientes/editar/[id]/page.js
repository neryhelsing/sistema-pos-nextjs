"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";

export default function EditarClientePage() {
  const router = useRouter();
  const { id } = useParams();
  const [cliente, setCliente] = useState({
    nombre: "",
    ruc: "",
    telefono: "",
    direccion: "",
    ciudad: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Cargar datos del cliente al iniciar
  useEffect(() => {
    const fetchCliente = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/clientes/${id}`);
        setCliente(response.data);
        setLoading(false);
      } catch (error) {
        setError("Error al cargar los datos del cliente.");
        setLoading(false);
      }
    };

    if (id) {
      fetchCliente();
    }
  }, [id]);

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

  // Verificar si el RUC ya existe para otro cliente
  const verificarRucDuplicado = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/clientes`, {
        params: { query: cliente.ruc },
      });

      // Verificar si hay clientes con el mismo RUC y que NO sean el cliente actual
      const duplicado = response.data.content.find(
        (c) => c.ruc === cliente.ruc && c.id !== cliente.id
      );
      if (duplicado) {
        setError("El RUC ya está registrado por otro cliente.");
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

    if (!validarCampos()) return;

    const rucUnico = await verificarRucDuplicado();
    if (!rucUnico) return;

    try {
      await axios.put(`http://localhost:8080/api/clientes/${id}`, cliente);
      alert("Cliente actualizado con éxito");
      router.push("/clientes");
    } catch (error) {
      setError("Error al actualizar el cliente.");
      console.error("Error:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <h3>Cargando datos del cliente...</h3>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <h2 className="text-center mb-4">Editar Cliente</h2>

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
                value={cliente.direccion || ""}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Ciudad (Opcional)</label>
              <input
                type="text"
                className="form-control"
                name="ciudad"
                value={cliente.ciudad || ""}
                onChange={handleChange}
              />
            </div>

            {/* Botones */}
            <div className="d-flex justify-content-between">
              <button type="submit" className="btn btn-primary">
                Guardar Cambios
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => router.push("/clientes")}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
