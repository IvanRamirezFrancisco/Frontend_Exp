import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ToastContainer, useToast } from '../components/common/Toast';
import { authService } from '../services/authService';
import './DashboardPage.css';

interface SecurityLevel {
  level: number;
  name: string;
  color: string;
  description: string;
  percentage: number;
}

interface TwoFactorMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  setup: () => void;
  disable?: () => void;
}

export function DashboardPage() {
  const { user, logout, updateUser, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toasts, removeToast, showSuccess, showError, showWarning } = useToast();
  const [actionLoading, setActionLoading] = useState(false);
  
  // Google Authenticator states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [manualKey, setManualKey] = useState<string>('');
  const [googleAuthCode, setGoogleAuthCode] = useState('');
  const [isEnablingGoogle, setIsEnablingGoogle] = useState(false);
  
  // SMS states - Modal Profesional
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsPhone, setSmsPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsModalStep, setSmsModalStep] = useState<'initial' | 'code-sent' | 'edit-phone'>('initial');
  const [isCodeInputEnabled, setIsCodeInputEnabled] = useState(false);
  const [isEnablingSms, setIsEnablingSms] = useState(false);
  const [codeSentSuccessfully, setCodeSentSuccessfully] = useState(false);
  
  // Email 2FA state
  const [isEnablingEmail, setIsEnablingEmail] = useState(false);

  // Función para enmascarar número de teléfono
  const maskPhoneNumber = (phone: string): string => {
    if (!phone || phone.length < 4) return phone;
    
    // Limpiar el número (solo dígitos y +)
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    
    if (cleanPhone.length <= 4) return cleanPhone;
    
    // Mostrar solo los últimos 2 dígitos
    const lastTwoDigits = cleanPhone.slice(-2);
    const maskedPart = '*'.repeat(Math.max(0, cleanPhone.length - 2));
    
    return maskedPart + lastTwoDigits;
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const getSecurityLevel = (): SecurityLevel => {
    let activeCount = 0;
    
    if (user?.googleAuthEnabled) activeCount++;
    if (user?.smsEnabled) activeCount++;
    if (user?.emailEnabled) activeCount++;

    const levels: SecurityLevel[] = [
      { level: 1, name: 'Básica', color: '#dc3545', description: 'Solo contraseña', percentage: 25 },
      { level: 2, name: 'Media', color: '#fd7e14', description: 'Contraseña + 1 método 2FA', percentage: 50 },
      { level: 3, name: 'Alta', color: '#ffc107', description: 'Contraseña + 2 métodos 2FA', percentage: 75 },
      { level: 4, name: 'Máxima', color: '#28a745', description: 'Contraseña + todos los métodos 2FA', percentage: 100 }
    ];

    return levels[Math.min(activeCount, 3)];
  };

  const getTwoFactorMethods = (): TwoFactorMethod[] => [
    {
      id: 'google',
      name: 'Google Authenticator',
      description: 'Códigos TOTP generados por la aplicación',
      icon: '/images/Google.png',
      enabled: user?.googleAuthEnabled || false,
      setup: setupGoogleAuth,
      disable: disableGoogleAuth
    },
    {
      id: 'sms',
      name: 'SMS 2FA',
      description: 'Códigos enviados a tu teléfono móvil',
      icon: '/images/SMS.png',
      enabled: user?.smsEnabled || false,
      setup: () => {
        setupSmsAuth();
      },
      disable: disableSmsAuth
    },
    {
      id: 'email',
      name: 'Email 2FA',
      description: 'Códigos enviados a tu correo electrónico',
      icon: '/images/GMAIL.png',
      enabled: user?.emailEnabled || false,
      setup: setupEmailAuth,
      disable: disableEmailAuth
    }
  ];

  const setupGoogleAuth = async () => {
    try {
      setIsEnablingGoogle(true);
      
      // Primero intentar configurar Google Auth
      const response = await authService.setupGoogleAuthenticator();
      if (response.success && response.qrCodeUrl) {
        setQrCode(response.qrCodeUrl);
        setManualKey(response.secret || '');
        setShowGoogleModal(true);
      } else {
        showError('Error de configuración', response.message || 'Error al configurar Google Authenticator');
      }
    } catch (error: any) {
      console.error('Error setting up Google Auth:', error);
      
      // Si el error es 403, intentar arreglar roles usando authService
      if (error.response?.status === 403) {
        try {
          const fixResponse = await authService.assignUserRole();
          if (fixResponse.success) {
            showSuccess('Rol asignado', 'Rol USER asignado. Intenta activar Google Auth nuevamente.');
          } else {
            showError('Error de roles', 'No se pudo asignar el rol USER');
          }
        } catch (fixError) {
          console.error('Error fixing roles:', fixError);
          showError('Error de conexión', error.response?.data?.message || 'Error al configurar Google Authenticator');
        }
      } else {
        showError('Error de conexión', error.response?.data?.message || 'Error al configurar Google Authenticator');
      }
    } finally {
      setIsEnablingGoogle(false);
    }
  };

  const confirmGoogleAuth = async () => {
    if (!googleAuthCode || googleAuthCode.length !== 6) {
      showWarning('Código requerido', 'Ingrese un código válido de 6 dígitos');
      return;
    }

    try {
      setIsEnablingGoogle(true);
      const response = await authService.enableGoogleAuthenticator(googleAuthCode);
      if (response.success) {
        // Actualizar usuario con Google Auth habilitado
        const updatedUser = {
          ...user!,
          googleAuthEnabled: true,
          twoFactorEnabled: true
        };
        updateUser(updatedUser);
        
        // Cerrar modal y limpiar estados
        setShowGoogleModal(false);
        setGoogleAuthCode('');
        setQrCode('');
        setManualKey('');
        
        showSuccess('¡Éxito!', 'Google Authenticator habilitado exitosamente');
      } else {
        showError('Código inválido', response.message || 'Código inválido. Inténtalo de nuevo.');
      }
    } catch (error: any) {
      console.error('Error confirming Google Auth:', error);
      showError('Error de confirmación', error.response?.data?.message || 'Error al confirmar Google Authenticator');
    } finally {
      setIsEnablingGoogle(false);
    }
  };

  const disableGoogleAuth = async () => {
    if (!confirm('¿Estás seguro de que quieres deshabilitar Google Authenticator?')) return;
    
    try {
      setIsEnablingGoogle(true);
      const response = await authService.disableGoogleAuthenticator();
      if (response.success) {
        updateUser({
          ...user!,
          googleAuthEnabled: false,
          twoFactorEnabled: user!.smsEnabled || user!.emailEnabled,
          twoFactorType: user!.smsEnabled ? 'SMS' : user!.emailEnabled ? 'EMAIL' : undefined
        });
      }
    } catch (error) {
      console.error('Error disabling Google Auth:', error);
    } finally {
      setIsEnablingGoogle(false);
    }
  };

  const setupSmsAuth = async () => {
    // Verificar si el usuario ya tiene un número registrado
    if (user?.phone && user.phone.trim() !== '') {
      try {
        setIsEnablingSms(true);
        const response = await authService.enableSmsWithExistingNumber();
        if (response.success) {
          setSmsPhone(response.phoneNumber || user.phone);
          setSmsModalStep('code-sent');
          setIsCodeInputEnabled(true);
          setCodeSentSuccessfully(true);
          setShowSmsModal(true);
          showSuccess('Código enviado', `Código SMS enviado a tu número registrado: ${response.phoneNumber || user.phone}`);
        } else {
          // Si falla, mostrar opción para actualizar número
          setSmsPhone(user.phone);
          setSmsModalStep('edit-phone');
          setIsCodeInputEnabled(false);
          setCodeSentSuccessfully(false);
          setShowSmsModal(true);
        }
      } catch (error: any) {
        console.error('Error enabling SMS with existing number:', error);
        // En caso de error, abrir modal para ingresar/actualizar número
        setSmsPhone(user.phone || '');
        setSmsModalStep('edit-phone');
        setIsCodeInputEnabled(false);
        setCodeSentSuccessfully(false);
        setShowSmsModal(true);
      } finally {
        setIsEnablingSms(false);
      }
    } else {
      // No hay número registrado, solicitar uno nuevo
      setSmsPhone('');
      setSmsModalStep('edit-phone');
      setIsCodeInputEnabled(false);
      setCodeSentSuccessfully(false);
      setShowSmsModal(true);
    }
  };

  const updatePhoneAndEnableSms = async () => {
    if (!smsPhone.trim()) {
      showWarning('Teléfono requerido', 'Por favor ingresa un número de teléfono válido');
      return;
    }

    // Validar formato básico de teléfono
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
    if (!phoneRegex.test(smsPhone)) {
      showWarning('Formato inválido', 'Por favor ingresa un número de teléfono válido (ej: +1234567890)');
      return;
    }
    
    try {
      setIsEnablingSms(true);
      const response = await authService.updatePhoneAndEnableSms(smsPhone);
      if (response.success) {
        setSmsModalStep('initial');
        setIsCodeInputEnabled(true);
        setCodeSentSuccessfully(true);
        showSuccess('Número actualizado', 'Número actualizado y código SMS enviado. Revisa tu teléfono.');
      } else {
        showError('Error de envío', response.message || 'Error al actualizar número y enviar código SMS');
      }
    } catch (error: any) {
      console.error('Error updating phone and enabling SMS:', error);
      showError('Error de conexión', error.response?.data?.message || 'Error al actualizar número');
    } finally {
      setIsEnablingSms(false);
    }
  };



  const confirmSmsAuth = async () => {
    if (!smsCode || smsCode.length < 4) {
      showWarning('Código requerido', 'Ingrese un código válido');
      return;
    }
    
    try {
      setIsEnablingSms(true);
      const response = await authService.confirmSmsTwoFactor(smsCode);
      if (response.success) {
        // Actualizar usuario con SMS 2FA habilitado
        const updatedUser = {
          ...user!,
          smsEnabled: true,
          twoFactorEnabled: true,
          phone: smsPhone
        };
        updateUser(updatedUser);
        
        // Cerrar modal y limpiar estados
        setShowSmsModal(false);
        setSmsPhone('');
        setSmsCode('');
        setSmsModalStep('initial');
        setIsCodeInputEnabled(false);
        setCodeSentSuccessfully(false);
        
        showSuccess('¡SMS 2FA activado!', 'SMS 2FA habilitado exitosamente');
      } else {
        showError('Código inválido', response.message || 'Código inválido. Inténtalo de nuevo.');
      }
    } catch (error: any) {
      console.error('Error confirming SMS:', error);
      showError('Error de confirmación', error.response?.data?.message || 'Error al confirmar código SMS');
    } finally {
      setIsEnablingSms(false);
    }
  };

  const disableSmsAuth = async () => {
    if (!confirm('¿Estás seguro de que quieres deshabilitar SMS 2FA?')) return;
    
    try {
      setIsEnablingSms(true);
      const response = await authService.disableSmsTwoFactor();
      if (response.success) {
        // Actualizar usuario con SMS 2FA deshabilitado
        const updatedUser = {
          ...user!,
          smsEnabled: false,
          twoFactorEnabled: user!.googleAuthEnabled || user!.emailEnabled
        };
        updateUser(updatedUser);
        
        showSuccess('SMS 2FA desactivado', 'SMS 2FA deshabilitado exitosamente');
      } else {
        showError('Error', response.message || 'Error al deshabilitar SMS 2FA');
      }
    } catch (error: any) {
      console.error('Error disabling SMS Auth:', error);
      showError('Error de conexión', error.response?.data?.message || 'Error al deshabilitar SMS 2FA');
    } finally {
      setIsEnablingSms(false);
    }
  };

  const setupEmailAuth = async () => {
    if (!confirm('¿Quieres habilitar la autenticación de dos factores por email?')) return;

    try {
      setIsEnablingEmail(true);
      const response = await authService.enableEmailTwoFactor();
      if (response.success) {
        // Actualizar usuario con Email 2FA habilitado
        const updatedUser = {
          ...user!,
          emailEnabled: true,
          twoFactorEnabled: true
        };
        updateUser(updatedUser);
        
        showSuccess('¡Email 2FA activado!', 'Email 2FA habilitado exitosamente! Ahora recibirás códigos de verificación en tu email.');
      } else {
        showError('Error de configuración', response.message || 'Error al habilitar Email 2FA');
      }
    } catch (error: any) {
      console.error('Error setting up Email 2FA:', error);
      showError('Error de conexión', error.response?.data?.message || 'Error al configurar Email 2FA');
    } finally {
      setIsEnablingEmail(false);
    }
  };

  const disableEmailAuth = async () => {
    if (!confirm('¿Estás seguro de que quieres deshabilitar Email 2FA?')) return;
    
    try {
      setIsEnablingEmail(true);
      const response = await authService.disableEmailTwoFactor();
      if (response.success) {
        // Actualizar usuario con Email 2FA deshabilitado
        const updatedUser = {
          ...user!,
          emailEnabled: false,
          twoFactorEnabled: user!.googleAuthEnabled || user!.smsEnabled
        };
        updateUser(updatedUser);
        
        showSuccess('Email 2FA desactivado', 'Email 2FA deshabilitado exitosamente');
      } else {
        showError('Error', response.message || 'Error al deshabilitar Email 2FA');
      }
    } catch (error: any) {
      console.error('Error disabling Email Auth:', error);
      showError('Error de conexión', error.response?.data?.message || 'Error al deshabilitar Email 2FA');
    } finally {
      setIsEnablingEmail(false);
    }
  };

  const handleLogout = async () => {
    try {
      setActionLoading(true);
      await logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return null; // This will trigger the useEffect redirect
  }

  const securityLevel = getSecurityLevel();
  const twoFactorMethods = getTwoFactorMethods();

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-content">
            <div className="header-info">
              <div className="logo">
                <span className="logo-icon"></span>
                <span className="logo-text"></span>
              </div>
              <div className="user-welcome">
                <h1>Bienvenido, {user.firstName}!</h1>
                <p className="welcome-date">
                  {new Date().toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            <div className="header-actions">
              <div className="user-info">
                <div className="user-avatar">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
                <div className="user-details">
                  <span className="user-name">{user.firstName} {user.lastName}</span>
                  <span className="user-email">{user.email}</span>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                loading={actionLoading}
                className="logout-button"
              >
                🔓 Cerrar Sesión
              </Button>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {/* Security Level Overview */}
          <div className="security-overview">
            <div className="security-level-card">
              <div className="level-header">
                <h3>Nivel de Seguridad</h3>
                <div className="level-badge" style={{ backgroundColor: securityLevel.color }}>
                  {securityLevel.name}
                </div>
              </div>
              
              <div className="level-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${securityLevel.percentage}%`,
                      backgroundColor: securityLevel.color 
                    }}
                  ></div>
                </div>
                <span className="progress-text">{securityLevel.percentage}%</span>
              </div>
              
              <p className="level-description">{securityLevel.description}</p>
              
              <div className="security-stats">
                <div className="stat-item">
                  <span className="stat-value">
                    {twoFactorMethods.filter(m => m.enabled).length}
                  </span>
                  <span className="stat-label">Métodos 2FA activos</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">
                    {user.createdAt ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                  </span>
                  <span className="stat-label">Días como miembro</span>
                </div>
              </div>
            </div>
            
            <div className="quick-actions">
              <h4>Recomendaciones de Seguridad</h4>
              {securityLevel.level < 4 && (
                <div className="recommendation">
                  <span className="rec-icon"></span>
                  <span>Tienes Google Authenticator activado. Considera agregar SMS 2FA para máxima seguridad.</span>
                </div>
              )}
              {!user.googleAuthEnabled && (
                <div className="recommendation">
                  <span className="rec-icon">⚠️</span>
                  <span>Activa Google Authenticator para mejor seguridad</span>
                </div>
              )}
            </div>
          </div>

          {/* Two-Factor Authentication Methods */}
          <div className="security-methods">
            <h3>Autenticación de Dos Factores</h3>
            <p className="methods-description">Gestiona tus métodos de seguridad</p>
            
            <div className="methods-grid">
              {twoFactorMethods.map((method) => (
                <div key={method.id} className={`method-card ${method.enabled ? 'enabled' : 'disabled'}`}>
                  <div className="method-header">
                    <div className="method-icon">
                      {typeof method.icon === 'string' ? (
                        <img src={method.icon} alt={method.name} width="32" height="32" />
                      ) : (
                        method.icon
                      )}
                    </div>
                    <div className="method-status">
                      {method.enabled ? (
                        <span className="status-active">● Activo</span>
                      ) : (
                        <span className="status-inactive">● Inactivo</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="method-content">
                    <h4>{method.name}</h4>
                    <p>{method.description}</p>
                  </div>
                  
                  <div className="method-actions">
                    {method.enabled ? (
                      <Button
                        onClick={method.disable}
                        variant="outline"
                        size="small"
                        loading={isEnablingGoogle || isEnablingSms || isEnablingEmail}
                        className="disable-btn"
                      >
                        Deshabilitar
                      </Button>
                    ) : (
                      <Button
                        onClick={method.setup}
                        variant="primary"
                        size="small"
                        loading={isEnablingGoogle || isEnablingSms || isEnablingEmail}
                        className="enable-btn"
                      >
                        + Activar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="activity-card">
            <h3>Actividad Reciente</h3>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon">🔐</div>
                <div className="activity-info">
                  <p className="activity-description">Inicio de sesión exitoso</p>
                  <p className="activity-time">Ahora</p>
                </div>
              </div>
              
              {user?.createdAt && (
                <div className="activity-item">
                  <div className="activity-icon">👤</div>
                  <div className="activity-info">
                    <p className="activity-description">Cuenta creada</p>
                    <p className="activity-time">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Google Authenticator Setup Modal */}
        {showGoogleModal && (
          <div className="modal-overlay" onClick={() => setShowGoogleModal(false)}>
            <div className="modal-content google-authenticator-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Activar Google Authenticator</h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowGoogleModal(false)}
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-body">
                <div className="auth-setup-container">
                  <div className="qr-section">
                    <h3>Escanea el código QR con la app de Google Authenticator.</h3>
                    
                    {qrCode && (
                      <div className="qr-code-container">
                        <img src={qrCode} alt="QR Code for Google Authenticator" className="qr-code" />
                      </div>
                    )}
                    
                    <div className="manual-entry-section">
                      <p>O ingresa este código manualmente:</p>
                      <div className="manual-key-container">
                        <code className="manual-key">{manualKey}</code>
                        <button 
                          className="copy-key-btn"
                          onClick={() => {
                            navigator.clipboard.writeText(manualKey);
                            showSuccess('Copiado', 'Código copiado al portapapeles');
                          }}
                          title="Copiar código"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="verification-section">
                    <div className="verification-form">
                      <label htmlFor="googleCode">Código de 6 dígitos:</label>
                      <Input
                        type="text"
                        name="googleCode"
                        placeholder="000000"
                        value={googleAuthCode}
                        onChange={(e) => setGoogleAuthCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        disabled={isEnablingGoogle}
                        className="verification-code-input"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-actions">
                <Button
                  onClick={() => setShowGoogleModal(false)}
                  variant="outline"
                  disabled={isEnablingGoogle}
                  className="cancel-btn"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmGoogleAuth}
                  variant="primary"
                  loading={isEnablingGoogle}
                  disabled={googleAuthCode.length !== 6}
                  className="confirm-btn"
                >
                  Confirmar activación
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* SMS Setup Modal */}
        {showSmsModal && (
          <div className="modal-overlay" onClick={() => setShowSmsModal(false)}>
            <div className="modal-content sms-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3><img src="/SMS.png" alt="SMS" width="20" height="20" style={{marginRight: '8px'}} /> Configurar SMS 2FA</h3>
                <button 
                  className="modal-close"
                  onClick={() => setShowSmsModal(false)}
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-body">
                {smsModalStep === 'initial' ? (
                  <>
                    <p style={{ fontSize: '16px', marginBottom: '15px', color: '#2c3e50' }}>
                      Código para el envío del código es: <strong className="masked-phone">{user?.phone ? maskPhoneNumber(user.phone) : '*******XX'}</strong>
                    </p>
                    
                    <Input
                      type="text"
                      name="smsCode"
                      label="Código de verificación"
                      placeholder="Ingresa el código aquí"
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value)}
                      disabled={!isCodeInputEnabled}
                      maxLength={6}
                    />
                    
                    {codeSentSuccessfully && (
                      <div className="info-box code-sent-success">
                        <span className="info-icon">✅</span>
                        <span>Código enviado exitosamente - Expira en 5 minutos</span>
                      </div>
                    )}
                  </>
                ) : smsModalStep === 'edit-phone' ? (
                  <>
                    <p>Actualizar número de teléfono</p>
                    {user?.phone && (
                      <div className="info-box">
                        <span className="info-icon">📱</span>
                        <span>Número actual: {maskPhoneNumber(user.phone)}</span>
                      </div>
                    )}
                    
                    <Input
                      type="tel"
                      name="smsPhone"
                      label="Nuevo número de teléfono"
                      placeholder="+1234567890"
                      value={smsPhone}
                      onChange={(e) => setSmsPhone(e.target.value)}
                      disabled={isEnablingSms}
                    />
                    
                    <div className="info-box">
                      <span className="info-icon">ℹ️</span>
                      <span>Incluye el código de país. Ejemplo: +52 para México</span>
                    </div>

                    {user?.phone && (
                      <Button
                        onClick={() => {
                          setSmsPhone(user.phone || '');
                          setSmsModalStep('initial');
                          setIsCodeInputEnabled(false);
                          setCodeSentSuccessfully(false);
                        }}
                        variant="outline"
                        disabled={isEnablingSms}
                        className="secondary-button"
                      >
                        Usar número actual ({maskPhoneNumber(user.phone)})
                      </Button>
                    )}
                  </>
                ) : null}
              </div>
              
              <div className="modal-actions">
                <Button
                  onClick={() => {
                    setShowSmsModal(false);
                    setSmsModalStep('initial');
                    setIsCodeInputEnabled(false);
                    setCodeSentSuccessfully(false);
                    setSmsCode('');
                  }}
                  variant="outline"
                  disabled={isEnablingSms}
                >
                  Cancelar
                </Button>
                
                {smsModalStep === 'initial' && (
                  <>
                    <Button
                      onClick={() => {
                        setSmsModalStep('edit-phone');
                        setSmsPhone(user?.phone || '');
                      }}
                      variant="outline"
                      disabled={isEnablingSms}
                      className="secondary-button"
                    >
                      Actualizar número
                    </Button>
                    
                    <Button
                      onClick={!isCodeInputEnabled ? setupSmsAuth : confirmSmsAuth}
                      variant="primary"
                      loading={isEnablingSms}
                      disabled={isCodeInputEnabled && !smsCode.trim()}
                    >
                      {!isCodeInputEnabled ? 'Enviar código' : 'Confirmar código'}
                    </Button>
                  </>
                )}
                
                {smsModalStep === 'edit-phone' && (
                  <Button
                    onClick={updatePhoneAndEnableSms}
                    variant="primary"
                    loading={isEnablingSms}
                    disabled={!smsPhone.trim()}
                  >
                    Actualizar y enviar código
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      </div>
    </div>
  );
}