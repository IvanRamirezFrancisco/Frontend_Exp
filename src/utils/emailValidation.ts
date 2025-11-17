// emailValidation.ts - Utilidades robustas para validación de correos electrónicos

interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  domain?: string;
  type?: 'educational' | 'governmental' | 'commercial' | 'personal';
}

// Dominios educativos reconocidos - EXTENDIDA
const EDUCATIONAL_DOMAINS = [
  // México - Universidades Tecnológicas y Politécnicas
  'uthh.edu.mx', 'utt.edu.mx', 'utez.edu.mx', 'utvt.edu.mx', 'utcgg.edu.mx',
  'utvm.edu.mx', 'utsem.edu.mx', 'utsjr.edu.mx', 'utcancun.edu.mx',
  
  // México - Universidades Públicas Principales
  'unam.mx', 'ipn.mx', 'uam.mx', 'udg.mx', 'uanl.mx', 'buap.mx', 
  'uach.mx', 'uabc.mx', 'uaslp.mx', 'uas.edu.mx', 'ugto.mx', 'unison.mx',
  'ujat.mx', 'uv.mx', 'uady.mx', 'uat.edu.mx', 'uacj.mx', 'uabjo.mx',
  
  // México - Tecnológicos e Institutos
  'itesm.mx', 'tec.mx', 'tecnm.mx', 'itsz.edu.mx', 'itver.edu.mx',
  'ittoluca.edu.mx', 'itmorelia.edu.mx', 'itmexicali.edu.mx',
  
  // México - Universidades Privadas Reconocidas
  'ibero.mx', 'up.edu.mx', 'anahuac.mx', 'ulsa.mx', 'unitec.mx',
  'uvm.edu.mx', 'unid.edu.mx', 'ula.edu.mx', 'udlap.mx',
  
  // Internacionales - Estados Unidos
  'harvard.edu', 'mit.edu', 'stanford.edu', 'berkeley.edu', 'yale.edu',
  'princeton.edu', 'columbia.edu', 'nyu.edu', 'ucla.edu', 'usc.edu',
  
  // Internacionales - Reino Unido
  'oxford.ac.uk', 'cambridge.ac.uk', 'imperial.ac.uk', 'ucl.ac.uk',
  'kcl.ac.uk', 'lse.ac.uk', 'warwick.ac.uk', 'manchester.ac.uk',
  
  // Internacionales - Otros países
  'sorbonne.fr', 'mcgill.ca', 'utoronto.ca', 'ubc.ca', 'anu.edu.au',
  'sydney.edu.au', 'unsw.edu.au', 'nus.edu.sg', 'ntu.edu.sg',
  
  // Latinoamérica
  'uba.ar', 'usp.br', 'uc.cl', 'unal.edu.co', 'cayetano.edu.pe'
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
 * Determina el tipo de dominio - MEJORADA
 */
export function getDomainType(domain: string): 'educational' | 'governmental' | 'commercial' | 'personal' {
  // Educativos - patrones ampliados
  if (EDUCATIONAL_DOMAINS.includes(domain) || 
      domain.endsWith('.edu') || 
      domain.endsWith('.edu.mx') || 
      domain.endsWith('.edu.ar') || 
      domain.endsWith('.edu.co') || 
      domain.endsWith('.edu.pe') || 
      domain.endsWith('.edu.cl') || 
      domain.endsWith('.edu.br') ||
      domain.endsWith('.ac.uk') ||
      domain.endsWith('.ac.jp') ||
      domain.endsWith('.edu.au') ||
      domain.includes('.edu.') ||
      domain.includes('universidad') ||
      domain.includes('instituto') ||
      domain.includes('tecnologico') ||
      domain.includes('college') ||
      domain.includes('school') ||
      domain.includes('academy')) {
    return 'educational';
  }
  
  // Gubernamentales - patrones ampliados
  if (GOVERNMENTAL_DOMAINS.includes(domain) || 
      domain.endsWith('.gov') || 
      domain.endsWith('.gob.mx') ||
      domain.endsWith('.gob.ar') ||
      domain.endsWith('.gob.co') ||
      domain.endsWith('.gob.pe') ||
      domain.endsWith('.gob.cl') ||
      domain.endsWith('.gov.br') ||
      domain.endsWith('.gov.uk') ||
      domain.endsWith('.gov.au') ||
      domain.endsWith('.gov.ca') ||
      domain.includes('.gob.') ||
      domain.includes('.gov.')) {
    return 'governmental';
  }
  
  // Personales - proveedores conocidos
  const personalProviders = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
    'icloud.com', 'me.com', 'mac.com', 'aol.com', 'protonmail.com',
    'tutanota.com', 'yandex.com', 'mail.com', 'gmx.com'
  ];
  
  if (personalProviders.includes(domain)) {
    return 'personal';
  }
  
  // Comerciales conocidos
  if (TRUSTED_PROVIDERS.includes(domain)) {
    return 'commercial';
  }
  
  // Por defecto, asumir comercial para dominios desconocidos
  return 'commercial';
}

