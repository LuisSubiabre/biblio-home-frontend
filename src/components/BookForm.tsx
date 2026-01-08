import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Checkbox } from '@heroui/checkbox';
import { Select, SelectItem } from '@heroui/select';
import { Modal, ModalBody, ModalHeader, ModalFooter, ModalContent } from '@heroui/modal';
import { addToast } from '@heroui/toast';
import { bookService, Book, BookFormData, openLibraryService } from '@/services/api';

// Función para generar iniciales del título
const getBookInitials = (title: string): string => {
  return title
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2) // Máximo 2 iniciales
    .join('');
};

// Componente para mostrar iniciales como placeholder de portada
const BookCoverPlaceholder: React.FC<{ title: string; className?: string }> = ({ title, className = "w-32 h-44" }) => {
  const initials = getBookInitials(title);

  return (
    <div className={`${className} bg-gray-300 dark:bg-gray-600 rounded-lg shadow-md flex-shrink-0 flex items-center justify-center border`}>
      <span className="text-gray-700 dark:text-gray-300 font-bold text-2xl">
        {initials}
      </span>
    </div>
  );
};
import { SearchIcon } from '@/components/icons';

interface BookFormProps {
  book?: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const BookForm: React.FC<BookFormProps> = ({ book, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<BookFormData>({
    titulo: '',
    autor: '',
    editorial: '',
    anio_publicacion: undefined,
    estado: 'en_estante',
    leido: false,
    isbn: '',
    portada_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [isbnInput, setIsbnInput] = useState('');
  const [isbnLoading, setIsbnLoading] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');

  useEffect(() => {
    if (book) {
      setFormData({
        titulo: book.titulo,
        autor: book.autor,
        editorial: book.editorial || '',
        anio_publicacion: book.anio_publicacion,
        estado: book.estado,
        leido: book.leido,
        isbn: book.isbn || '',
        portada_url: book.portada_url || '',
      });
      setCoverImageUrl(book.portada_url || '');
      setIsbnInput(book.isbn || ''); // Cargar ISBN cuando se edita un libro existente
    } else {
      setFormData({
        titulo: '',
        autor: '',
        editorial: '',
        anio_publicacion: undefined,
        estado: 'en_estante',
        leido: false,
        isbn: '',
        portada_url: '',
      });
      setCoverImageUrl('');
      setIsbnInput(''); // Limpiar ISBN cuando se agrega un libro nuevo
    }
  }, [book, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (book) {
        await bookService.updateBook(book.id, formData);
        addToast({
          title: '¡Libro actualizado!',
          description: 'El libro ha sido actualizado correctamente.',
          color: 'success'
        });
      } else {
        await bookService.createBook(formData);
        addToast({
          title: '¡Libro agregado!',
          description: 'El libro ha sido agregado correctamente.',
          color: 'success'
        });
      }
      // Llamar a onSave para refrescar la lista y luego cerrar el modal
      onSave();
      onClose();
    } catch (err) {
      addToast({
        title: 'Error al guardar libro',
        description: err instanceof Error ? err.message : 'Ha ocurrido un error inesperado.',
        color: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleISBNLookup = async () => {
    if (!isbnInput.trim()) {
      addToast({
        title: 'ISBN requerido',
        description: 'Por favor ingresa un ISBN para buscar.',
        color: 'warning'
      });
      return;
    }

    setIsbnLoading(true);
    try {
      const openLibraryBook = await openLibraryService.searchByISBN(isbnInput);

      if (!openLibraryBook) {
        addToast({
          title: 'Libro no encontrado',
          description: 'No se encontró ningún libro con ese ISBN. Verifica que sea correcto.',
          color: 'warning'
        });
        return;
      }

      const bookData = await openLibraryService.extractBookData(openLibraryBook, isbnInput);

      // Actualizar el formulario con los datos encontrados
      setFormData(prev => ({
        ...prev,
        ...bookData,
        isbn: isbnInput, // Guardar el ISBN que se usó para la búsqueda
      }));

      // Actualizar la imagen de portada para vista previa
      if (bookData.portada_url) {
        setCoverImageUrl(bookData.portada_url);
      }

      addToast({
        title: '¡Libro encontrado!',
        description: 'Los datos del libro han sido completados automáticamente.',
        color: 'success'
      });

    } catch (error) {
      addToast({
        title: 'Error en la búsqueda',
        description: error instanceof Error ? error.message : 'Ocurrió un error al buscar el libro.',
        color: 'danger'
      });
    } finally {
      setIsbnLoading(false);
    }
  };

  const statusOptions = [
    { key: 'en_estante', label: 'En estante' },
    { key: 'prestado', label: 'Prestado' },
    { key: 'otro', label: 'Otro' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            {book ? 'Editar Libro' : 'Agregar Nuevo Libro'}
          </ModalHeader>
          <ModalBody className="space-y-4">
            {/* Campo ISBN con búsqueda automática */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  label="ISBN"
                  placeholder="Ingresa el ISBN del libro"
                  value={isbnInput}
                  onChange={(e) => setIsbnInput(e.target.value)}
                  disabled={loading || isbnLoading}
                  className="flex-1"
                />
                <Button
                  type="button"
                  color="secondary"
                  variant="flat"
                  onClick={handleISBNLookup}
                  disabled={loading || isbnLoading || !isbnInput.trim()}
                  className="mt-6"
                  startContent={<SearchIcon className="w-4 h-4" />}
                >
                  {isbnLoading ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Busca automáticamente título, autor, editorial y año de publicación
              </p>
            </div>

            {/* Vista previa de la imagen de portada */}
            {(coverImageUrl || formData.titulo) && (
              <div className="flex justify-center">
                <div className="relative">
                  {coverImageUrl ? (
                    <img
                      src={coverImageUrl}
                      alt="Portada del libro"
                      className="w-32 h-44 object-cover rounded-lg shadow-md border"
                      onError={(e) => {
                        // Si la imagen falla al cargar, ocultarla
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : formData.titulo ? (
                    <BookCoverPlaceholder title={formData.titulo} />
                  ) : null}
                  {(coverImageUrl || formData.titulo) && (
                    <button
                      type="button"
                      onClick={() => {
                        setCoverImageUrl('');
                        setFormData(prev => ({ ...prev, portada_url: '' }));
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            )}

            <Input
              label="Título"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              required
              disabled={loading}
            />

            <Input
              label="Autor"
              value={formData.autor}
              onChange={(e) => setFormData({ ...formData, autor: e.target.value })}
              required
              disabled={loading}
            />

            <Input
              label="Editorial"
              value={formData.editorial}
              onChange={(e) => setFormData({ ...formData, editorial: e.target.value })}
              disabled={loading}
            />

            <Input
              type="number"
              label="Año de publicación"
              value={formData.anio_publicacion?.toString() || ''}
              onChange={(e) => setFormData({
                ...formData,
                anio_publicacion: e.target.value ? parseInt(e.target.value) : undefined
              })}
              disabled={loading}
              min="1000"
              max={new Date().getFullYear()}
            />

            <Input
              label="ISBN (opcional)"
              placeholder="ISBN del libro"
              value={formData.isbn}
              onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
              disabled={loading}
            />

            <Select
              label="Estado"
              selectedKeys={[formData.estado]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setFormData({ ...formData, estado: selected as 'en_estante' | 'prestado' | 'otro' });
              }}
              disabled={loading}
            >
              {statusOptions.map((option) => (
                <SelectItem key={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>

            <Checkbox
              isSelected={formData.leido}
              onValueChange={(checked) => setFormData({ ...formData, leido: checked })}
              disabled={loading}
            >
              ¿Ya lo leíste?
            </Checkbox>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              color="primary"
              disabled={loading}
            >
              {loading ? (book ? 'Guardando...' : 'Agregando...') : (book ? 'Guardar' : 'Agregar')}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};