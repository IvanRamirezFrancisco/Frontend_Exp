import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { authService } from '../services/authService';
import './ResetPasswordPage.css';

interface PasswordStrength {
  score: number;
  suggestions: string[];
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Validar token al cargar la página
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Token de recuperación no encontrado. El enlace puede estar incorrecto.');
        setIsValidatingToken(false);
        return;
      }

      try {
        setIsValidatingToken(true);
        const response = await authService.validateResetToken(token);
        
        if (response.success) {
          setTokenValid(true);
        } else {
          setError('El enlace de recuperación ha expirado o es inválido. Solicita uno nuevo.');
          setTokenValid(false);
        }
      } catch (error: any) {
        console.error('Error validating token:', error);
        const errorMessage = error.response?.data?.message || 
                            'Error validando el enlace de recuperación.';
        setError(errorMessage);
        setTokenValid(false);
      } finally {
        setIsValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  // Validación de fortaleza de contraseña
  const checkPasswordStrength = (pwd: string): PasswordStrength => {
    const suggestions: string[] = [];
    let score = 0;

    if (pwd.length >= 8) score++; else suggestions.push('Al menos 8 caracteres');
    if (/[a-z]/.test(pwd)) score++; else suggestions.push('Una letra minúscula');
    if (/[A-Z]/.test(pwd)) score++; else suggestions.push('Una letra mayúscula');
    if (/\d/.test(pwd)) score++; else suggestions.push('Un número');
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(pwd)) score++; else suggestions.push('Un carácter especial');

    return { score, suggestions };
  };

  const passwordStrength = checkPasswordStrength(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const validateForm = (): string | null => {
    if (!password.trim()) {
      return 'La contraseña es obligatoria';
    }

    if (passwordStrength.score < 3) {
      return 'La contraseña no cumple con los requisitos mínimos de seguridad';
    }

    if (!confirmPassword.trim()) {
      return 'Debes confirmar tu contraseña';
    }

    if (password !== confirmPassword) {
      return 'Las contraseñas no coinciden';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Token no encontrado');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.resetPassword({ 
        token, 
        password: password.trim()
      });
      
      if (response.success) {
        setSuccessMessage('¡Contraseña actualizada exitosamente! Ya puedes iniciar sesión con tu nueva contraseña.');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response.message || 'Error al actualizar la contraseña');
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error de conexión. Inténtalo de nuevo.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError(null);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (error) setError(null);
  };

  const getPasswordStrengthColor = (score: number): string => {
    if (score <= 1) return '#e74c3c';
    if (score <= 3) return '#f39c12';
    return '#27ae60';
  };

  const getPasswordStrengthText = (score: number): string => {
    if (score <= 1) return 'Muy débil';
    if (score <= 2) return 'Débil';
    if (score <= 3) return 'Regular';
    if (score <= 4) return 'Fuerte';
    return 'Muy fuerte';
  };

  // Loading state mientras se valida el token
  if (isValidatingToken) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-card">
            <div className="validation-loading">
              <div className="spinner"></div>
              <p>Validando enlace de recuperación...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Token inválido o error
  if (!tokenValid) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-card">
            <div className="reset-password-header">
              <div className="reset-password-logo">
                <div className="logo-icon"></div>
                <h1 className="logo-text">AuthSystem</h1>
              </div>
              <h2 className="reset-password-title">
                Enlace inválido
              </h2>
            </div>

            <div className="reset-password-error" role="alert">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>

            <div className="reset-password-footer">
              <p className="back-to-login">
                <Link to="/forgot-password" className="forgot-link">
                  Solicitar nuevo enlace
                </Link>
                {' | '}
                <Link to="/login" className="login-link">
                  Volver al login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-card">
          {/* Header */}
          <div className="reset-password-header">
            <div className="reset-password-logo">
              <div className="logo-icon">🏛️</div>
              <h1 className="logo-text">AuthSystem</h1>
            </div>
            <h2 className="reset-password-title">
              Nueva contraseña
            </h2>
            <p className="reset-password-subtitle">
              Ingresa tu nueva contraseña segura
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="reset-password-form">
            {error && (
              <div className="reset-password-error" role="alert">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="reset-password-success" role="alert">
                <span className="success-icon">✅</span>
                <div>
                  <p>{successMessage}</p>
                  <p className="redirect-message">
                    Redirigiendo al login en 3 segundos...
                  </p>
                </div>
              </div>
            )}

            {!successMessage && (
              <>
                {/* Nueva contraseña */}
                <div className="form-field">
                  <div className="password-input-wrapper">
                    <Input
                      label="Nueva contraseña"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Ingresa tu nueva contraseña"
                      value={password}
                      onChange={handlePasswordChange}
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      <img 
                        src={showPassword ? "/invisible.png" : "/ojo.png"}
                        alt={showPassword ? "Ocultar" : "Mostrar"}
                      />
                    </button>
                  </div>

                  {/* Password strength indicator */}
                  {password && (
                    <div className="password-strength">
                      <div className="strength-bar">
                        <div 
                          className="strength-fill"
                          style={{
                            width: `${(passwordStrength.score / 5) * 100}%`,
                            backgroundColor: getPasswordStrengthColor(passwordStrength.score)
                          }}
                        ></div>
                      </div>
                      <span 
                        className="strength-text"
                        style={{ color: getPasswordStrengthColor(passwordStrength.score) }}
                      >
                        {getPasswordStrengthText(passwordStrength.score)}
                      </span>
                      {passwordStrength.suggestions.length > 0 && (
                        <div className="strength-suggestions">
                          <p>Para mejorar la seguridad, agrega:</p>
                          <ul>
                            {passwordStrength.suggestions.map((suggestion, index) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Confirmar contraseña */}
                <div className="form-field">
                  <div className="password-input-wrapper">
                    <Input
                      label="Confirmar contraseña"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirma tu nueva contraseña"
                      value={confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      <img 
                        src={showConfirmPassword ? "/invisible.png" : "/ojo.png"}
                        alt={showConfirmPassword ? "Ocultar" : "Mostrar"}
                      />
                    </button>
                  </div>

                  {/* Password match indicator */}
                  {confirmPassword && (
                    <div className={`password-match ${passwordsMatch ? 'match' : 'no-match'}`}>
                      <span className="match-icon">
                        {passwordsMatch ? '✅' : '❌'}
                      </span>
                      <span>
                        {passwordsMatch ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <Button
                    type="submit"
                    variant="primary"
                    size="large"
                    loading={isLoading}
                    disabled={passwordStrength.score < 3 || !passwordsMatch}
                    className="reset-password-button"
                  >
                    Actualizar contraseña
                  </Button>
                </div>
              </>
            )}
          </form>

          {/* Footer */}
          <div className="reset-password-footer">
            <p className="back-to-login">
              ¿Recordaste tu contraseña?{' '}
              <Link to="/login" className="login-link">
                Volver al login
              </Link>
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="reset-password-decoration">
          <div className="decoration-circle decoration-circle--1"></div>
          <div className="decoration-circle decoration-circle--2"></div>
          <div className="decoration-triangle decoration-triangle--1"></div>
        </div>
      </div>
    </div>
  );
}