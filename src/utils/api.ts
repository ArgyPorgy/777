// API client for 777 game backend

// Get API URL from environment or default to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public error?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    // Handle 502 Bad Gateway
    if (response.status === 502) {
      throw new ApiError(
        'Server temporarily unavailable. Please try again.',
        response.status,
        'ServerUnavailable'
      );
    }
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new ApiError(
        'Server returned an unexpected response. Please try again.',
        response.status,
        'InvalidResponse'
      );
    }

    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || data.error || 'Request failed',
        response.status,
        data.error
      );
    }

    if (!data.success || !data.data) {
      throw new ApiError(
        data.message || data.error || 'Invalid response format',
        response.status,
        data.error
      );
    }

    return data.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(
        'Unable to connect to server. Please check your connection.',
        0,
        'NetworkError'
      );
    }

    throw new ApiError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0,
      'UnknownError'
    );
  }
}

export async function getGameState(address: string) {
  return fetchApi<any>(`/game/state?address=${address}`, {
    method: 'GET',
  });
}

export async function saveSpin(
  address: string,
  signature?: string
) {
  return fetchApi<any>('/game/spin', {
    method: 'POST',
    headers: {
      'x-wallet-address': address,
    },
    body: JSON.stringify({
      signature,
      timestamp: Date.now(),
    }),
  });
}

export async function getLeaderboard(
  limit = 50,
  offset = 0,
  address?: string
) {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  
  if (address) {
    params.append('address', address);
  }

  return fetchApi<any>(`/leaderboard?${params.toString()}`, {
    method: 'GET',
    ...(address && {
      headers: {
        'x-wallet-address': address,
      },
    }),
  });
}
