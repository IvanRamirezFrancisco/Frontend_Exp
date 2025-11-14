import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        console.log('Request interceptor - Token available:', token ? 'Yes' : 'No');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('Authorization header set');
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              const response = await this.refreshAccessToken(refreshToken);
              if (response.data.accessToken) {
                this.setToken(response.data.accessToken);
                originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
                return this.client(originalRequest);
              }
            }
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Token management
  public setToken(token: string): void {
    // Usar tanto cookies como localStorage para máxima compatibilidad
    const isProduction = window.location.protocol === 'https:';
    
    // Intentar guardar en cookies
    try {
      Cookies.set('accessToken', token, { 
        secure: isProduction, 
        sameSite: 'lax',
        expires: 1 // 1 día
      });
    } catch (error) {
      console.warn('Failed to set cookie:', error);
    }
    
    // Siempre guardar en localStorage como fallback
    localStorage.setItem('accessToken', token);
    console.log('Token set in both cookie and localStorage');
  }

  public getToken(): string | undefined {
    // Intentar obtener de cookies primero
    let token = Cookies.get('accessToken');
    
    // Si no está en cookies, intentar localStorage
    if (!token) {
      token = localStorage.getItem('accessToken') || undefined;
    }
    
    console.log('Token retrieved:', token ? 'Present' : 'Missing');
    return token;
  }

  public setRefreshToken(token: string): void {
    // Usar tanto cookies como localStorage para máxima compatibilidad
    const isProduction = window.location.protocol === 'https:';
    
    // Intentar guardar en cookies
    try {
      Cookies.set('refreshToken', token, { 
        secure: isProduction, 
        sameSite: 'lax',
        expires: 7 // 7 días
      });
    } catch (error) {
      console.warn('Failed to set refresh cookie:', error);
    }
    
    // Siempre guardar en localStorage como fallback
    localStorage.setItem('refreshToken', token);
  }

  public getRefreshToken(): string | undefined {
    // Intentar obtener de cookies primero
    let token = Cookies.get('refreshToken');
    
    // Si no está en cookies, intentar localStorage
    if (!token) {
      token = localStorage.getItem('refreshToken') || undefined;
    }
    
    return token;
  }

  public clearTokens(): void {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Refresh token endpoint
  private async refreshAccessToken(refreshToken: string): Promise<AxiosResponse> {
    return this.client.post('/auth/refresh', { refreshToken });
  }

  // Generic HTTP methods
  public async get<T>(url: string, params?: any): Promise<AxiosResponse<T>> {
    return this.client.get(url, { params });
  }

  public async post<T>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return this.client.post(url, data);
  }

  public async put<T>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return this.client.put(url, data);
  }

  public async delete<T>(url: string): Promise<AxiosResponse<T>> {
    return this.client.delete(url);
  }

  // File upload
  public async upload<T>(url: string, formData: FormData): Promise<AxiosResponse<T>> {
    return this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Export the class for testing or custom instances
export { ApiClient };