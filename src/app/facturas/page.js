"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import FacturaTable from "@/components/FacturaTable";
import axios from "axios";

export default function FacturaSearchPage() {
  const [facturas, setFacturas] = useState([]);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchFacturas = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/facturas", {
          params: { query, page: currentPage, size: pageSize, sort: "creadoEn,desc" },
        });

        setFacturas(response.data.content);
        setTotalPages(response.data.totalPages);
      } catch (error) {
        console.error("Error al cargar facturas:", error);
      }
    };

    fetchFacturas();
  }, [query, currentPage]);

  const handleSearch = (searchQuery) => {
    setQuery(searchQuery);
    setCurrentPage(0);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleDelete = async (factura) => {
    if (confirm(`¿Estás seguro de que deseas eliminar la factura N° ${factura.numeroFactura}?`)) {
      try {
        await axios.delete(`http://localhost:8080/api/facturas/${factura.id}`);
        alert("Factura eliminada correctamente");
        setFacturas(facturas.filter((f) => f.id !== factura.id));
      } catch (error) {
        console.error("Error al eliminar factura:", error);
        alert("Error al eliminar la factura.");
      }
    }
  };

  const columnas = [
    { header: "N° Factura", accessor: "numeroFactura" },
    { header: "Cliente", accessor: (factura) => factura.clienteNombre || "—" },
    { header: "Fecha Creación", accessor: (factura) => new Date(factura.creadoEn).toLocaleString("es-PY") },
    { header: "Total", accessor: (factura) => `${factura.total.toLocaleString("es-PY")} Gs` },
    { header: "Saldo", accessor: (factura) => `${(factura.saldo ?? factura.total).toLocaleString("es-PY")} Gs` },
    { header: "Estado", accessor: (factura) => factura.estado ?? "—" },
  ];

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Gestión de Facturas</h2>

      <div className="container">
        <div className="row justify-content-center">
          <SearchBar
            placeholder="Buscar por nombre de cliente o N° factura..."
            onSearch={handleSearch}
            debounceTime={300}
          />

          <div className="col-2">
            <Link href="/facturas/nuevo" className="btn btn-success">
              Nueva Factura
            </Link>
          </div>
        </div>
      </div>

      {facturas.length > 0 ? (
        <FacturaTable
          data={facturas}
          columns={columnas}
          onDelete={handleDelete}
          onPageChange={handlePageChange}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      ) : (
        <p className="text-muted mt-3">No se encontraron facturas.</p>
      )}
    </div>
  );
}
