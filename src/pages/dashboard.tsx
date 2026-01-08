import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@heroui/button';
import { useAuth } from '@/contexts/AuthContext';
import { BookList } from '@/components/BookList';
import { BookForm } from '@/components/BookForm';
import { LibraryStats } from '@/components/Stats';
import { Book } from '@/services/api';
import { PlusIcon } from '@/components/icons';

export default function DashboardPage() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleAddBook = () => {
    setSelectedBook(null);
    setIsFormOpen(true);
  };

  const handleEditBook = (book: Book) => {
    setSelectedBook(book);
    setIsFormOpen(true);
  };

  const handleDeleteBook = (_id: number) => {
    // La eliminación se maneja en el componente BookList
    // Aquí podríamos agregar lógica adicional si es necesario
  };

  const handleFormSave = () => {
    // Refrescar la lista de libros - esto se maneja en el componente BookList
    window.location.reload(); // Temporal, mejor usar un estado global
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
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
                Bienvenido, {user?.nombre}
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
              <Button
                variant="light"
                onClick={handleLogout}
              >
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <LibraryStats />

        {/* Lista de Libros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
            Mis Libros
          </h2>
          <BookList
            onEdit={handleEditBook}
            onDelete={handleDeleteBook}
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