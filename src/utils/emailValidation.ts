// emailValidation.ts - Utilidades robustas para validación de correos electrónicos

interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  domain?: string;
  type?: 'educational' | 'governmental' | 'commercial' | 'personal';
}

// Dominios educativos reconocidos
const EDUCATIONAL_DOMAINS = [
  // México
  'uthh.edu.mx', 'unam.mx', 'itesm.mx', 'ipn.mx', 'uam.mx', 'udg.mx',
  'uanl.mx', 'buap.mx', 'uach.mx', 'uat.edu.mx', 'uabc.mx', 'uaslp.mx',
  'uas.edu.mx', 'ugto.mx', 'unison.mx', 'uach.edu.mx', 'ujat.mx',
  
  // Internacionales
  'harvard.edu', 'mit.edu', 'stanford.edu', 'berkeley.edu', 'yale.edu',
  'oxford.ac.uk', 'cambridge.ac.uk', 'sorbonne.fr', 'mcgill.ca'
];

// Dominios gubernamentales reconocidos
const GOVERNMENTAL_DOMAINS = [
  // México
  'gob.mx', 'sep.gob.mx', 'imss.gob.mx', 'issste.gob.mx', 
  'sat.gob.mx', 'inegi.gob.mx', 'conacyt.mx', 'salud.gob.mx',
  'semarnat.gob.mx', 'energia.gob.mx', 'hacienda.gob.mx',
  
  // Internacionales
  'gov', 'state.gov', 'nih.gov', 'cdc.gov', 'nasa.gov'
];

// Proveedores de email comerciales/personales confiables
const TRUSTED_PROVIDERS = [
  // Principales
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
  'live.com', 'icloud.com', 'me.com', 'mac.com',
  
  // Alternativos confiables
  'protonmail.com', 'tutanota.com', 'zoho.com', 'yandex.com',
  'mail.com', 'gmx.com', 'aol.com', 'fastmail.com',
  
  // Empresariales reconocidos
  'microsoft.com', 'google.com', 'apple.com', 'amazon.com',
  'facebook.com', 'meta.com', 'twitter.com', 'x.com', 
  'linkedin.com', 'adobe.com', 'salesforce.com', 'dropbox.com'
];

/**
 * Valida formato básico de email
 */
export function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Obtiene el dominio de un email
 */
export function extractDomain(email: string): string | null {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : null;
}

/**
 * Determina el tipo de dominio
 */
export function getDomainType(domain: string): 'educational' | 'governmental' | 'commercial' | 'personal' {
  if (EDUCATIONAL_DOMAINS.includes(domain) || domain.endsWith('.edu') || domain.endsWith('.edu.mx')) {
    return 'educational';
  }
  
  if (GOVERNMENTAL_DOMAINS.includes(domain) || domain.endsWith('.gov') || domain.endsWith('.gob.mx')) {
    return 'governmental';
  }
  
  if (TRUSTED_PROVIDERS.includes(domain)) {
    return domain.includes('gmail.com') || domain.includes('yahoo.com') || 
           domain.includes('hotmail.com') || domain.includes('outlook.com') || 
           domain.includes('icloud.com') ? 'personal' : 'commercial';
  }
  
  return 'commercial';
}

/**
 * Verifica si un dominio es confiable
 */
export function isTrustedDomain(domain: string): boolean {
  // Dominios específicamente permitidos
  if (EDUCATIONAL_DOMAINS.includes(domain) || 
      GOVERNMENTAL_DOMAINS.includes(domain) || 
      TRUSTED_PROVIDERS.includes(domain)) {
    return true;
  }
  
  // Patrones de dominios confiables
  const trustedPatterns = [
    /\.edu$/,           // Educativos US
    /\.edu\.mx$/,       // Educativos México
    /\.ac\.uk$/,        // Académicos Reino Unido
    /\.gov$/,           // Gubernamentales US
    /\.gob\.mx$/,       // Gubernamentales México
    /\.org$/,           // Organizaciones
    /\.mil$/,           // Militares
  ];
  
  return trustedPatterns.some(pattern => pattern.test(domain));
}

