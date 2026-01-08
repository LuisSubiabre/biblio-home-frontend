import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/button";

import { useAuth } from "@/contexts/AuthContext";
import { BookList } from "@/components/BookList";
import { BookForm } from "@/components/BookForm";
import { LibraryStats } from "@/components/Stats";
import { Book, bookService } from "@/services/api";
import { PlusIcon } from "@/components/icons";

export default function DashboardPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Cargar libros inicialmente
  useEffect(() => {
    loadBooks();
  }, []);

  // Función para limpiar libros duplicados (por si acaso)
  const cleanDuplicateBooks = (books: Book[]): Book[] => {
    const seen = new Set<number>();
    return books.filter(book => {
      if (!book.id || seen.has(book.id)) {
        console.warn("Eliminando libro duplicado o sin ID:", book);
        return false;
      }
      seen.add(book.id);
      return true;
    });
  };

  const loadBooks = async () => {
    try {
      setLoading(true);
      const data = await bookService.getBooks();
      setBooks(cleanDuplicateBooks(data));
    } catch (error) {
      console.error("Error cargando libros:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = () => {
    setSelectedBook(null);
    setIsFormOpen(true);
  };

  const handleEditBook = (book: Book) => {
    setSelectedBook(book);
    setIsFormOpen(true);
  };

  const handleDeleteBook = async (bookId: number) => {
    try {
      await bookService.deleteBook(bookId);
      // Actualizar estado local eliminando el libro
      setBooks(prevBooks => prevBooks.filter(book => book.id !== bookId));
    } catch (error) {
      console.error("Error eliminando libro:", error);
      // Recargar libros si hay error
      loadBooks();
    }
  };

  const handleFormSave = async (savedBook: Book) => {
    try {
      console.log("📝 handleFormSave llamado con:", savedBook);

      // SOLUCIÓN: Siempre recargar la lista completa para asegurar actualización
      console.log("🔄 Recargando lista completa de libros...");
      await loadBooks();
      console.log("✅ Lista recargada exitosamente");

      // Limpiar el libro seleccionado para futuras operaciones
      setSelectedBook(null);
      console.log("🧹 selectedBook limpiado");

    } catch (error) {
      console.error("❌ Error recargando libros:", error);
      // Intentar recargar una vez más en caso de error
      try {
        await loadBooks();
      } catch (retryError) {
        console.error("❌ Error en reintento:", retryError);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                📚 Mi Biblioteca
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Bienvenido, {user?.email}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                color="primary"
                startContent={<PlusIcon className="w-4 h-4" />}
                onClick={handleAddBook}
              >
                Agregar Libro
              </Button>
              <Button variant="light" onClick={handleLogout}>
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <LibraryStats books={books} />

        {/* Lista de Libros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
            Mis Libros
          </h2>
          <BookList
            books={books}
            loading={loading}
            onDelete={handleDeleteBook}
            onEdit={handleEditBook}
          />
        </div>
      </main>

      {/* Modal del formulario */}
      <BookForm
        book={selectedBook}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleFormSave}
      />
    </div>
  );
}
