import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { authService } from '../services/authService';
import './ManualVerifyPage.css';

export function ManualVerifyPage() {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token.trim()) {
      setMessage('Por favor ingresa el token de verificación');
      setStatus('error');
      return;
    }

    try {
      setStatus('loading');
      setMessage('');
      
      const response = await authService.verifyEmail(token.trim());
      
      if (response.success) {
        setStatus('success');
        setMessage('¡Cuenta verificada exitosamente!');
        
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Cuenta verificada. Ya puedes iniciar sesión.',
              verified: true 
            } 
          });
        }, 2000);
      } else {
        setStatus('error');
        setMessage(response.message || 'Error al verificar la cuenta');
      }
    } catch (error: any) {
      console.error('Error verificando:', error);
      setStatus('error');
      setMessage(
        error.response?.data?.message || 
        'Error de conexión. Verifica que el servidor esté funcionando.'
      );
    }
  };

  return (
    <div className="manual-verify-page">
      <div className="manual-verify-container">
        <div className="manual-verify-card">
          <div className="manual-verify-header">
            <h2>Verificar Cuenta Manualmente</h2>
            <p>Ingresa el código de verificación que recibiste por email</p>
          </div>

          <form onSubmit={handleSubmit} className="manual-verify-form">
            <Input
              label="Código de Verificación"
              type="text"
              name="token"
              placeholder="Pega aquí el código que recibiste por email"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={status === 'loading'}
              className="token-input"
            />

            {message && (
              <div className={`message ${status === 'success' ? 'success' : 'error'}`}>
                {message}
              </div>
            )}

            <div className="form-actions">
              <Button
                type="submit"
                variant="primary"
                size="large"
                loading={status === 'loading'}
                disabled={status === 'loading' || !token.trim()}
                className="verify-button"
              >
                {status === 'loading' ? 'Verificando...' : 'Verificar Cuenta'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/login')}
                disabled={status === 'loading'}
                className="back-button"
              >
                Volver al Login
              </Button>
            </div>
          </form>

          <div className="help-info">
            <h4>¿Dónde encontrar el código?</h4>
            <p>1. Revisa tu email (incluyendo spam)</p>
            <p>2. Busca el email de "AuthSystem"</p>
            <p>3. Copia el código que aparece en la caja gris</p>
            <p>4. Pégalo en el campo de arriba</p>
          </div>
        </div>
      </div>
    </div>
  );
}