import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Badge } from '@heroui/badge';
import { Input } from '@heroui/input';
import { addToast } from '@heroui/toast';
import { bookService, Book } from '@/services/api';
import { EditIcon, DeleteIcon, SearchIcon } from '@/components/icons';

// Función para generar iniciales del título
const getBookInitials = (title: string): string => {
  // Artículos y palabras comunes a excluir (español, inglés, etc.)
  const commonWords = new Set([
    'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'de', 'del', 'al', 'en', 'y', 'o', 'con', 'por', 'para', 'como', 'que', 'su', 'sus',
    'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being'
  ]);

  // Limpiar el título y dividir en palabras
  const words = title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remover puntuación
    .split(/\s+/)
    .filter(word => word.length > 0 && !commonWords.has(word));

  // Si no quedan palabras significativas, usar las primeras letras del título original
  if (words.length === 0) {
    const cleanTitle = title.replace(/[^\w\s]/g, '').trim();
    if (cleanTitle.length > 0) {
      return cleanTitle.charAt(0).toUpperCase();
    }
    return 'B'; // Fallback por si el título está vacío
  }

  // Tomar las primeras letras de las palabras significativas
  const initials = words
    .slice(0, 2) // Máximo 2 iniciales
    .map(word => word.charAt(0).toUpperCase())
    .join('');

  return initials;
};

// Componente para mostrar iniciales como placeholder de portada
const BookCoverPlaceholder: React.FC<{ title: string; className?: string }> = ({ title, className = "w-16 h-20" }) => {
  const initials = getBookInitials(title);

  return (
    <div className={`${className} bg-gray-300 dark:bg-gray-600 rounded-md shadow-sm flex-shrink-0 flex items-center justify-center`}>
      <span className="text-gray-700 dark:text-gray-300 font-semibold text-sm">
        {initials}
      </span>
    </div>
  );
};

