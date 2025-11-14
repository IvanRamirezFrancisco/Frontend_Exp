import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import type { LoginCredentials } from '../types';
import './LoginPage.css';
// Las imágenes ahora están en public/ para producción

export function LoginPage() {
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginCredentials>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginCredentials> = {};

    if (!formData.email) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingresa un email válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof LoginCredentials]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      setApiError(null);
      
      const response = await login(formData);
      
      if (response.success !== false) {
        if (response.twoFactorRequired) {
          // Redirect to 2FA page with required type
          navigate('/two-factor', { 
            state: { 
              type: response.twoFactorType,
              email: formData.email 
            } 
          });
        } else {
          // Redirect to intended page or dashboard
          navigate(from, { replace: true });
        }
      } else {
        setApiError('Error en el inicio de sesión');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error de conexión. Inténtalo de nuevo.';
      setApiError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetForm = () => {
    setFormData({ email: '', password: '' });
    setErrors({});
    setApiError(null);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="login-logo">
              <div className="logo-icon"></div>
              <h1 className="logo-text">Login</h1>
            </div>
            <p className="login-subtitle">
              Bienvenido de nuevo
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="login-form">
            {apiError && (
              <div className="login-error" role="alert">
                <span className="error-icon">⚠️</span>
                <span>{apiError}</span>
              </div>
            )}

            <div className="form-fields">
              <Input
                label="Correo electrónico"
                type="email"
                name="email"
                placeholder="usuario@ejemplo.com"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
                disabled={isLoading}
              />

              <div className="password-input-wrapper">
                <Input
                  label="Contraseña"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Ingresa tu contraseña"
                  value={formData.password}
                  onChange={handleInputChange}
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
                    src={showPassword ? "/invisible.png" : "/ojo.png"}
                    alt={showPassword ? "Ocultar" : "Mostrar"}
                    className="password-toggle-icon"
                  />
                </button>
              </div>
            </div>

            <div className="form-options">
              <Link to="/forgot-password" className="forgot-password-link">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <div className="form-actions">
              <Button
                type="submit"
                variant="primary"
                size="large"
                loading={isLoading}
                className="login-button"
              >
                Iniciar Sesión
              </Button>

              <Button
                type="button"
                variant="outline"
                size="medium"
                onClick={handleResetForm}
                disabled={isLoading}
                className="reset-button"
              >
                Limpiar
              </Button>
            </div>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <p className="signup-prompt">
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className="signup-link">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="login-decoration">
          <div className="decoration-circle decoration-circle--1"></div>
          <div className="decoration-circle decoration-circle--2"></div>
          <div className="decoration-circle decoration-circle--3"></div>
        </div>
      </div>
    </div>
  );
}