const API_BASE_URL = 'http://149.50.146.106:3101/api';

// Tipos
export interface User {
  id: number;
  nombre: string;
  email: string;
  fecha_creacion: string;
}

export interface Book {
  id: number;
  usuario_id: number;
  titulo: string;
  autor: string;
  editorial?: string;
  anio_publicacion?: number;
  estado: 'en_estante' | 'prestado' | 'otro';
  leido: boolean;
  fecha_registro: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  nombre: string;
  email: string;
  password: string;
}

export interface BookFormData {
  titulo: string;
  autor: string;
  editorial?: string;
  anio_publicacion?: number;
  estado: 'en_estante' | 'prestado' | 'otro';
  leido: boolean;
}

export interface Stats {
  total_libros: number;
  libros_prestados: number;
  libros_en_estante: number;
  libros_leidos: number;
  libros_no_leidos: number;
}

// Utilidades
const getToken = () => localStorage.getItem('token');
const setToken = (token: string) => localStorage.setItem('token', token);
const removeToken = () => localStorage.removeItem('token');

// Decodificar JWT para obtener información del usuario
const decodeToken = (token: string): any => {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      }
    } catch {
      // Si no es JSON válido, usar text
      const errorText = await response.text();
      if (errorText) {
        errorMessage = errorText;
      }
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

// Servicios de autenticación
export const authService = {
  async login(data: LoginData) {
    const response = await apiRequest('/usuarios/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.token) {
      setToken(response.token);
    }
    return response;
  },

  async register(data: RegisterData) {
    const response = await apiRequest('/usuarios/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.token) {
      setToken(response.token);
    }
    return response;
  },

  async getProfile() {
    return apiRequest('/usuarios/profile');
  },

  getUserFromToken(): User | null {
    const token = getToken();
    if (!token) return null;

    const decoded = decodeToken(token);
    if (!decoded) return null;

    return {
      id: decoded.id,
      nombre: decoded.nombre,
      email: decoded.email,
      fecha_creacion: decoded.fecha_creacion
    };
  },

  async updateProfile(data: { nombre?: string; email?: string }) {
    return apiRequest('/usuarios/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteAccount() {
    return apiRequest('/usuarios/profile', {
      method: 'DELETE',
    });
  },

  logout() {
    removeToken();
  },

  getToken,
  isAuthenticated() {
    return !!getToken();
  },
};

// Servicios de libros
export const bookService = {
  async getBooks() {
    const response = await apiRequest('/libros');
    return response.libros as Book[];
  },

  async getBook(id: number) {
    return apiRequest(`/libros/${id}`);
  },

  async createBook(data: BookFormData) {
    return apiRequest('/libros', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateBook(id: number, data: Partial<BookFormData>) {
    return apiRequest(`/libros/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteBook(id: number) {
    return apiRequest(`/libros/${id}`, {
      method: 'DELETE',
    });
  },

  async searchBooks(query: string) {
    const response = await apiRequest(`/libros/search?q=${encodeURIComponent(query)}`);
    return response.libros as Book[];
  },

  async getBooksByStatus(status: string) {
    const response = await apiRequest(`/libros/estado/${status}`);
    return response.libros as Book[];
  },

  async getBooksByReadStatus(read: boolean) {
    const response = await apiRequest(`/libros/leido/${read}`);
    return response.libros as Book[];
  },

  async getStats() {
    const response = await apiRequest('/libros/stats/estadisticas');
    return response.estadisticas as Stats;
  },
};