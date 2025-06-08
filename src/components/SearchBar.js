"use client";

import { useState } from "react";
import PropTypes from "prop-types";

export default function SearchBar({ placeholder, onSearch, debounceTime = 500 }) {
  const [searchTerm, setSearchTerm] = useState("");

  // Función para manejar cambios con debounce
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (onSearch) {
      clearTimeout(window.searchTimeout);
      window.searchTimeout = setTimeout(() => {
        onSearch(value); // Llama al callback con el valor actual
      }, debounceTime);
    }
  };

    return (
        <div className="col-md-6">
            <div className="input-group mb-3">
                <input
                type="text"
                className="form-control"
                value={searchTerm}
                onChange={handleInputChange}
                placeholder={placeholder || "Buscar..."}
                />
                <button
                    className="btn btn-primary"
                    onClick={() => onSearch && onSearch(searchTerm)}
                >
                    Buscar
                </button>
            </div>
        </div>
    );
}

// Validación de props
SearchBar.propTypes = {
  placeholder: PropTypes.string, // Texto de ayuda para el input
  onSearch: PropTypes.func, // Función a ejecutar al buscar
  debounceTime: PropTypes.number, // Tiempo de espera para debounce
};
