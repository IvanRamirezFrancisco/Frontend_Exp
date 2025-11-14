import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { authService } from '../services/authService';
import './VerifyAccountPage.css';

export function VerifyAccountPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState<string>('');
  const navigate = useNavigate();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de verificación no encontrado');
      return;
    }

    verifyToken(token);
  }, [token]);

  const verifyToken = async (verificationToken: string) => {
    try {
      setStatus('loading');
      
      const response = await authService.verifyEmail(verificationToken);
      
      if (response.success) {
        setStatus('success');
        setMessage('¡Tu cuenta ha sido verificada exitosamente!');
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Cuenta verificada exitosamente. Ya puedes iniciar sesión.',
              verified: true 
            } 
          });
        }, 3000);
      } else {
        setStatus('error');
        setMessage(response.message || 'Error al verificar la cuenta');
      }
    } catch (error: any) {
      console.error('Error verificando cuenta:', error);
      
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || '';
        if (errorMessage.includes('expirado')) {
          setStatus('expired');
          setMessage('El token de verificación ha expirado');
        } else if (errorMessage.includes('usado') || errorMessage.includes('inválido')) {
          setStatus('error');
          setMessage('Token de verificación inválido o ya usado');
        } else {
          setStatus('error');
          setMessage(errorMessage || 'Error al verificar la cuenta');
        }
      } else {
        setStatus('error');
        setMessage('Error de conexión. Inténtalo de nuevo.');
      }
    }
  };

  const handleResendEmail = async () => {
    // Esta funcionalidad requeriría el email del usuario
    // Por ahora, redirigir al login
    navigate('/login', { 
      state: { 
        message: 'Solicita un nuevo email de verificación desde el login si es necesario.' 
      } 
    });
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <div className="verify-icon loading">
              <div className="spinner"></div>
            </div>
            <h2>Verificando tu cuenta...</h2>
            <p>Por favor espera mientras verificamos tu token.</p>
          </>
        );

      case 'success':
        return (
          <>
            <div className="verify-icon success">
              <svg viewBox="0 0 24 24" className="checkmark">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2>¡Cuenta Verificada!</h2>
            <p>{message}</p>
            <p className="redirect-info">Serás redirigido al login en unos segundos...</p>
            <Button 
              onClick={() => navigate('/login')}
              variant="primary"
              className="verify-action-btn"
            >
              Ir al Login
            </Button>
          </>
        );

      case 'expired':
        return (
          <>
            <div className="verify-icon error">
              <svg viewBox="0 0 24 24" className="clock">
                <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8zm1-13h-2v6l5.25 3.15.75-1.23L13 11.25V7z" />
              </svg>
            </div>
            <h2>Token Expirado</h2>
            <p>{message}</p>
            <p>Los tokens de verificación expiran después de 24 horas por seguridad.</p>
            <div className="verify-actions">
              <Button 
                onClick={handleResendEmail}
                variant="primary"
                className="verify-action-btn"
              >
                Solicitar Nuevo Email
              </Button>
              <Button 
                onClick={() => navigate('/login')}
                variant="outline"
                className="verify-action-btn"
              >
                Ir al Login
              </Button>
            </div>
          </>
        );

      case 'error':
      default:
        return (
          <>
            <div className="verify-icon error">
              <svg viewBox="0 0 24 24" className="error-icon">
                <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8zm1-5h-2v2h2zm0-8h-2v6h2z" />
              </svg>
            </div>
            <h2>Error de Verificación</h2>
            <p>{message}</p>
            <div className="verify-actions">
              <Button 
                onClick={handleResendEmail}
                variant="primary"
                className="verify-action-btn"
              >
                Solicitar Nuevo Email
              </Button>
              <Button 
                onClick={() => navigate('/login')}
                variant="outline"
                className="verify-action-btn"
              >
                Ir al Login
              </Button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="verify-page">
      <div className="verify-container">
        <div className="verify-card">
          <div className="verify-header">
            <div className="verify-logo">
              <h1>AuthSystem</h1>
            </div>
          </div>

          <div className="verify-content">
            {renderContent()}
          </div>

          <div className="verify-footer">
            <p>¿Necesitas ayuda? <a href="#contact">Contáctanos</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}