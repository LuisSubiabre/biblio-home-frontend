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

export interface GoogleBooksVolume {
  id: string;
  volumeInfo: {
    title?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    industryIdentifiers?: Array<{
      type: "ISBN_10" | "ISBN_13";
      identifier: string;
    }>;
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
    };
  };
}

export interface GoogleBooksResponse {
  totalItems: number;
  items?: GoogleBooksVolume[];
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

// Servicios de Google Books
export const googleBooksService = {
  async searchByISBN(isbn: string): Promise<GoogleBooksVolume | null> {
    try {
      // Limpiar el ISBN de caracteres no numéricos
      const cleanISBN = isbn.replace(/[^0-9X]/gi, "");

      // PRIMERO: Intentar con Google Books
      console.log("🔍 Buscando en Google Books...");
      const googleResult = await this.searchInGoogleBooks(cleanISBN);

      if (googleResult) {
        console.log("✅ Libro encontrado en Google Books");

        return googleResult;
      }

      // SEGUNDO: Fallback a OpenLibrary
      console.log("📚 No encontrado en Google Books, probando OpenLibrary...");
      const openLibraryResult = await this.searchInOpenLibrary(cleanISBN);

      if (openLibraryResult) {
        console.log("✅ Libro encontrado en OpenLibrary (fallback)");

        // Convertir el resultado de OpenLibrary al formato de Google Books
        return await this.convertOpenLibraryToGoogleBooks(
          openLibraryResult,
          cleanISBN
        );
      }

      console.log("❌ Libro no encontrado en ninguna fuente");

      return null; // No encontrado en ninguna fuente
    } catch (error) {
      console.error("Error en la búsqueda de libros:", error);
      throw new Error(
        "Error al buscar el libro. Verifica tu conexión a internet."
      );
    }
  },

  // Buscar en Google Books
  async searchInGoogleBooks(
    cleanISBN: string
  ): Promise<GoogleBooksVolume | null> {
    const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;

    if (!apiKey) {
      console.warn(
        "⚠️ API key de Google Books no configurada, saltando búsqueda"
      );

      return null;
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}&key=${apiKey}`
      );

      if (!response.ok) {
        if (response.status === 404 || response.status === 400) {
          return null; // ISBN no encontrado
        }
        throw new Error(`Error en Google Books: ${response.status}`);
      }

      const data: GoogleBooksResponse = await response.json();

      if (!data.items || data.items.length === 0) {
        return null; // No se encontraron resultados
      }

      return data.items[0];
    } catch (error) {
      console.warn(
        "Error al buscar en Google Books:",
        error instanceof Error ? error.message : String(error)
      );

      return null;
    }
  },

  // Buscar en OpenLibrary (fallback)
  async searchInOpenLibrary(cleanISBN: string): Promise<any | null> {
    try {
      const response = await fetch(
        `https://openlibrary.org/isbn/${cleanISBN}.json`
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null; // ISBN no encontrado
        }
        throw new Error(`Error en OpenLibrary: ${response.status}`);
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.warn(
        "Error al buscar en OpenLibrary:",
        error instanceof Error ? error.message : String(error)
      );

      return null;
    }
  },

  // Convertir resultado de OpenLibrary al formato de Google Books
  async convertOpenLibraryToGoogleBooks(
    openLibraryBook: any,
    originalISBN: string
  ): Promise<GoogleBooksVolume> {
    const authors = await this.extractAuthorsFromOpenLibrary(
      openLibraryBook.authors
    );

    return {
      id: openLibraryBook.key || `openlibrary_${originalISBN}`,
      volumeInfo: {
        title: openLibraryBook.title,
        authors: authors,
        publisher: openLibraryBook.publishers?.[0],
        publishedDate: openLibraryBook.publish_date,
        industryIdentifiers: [
          {
            type: "ISBN_13",
            identifier: originalISBN,
          },
        ],
        imageLinks: {
          medium: this.getCoverImageUrlFromOpenLibrary(
            openLibraryBook,
            originalISBN
          ),
        },
      },
    };
  },

  // Extraer autores de OpenLibrary
  async extractAuthorsFromOpenLibrary(
    authors?: Array<{ key?: string; name?: string }>
  ): Promise<string[] | undefined> {
    if (!authors || authors.length === 0) return undefined;

    const validAuthors: string[] = [];

    // Primero intentar nombres directos
    const directNames = authors
      .map((author: any) => author.name)
      .filter((name: any) => name && name.trim());

    if (directNames.length > 0) {
      validAuthors.push(...directNames);
    }

    // Si no tenemos suficientes nombres directos, hacer llamadas API para autores con key
    if (validAuthors.length === 0 || validAuthors.length < authors.length) {
      try {
        const authorPromises = authors
          .filter((author: any) => author.key && !author.name) // Solo autores con key pero sin nombre
          .map((author: any) => this.getAuthorNameFromOpenLibrary(author.key!));

        const apiAuthorNames = await Promise.all(authorPromises);
        const validApiAuthors = apiAuthorNames.filter(
          (name) => name !== null
        ) as string[];

        validAuthors.push(...validApiAuthors);
      } catch (error) {
        console.warn("Error obteniendo autores de OpenLibrary:", error);
      }
    }

    return validAuthors.length > 0 ? validAuthors : undefined;
  },

  // Obtener nombre de autor desde OpenLibrary por key
  async getAuthorNameFromOpenLibrary(
    authorKey: string
  ): Promise<string | null> {
    try {
      const response = await fetch(`https://openlibrary.org${authorKey}.json`);

      if (!response.ok) return null;

      const authorData = await response.json();

      return authorData.name || null;
    } catch (error) {
      console.warn("Error obteniendo autor de OpenLibrary:", error);

      return null;
    }
  },

  // Obtener URL de portada de OpenLibrary
  getCoverImageUrlFromOpenLibrary(
    openLibraryBook: any,
    originalISBN: string
  ): string | undefined {
    // Método 1: Usar el ID de portada si está disponible
    if (openLibraryBook.covers && openLibraryBook.covers.length > 0) {
      return `https://covers.openlibrary.org/b/id/${openLibraryBook.covers[0]}-M.jpg`;
    }

    // Método 2: Usar el key del libro
    if (openLibraryBook.key) {
      const olid = openLibraryBook.key
        .replace("/works/", "")
        .replace("/books/", "");

      return `https://covers.openlibrary.org/b/olid/${olid}-M.jpg`;
    }

    // Método 3: Usar ISBN como fallback
    if (originalISBN) {
      return `https://covers.openlibrary.org/b/isbn/${originalISBN}-M.jpg`;
    }

    return undefined;
  },

  // Función auxiliar para extraer datos del libro de Google Books
  extractBookData(googleBook: GoogleBooksVolume): Partial<BookFormData> {
    const bookData: Partial<BookFormData> = {};
    const volumeInfo = googleBook.volumeInfo;

    // Título
    if (volumeInfo.title) {
      bookData.titulo = volumeInfo.title;
    }

    // Autor
    if (volumeInfo.authors && volumeInfo.authors.length > 0) {
      bookData.autor = volumeInfo.authors.join(", ");
    }

    // Editorial
    if (volumeInfo.publisher) {
      bookData.editorial = volumeInfo.publisher;
    }

    // Año de publicación
    if (volumeInfo.publishedDate) {
      // Extraer el año (puede venir en formatos como "2020", "2020-01", "2020-01-01")
      const yearMatch = volumeInfo.publishedDate.match(/^(\d{4})/);

      if (yearMatch) {
        const year = parseInt(yearMatch[1]);

        if (year >= 1000 && year <= new Date().getFullYear()) {
          bookData.anio_publicacion = year;
        }
      }
    }

    // Imagen de portada
    bookData.portada_url = this.getCoverImageUrl(googleBook);

    return bookData;
  },

  // Función para obtener la URL de la imagen de portada
  getCoverImageUrl(googleBook: GoogleBooksVolume): string | undefined {
    const imageLinks = googleBook.volumeInfo.imageLinks;

    if (!imageLinks) {
      return undefined;
    }

    // Prioridad: medium > thumbnail > small > large > extraLarge > smallThumbnail
    return (
      imageLinks.medium ||
      imageLinks.thumbnail ||
      imageLinks.small ||
      imageLinks.large ||
      imageLinks.extraLarge ||
      imageLinks.smallThumbnail
    );
  },
};
