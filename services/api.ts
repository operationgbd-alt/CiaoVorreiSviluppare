import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// URL del backend - FALLBACK HARDCODED per sicurezza
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl 
  || 'https://solartech-backend-production.up.railway.app/api';

// Log per debug - rimuovi in produzione
console.log('[API] Base URL:', API_BASE_URL);

async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('authToken');
  } catch {
    return null;
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${API_BASE_URL}${endpoint}`;
  console.log('[API] Request:', options.method || 'GET', url);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('[API] Error:', error);
    throw error;
  }
}

export const api = {
  // Auth
  login: async (username: string, password: string) => {
    return apiRequest<{ success: boolean; data: { token: string; user: any } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  // Users
  getUsers: async () => {
    return apiRequest<{ success: boolean; data: any[] }>('/users');
  },

  createUser: async (userData: any) => {
    return apiRequest<{ success: boolean; data: any }>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  updateUser: async (id: string, userData: any) => {
    return apiRequest<{ success: boolean; data: any }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  deleteUser: async (id: string) => {
    return apiRequest<{ success: boolean }>(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Companies
  getCompanies: async () => {
    return apiRequest<{ success: boolean; data: any[] }>('/companies');
  },

  createCompany: async (companyData: any) => {
    return apiRequest<{ success: boolean; data: any }>('/companies', {
      method: 'POST',
      body: JSON.stringify(companyData),
    });
  },

  updateCompany: async (id: string, companyData: any) => {
    return apiRequest<{ success: boolean; data: any }>(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(companyData),
    });
  },

  deleteCompany: async (id: string) => {
    return apiRequest<{ success: boolean }>(`/companies/${id}`, {
      method: 'DELETE',
    });
  },

  // Interventions
  getInterventions: async () => {
    return apiRequest<{ success: boolean; data: any[] }>('/interventions');
  },

  getIntervention: async (id: string) => {
    return apiRequest<{ success: boolean; data: any }>(`/interventions/${id}`);
  },

  createIntervention: async (interventionData: any) => {
    return apiRequest<{ success: boolean; data: any }>('/interventions', {
      method: 'POST',
      body: JSON.stringify(interventionData),
    });
  },

  updateIntervention: async (id: string, interventionData: any) => {
    return apiRequest<{ success: boolean; data: any }>(`/interventions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(interventionData),
    });
  },

  deleteIntervention: async (id: string) => {
    return apiRequest<{ success: boolean }>(`/interventions/${id}`, {
      method: 'DELETE',
    });
  },

  // Status update
  updateInterventionStatus: async (id: string, status: string, notes?: string) => {
    return apiRequest<{ success: boolean; data: any }>(`/interventions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  },

  // GPS update
  updateInterventionGps: async (id: string, latitude: number, longitude: number) => {
    return apiRequest<{ success: boolean; data: any }>(`/interventions/${id}/gps`, {
      method: 'PUT',
      body: JSON.stringify({ latitude, longitude }),
    });
  },

  // Appointment
  setAppointment: async (id: string, date: string, notes?: string) => {
    return apiRequest<{ success: boolean; data: any }>(`/interventions/${id}/appointment`, {
      method: 'POST',
      body: JSON.stringify({ date, notes }),
    });
  },

  // Photos
  getPhotos: async (interventionId: string) => {
    return apiRequest<{ success: boolean; data: any[] }>(`/photos/intervention/${interventionId}`);
  },

  uploadPhoto: async (interventionId: string, photoData: string, mimeType: string, description?: string) => {
    return apiRequest<{ success: boolean; data: any }>('/photos', {
      method: 'POST',
      body: JSON.stringify({
        intervention_id: interventionId,
        photo_data: photoData,
        mime_type: mimeType,
        description,
      }),
    });
  },

  deletePhoto: async (id: string) => {
    return apiRequest<{ success: boolean }>(`/photos/${id}`, {
      method: 'DELETE',
    });
  },

  // Reports
  generateReport: async (interventionId: string) => {
    return apiRequest<{ success: boolean; data: { pdf: string } }>(`/reports/intervention/${interventionId}`);
  },

  // Push Tokens - NOMI CORRETTI
  registerPushToken: async (token: string) => {
    return apiRequest<{ success: boolean }>('/push-tokens/register', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  unregisterPushToken: async (token: string) => {
    return apiRequest<{ success: boolean }>('/push-tokens/unregister', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  // Technicians location (for map)
  getTechniciansLocations: async () => {
    return apiRequest<{ success: boolean; data: any[] }>('/users/technicians/locations');
  },
};