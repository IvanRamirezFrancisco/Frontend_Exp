// phoneUtils.ts - Utilidades para manejo y validación de números telefónicos

interface CountryCode {
  code: string;
  name: string;
  dial: string;
  flag: string;
  minLength: number;
  maxLength: number;
  format?: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: 'MX', name: 'México', dial: '+52', flag: '🇲🇽', minLength: 10, maxLength: 10, format: 'XXX XXX XXXX' },
  { code: 'US', name: 'Estados Unidos', dial: '+1', flag: '🇺🇸', minLength: 10, maxLength: 10, format: '(XXX) XXX-XXXX' },
  { code: 'CA', name: 'Canadá', dial: '+1', flag: '🇨🇦', minLength: 10, maxLength: 10, format: '(XXX) XXX-XXXX' },
  { code: 'ES', name: 'España', dial: '+34', flag: '🇪🇸', minLength: 9, maxLength: 9, format: 'XXX XXX XXX' },
  { code: 'CO', name: 'Colombia', dial: '+57', flag: '🇨🇴', minLength: 10, maxLength: 10, format: 'XXX XXX XXXX' },
  { code: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷', minLength: 10, maxLength: 10, format: 'XX XXXX-XXXX' },
  { code: 'PE', name: 'Perú', dial: '+51', flag: '🇵🇪', minLength: 9, maxLength: 9, format: 'XXX XXX XXX' },
  { code: 'CL', name: 'Chile', dial: '+56', flag: '🇨🇱', minLength: 9, maxLength: 9, format: 'X XXXX XXXX' },
  { code: 'BR', name: 'Brasil', dial: '+55', flag: '🇧🇷', minLength: 10, maxLength: 11, format: '(XX) XXXXX-XXXX' },
  { code: 'GB', name: 'Reino Unido', dial: '+44', flag: '🇬🇧', minLength: 10, maxLength: 10, format: 'XXXX XXX XXXX' }
];

/**
 * Limpia un número telefónico dejando solo dígitos
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Detecta el país basado en un número telefónico completo
 */
export function detectCountryFromPhone(phone: string): CountryCode | null {
  if (!phone.startsWith('+')) return null;
  
  // Ordenar por longitud de dial code (más específico primero)
  const sortedCountries = [...COUNTRY_CODES].sort((a, b) => b.dial.length - a.dial.length);
  
  return sortedCountries.find(country => phone.startsWith(country.dial)) || null;
}

/**
 * Valida un número telefónico internacional
 */
export function validateInternationalPhone(phone: string): {
  isValid: boolean;
  error?: string;
  country?: CountryCode;
} {
  if (!phone) {
    return { isValid: true }; // Campo opcional
  }

  if (!phone.startsWith('+')) {
    return {
      isValid: false,
      error: 'El número debe incluir código de país (+52, +1, etc.)'
    };
  }

  const country = detectCountryFromPhone(phone);
  if (!country) {
    return {
      isValid: false,
      error: 'Código de país no reconocido'
    };
  }

  const localNumber = phone.substring(country.dial.length);
  const cleanLocal = cleanPhoneNumber(localNumber);

  if (cleanLocal.length < country.minLength) {
    return {
      isValid: false,
      error: `Número de ${country.name} debe tener al menos ${country.minLength} dígitos`,
      country
    };
  }

  if (cleanLocal.length > country.maxLength) {
    return {
      isValid: false,
      error: `Número de ${country.name} debe tener máximo ${country.maxLength} dígitos`,
      country
    };
  }

  // Validaciones específicas por país
  if (country.code === 'MX' && !isValidMexicanNumber(cleanLocal)) {
    return {
      isValid: false,
      error: 'Número mexicano inválido',
      country
    };
  }

  if ((country.code === 'US' || country.code === 'CA') && !isValidNorthAmericanNumber(cleanLocal)) {
    return {
      isValid: false,
      error: 'Número de US/Canadá inválido',
      country
    };
  }

  return {
    isValid: true,
    country
  };
}

/**
 * Valida formato específico de números mexicanos
 */
function isValidMexicanNumber(localNumber: string): boolean {
  if (localNumber.length !== 10) return false;
  
  // No debe empezar con 0 o 1
  if (localNumber[0] === '0' || localNumber[0] === '1') return false;
  
  return true;
}

/**
 * Valida formato específico de números de Norte América (US/Canadá)
 */
function isValidNorthAmericanNumber(localNumber: string): boolean {
  if (localNumber.length !== 10) return false;
  
  const areaCode = localNumber.substring(0, 3);
  const exchange = localNumber.substring(3, 6);
  
  // Código de área no puede empezar con 0 o 1
  if (areaCode[0] === '0' || areaCode[0] === '1') return false;
  
  // Exchange no puede empezar con 0 o 1
  if (exchange[0] === '0' || exchange[0] === '1') return false;
  
  return true;
}

/**
 * Formatea un número telefónico según el formato del país
 */
export function formatPhoneNumber(phone: string, format?: string): string {
  if (!format) return phone;
  
  const digits = cleanPhoneNumber(phone);
  let formatted = '';
  let digitIndex = 0;
  
  for (let i = 0; i < format.length && digitIndex < digits.length; i++) {
    if (format[i] === 'X') {
      formatted += digits[digitIndex];
      digitIndex++;
    } else if (digitIndex > 0) {
      formatted += format[i];
    }
  }
  
  return formatted;
}

/**
 * Convierte un número local a internacional
 */
export function toInternationalFormat(localNumber: string, countryCode: string): string {
  const country = COUNTRY_CODES.find(c => c.code === countryCode);
  if (!country) return localNumber;
  
  const clean = cleanPhoneNumber(localNumber);
  return `${country.dial}${clean}`;
}

/**
 * Extrae el número local de un número internacional
 */
export function extractLocalNumber(internationalNumber: string): string {
  const country = detectCountryFromPhone(internationalNumber);
  if (!country) return internationalNumber;
  
  return internationalNumber.substring(country.dial.length);
}

/**
 * Obtiene información de un país por código
 */
export function getCountryByCode(code: string): CountryCode | undefined {
  return COUNTRY_CODES.find(country => country.code === code);
}

/**
 * Obtiene información de un país por dial code
 */
export function getCountryByDialCode(dialCode: string): CountryCode | undefined {
  return COUNTRY_CODES.find(country => country.dial === dialCode);
}