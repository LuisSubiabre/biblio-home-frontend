import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Badge } from '@heroui/badge';
import { Input } from '@heroui/input';
import { bookService, Book } from '@/services/api';
import { EditIcon, DeleteIcon, SearchIcon } from '@/components/icons';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">Confirmar eliminación</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          ¿Estás seguro de que quieres eliminar este libro? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="light" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button color="danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface BookListProps {
  onEdit: (book: Book) => void;
  onDelete: (id: number) => void;
}

export const BookList: React.FC<BookListProps> = ({ onEdit, onDelete }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = books.filter(book =>
        book.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.autor.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBooks(filtered);
    } else {
      setFilteredBooks(books);
    }
  }, [books, searchTerm]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const data = await bookService.getBooks();
      setBooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar libros');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (book: Book) => {
    setBookToDelete(book);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bookToDelete) return;

    try {
      setDeleteLoading(true);
      await bookService.deleteBook(bookToDelete.id);
      setBooks(books.filter(book => book.id !== bookToDelete.id));
      onDelete(bookToDelete.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar libro');
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
      setBookToDelete(null);
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'en_estante':
        return 'success';
      case 'prestado':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusText = (estado: string) => {
    switch (estado) {
      case 'en_estante':
        return 'En estante';
      case 'prestado':
        return 'Prestado';
      default:
        return 'Otro';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={loadBooks} color="primary">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Buscar por título o autor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          startContent={<SearchIcon className="w-4 h-4" />}
          className="max-w-md"
        />
      </div>

      {filteredBooks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? 'No se encontraron libros' : 'No tienes libros registrados'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBooks.map((book) => (
            <Card key={book.id} className="h-full">
              <CardHeader className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg line-clamp-2">{book.titulo}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{book.autor}</p>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onClick={() => onEdit(book)}
                  >
                    <EditIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onClick={() => handleDeleteClick(book)}
                  >
                    <DeleteIcon className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="space-y-2">
                  {book.editorial && (
                    <p className="text-sm">
                      <span className="font-medium">Editorial:</span> {book.editorial}
                    </p>
                  )}
                  {book.anio_publicacion && (
                    <p className="text-sm">
                      <span className="font-medium">Año:</span> {book.anio_publicacion}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <Badge color={getStatusColor(book.estado)} variant="flat">
                      {getStatusText(book.estado)}
                    </Badge>
                    <Badge color={book.leido ? 'success' : 'default'} variant="flat">
                      {book.leido ? 'Leído' : 'Sin leer'}
                    </Badge>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
    </div>
  );
};