import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { authService } from '../services/authService';
import './ForgotPasswordPage.css';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const validateEmail = (email: string): boolean => {
    // Usar la validación profesional del utility
    const emailRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('El email es obligatorio');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Ingresa un email válido');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      const response = await authService.requestPasswordReset(email.trim());
      
      if (response.success) {
        setSuccessMessage(
          response.message || 
          'Se ha enviado un enlace de recuperación a tu email. Revisa tu bandeja de entrada.'
        );
        
        // Redirect to login after 5 seconds
        setTimeout(() => {
          navigate('/login');
        }, 5000);
      } else {
        setError(response.message || 'Error al solicitar recuperación de contraseña');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error de conexión. Inténtalo de nuevo.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) {
      setError(null);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          {/* Header */}
          <div className="forgot-password-header">
            <div className="forgot-password-logo">
              <div className="logo-icon"></div>
              <h1 className="logo-text"> Reseteo </h1>
            </div>
            <h2 className="forgot-password-title">
              Recuperar contraseña
            </h2>
            <p className="forgot-password-subtitle">
              Ingresa tu email registrado y verificado. Te enviaremos un enlace seguro para restablecer tu contraseña
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="forgot-password-form">
            {error && (
              <div className="forgot-password-error" role="alert">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="forgot-password-success" role="alert">
                <span className="success-icon">✅</span>
                <div>
                  <p>{successMessage}</p>
                  <p className="redirect-message">
                    Serás redirigido al login en unos segundos...
                  </p>
                </div>
              </div>
            )}

            {!successMessage && (
              <>
                <div className="form-field">
                  <Input
                    label="Correo electrónico"
                    type="email"
                    name="email"
                    placeholder="usuario@ejemplo.com"
                    value={email}
                    onChange={handleEmailChange}
                    error={error || undefined}
                    disabled={isLoading}

                  />
                </div>

                <div className="security-note">
                  <div className="security-icon">🔒</div>
                  <p>
                    <strong>Nota de seguridad:</strong> Solo las cuentas verificadas pueden solicitar 
                    restablecimiento de contraseña. El enlace será válido por 1 hora.
                  </p>
                </div>

                <div className="form-actions">
                  <Button
                    type="submit"
                    variant="primary"
                    size="large"
                    loading={isLoading}
                    className="forgot-password-button"
                  >
                    Enviar enlace de recuperación
                  </Button>
                </div>
              </>
            )}
          </form>

          {/* Footer */}
          <div className="forgot-password-footer">
            <p className="back-to-login">
              ¿Recordaste tu contraseña?{' '}
              <Link to="/login" className="login-link">
                Volver al login
              </Link>
            </p>
            
            {!successMessage && (
              <p className="register-prompt">
                ¿No tienes una cuenta?{' '}
                <Link to="/register" className="register-link">
                  Regístrate aquí
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="forgot-password-decoration">
          <div className="decoration-circle decoration-circle--1"></div>
          <div className="decoration-circle decoration-circle--2"></div>
          <div className="decoration-triangle decoration-triangle--1"></div>
        </div>
      </div>
    </div>
  );
}