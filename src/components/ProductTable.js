"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function ProductTable({ data, columns, onDelete, onPageChange, currentPage, totalPages }) {
  const router = useRouter(); 

  // Ordenar datos por la columna "nombre"
  const sortedData = [...data].sort((a, b) => a.nombre?.toLowerCase().localeCompare(b.nombre?.toLowerCase()));

  // Función para formatear los valores numéricos (precio, cantidad) y agregar el % en gravado
  const formatValue = (accessor, value) => {
    if (accessor === "precio" || accessor === "cantidad") {
      return value.toLocaleString("es-PY"); // Formateo numérico con separadores
    } 
    if (accessor === "gravado") {
      return `${value}%`; // Agregar el símbolo %
    }
    return value;
  };

  return (
    <div className="table-responsive">
      <table className="table table-striped table-bordered">
        <thead className="table-primary text-center">
          <tr>
            {columns.map((col, index) => (
              <th key={index} className="text-center">{col.header}</th>
            ))}
            <th className="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.length > 0 ? (
            sortedData.map((item, index) => (
              <tr key={index}>
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className={col.accessor === "precio" || col.accessor === "cantidad" ? "text-end" : "text-center"}>
                    {formatValue(col.accessor, item[col.accessor])}
                  </td>
                ))}
                <td className="text-center">
                  <button className="btn btn-warning btn-sm me-2" onClick={() => router.push(`/productos/editar/${item.id}`)}>
                    Editar
                  </button>

                  {onDelete && (
                    <button className="btn btn-danger btn-sm" onClick={() => onDelete(item)}>
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length + 1} className="text-center">No hay datos disponibles</td>
            </tr>
          )}
        </tbody>
      </table>

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
