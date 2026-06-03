const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Memory cache for tokens to prevent redundant read/writes to localStorage
let cachedAccessToken: string | null = null;
let cachedRefreshToken: string | null = null;

// Safe token retrieval
export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  if (!cachedAccessToken) {
    cachedAccessToken = localStorage.getItem('wavo_access_token');
  }
  return cachedAccessToken;
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  if (!cachedRefreshToken) {
    cachedRefreshToken = localStorage.getItem('wavo_refresh_token');
  }
  return cachedRefreshToken;
};

export const setTokens = (accessToken: string, refreshToken: string) => {
  if (typeof window === 'undefined') return;
  cachedAccessToken = accessToken;
  cachedRefreshToken = refreshToken;
  localStorage.setItem('wavo_access_token', accessToken);
  localStorage.setItem('wavo_refresh_token', refreshToken);
};

export const clearTokens = () => {
  if (typeof window === 'undefined') return;
  cachedAccessToken = null;
  cachedRefreshToken = null;
  localStorage.removeItem('wavo_access_token');
  localStorage.removeItem('wavo_refresh_token');
  localStorage.removeItem('wavo_user');
};

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const processQueue = (token: string | null) => {
  refreshQueue.forEach((callback) => {
    if (token) callback(token);
  });
  refreshQueue = [];
};

/**
 * Custom Fetch API Wrapper that implements automatic JWT Attachments,
 * 401 Interceptors, and Transparent Refresh Token Rotation.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Attach token
  const headers = new Headers(options.headers || {});
  
  // Default to empty JSON body for POST/PUT/PATCH requests to avoid 415 (Unsupported Media Type)
  // errors when reverse proxies append text/plain or other types on empty POST bodies.
  let body = options.body;
  if (['POST', 'PUT', 'PATCH'].includes(options.method || '') && !body) {
    body = JSON.stringify({});
  }

  if (body && !headers.has('Content-Type') && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const config = {
    ...options,
    body,
    headers,
  };

  try {
    let response = await fetch(url, config);

    // 401 Interceptor: Access token expired or suspended
    if (response.status === 401) {
      try {
        const clone = response.clone();
        const errJson = await clone.json();
        if (errJson?.error?.code === 'USER_SUSPENDED') {
          clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login?suspended=true';
          }
          return errJson;
        }
      } catch (e) {
        // Ignore clone parsing errors
      }

      const refreshToken = getRefreshToken();

      if (refreshToken) {
        // If already refreshing, queue this request
        if (isRefreshing) {
          return new Promise<ApiResponse<T>>((resolve) => {
            refreshQueue.push((newAccessToken) => {
              const newHeaders = new Headers(config.headers);
              newHeaders.set('Authorization', `Bearer ${newAccessToken}`);
              resolve(
                fetch(url, { ...config, headers: newHeaders }).then((res) =>
                  res.json()
                )
              );
            });
          });
        }

        isRefreshing = true;

        try {
          // Attempt token rotation
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshData.data;

            setTokens(newAccessToken, newRefreshToken);
            processQueue(newAccessToken);
            isRefreshing = false;

            // Retry original request
            const retryHeaders = new Headers(config.headers);
            retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);
            response = await fetch(url, { ...config, headers: retryHeaders });
          } else {
            // Refresh token has expired/reuse attack detected -> log out user
            isRefreshing = false;
            processQueue(null);
            clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return {
              success: false,
              error: {
                code: 'UNAUTHORIZED',
                message: 'Your session has expired. Please log in again.',
              },
            };
          }
        } catch (refreshErr) {
          isRefreshing = false;
          processQueue(null);
          return {
            success: false,
            error: {
              code: 'NETWORK_ERROR',
              message: 'Failed to refresh authentication session.',
            },
          };
        }
      }
    }

    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'A network error occurred.',
      },
    };
  }
}
