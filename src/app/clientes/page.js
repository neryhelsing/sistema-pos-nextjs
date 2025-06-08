"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import ClientTable from "@/components/ClientTable";
import axios from "axios";

export default function ClientSearchPage() {
  const [clientes, setClientes] = useState([]); // ✅ Estado inicial vacío
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/clientes", {
          params: { query, page: currentPage, size: pageSize },
        });

        // ✅ Validar que la respuesta de la API contenga datos
        if (response.data && Array.isArray(response.data.content)) {
          setClientes(response.data.content);
          setTotalPages(response.data.totalPages);
        } else {
          setClientes([]);
          setTotalPages(1);
        }
      } catch (error) {
        console.error("Error al obtener clientes:", error);
        setClientes([]); // ✅ Evita errores si la API falla
        setTotalPages(1);
      }
    };

    fetchClientes();
  }, [query, currentPage]);

  const handleSearch = (searchQuery) => {
    setQuery(searchQuery);
    setCurrentPage(0);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // 🔹 Función para eliminar un cliente y actualizar la lista
  const handleDelete = async (cliente) => {
    if (confirm(`¿Estás seguro de que deseas eliminar a "${cliente.nombre}"?`)) {
      try {
        await axios.delete(`http://localhost:8080/api/clientes/${cliente.id}`);
        alert("Cliente eliminado con éxito");
        setClientes((prevClientes) => prevClientes.filter((c) => c.id !== cliente.id)); 
      } catch (error) {
        alert("Error al eliminar el cliente.");
        console.error("Error:", error);
      }
    }
  };

  const handleEdit = (cliente) => {
    alert(`Editar cliente: ${cliente.nombre}`);
  };

  const columnas = [
    { header: "Nombre", accessor: "nombre" },
    { header: "RUC", accessor: "ruc" },
    { header: "Teléfono", accessor: "telefono" },
    { header: "Dirección", accessor: "direccion" },
    { header: "Ciudad", accessor: "ciudad" },
  ];

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Gestión de Clientes</h2>

      <div className="container">
        <div className="row justify-content-center">
          <SearchBar
            placeholder="Escribe el nombre o RUC del cliente..."
            onSearch={handleSearch}
            debounceTime={300}
          />

          <div className="col-2">
            <Link href="/clientes/nuevo" className="btn btn-success">
              Nuevo Cliente
            </Link>
          </div>
        </div>
      </div>

      {clientes.length > 0 ? (
        <ClientTable
          data={clientes}
          columns={columnas}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onPageChange={handlePageChange}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      ) : (
        <p className="text-muted mt-3 text-center">No se encontraron clientes.</p>
      )}
    </div>
  );
}
