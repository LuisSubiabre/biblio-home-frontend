const API_BASE_URL = "https://biblio-home-backend.vercel.app/api";

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
  estado: "en_estante" | "prestado" | "otro";
  leido: boolean;
  isbn?: string;
  portada_url?: string;
  tipo?:
    | "libro"
    | "comic"
    | "manga"
    | "digital"
    | "revista"
    | "audiolibro"
    | "otro";
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
  estado: "en_estante" | "prestado" | "otro";
  leido: boolean;
  isbn?: string;
  portada_url?: string;
  tipo?:
    | "libro"
    | "comic"
    | "manga"
    | "digital"
    | "revista"
    | "audiolibro"
    | "otro";
}

export interface OpenLibraryBook {
  title?: string;
  authors?: Array<{ key?: string; name?: string }>;
  publishers?: string[];
  publish_date?: string;
  isbn_13?: string[];
  isbn_10?: string[];
  covers?: number[];
  key?: string;
}

export interface Stats {
  total_libros: number;
  libros_prestados: number;
  libros_en_estante: number;
  libros_leidos: number;
  libros_no_leidos: number;
}

// Utilidades
const getToken = () => localStorage.getItem("token");
const setToken = (token: string) => localStorage.setItem("token", token);
const removeToken = () => localStorage.removeItem("token");

// Decodificar JWT para obtener información del usuario
const decodeToken = (token: string): any => {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));

    return JSON.parse(decoded);
  } catch (error) {
    console.error("Error decoding token:", error);

    return null;
  }
};

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
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
      } else if (typeof errorData === "string") {
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
    const response = await apiRequest("/usuarios/login", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.token) {
      setToken(response.token);
    }

    return response;
  },

  async register(data: RegisterData) {
    const response = await apiRequest("/usuarios/register", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.token) {
      setToken(response.token);
    }

    return response;
  },

  async getProfile() {
    return apiRequest("/usuarios/profile");
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
      fecha_creacion: decoded.fecha_creacion,
    };
  },

  async updateProfile(data: { nombre?: string; email?: string }) {
    return apiRequest("/usuarios/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteAccount() {
    return apiRequest("/usuarios/profile", {
      method: "DELETE",
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
    const response = await apiRequest("/libros");

    return response.libros as Book[];
  },

  async getBook(id: number) {
    return apiRequest(`/libros/${id}`);
  },

  async createBook(data: BookFormData) {
    return apiRequest("/libros", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateBook(id: number, data: Partial<BookFormData>) {
    return apiRequest(`/libros/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteBook(id: number) {
    return apiRequest(`/libros/${id}`, {
      method: "DELETE",
    });
  },

  async searchBooks(query: string) {
    const response = await apiRequest(
      `/libros/search?q=${encodeURIComponent(query)}`
    );

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
    const response = await apiRequest("/libros/stats/estadisticas");

    return response.estadisticas as Stats;
  },
};

// Servicios de OpenLibrary
export const openLibraryService = {
  async searchByISBN(isbn: string): Promise<OpenLibraryBook | null> {
    try {
      // Limpiar el ISBN de caracteres no numéricos
      const cleanISBN = isbn.replace(/[^0-9X]/gi, "");

      const response = await fetch(
        `https://openlibrary.org/isbn/${cleanISBN}.json`
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null; // ISBN no encontrado
        }
        throw new Error(`Error en la búsqueda: ${response.status}`);
      }

      const data = await response.json();

      return data as OpenLibraryBook;
    } catch (error) {
      console.error("Error buscando en OpenLibrary:", error);
      throw new Error(
        "Error al buscar el libro. Verifica tu conexión a internet."
      );
    }
  },

  // Función auxiliar para obtener detalles de un autor por su key
  async getAuthorName(authorKey: string): Promise<string | null> {
    try {
      const response = await fetch(`https://openlibrary.org${authorKey}.json`);

      if (!response.ok) return null;

      const authorData = await response.json();

      return authorData.name || null;
    } catch (error) {
      console.error("Error obteniendo autor:", error);

      return null;
    }
  },

  // Función auxiliar para extraer datos del libro de OpenLibrary
  async extractBookData(
    openLibraryBook: OpenLibraryBook,
    isbn: string
  ): Promise<Partial<BookFormData>> {
    const bookData: Partial<BookFormData> = {};

    // Título
    if (openLibraryBook.title) {
      bookData.titulo = openLibraryBook.title;
    }

    // Autor - estrategia mejorada para obtener nombres
    if (openLibraryBook.authors && openLibraryBook.authors.length > 0) {
      const authors: string[] = [];

      // Primero intentar obtener nombres directos si están disponibles
      const directNames = openLibraryBook.authors
        .map((author) => author.name)
        .filter((name): name is string => Boolean(name && name.trim()));

      if (directNames.length > 0) {
        authors.push(...directNames);
      }

      // Si no tenemos suficientes nombres directos, hacer llamadas API para autores con key
      if (
        authors.length === 0 ||
        authors.length < openLibraryBook.authors.length
      ) {
        try {
          const authorPromises = openLibraryBook.authors
            .filter((author) => author.key && !author.name) // Solo autores con key pero sin nombre
            .map((author) => this.getAuthorName(author.key!));

          const apiAuthorNames = await Promise.all(authorPromises);
          const validApiAuthors = apiAuthorNames.filter(
            (name) => name !== null
          ) as string[];

          authors.push(...validApiAuthors);
        } catch (error) {
          console.error("Error obteniendo autores de la API:", error);
        }
      }

      // Si conseguimos al menos un autor, lo asignamos
      if (authors.length > 0) {
        bookData.autor = [...new Set(authors)].join(", "); // Eliminar duplicados
      }
    }

    // Editorial
    if (openLibraryBook.publishers && openLibraryBook.publishers.length > 0) {
      bookData.editorial = openLibraryBook.publishers[0];
    }

    // Año de publicación
    if (openLibraryBook.publish_date) {
      // Intentar extraer el año de diferentes formatos
      const yearMatch = openLibraryBook.publish_date.match(/(\d{4})/);

      if (yearMatch) {
        const year = parseInt(yearMatch[1]);

        if (year >= 1000 && year <= new Date().getFullYear()) {
          bookData.anio_publicacion = year;
        }
      }
    }

    // Imagen de portada
    bookData.portada_url = this.getCoverImageUrl(openLibraryBook, isbn);

    return bookData;
  },

  // Función para obtener la URL de la imagen de portada
  getCoverImageUrl(
    openLibraryBook: OpenLibraryBook,
    originalIsbn: string
  ): string | undefined {
    // Limpiar el ISBN para usar en la URL
    const cleanISBN = originalIsbn.replace(/[^0-9X]/gi, "");

    // Método 1: Usar el ID de portada si está disponible (mejor calidad)
    if (openLibraryBook.covers && openLibraryBook.covers.length > 0) {
      return `https://covers.openlibrary.org/b/id/${openLibraryBook.covers[0]}-M.jpg`;
    }

    // Método 2: Usar el key del libro de OpenLibrary
    if (openLibraryBook.key) {
      const olid = openLibraryBook.key
        .replace("/works/", "")
        .replace("/books/", "");

      return `https://covers.openlibrary.org/b/olid/${olid}-M.jpg`;
    }

    // Método 3: Usar ISBN como fallback
    if (cleanISBN) {
      return `https://covers.openlibrary.org/b/isbn/${cleanISBN}-M.jpg`;
    }

    return undefined;
  },
};
