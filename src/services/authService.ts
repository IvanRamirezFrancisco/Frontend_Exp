import { apiClient } from './apiClient';
import type { 
  LoginCredentials, 
  RegisterData, 
  LoginResponse, 
  ApiResponse, 
  User, 
  PasswordResetData,
  TwoFactorSetupResponse,
  TwoFactorVerification
} from '../types';

class AuthService {
  // Authentication endpoints
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    
    console.log('Login response:', response.data);
    console.log('Response data structure:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data?.accessToken && response.data.data?.refreshToken) {
      console.log('Setting tokens...');
      apiClient.setToken(response.data.data.accessToken);
      apiClient.setRefreshToken(response.data.data.refreshToken);
      console.log('Tokens set successfully');
    } else {
      console.log('Tokens not found in response');
    }
    
    return response.data.data || response.data as any;
  }

  async register(data: RegisterData): Promise<ApiResponse<User>> {
    const response = await apiClient.post<ApiResponse<User>>('/auth/register', data);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      apiClient.clearTokens();
    }
  }

  async refreshToken(): Promise<string | null> {
    const refreshToken = apiClient.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await apiClient.post<{ accessToken: string }>('/auth/refresh', {
        refreshToken
      });
      
      if (response.data.accessToken) {
        apiClient.setToken(response.data.accessToken);
        return response.data.accessToken;
      }
    } catch (error) {
      apiClient.clearTokens();
    }
    
    return null;
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<ApiResponse<User>>('/auth/me');
      return response.data.data || null;
    } catch (error) {
      return null;
    }
  }

  // Password Reset - Rutas corregidas según backend
  async requestPasswordReset(email: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(data: PasswordResetData): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/auth/reset-password', data);
    return response.data;
  }

  async validateResetToken(token: string): Promise<ApiResponse> {
    const response = await apiClient.get<ApiResponse>(`/auth/validate-reset-token?token=${encodeURIComponent(token)}`);
    return response.data;
  }

  // Google Authenticator Methods
  async setupGoogleAuthenticator(): Promise<TwoFactorSetupResponse> {
    const response = await apiClient.get<ApiResponse<{ qrCode: string; manualEntryKey: string }>>('/2fa/google/qrcode');
    if (response.data.success) {
      return {
        success: true,
        qrCodeUrl: response.data.data?.qrCode,
        secret: response.data.data?.manualEntryKey
      };
    }
    return { success: false, message: response.data.message };
  }

  async enableGoogleAuthenticator(code: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/2fa/google/confirm', { code });
    return response.data;
  }

  async disableGoogleAuthenticator(): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/2fa/disable/GOOGLE_AUTHENTICATOR');
    return response.data;
  }

  // Email 2FA Methods
  async enableEmailTwoFactor(): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/2fa/email/enable');
    return response.data;
  }

  async sendEmailCode(): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/2fa/email/send');
    return response.data;
  }

  async verifyEmailTwoFactor(code: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/2fa/email/verify', { code });
    return response.data;
  }

  async disableEmailTwoFactor(): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/2fa/disable/EMAIL');
    return response.data;
  }

  // SMS 2FA Methods
  async setupSmsTwoFactor(phoneNumber: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/2fa/sms/setup/send-code', { phoneNumber });
    return response.data;
  }

  async confirmSmsTwoFactor(code: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/2fa/sms/setup/verify-code', { code });
    return response.data;
  }

  async sendSmsCode(): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/2fa/sms/send');
    return response.data;
  }

  async verifySmsTwoFactor(code: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/2fa/sms/verify', { code });
    return response.data;
  }

  async disableSmsTwoFactor(): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/2fa/disable/SMS');
    return response.data;
  }

  async verifyTwoFactor(verification: TwoFactorVerification): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/2fa/verify', verification);
    return response.data;
  }

  async verify2FA(data: { email: string; code: string; method: string }): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/2fa/verify-login', data);
    
    if (response.data.success && response.data.data?.accessToken && response.data.data?.refreshToken) {
      apiClient.setToken(response.data.data.accessToken);
      apiClient.setRefreshToken(response.data.data.refreshToken);
    }
    
    return response.data.data || response.data as any;
  }

  async resend2FA(data: { email: string; method: string }): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/2fa/resend', data);
    return response.data;
  }

  // Email verification
  async resendVerificationEmail(): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/auth/resend-verification');
    return response.data;
  }

  async verifyEmail(token: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/auth/verify-email', { token });
    return response.data;
  }

  // Fix roles method (temporary)
  async assignUserRole(): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/fix/assign-user-role');
    return response.data;
  }

  // Get available 2FA methods for login (no auth required)
  async getAvailable2FAMethods(email: string): Promise<{
    googleAuthenticator: boolean;
    sms: boolean;
    email: boolean;
  }> {
    const response = await apiClient.get<ApiResponse<{
      googleAuthenticator: boolean;
      sms: boolean;
      email: boolean;
    }>>(`/2fa/methods/${encodeURIComponent(email)}`);
    
    return response.data.data || {
      googleAuthenticator: false,
      sms: false,
      email: false
    };
  }

  // Utility methods
  isLoggedIn(): boolean {
    return !!apiClient.getToken();
  }

  getStoredToken(): string | undefined {
    return apiClient.getToken();
  }
}

export const authService = new AuthService();
export { AuthService };