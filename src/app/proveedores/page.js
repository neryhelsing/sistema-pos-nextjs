"use client";

import axios from "axios";
import { useState, useEffect } from "react";

export default function ProductSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Función para buscar productos
  useEffect(() => {
    const fetchProducts = async () => {
      if (searchTerm.trim() === "") {
        setResults([]);
        setShowDropdown(false); // Ocultar dropdown si no hay búsqueda
        return;
      }

      try {
        const response = await axios.get("http://localhost:8080/api/productos", {
          params: { query: searchTerm },
        });
        setResults(response.data);
        setShowDropdown(true); // Mostrar dropdown si hay resultados
      } catch (error) {
        console.error("Error fetching products:", error);
        setResults([]);
        setShowDropdown(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 500); // Retraso de 500ms para evitar llamadas innecesarias

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Función para agregar productos seleccionados a la tabla
  const handleSelectProduct = (product) => {
    if (!selectedProducts.find((p) => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, { ...product, cantidad: 1 }]);
    }
    setShowDropdown(false); // Ocultar dropdown al seleccionar un producto
    setSearchTerm(""); // Limpiar el campo de búsqueda
  };

  // Función para ejecutar búsqueda manual con botón
  const handleSearchButton = () => {
    if (searchTerm.trim() !== "") {
      setShowDropdown(true);
    }
  };

  // Función para eliminar un producto de la tabla
  const handleRemoveProduct = (id) => {
    setSelectedProducts(selectedProducts.filter((product) => product.id !== id));
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Buscar Producto</h2>

      {/* Campo de búsqueda */}
      <div className="input-group mb-3 position-relative">
        <input
          type="text"
          className="form-control"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Escribe el nombre del producto..."
          onFocus={() => setShowDropdown(results.length > 0)}
        />
        <button className="btn btn-primary" onClick={handleSearchButton}>
          Buscar
        </button>

        {/* Dropdown con resultados */}
        {showDropdown && results.length > 0 && (
          <ul
            className="dropdown-menu show w-100"
            style={{ position: "absolute", top: "100%", zIndex: 10 }}
          >
            {results.map((product) => (
              <li
                key={product.id}
                className="dropdown-item d-flex justify-content-between align-items-center"
                style={{ cursor: "pointer" }}
                onClick={() => handleSelectProduct(product)}
              >
                {product.nombre}
                <span className="badge bg-secondary">{product.precio} Gs</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tabla de productos seleccionados */}
      {selectedProducts.length > 0 && (
        <div className="table-responsive">
          <h3 className="text-center mt-4 mb-3">Productos Seleccionados</h3>
          <table className="table table-striped table-bordered">
            <thead className="table-primary">
              <tr>
                <th>Nombre</th>
                <th>Precio (Gs)</th>
                <th>Cantidad</th>
                <th>Total (Gs)</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {selectedProducts.map((product) => (
                <tr key={product.id} className="table-warning">
                  <td>{product.nombre}</td>
                  <td>{product.precio}</td>
                  <td>
                    <input
                      type="number"
                      className="form-control"
                      defaultValue={product.cantidad}
                      min={1}
                      onChange={(e) =>
                        (product.cantidad = parseInt(e.target.value, 10) || 1)
                      }
                    />
                  </td>
                  <td>{(product.cantidad || 1) * product.precio}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveProduct(product.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