/**
 * Valida la estructura del dominio
 */
export function validateDomainStructure(domain: string): { isValid: boolean; error?: string } {
  const parts = domain.split('.');
  
  // Debe tener al menos 2 partes (ej: ejemplo.com)
  if (parts.length < 2) {
    return { isValid: false, error: 'Dominio incompleto' };
  }
  
  const tld = parts[parts.length - 1]; // Top Level Domain
  const sld = parts[parts.length - 2]; // Second Level Domain
  
  // TLD debe tener al menos 2 caracteres
  if (tld.length < 2) {
    return { isValid: false, error: 'Extensión de dominio inválida' };
  }
  
  // SLD debe tener al menos 2 caracteres (rechaza dominios como "a.com")
  if (sld.length < 2) {
    return { isValid: false, error: 'Dominio demasiado corto' };
  }
  
  // Verificar caracteres válidos
  const validDomainRegex = /^[a-zA-Z0-9.-]+$/;
  if (!validDomainRegex.test(domain)) {
    return { isValid: false, error: 'Caracteres inválidos en dominio' };
  }
  
  // No debe empezar o terminar con guión
  if (domain.startsWith('-') || domain.endsWith('-')) {
    return { isValid: false, error: 'Formato de dominio inválido' };
  }
  
  return { isValid: true };
}

/**
 * Validación completa de email
 */
export function validateEmail(email: string): EmailValidationResult {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'El email es obligatorio' };
  }
  
  const cleanEmail = email.trim().toLowerCase();
  
  // Validar formato básico
  if (!validateEmailFormat(cleanEmail)) {
    return { isValid: false, error: 'Formato de email inválido' };
  }
  
  const domain = extractDomain(cleanEmail);
  if (!domain) {
    return { isValid: false, error: 'Dominio de email inválido' };
  }
  
  // Validar estructura del dominio
  const domainValidation = validateDomainStructure(domain);
  if (!domainValidation.isValid) {
    return { isValid: false, error: domainValidation.error };
  }
  
  // Validar email institucional específico (UTHH)
  if (domain === 'uthh.edu.mx') {
    if (!/^\d{8}@uthh\.edu\.mx$/.test(cleanEmail)) {
      return { 
        isValid: false, 
        error: 'Email institucional debe ser: 12345678@uthh.edu.mx',
        domain,
        type: 'educational'
      };
    }
  }
  
  // Verificar si es un dominio confiable
  if (!isTrustedDomain(domain)) {
    return { 
      isValid: false, 
      error: 'Dominio de email no reconocido. Use un proveedor confiable (Gmail, Yahoo, Outlook, etc.)',
      domain 
    };
  }
  
  // Validaciones adicionales de seguridad
  const localPart = cleanEmail.split('@')[0];
  
  // La parte local no debe ser demasiado corta
  if (localPart.length < 2) {
    return { isValid: false, error: 'Nombre de usuario demasiado corto' };
  }
  
  // No debe contener secuencias sospechosas
  const suspiciousPatterns = [
    /^test/,           // Empieza con "test"
    /^admin/,          // Empieza con "admin"  
    /^noreply/,        // Empieza con "noreply"
    /\+.*\+/,          // Múltiples signos +
    /\.{2,}/,          // Múltiples puntos consecutivos
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(localPart))) {
    return { isValid: false, error: 'Formato de email inválido' };
  }
  
  return {
    isValid: true,
    domain,
    type: getDomainType(domain)
  };
}

/**
 * Lista de ejemplos de emails válidos para mostrar al usuario
 */
export const EMAIL_EXAMPLES = {
  personal: [
    'usuario@gmail.com',
    'correo@yahoo.com', 
    'email@hotmail.com',
    'cuenta@outlook.com'
  ],
  educational: [
    '12345678@uthh.edu.mx',
    'estudiante@unam.mx',
    'alumno@itesm.mx'
  ],
  governmental: [
    'funcionario@gob.mx',
    'empleado@sep.gob.mx'
  ]
};