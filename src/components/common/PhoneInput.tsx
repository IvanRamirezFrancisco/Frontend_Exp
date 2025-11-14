import React, { useState, useEffect, useRef } from 'react';
import { COUNTRY_CODES } from '../../utils/phoneUtils';
import './PhoneInput.css';

interface Country {
  code: string;
  name: string;
  dial: string;
  flag: string;
  format?: string;
  maxLength?: number;
}

interface PhoneInputProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
}

// Convertir COUNTRY_CODES al formato esperado con mejores flags
const countries: Country[] = COUNTRY_CODES.map(country => ({
  code: country.code,
  name: country.name,
  dial: country.dial,
  flag: country.flag,
  format: country.format,
  maxLength: country.maxLength
}));

export function PhoneInput({ 
  label = 'Teléfono', 
  value = '', 
  onChange, 
  error, 
  disabled = false, 
  placeholder = 'Número de teléfono',
  required = false 
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]); // México por defecto
  const [localNumber, setLocalNumber] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtrar países basado en búsqueda
  const filteredCountries = countries.filter(country => 
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dial.includes(searchTerm) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Formatear número según el país seleccionado
  const formatPhoneNumber = (number: string, format?: string): string => {
    if (!format) return number;
    
    const digits = number.replace(/\D/g, '');
    let formatted = '';
    let digitIndex = 0;
    
    for (let i = 0; i < format.length && digitIndex < digits.length; i++) {
      if (format[i] === 'X') {
        formatted += digits[digitIndex];
        digitIndex++;
      } else if (digitIndex > 0) {
        formatted += format[i];
      }
    }
    
    return formatted;
  };

  // Limpiar número (solo dígitos)
  const cleanNumber = (number: string): string => {
    return number.replace(/\D/g, '');
  };

  // Detectar país automáticamente basado en el valor inicial
  useEffect(() => {
    if (value && value.startsWith('+')) {
      const matchedCountry = countries.find(country => 
        value.startsWith(country.dial)
      );
      
      if (matchedCountry) {
        setSelectedCountry(matchedCountry);
        const extractedNumber = value.substring(matchedCountry.dial.length);
        setLocalNumber(cleanNumber(extractedNumber));
      }
    } else if (value) {
      setLocalNumber(cleanNumber(value));
    }
  }, []);

  // Manejar cambios en el input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const digits = cleanNumber(inputValue);
    
    // Limitar longitud según el país
    if (selectedCountry.maxLength && digits.length > selectedCountry.maxLength) {
      return;
    }
    
    setLocalNumber(digits);
    
    // Construir número completo y notificar cambio
    const fullNumber = digits ? `${selectedCountry.dial}${digits}` : '';
    onChange?.(fullNumber);
  };

  // Manejar selección de país
  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    setSearchTerm('');
    
    // Reconstruir número completo con nuevo código de país
    const fullNumber = localNumber ? `${country.dial}${localNumber}` : '';
    onChange?.(fullNumber);
    
    // Enfocar el input después de seleccionar país
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Obtener número formateado para mostrar
  const displayNumber = formatPhoneNumber(localNumber, selectedCountry.format);

  return (
    <div className="phone-input-container">
      <label className={`phone-input-label ${required ? 'required' : ''}`}>
        {label}
        {required && <span className="required-asterisk"> *</span>}
      </label>
      
      <div className={`phone-input-wrapper ${error ? 'error' : ''} ${disabled ? 'disabled' : ''} ${isFocused ? 'focused' : ''}`}>
        {/* Selector de país mejorado */}
        <div className="country-selector" ref={dropdownRef}>
          <button
            type="button"
            className={`country-button ${isDropdownOpen ? 'active' : ''}`}
            onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled}
            title={`${selectedCountry.name} ${selectedCountry.dial} - Clic para cambiar país`}
            aria-label={`País seleccionado: ${selectedCountry.name} ${selectedCountry.dial}. Hacer clic para cambiar`}
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
          >
            <span className="country-flag">{selectedCountry.flag}</span>
            <span className="country-info">
              <span className="country-code">{selectedCountry.dial}</span>
              <span className="country-name-short">{selectedCountry.code}</span>
            </span>
            <svg
              className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
            >
              <path
                d="M3.5 5.25L7 8.75L10.5 5.25"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Dropdown de países */}
          {isDropdownOpen && (
            <div className="countries-dropdown" role="listbox" aria-label="Seleccionar país">
              <div className="countries-search">
                <input
                  type="text"
                  placeholder="Buscar país..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                  autoFocus
                />
              </div>
              
              <div className="countries-list">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    className={`country-option ${selectedCountry.code === country.code ? 'selected' : ''}`}
                    onClick={() => handleCountrySelect(country)}
                    role="option"
                    aria-selected={selectedCountry.code === country.code}
                    aria-label={`${country.name}, código ${country.dial}`}
                  >
                    <span className="country-flag">{country.flag}</span>
                    <span className="country-name">{country.name}</span>
                    <span className="country-dial">{country.dial}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input del número mejorado */}
        <input
          ref={inputRef}
          type="tel"
          value={displayNumber}
          onChange={handlePhoneChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className="phone-number-input"
          autoComplete="tel"
        />
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="phone-input-error" role="alert">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
        </div>
      )}

      {/* Información del formato cuando hay número */}
      {selectedCountry.format && !error && localNumber && (
        <div className="phone-input-hint">
          <span className="hint-icon">ℹ️</span>
          <span className="hint-text">
            Formato {selectedCountry.name}: {selectedCountry.format.replace(/X/g, '0')}
          </span>
        </div>
      )}

      {/* Información del país seleccionado */}
      {!error && !localNumber && (
        <div className="phone-input-info">
          <span className="info-text">
            {selectedCountry.flag} País: <strong>{selectedCountry.name}</strong> {selectedCountry.dial}
          </span>
          <span className="change-hint">Clic en la bandera para cambiar</span>
        </div>
      )}
    </div>
  );
}