type FilterType = 'todos' | 'en_estante' | 'prestado' | 'leido';

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
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('todos');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('todos');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    let filtered = books;

    // Aplicar filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(book =>
        book.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.autor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtro por estado/leído
    if (selectedFilter !== 'todos') {
      filtered = filtered.filter(book => {
        switch (selectedFilter) {
          case 'en_estante':
            return book.estado === 'en_estante';
          case 'prestado':
            return book.estado === 'prestado';
          case 'leido':
            return book.leido === true;
          default:
            return true;
        }
      });
    }

    // Aplicar filtro por tipo
    if (selectedTypeFilter !== 'todos') {
      filtered = filtered.filter(book => book.tipo === selectedTypeFilter || (!book.tipo && selectedTypeFilter === 'libro'));
    }

    setFilteredBooks(filtered);
  }, [books, searchTerm, selectedFilter, selectedTypeFilter]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const data = await bookService.getBooks();
      setBooks(data);
    } catch (err) {
      addToast({
        title: 'Error al cargar libros',
        description: err instanceof Error ? err.message : 'Ha ocurrido un error inesperado.',
        color: 'danger'
      });
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
      addToast({
        title: '¡Libro eliminado!',
        description: 'El libro ha sido eliminado correctamente.',
        color: 'success'
      });
      onDelete(bookToDelete.id);
    } catch (err) {
      addToast({
        title: 'Error al eliminar libro',
        description: err instanceof Error ? err.message : 'Ha ocurrido un error inesperado.',
        color: 'danger'
      });
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

  const getTypeText = (tipo?: string) => {
    switch (tipo) {
      case 'libro':
        return '📖 Libro';
      case 'comic':
        return '🦸 Comic';
      case 'manga':
        return '🇯🇵 Manga';
      case 'digital':
        return '💻 Digital';
      case 'revista':
        return '📰 Revista';
      case 'audiolibro':
        return '🎧 Audiolibro';
      default:
        return '📚 Otro';
    }
  };


  const exportToCSV = () => {
    try {
      // Encabezados del CSV
      const headers = [
        'ID',
        'Título',
        'Autor',
        'Editorial',
        'Año de Publicación',
        'Estado',
        'Leído',
        'ISBN',
        'Portada URL',
        'Fecha de Registro'
      ];

      // Convertir los libros a filas CSV
      const csvData = books.map(book => [
        book.id,
        `"${book.titulo.replace(/"/g, '""')}"`, // Escapar comillas en títulos
        `"${book.autor.replace(/"/g, '""')}"`,   // Escapar comillas en autores
        `"${(book.editorial || '').replace(/"/g, '""')}"`,
        book.anio_publicacion || '',
        getStatusText(book.estado),
        book.leido ? 'Sí' : 'No',
        `"${(book.isbn || '').replace(/"/g, '""')}"`,
        `"${(book.portada_url || '').replace(/"/g, '""')}"`,
        new Date(book.fecha_registro).toLocaleDateString('es-ES')
      ]);

      // Combinar headers y datos
      const csvContent = [headers, ...csvData]
        .map(row => row.join(','))
        .join('\n');

      // Crear blob y descargar
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `biblioteca_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      addToast({
        title: '¡Exportación exitosa!',
        description: `Se exportaron ${books.length} libros a CSV.`,
        color: 'success'
      });

    } catch (error) {
      addToast({
        title: 'Error en la exportación',
        description: 'Ocurrió un error al exportar los libros.',
        color: 'danger'
      });
      console.error('Error exporting to CSV:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (books.length === 0 && !loading && searchTerm === '') {
    return (
      <div className="text-center py-8 text-gray-500">
        No tienes libros registrados. ¡Agrega tu primer libro!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Input
          placeholder="Buscar por título o autor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          startContent={<SearchIcon className="w-4 h-4" />}
          className="max-w-md"
        />

        {/* Filtros por estado */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={selectedFilter === 'todos' ? 'solid' : 'flat'}
            color={selectedFilter === 'todos' ? 'primary' : 'default'}
            onClick={() => setSelectedFilter('todos')}
          >
            Todos
          </Button>
          <Button
            size="sm"
            variant={selectedFilter === 'en_estante' ? 'solid' : 'flat'}
            color={selectedFilter === 'en_estante' ? 'success' : 'default'}
            onClick={() => setSelectedFilter('en_estante')}
          >
            En estantes
          </Button>
          <Button
            size="sm"
            variant={selectedFilter === 'prestado' ? 'solid' : 'flat'}
            color={selectedFilter === 'prestado' ? 'warning' : 'default'}
            onClick={() => setSelectedFilter('prestado')}
          >
            Prestados
          </Button>
          <Button
            size="sm"
            variant={selectedFilter === 'leido' ? 'solid' : 'flat'}
            color={selectedFilter === 'leido' ? 'primary' : 'default'}
            onClick={() => setSelectedFilter('leido')}
          >
            Leídos
          </Button>
        </div>

        {/* Filtros por tipo */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400 self-center mr-2">Tipo:</span>
          <Button
            size="sm"
            variant={selectedTypeFilter === 'todos' ? 'solid' : 'flat'}
            color={selectedTypeFilter === 'todos' ? 'primary' : 'default'}
            onClick={() => setSelectedTypeFilter('todos')}
          >
            Todos
          </Button>
          <Button
            size="sm"
            variant={selectedTypeFilter === 'libro' ? 'solid' : 'flat'}
            color={selectedTypeFilter === 'libro' ? 'secondary' : 'default'}
            onClick={() => setSelectedTypeFilter('libro')}
          >
            📖 Libro
          </Button>
          <Button
            size="sm"
            variant={selectedTypeFilter === 'comic' ? 'solid' : 'flat'}
            color={selectedTypeFilter === 'comic' ? 'secondary' : 'default'}
            onClick={() => setSelectedTypeFilter('comic')}
          >
            🦸 Comic
          </Button>
          <Button
            size="sm"
            variant={selectedTypeFilter === 'manga' ? 'solid' : 'flat'}
            color={selectedTypeFilter === 'manga' ? 'secondary' : 'default'}
            onClick={() => setSelectedTypeFilter('manga')}
          >
            🇯🇵 Manga
          </Button>
          <Button
            size="sm"
            variant={selectedTypeFilter === 'digital' ? 'solid' : 'flat'}
            color={selectedTypeFilter === 'digital' ? 'secondary' : 'default'}
            onClick={() => setSelectedTypeFilter('digital')}
          >
            💻 Digital
          </Button>
        </div>

        {/* Botón de exportación */}
        <Button
          color="success"
          variant="flat"
          onClick={exportToCSV}
          disabled={loading || books.length === 0}
          className="whitespace-nowrap"
        >
          📊 Exportar a CSV
        </Button>
      </div>

      {filteredBooks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm || selectedFilter !== 'todos'
            ? 'No se encontraron libros con los filtros aplicados'
            : 'No tienes libros registrados'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBooks.map((book) => (
            <Card key={book.id} className="h-full">
              <CardHeader className="flex justify-between items-start">
                <div className="flex gap-3 flex-1">
                  {book.portada_url ? (
                    <img
                      src={book.portada_url}
                      alt={`Portada de ${book.titulo}`}
                      className="w-16 h-20 object-cover rounded-md shadow-sm flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <BookCoverPlaceholder title={book.titulo} />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg line-clamp-2">{book.titulo}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{book.autor}</p>
                  </div>
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
                    <div className="flex gap-2">
                      <Badge color={getStatusColor(book.estado)} variant="flat">
                        {getStatusText(book.estado)}
                      </Badge>
                      <Badge color="secondary" variant="flat">
                        {getTypeText(book.tipo)}
                      </Badge>
                    </div>
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