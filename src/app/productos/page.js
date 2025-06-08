"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import ProductTable from "@/components/ProductTable";
import axios from "axios";

export default function ProductSearchPage() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/productos", {
          params: { query, page: currentPage, size: pageSize },
        });

        setProducts(response.data.content);
        setTotalPages(response.data.totalPages);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, [query, currentPage]); // 🔹 Manteniendo la estructura original

  const handleSearch = (searchQuery) => {
    setQuery(searchQuery);
    setCurrentPage(0);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // 🔹 Función para eliminar un producto
  const handleDelete = async (producto) => {
    if (confirm(`¿Estás seguro de que deseas eliminar "${producto.nombre}"?`)) {
      try {
        await axios.delete(`http://localhost:8080/api/productos/${producto.id}`);
        alert("Producto eliminado con éxito");
        setProducts(products.filter((p) => p.id !== producto.id)); // 🔹 Actualizar lista sin recargar la página
      } catch (error) {
        alert("Error al eliminar el producto.");
        console.error("Error:", error);
      }
    }
  };

  const handleEdit = (producto) => {
    alert(`Editar producto: ${producto.nombre}`);
  };

  const columnas = [
    { header: "Código de Barra", accessor: "codigoBarra" },
    { header: "Nombre", accessor: "nombre" },
    { header: "Precio", accessor: "precio" },
    { header: "Gravado", accessor: "gravado", format: (value) => `${value}%` }, // Nueva columna Gravado después de Precio
    { header: "Cantidad", accessor: "cantidad" },
  ];

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Gestión de Productos</h2>

      {/* 🔹 Ajuste con Flexbox de Bootstrap */}
      <div className="container">
        <div className="row justify-content-center">
          <SearchBar
            placeholder="Escribe el nombre o código de barra del producto..."
            onSearch={handleSearch}
            debounceTime={300}
          />

          <div className="col-2">
            <Link href="/productos/nuevo" className="btn btn-success">
              Nuevo Producto
            </Link>
          </div>
        </div>
      </div>

      {products.length > 0 ? (
        <ProductTable
          data={products}
          columns={columnas}
          onDelete={handleDelete}  // 🔹 Pasar la función de eliminación al componente
          onEdit={handleEdit}
          onPageChange={handlePageChange}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      ) : (
        <p className="text-muted mt-3">No se encontraron productos.</p>
      )}
    </div>
  );
}
