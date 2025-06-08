"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function PagoTable({ data, columns, onPageChange, currentPage, totalPages }) {
  const router = useRouter();

  return (
    <div className="table-responsive">
      <table className="table table-striped table-bordered">
        <thead className="table-success text-center">
          <tr>
            {columns.map((col, index) => (
              <th key={index}>{col.header}</th>
            ))}
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((pago, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="text-center">
                    {typeof col.accessor === "function"
                      ? col.accessor(pago)
                      : pago[col.accessor]}
                  </td>
                ))}
                <td className="text-center">
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => router.push(`/pagos/editar/${pago.id}`)}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length + 1} className="text-center">
                No hay datos disponibles
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between mt-3">
          {currentPage > 0 && (
            <button className="btn btn-secondary" onClick={() => onPageChange(currentPage - 1)}>
              ← Anterior
            </button>
          )}
          <span>Página {currentPage + 1} de {totalPages}</span>
          {currentPage + 1 < totalPages && (
            <button className="btn btn-secondary" onClick={() => onPageChange(currentPage + 1)}>
              Siguiente →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
