import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import './TwoFactorPage.css';

interface LocationState {
  email: string;
}

interface Available2FAMethods {
  googleAuthenticator: boolean;
  sms: boolean;
  email: boolean;
}

const TwoFactorPage: React.FC = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [method, setMethod] = useState<'GOOGLE_AUTHENTICATOR' | 'EMAIL' | 'SMS'>('EMAIL');
  const [availableMethods, setAvailableMethods] = useState<Available2FAMethods>({
    googleAuthenticator: false,
    sms: false,
    email: false
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();

  const email = (location.state as LocationState)?.email || '';

  useEffect(() => {
    if (!email) {
      navigate('/login');
      return;
    }
    loadAvailableMethods();
  }, [email, navigate]);

  const loadAvailableMethods = async () => {
    try {
      setMethodsLoading(true);
      const methods = await authService.getAvailable2FAMethods(email);
      setAvailableMethods(methods);

      // Seleccionar el primer método disponible automáticamente
      if (methods.email) {
        setMethod('EMAIL');
      } else if (methods.googleAuthenticator) {
        setMethod('GOOGLE_AUTHENTICATOR');
      } else if (methods.sms) {
        setMethod('SMS');
      }
    } catch (error) {
      console.error('Error loading 2FA methods:', error);
      setError('Error al cargar métodos de verificación');
    } finally {
      setMethodsLoading(false);
    }
  };

  const validateCode = (code: string): boolean => {
    return /^\d{6}$/.test(code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateCode(code)) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    // Prevenir múltiples submissions
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const response = await authService.verify2FA({
        email,
        code,
        method
      });

      console.log('2FA verification response:', response);

      // Verificar la estructura correcta de la respuesta
      if (response.success !== false && response.data?.user) {
        setUser(response.data.user);
        // Navegar al dashboard después de un breve delay para confirmar el éxito
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      } else if (response.success !== false && response.user) {
        // Fallback por si la respuesta tiene una estructura diferente
        setUser(response.user);
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      } else {
        setError('Código inválido');
      }
    } catch (error: any) {
      console.error('2FA verification failed:', error);
      
      // Manejo más específico de errores
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Error al verificar el código. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await authService.resend2FA({ email, method });
      if (response.success) {
        setError('Código reenviado exitosamente');
      } else {
        setError(response.message || 'Error al reenviar código');
      }
    } catch (error) {
      console.error('Resend 2FA failed:', error);
      setError('Error al reenviar código');
    } finally {
      setLoading(false);
    }
  };

  const getMethodDisplayName = (method: string): string => {
    switch (method) {
      case 'GOOGLE_AUTHENTICATOR':
        return 'Google Authenticator';
      case 'EMAIL':
        return 'Correo Electrónico';
      case 'SMS':
        return 'SMS';
      default:
        return method;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'GOOGLE_AUTHENTICATOR':
        return '/images/Google.png';
      case 'EMAIL':
        return '/images/GMAIL.png';
      case 'SMS':
        return '/images/SMS.png';
      default:
        return '🔒';
    }
  };

  const getMethodDescription = (method: string): string => {
    switch (method) {
      case 'GOOGLE_AUTHENTICATOR':
        return 'Usa la aplicación Google Authenticator';
      case 'EMAIL':
        return 'Código enviado a tu correo electrónico';
      case 'SMS':
        return 'Código enviado a tu teléfono móvil';
      default:
        return '';
    }
  };

  const getAvailableMethodsList = () => {
    const methods = [];
    if (availableMethods.email) {
      methods.push({ value: 'EMAIL', label: 'Correo Electrónico', icon: '/GMAIL.png' });
    }
    if (availableMethods.googleAuthenticator) {
      methods.push({ value: 'GOOGLE_AUTHENTICATOR', label: 'Google Authenticator', icon: '/images/Google.png' });
    }
    if (availableMethods.sms) {
      methods.push({ value: 'SMS', label: 'SMS', icon: '/SMS.png' });
    }
    return methods;
  };

  if (methodsLoading) {
    return (
      <div className="two-factor-container">
        <div className="two-factor-card">
          <div className="loading-methods">
            <div className="loading-spinner"></div>
            <p>Cargando métodos de verificación...</p>
          </div>
        </div>
      </div>
    );
  }

  const availableMethodsList = getAvailableMethodsList();

  if (availableMethodsList.length === 0) {
    return (
      <div className="two-factor-container">
        <div className="two-factor-card">
          <div className="no-methods">
            <div className="no-methods-icon">🔒</div>
            <h2>Sin métodos 2FA configurados</h2>
            <p>Esta cuenta no tiene métodos de verificación en dos pasos configurados.</p>
            <Button onClick={() => navigate('/login')} className="back-to-login-btn">
              Volver al Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="two-factor-container">
      <div className="two-factor-card">
        <div className="two-factor-header">
          <div className="header-icon">🔐</div>
          <h2>Verificación en Dos Pasos</h2>
          <p>Selecciona tu método de verificación preferido</p>
        </div>

        {availableMethodsList.length > 1 && (
          <div className="method-selector-grid">
            <label className="method-selector-label">Método de verificación:</label>
            <div className="methods-grid">
              {availableMethodsList.map((methodOption) => (
                <button
                  key={methodOption.value}
                  type="button"
                  className={`method-option ${method === methodOption.value ? 'active' : ''}`}
                  onClick={() => setMethod(methodOption.value as typeof method)}
                  disabled={loading}
                >
                  <div className="method-option-icon">
                    {typeof methodOption.icon === 'string' && methodOption.icon.startsWith('/') ? (
                      <img src={methodOption.icon} alt={methodOption.label} width="24" height="24" />
                    ) : (
                      methodOption.icon
                    )}
                  </div>
                  <div className="method-option-label">{methodOption.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="current-method-info">
          <div className="method-info-card">
            <div className="method-info-header">
              <span className="method-info-icon">
                {typeof getMethodIcon(method) === 'string' && getMethodIcon(method).startsWith('/') ? (
                  <img src={getMethodIcon(method)} alt={getMethodDisplayName(method)} width="24" height="24" />
                ) : (
                  getMethodIcon(method)
                )}
              </span>
              <div>
                <h3>{getMethodDisplayName(method)}</h3>
                <p>{getMethodDescription(method)}</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="two-factor-form">
          <div className="code-input-container">
            <div className="input-label">
              {method === 'GOOGLE_AUTHENTICATOR' ? 
                'Código de Google Authenticator' : 
                'Código de verificación'
              }
            </div>
            <Input
              type="text"
              name="code"
              placeholder={method === 'GOOGLE_AUTHENTICATOR' ? 
                'Código de 6 dígitos de la app' : 
                'Código de 6 dígitos enviado'
              }
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              disabled={loading}
              className="code-input"
            />
            {method !== 'GOOGLE_AUTHENTICATOR' && (
              <div className="code-helper">
                <span className="helper-icon">📱</span>
                Revisa {method === 'EMAIL' ? 'tu correo electrónico' : 'tu teléfono móvil'}
              </div>
            )}
            {method === 'GOOGLE_AUTHENTICATOR' && (
              <div className="code-helper">
                <span className="helper-icon"><img src="/images/Google.png" alt="Google Authenticator" width="20" height="20" /></span>
                Abre la app de Google Authenticator y ingresa el código actual
              </div>
            )}
          </div>

          {error && (
            <div className={`message ${error.includes('exitosamente') ? 'success' : 'error'}`}>
              {error}
            </div>
          )}

          <div className="button-group">
            <Button 
              type="submit" 
              disabled={loading || !validateCode(code)}
              className="verify-btn"
            >
              {loading ? 'Verificando...' : 'Verificar Código'}
            </Button>

            {method !== 'GOOGLE_AUTHENTICATOR' && (
              <Button 
                type="button" 
                onClick={handleResendCode}
                disabled={loading}
                className="resend-btn secondary"
              >
                Reenviar Código
              </Button>
            )}
          </div>
        </form>

        <div className="two-factor-footer">
          <p>¿Problemas con la verificación?</p>
          <button 
            onClick={() => navigate('/login')}
            className="back-to-login"
          >
            Volver al Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorPage;