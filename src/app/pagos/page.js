"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import PagoTable from "@/components/PagoTable";
import axios from "axios";

export default function PagosPage() {
  const [pagos, setPagos] = useState([]);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchPagos = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/pagos", {
          params: { query, page: currentPage, size: pageSize, sort: "creadoEn,desc" },
        });

        setPagos(response.data.content);
        setTotalPages(response.data.totalPages);
      } catch (error) {
        console.error("Error al cargar pagos:", error);
      }
    };

    fetchPagos();
  }, [query, currentPage]);

  const handleSearch = (searchQuery) => {
    setQuery(searchQuery);
    setCurrentPage(0);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const columnas = [
    { header: "Nº de pago", accessor: "nPago" },
    { header: "Pago total", accessor: (p) => `${p.totalPagado.toLocaleString("es-PY")} Gs` },
    { header: "Fecha de creación", accessor: (p) => new Date(p.creadoEn).toLocaleString("es-PY") },
  ];

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Historial de Pagos</h2>

      <div className="container">
        <div className="row justify-content-center">
          <SearchBar
            placeholder="Buscar por Nº de pago..."
            onSearch={handleSearch}
            debounceTime={300}
          />

          <div className="col-2">
            <Link href="/pagos/nuevo" className="btn btn-success">
              Nuevo Pago
            </Link>
          </div>
        </div>
      </div>

      {pagos.length > 0 ? (
        <PagoTable
          data={pagos}
          columns={columnas}
          onPageChange={handlePageChange}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      ) : (
        <p className="text-muted mt-3">No se encontraron pagos.</p>
      )}
    </div>
  );
}
