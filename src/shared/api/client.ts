const debugApi = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.log('[api]', ...args);
  }
};

// Normalize API URL - remove trailing slash and ensure /api is present
const getApiBaseUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';
  
  // Remove all trailing slashes
  let normalized = envUrl.replace(/\/+$/, '');
  
  // If URL doesn't end with /api, add it
  if (!normalized.endsWith('/api')) {
    // Remove any existing /api if it's in the middle
    normalized = normalized.replace(/\/api\/?$/, '');
    normalized = `${normalized}/api`;
  }
  
  // Ensure no trailing slash
  normalized = normalized.replace(/\/+$/, '');
  
  debugApi('base URL', normalized);
  return normalized;
};

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Ensure endpoint starts with / and API_BASE_URL doesn't end with /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    // Remove any double slashes that might occur
    const url = `${API_BASE_URL}${cleanEndpoint}`.replace(/([^:]\/)\/+/g, '$1');
    
    debugApi(options.method || 'GET', url);

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const config: RequestInit = {
      ...options,
      headers,
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      
      debugApi(response.status, url);

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use status text
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
        console.error('API error response:', errorMessage, 'URL:', url);
        throw new Error(errorMessage);
      }

      // Parse JSON only if response is OK
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        debugApi('ok', url);
        return data as T;
      } else {
        // If not JSON, try to parse as text or return empty array/object based on context
        const text = await response.text();
        if (text) {
          try {
            return JSON.parse(text) as T;
          } catch {
            // If parsing fails, return empty array (most common case for entity lists)
            return [] as unknown as T;
          }
        }
        return [] as unknown as T;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('API request timeout:', url);
          throw new Error('Request timeout - please try again');
        }
        console.error('API request error:', error.message, 'URL:', url);
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request<T>(`${endpoint}${queryString}`, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // File upload
  async uploadFile(endpoint: string, file: File): Promise<{ url: string; filename: string; size: number; mimetype: string }> {
    const token = this.getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Upload failed');
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();

