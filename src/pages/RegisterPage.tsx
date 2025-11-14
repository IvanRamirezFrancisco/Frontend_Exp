import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/common/Input';
import { PhoneInput } from '../components/common/PhoneInput';
import { Button } from '../components/common/Button';
import { authService } from '../services/authService';
import { validateInternationalPhone } from '../utils/phoneUtils';
import { validateEmail } from '../utils/emailValidation';
import './RegisterPage.css';
// Las imágenes ahora están en public/ para producción

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

export function RegisterPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validación en tiempo real después de que el usuario haya empezado a escribir
    if (value.length > 0) {
      setTimeout(() => {
        const error = validateField(name, value);
        setErrors(prev => ({
          ...prev,
          [name]: error
        }));
      }, 500); // Debounce de 500ms
    } else {
      // Limpiar error si el campo está vacío
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Función para validar la fortaleza de la contraseña
  const getPasswordStrength = (password: string) => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[@$!%*?&.]/.test(password),
      noCommon: !['password', '123456', 'qwerty'].some(common => 
        password.toLowerCase().includes(common)
      ),
      noSequence: !['123456', '654321', 'abcdef'].some(seq => 
        password.toLowerCase().includes(seq)
      )
    };

    Object.values(checks).forEach(check => check && score++);

    if (score <= 3) return { level: 'weak', text: 'Débil', color: '#ff4444' };
    if (score <= 5) return { level: 'medium', text: 'Moderada', color: '#ffaa00' };
    if (score <= 6) return { level: 'strong', text: 'Fuerte', color: '#44ff44' };
    return { level: 'very-strong', text: 'Muy Fuerte', color: '#00aa00' };
  };

  // Funciones para alternar visibilidad de contraseñas
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(prev => !prev);
  };

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'firstName':
        if (!value.trim()) return 'El nombre es obligatorio';
        if (value.length < 2) return 'El nombre debe tener al menos 2 caracteres';
        if (value.length > 50) return 'El nombre no puede exceder 50 caracteres';
        if (!/^[A-Za-zÀ-ÿ\u00f1\u00d1\s]+$/.test(value)) return 'Solo letras y espacios permitidos';
        break;

      case 'lastName':
        if (!value.trim()) return 'El apellido es obligatorio';
        if (value.length < 2) return 'El apellido debe tener al menos 2 caracteres';
        if (value.length > 50) return 'El apellido no puede exceder 50 caracteres';
        if (!/^[A-Za-zÀ-ÿ\u00f1\u00d1\s]+$/.test(value)) return 'Solo letras y espacios permitidos';
        break;

      case 'email':
        const emailValidation = validateEmail(value);
        if (!emailValidation.isValid) {
          return emailValidation.error;
        }
        break;

      case 'phone':
        if (value) {
          const validation = validateInternationalPhone(value);
          if (!validation.isValid) {
            return validation.error;
          }
        }
        break;

      case 'password':
        if (!value) return 'La contraseña es obligatoria';
        if (value.length < 8) return 'Mínimo 8 caracteres';
        if (value.length > 128) return 'Máximo 128 caracteres';
        if (!/(?=.*[a-z])/.test(value)) return 'Debe contener al menos una minúscula';
        if (!/(?=.*[A-Z])/.test(value)) return 'Debe contener al menos una mayúscula';
        if (!/(?=.*\d)/.test(value)) return 'Debe contener al menos un número';
        if (!/(?=.*[@$!%*?&.])/.test(value)) return 'Debe contener un símbolo (@$!%*?&.)';
        
        // Verificar contraseñas comunes
        const commonPasswords = ['password', '12345678', 'qwerty123', 'password123'];
        if (commonPasswords.some(common => value.toLowerCase().includes(common))) {
          return 'Contraseña demasiado común';
        }
        
        // Verificar secuencias
        const sequences = ['123456', '654321', 'abcdef', 'qwerty'];
        if (sequences.some(seq => value.toLowerCase().includes(seq))) {
          return 'No uses secuencias obvias (123456, qwerty, etc.)';
        }

        // Verificar que no contenga datos personales
        if (formData.firstName && value.toLowerCase().includes(formData.firstName.toLowerCase())) {
          return 'No debe contener tu nombre';
        }
        if (formData.lastName && value.toLowerCase().includes(formData.lastName.toLowerCase())) {
          return 'No debe contener tu apellido';
        }
        if (formData.email && value.toLowerCase().includes(formData.email.split('@')[0].toLowerCase())) {
          return 'No debe contener tu email';
        }
        break;

      case 'confirmPassword':
        if (!value) return 'Confirma tu contraseña';
        if (value !== formData.password) return 'Las contraseñas no coinciden';
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof FormData]);
      if (error) {
        newErrors[key as keyof FormData] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      setApiError(null);
      setSuccessMessage(null);
      
      console.log('Enviando datos de registro:', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone
      });
      
      const { confirmPassword, ...submitData } = formData;
      const response = await authService.register(submitData);
      
      console.log('Respuesta del servidor:', response);
      
      if (response.success) {
        setSuccessMessage(
          response.message || 
          'Registro exitoso. Revisa tu email para verificar tu cuenta.'
        );
        
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Registro exitoso. Por favor, inicia sesión.',
              email: formData.email
            } 
          });
        }, 3000);
      } else {
        setApiError(response.message || 'Error en el registro');
      }
    } catch (error: any) {
      console.error('Error completo:', error);
      console.error('Error response:', error.response);
      
      let errorMessage = 'Error de conexión. Verifica que el servidor esté funcionando.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setApiError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: ''
    });
    setErrors({});
    setApiError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-card">
          <div className="register-header">
            <div className="register-logo">
              <div className="logo-icon"></div>
              <h1 className="logo-text">Registro</h1>
            </div>
            <p className="register-subtitle">Crea tu cuenta</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form" noValidate>
            {apiError && (
              <div className="register-error" role="alert">
                <span className="error-icon"></span>
                <span>{apiError}</span>
              </div>
            )}

            {successMessage && (
              <div className="register-success" role="alert">
                <span className="success-icon"></span>
                <span>{successMessage}</span>
              </div>
            )}

            <div className="form-fields">
              <div className="form-row">
                <Input
                  label="Nombre *"
                  type="text"
                  name="firstName"
                  placeholder="Tu nombre"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={errors.firstName}
                  disabled={isLoading}
                />

                <Input
                  label="Apellido *"
                  type="text"
                  name="lastName"
                  placeholder="Tu apellido"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={errors.lastName}
                  disabled={isLoading}
                />
              </div>

              <Input
                label="Correo electrónico *"
                type="email"
                name="email"
                placeholder="usuario@ejemplo.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                disabled={isLoading}
              />

              <PhoneInput
                label="Teléfono (opcional)"
                placeholder="Número de teléfono"
                value={formData.phone}
                onChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    phone: value
                  }));
                  
                  // Validación en tiempo real del teléfono
                  if (value.length > 0) {
                    setTimeout(() => {
                      const error = validateField('phone', value);
                      setErrors(prev => ({
                        ...prev,
                        phone: error
                      }));
                    }, 100);
                  } else {
                    setErrors(prev => ({
                      ...prev,
                      phone: undefined
                    }));
                  }
                }}
                error={errors.phone}
                disabled={isLoading}
              />

              <div className="password-field-container">
                <div className="password-input-wrapper">
                  <Input
                    label="Contraseña *"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={togglePasswordVisibility}
                    disabled={isLoading}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    <img 
                      src={showPassword ? "/images/invisible.png" : "/images/ojo.png"}
                      alt={showPassword ? "Ocultar" : "Mostrar"}
                      className="password-toggle-icon"
                    />
                  </button>
                </div>
                
                {/* Indicador de fortaleza de contraseña */}
                {formData.password && (
                  <div className="password-strength-indicator">
                    <div className="password-strength-bar">
                      <div 
                        className={`strength-bar-fill strength-${getPasswordStrength(formData.password).level}`}
                        style={{ 
                          width: `${Math.min(100, (getPasswordStrength(formData.password).level === 'weak' ? 25 : 
                                     getPasswordStrength(formData.password).level === 'medium' ? 50 : 
                                     getPasswordStrength(formData.password).level === 'strong' ? 75 : 100))}%`,
                          backgroundColor: getPasswordStrength(formData.password).color
                        }}
                      />
                    </div>
                    <span className="strength-text" style={{ color: getPasswordStrength(formData.password).color }}>
                      Fortaleza: {getPasswordStrength(formData.password).text}
                    </span>
                  </div>
                )}

                {/* Criterios de contraseña */}
                {formData.password && (
                  <div className="password-criteria">
                    <div className={`criteria-item ${formData.password.length >= 8 ? 'valid' : 'invalid'}`}>
                      <span className="criteria-icon">{formData.password.length >= 8 ? '✓' : '✗'}</span>
                      Al menos 8 caracteres
                    </div>
                    <div className={`criteria-item ${/[a-z]/.test(formData.password) ? 'valid' : 'invalid'}`}>
                      <span className="criteria-icon">{/[a-z]/.test(formData.password) ? '✓' : '✗'}</span>
                      Una minúscula (a-z)
                    </div>
                    <div className={`criteria-item ${/[A-Z]/.test(formData.password) ? 'valid' : 'invalid'}`}>
                      <span className="criteria-icon">{/[A-Z]/.test(formData.password) ? '✓' : '✗'}</span>
                      Una mayúscula (A-Z)
                    </div>
                    <div className={`criteria-item ${/\d/.test(formData.password) ? 'valid' : 'invalid'}`}>
                      <span className="criteria-icon">{/\d/.test(formData.password) ? '✓' : '✗'}</span>
                      Un número (0-9)
                    </div>
                    <div className={`criteria-item ${/[@$!%*?&.]/.test(formData.password) ? 'valid' : 'invalid'}`}>
                      <span className="criteria-icon">{/[@$!%*?&.]/.test(formData.password) ? '✓' : '✗'}</span>
                      Un símbolo (@$!%*?&.)
                    </div>
                  </div>
                )}
              </div>

              <div className="password-input-wrapper">
                <Input
                  label="Confirmar contraseña *"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Repite tu contraseña"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={toggleConfirmPasswordVisibility}
                  disabled={isLoading}
                  aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <img 
                    src={showConfirmPassword ? "/images/invisible.png" : "/images/ojo.png"}
                    alt={showConfirmPassword ? "Ocultar" : "Mostrar"}
                    className="password-toggle-icon"
                  />
                </button>
              </div>
            </div>

            <div className="form-actions">
              <Button
                type="submit"
                variant="primary"
                size="large"
                loading={isLoading}
                disabled={isLoading}
                className="register-button"
              >
                {isLoading ? 'Registrando...' : 'Registrarse'}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="medium"
                onClick={handleResetForm}
                disabled={isLoading}
                className="reset-button"
              >
                Limpiar formulario
              </Button>
            </div>
          </form>

          <div className="register-footer">
            <p className="login-prompt">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="login-link">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>

        <div className="register-decoration">
          <div className="decoration-circle decoration-circle--1"></div>
          <div className="decoration-circle decoration-circle--2"></div>
          <div className="decoration-circle decoration-circle--3"></div>
          <div className="decoration-square decoration-square--1"></div>
        </div>
      </div>
    </div>
  );
}
