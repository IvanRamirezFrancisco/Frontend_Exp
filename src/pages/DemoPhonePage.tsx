import { useState } from 'react';
import { PhoneInput } from '../components/common/PhoneInput';
import { validateInternationalPhone } from '../utils/phoneUtils';
import './DemoPhonePage.css';

export function DemoPhonePage() {
  const [phone, setPhone] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    const validation = validateInternationalPhone(value);
    setValidationResult(validation);
  };

  return (
    <div className="demo-phone-page">
      <div className="demo-container">
        <h1>Demostración PhoneInput Component</h1>
        
        <div className="demo-section">
          <h2>PhoneInput con Validación Automática</h2>
          
          <PhoneInput
            label="Número de Teléfono"
            placeholder="Ingresa tu número"
            value={phone}
            onChange={handlePhoneChange}
            error={validationResult && !validationResult.isValid ? validationResult.error : undefined}
            required={true}
          />

          <div className="validation-info">
            <h3>Información de Validación:</h3>
            <pre>{JSON.stringify(validationResult, null, 2)}</pre>
          </div>

          <div className="phone-info">
            <h3>Valor del Teléfono:</h3>
            <p><strong>Completo:</strong> {phone || 'No ingresado'}</p>
            <p><strong>Longitud:</strong> {phone.length} caracteres</p>
          </div>

          <div className="examples">
            <h3>Ejemplos de Números Válidos:</h3>
            <ul>
              <li><strong>México:</strong> +52 771 203 1751</li>
              <li><strong>Estados Unidos:</strong> +1 (555) 123-4567</li>
              <li><strong>España:</strong> +34 612 345 678</li>
              <li><strong>Colombia:</strong> +57 300 123 4567</li>
            </ul>
          </div>

          <div className="test-buttons">
            <h3>Pruebas Rápidas:</h3>
            <button 
              className="test-btn"
              onClick={() => handlePhoneChange('+5277123456789')}
            >
              Probar México (+52)
            </button>
            <button 
              className="test-btn"
              onClick={() => handlePhoneChange('+15551234567')}
            >
              Probar US (+1)
            </button>
            <button 
              className="test-btn"
              onClick={() => handlePhoneChange('+34612345678')}
            >
              Probar España (+34)
            </button>
            <button 
              className="test-btn"
              onClick={() => handlePhoneChange('')}
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="features-list">
          <h2>Características Implementadas:</h2>
          <ul>
            <li>✅ Selector de país con banderas</li>
            <li>✅ Búsqueda de países por nombre, código o dial</li>
            <li>✅ Formateo automático según el país</li>
            <li>✅ Validación en tiempo real</li>
            <li>✅ Detección automática de país por número</li>
            <li>✅ Soporte para múltiples países</li>
            <li>✅ Accesibilidad completa (ARIA labels)</li>
            <li>✅ Diseño responsive</li>
            <li>✅ Integración con sistema de validación existente</li>
            <li>✅ Compatibilidad con backend (TextBelt SMS)</li>
          </ul>
        </div>

        <div className="back-link">
          <a href="/register">← Volver al Registro</a>
        </div>
      </div>
    </div>
  );
}