// Types for authentication and user management

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  enabled: boolean;
  twoFactorEnabled: boolean;
  twoFactorType?: 'GOOGLE_AUTHENTICATOR' | 'EMAIL' | 'SMS';
  googleAuthEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginResponse {
  success?: boolean;
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  user?: User;
  twoFactorRequired?: boolean;
  twoFactorType?: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    tokenType?: string;
    expiresIn?: number;
    user?: User;
    twoFactorRequired?: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  phoneNumber?: string;  // Para respuestas de SMS
  requiresPhoneUpdate?: boolean;  // Para indicar si se necesita actualizar teléfono
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetData {
  token: string;
  password: string;
}

export interface TwoFactorSetupResponse {
  success: boolean;
  qrCodeUrl?: string;
  secret?: string;
  backupCodes?: string[];
  message?: string;
}

export interface TwoFactorVerification {
  code: string;
  type: 'GOOGLE_AUTHENTICATOR' | 'EMAIL' | 'SMS';
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  register: (data: RegisterData) => Promise<ApiResponse>;
  logout: () => void;
  refreshToken: () => Promise<string | null>;
  updateUser: (user: User) => void;
  setUser: (user: User) => void;
}