/**
 * Verifica si un dominio es confiable - PERMISIVA PARA PRODUCCIÓN
 */
export function isTrustedDomain(domain: string): boolean {
  // Dominios específicamente permitidos
  if (EDUCATIONAL_DOMAINS.includes(domain) || 
      GOVERNMENTAL_DOMAINS.includes(domain) || 
      TRUSTED_PROVIDERS.includes(domain)) {
    return true;
  }
  
  // Patrones de dominios confiables - AMPLIADOS
  const trustedPatterns = [
    // Educativos
    /\.edu$/,           // Educativos US
    /\.edu\.[a-z]{2}$/,  // Educativos internacionales (edu.mx, edu.ar, etc.)
    /\.ac\.[a-z]{2}$/,   // Académicos internacionales
    /\.school$/,        // Escuelas
    /\.college$/,       // Colegios
    /\.academy$/,       // Academias
    
    // Gubernamentales
    /\.gov$/,           // Gubernamentales US
    /\.gov\.[a-z]{2}$/,  // Gubernamentales internacionales
    /\.gob\.[a-z]{2}$/,  // Gubernamentales hispanohablantes
    /\.mil$/,           // Militares
    
    // Organizaciones
    /\.org$/,           // Organizaciones
    /\.org\.[a-z]{2}$/,  // Organizaciones por país
    /\.int$/,           // Internacionales
    
    // Comerciales comunes
    /\.com$/,           // Comerciales
    /\.com\.[a-z]{2}$/,  // Comerciales por país
    /\.net$/,           // Redes
    /\.info$/,          // Información
    /\.biz$/,           // Negocios
    
    // Nuevos TLDs
    /\.app$/,           // Aplicaciones
    /\.dev$/,           // Desarrolladores
    /\.tech$/,          // Tecnología
    /\.online$/,        // En línea
    /\.site$/,          // Sitios web
    /\.email$/,         // Email
    /\.cloud$/,         // Nube
    
    // Países principales
    /\.[a-z]{2}$/,      // Cualquier código de país de 2 letras
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
 * Validación completa de email - PROFESIONAL Y PERMISIVA
 */
export function validateEmail(email: string): EmailValidationResult {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'El email es obligatorio' };
  }
  
  const cleanEmail = email.trim().toLowerCase();
  
  // 1. Validar formato básico RFC 5322 mejorado
  const advancedEmailRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
  
  if (!advancedEmailRegex.test(cleanEmail)) {
    return { isValid: false, error: 'Formato de email inválido' };
  }
  
  const domain = extractDomain(cleanEmail);
  if (!domain) {
    return { isValid: false, error: 'Dominio de email inválido' };
  }
  
  // 2. Validar estructura básica del dominio
  const domainValidation = validateDomainStructure(domain);
  if (!domainValidation.isValid) {
    return { isValid: false, error: domainValidation.error };
  }
  
  // 3. Validaciones de la parte local (antes del @)
  const localPart = cleanEmail.split('@')[0];
  
  // La parte local no debe ser demasiado corta (mínimo 1 carácter es técnicamente válido)
  if (localPart.length < 1) {
    return { isValid: false, error: 'Nombre de usuario requerido' };
  }
  
  // La parte local no debe ser demasiado larga (estándar RFC)
  if (localPart.length > 64) {
    return { isValid: false, error: 'Nombre de usuario demasiado largo (máximo 64 caracteres)' };
  }
  
  // El dominio no debe ser demasiado largo
  if (domain.length > 255) {
    return { isValid: false, error: 'Dominio demasiado largo (máximo 255 caracteres)' };
  }
  
  // 4. Validaciones de seguridad básicas (solo las críticas)
  const criticallyInvalidPatterns = [
    /^\.+/,            // Empieza con puntos
    /\.+$/,            // Termina con puntos
    /\.{2,}/,          // Múltiples puntos consecutivos
    /@.*@/,            // Múltiples símbolos @
  ];
  
  if (criticallyInvalidPatterns.some(pattern => pattern.test(cleanEmail))) {
    return { isValid: false, error: 'Formato de email inválido' };
  }
  
  // 5. Validaciones específicas de dominios conocidos (permisivas)
  const domainType = getDomainType(domain);
  
  // Para dominios educativos, gubernamentales y comerciales reconocidos: permitir cualquier formato
  if (EDUCATIONAL_DOMAINS.includes(domain) || 
      GOVERNMENTAL_DOMAINS.includes(domain) || 
      TRUSTED_PROVIDERS.includes(domain)) {
    return {
      isValid: true,
      domain,
      type: domainType
    };
  }
  
  // 6. Para dominios no reconocidos: validaciones adicionales de estructura
  const parts = domain.split('.');
  const tld = parts[parts.length - 1];
  
  // Lista amplia de TLDs válidos (Top Level Domains)
  const validTLDs = [
    // Genéricos comunes
    'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
    'info', 'biz', 'name', 'pro', 'aero', 'coop', 'museum',
    
    // Nuevos genéricos
    'app', 'dev', 'tech', 'online', 'site', 'website', 'store',
    'shop', 'blog', 'news', 'media', 'social', 'email', 'cloud',
    
    // Países principales
    'mx', 'us', 'uk', 'ca', 'au', 'de', 'fr', 'it', 'es', 'br',
    'ar', 'cl', 'co', 'pe', 've', 'ec', 'uy', 'py', 'bo', 'cr',
    'gt', 'hn', 'sv', 'ni', 'pa', 'do', 'cu', 'pr', 'jm', 'ht',
    
    // Dominios educativos internacionales
    'edu.mx', 'edu.ar', 'edu.co', 'edu.pe', 'edu.cl', 'edu.br',
    'ac.uk', 'ac.jp', 'edu.au', 'edu.ca', 'edu.in', 'edu.sg',
    
    // Dominios gubernamentales internacionales
    'gob.mx', 'gob.ar', 'gob.co', 'gob.pe', 'gob.cl', 'gov.br',
    'gov.uk', 'gov.au', 'gov.ca', 'gov.in', 'gov.sg'
  ];
  
  // Verificar si el TLD es válido o si es un dominio multinivel válido
  const isValidTLD = validTLDs.includes(tld) || 
                     validTLDs.some(validTLD => domain.endsWith('.' + validTLD));
  
  if (!isValidTLD) {
    // Para TLDs desconocidos, verificar si sigue patrones válidos
    if (tld.length < 2 || tld.length > 6) {
      return { isValid: false, error: 'Extensión de dominio inválida' };
    }
    
    // Permitir si sigue un patrón de TLD válido (solo letras)
    if (!/^[a-z]+$/.test(tld)) {
      return { isValid: false, error: 'Extensión de dominio inválida' };
    }
  }
  
  // 7. Todo parece válido - permitir el registro
  return {
    isValid: true,
    domain,
    type: domainType
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
    'cuenta@outlook.com',
    'nombre@icloud.com'
  ],
  educational: [
    'ana.maria@uthh.edu.mx',
    'profesor@unam.mx',
    'estudiante@itesm.mx',
    'alumno@ipn.mx',
    'docente@tecnm.mx'
  ],
  governmental: [
    'funcionario@gob.mx',
    'empleado@sep.gob.mx',
    'servidor@salud.gob.mx'
  ],
  commercial: [
    'empleado@empresa.com',
    'contacto@negocio.com.mx',
    'info@organizacion.org'
  ]
};