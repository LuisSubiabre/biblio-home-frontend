import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Checkbox } from '@heroui/checkbox';
import { Select, SelectItem } from '@heroui/select';
import { Switch } from '@heroui/switch';
import { Modal, ModalBody, ModalHeader, ModalFooter, ModalContent } from '@heroui/modal';
import { addToast } from '@heroui/toast';
import { bookService, Book, BookFormData, googleBooksService } from '@/services/api';

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
const BookCoverPlaceholder: React.FC<{ title: string; className?: string }> = ({ title, className = "w-20 h-28" }) => {
  const initials = getBookInitials(title);

  return (
    <div className={`${className} bg-gray-300 dark:bg-gray-600 rounded-md shadow-sm flex-shrink-0 flex items-center justify-center border`}>
      <span className="text-gray-700 dark:text-gray-300 font-bold text-lg">
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
  onSave: (savedBook: Book) => void;
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
    tipo: 'libro',
  });
  const [loading, setLoading] = useState(false);
  const [isbnInput, setIsbnInput] = useState('');
  const [isbnLoading, setIsbnLoading] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');
  const [includeCoverImage, setIncludeCoverImage] = useState<boolean>(true);

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
        tipo: book.tipo || 'libro',
      });
      setCoverImageUrl(book.portada_url || '');
      setIsbnInput(book.isbn || ''); // Cargar ISBN cuando se edita un libro existente
      setIncludeCoverImage(!!book.portada_url); // Activar switch si tiene portada
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
        tipo: 'libro',
      });
      setCoverImageUrl('');
      setIsbnInput(''); // Limpiar ISBN cuando se agrega un libro nuevo
      setIncludeCoverImage(true); // Por defecto activado para nuevos libros
    }
  }, [book, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Preparar los datos para enviar, incluyendo portada_url solo si el switch está activado
      const dataToSend = {
        ...formData,
        portada_url: includeCoverImage ? formData.portada_url : '',
      };

      let savedBook: Book;

      if (book) {
        // Actualización: el libro ya existe, actualizarlo
        console.log("🔄 Actualizando libro existente:", book.id);
        await bookService.updateBook(book.id, dataToSend);
        savedBook = { ...book, ...dataToSend }; // Combinar datos originales con actualizados
        console.log("📖 Libro actualizado:", savedBook);
        addToast({
          title: '¡Libro actualizado!',
          description: 'El libro ha sido actualizado correctamente.',
          color: 'success'
        });
      } else {
        // Creación: crear nuevo libro
        console.log("➕ Creando nuevo libro con datos:", dataToSend);
        savedBook = await bookService.createBook(dataToSend);
        console.log("📚 Libro creado por servidor:", savedBook);
        addToast({
          title: '¡Libro agregado!',
          description: 'El libro ha sido agregado correctamente.',
          color: 'success'
        });
      }

      // Llamar a onSave con el libro guardado
      console.log("📤 Llamando onSave con:", savedBook);
      onSave(savedBook);
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
      const googleBook = await googleBooksService.searchByISBN(isbnInput);

      if (!googleBook) {
        addToast({
          title: 'Libro no encontrado',
          description: 'No se encontró ningún libro con ese ISBN. Verifica que sea correcto.',
          color: 'warning'
        });
        return;
      }

      const bookData = googleBooksService.extractBookData(googleBook);

      // Actualizar el formulario con los datos encontrados
      setFormData(prev => ({
        ...prev,
        ...bookData,
        isbn: isbnInput, // Guardar el ISBN que se usó para la búsqueda
        // Solo incluir portada_url si el switch está activado
        portada_url: includeCoverImage ? bookData.portada_url || prev.portada_url : '',
      }));

      // Actualizar la imagen de portada para vista previa solo si el switch está activado
      if (includeCoverImage && bookData.portada_url) {
        setCoverImageUrl(bookData.portada_url);
      } else if (!includeCoverImage) {
        setCoverImageUrl('');
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

  const typeOptions = [
    { key: 'libro', label: '📖 Libro' },
    { key: 'comic', label: '🦸 Comic' },
    { key: 'manga', label: '🇯🇵 Manga' },
    { key: 'digital', label: '💻 Digital' },
    { key: 'revista', label: '📰 Revista' },
    { key: 'audiolibro', label: '🎧 Audiolibro' },
    { key: 'otro', label: '📚 Otro' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader className="pb-2">
            {book ? 'Editar Libro' : 'Agregar Nuevo Libro'}
          </ModalHeader>
          <ModalBody className="space-y-3 py-3">
            {/* Campo ISBN con búsqueda automática */}
            <div className="space-y-1">
              <div className="flex gap-2">
                <Input
                  label="ISBN"
                  placeholder="ISBN del libro"
                  value={isbnInput}
                  onChange={(e) => setIsbnInput(e.target.value)}
                  disabled={loading || isbnLoading}
                  className="flex-1"
                  size="sm"
                />
                <Button
                  type="button"
                  color="secondary"
                  variant="flat"
                  onClick={handleISBNLookup}
                  disabled={loading || isbnLoading || !isbnInput.trim()}
                  size="sm"
                  className="mt-5 px-3"
                  startContent={<SearchIcon className="w-3 h-3" />}
                >
                  {isbnLoading ? '...' : 'Buscar'}
                </Button>
              </div>
              <p className="text-xs text-gray-500 leading-tight">
                Autocompleta título, autor, editorial y año
              </p>
            </div>

            {/* Switch para incluir imagen de portada */}
            <Switch
              isSelected={includeCoverImage}
              onValueChange={setIncludeCoverImage}
              disabled={loading}
              size="sm"
              className="py-1"
            >
              Incluir portada
            </Switch>

            {/* Vista previa de la imagen de portada */}
            {includeCoverImage && (coverImageUrl || formData.titulo) && (
              <div className="flex justify-center py-2">
                <div className="relative">
                  {coverImageUrl ? (
                    <img
                      src={coverImageUrl}
                      alt="Portada del libro"
                      className="w-20 h-28 object-cover rounded-md shadow-sm border"
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
                        setIncludeCoverImage(false); // Desactivar el switch cuando se elimina la imagen
                      }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
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
              size="sm"
            />

            <Input
              label="Autor"
              value={formData.autor}
              onChange={(e) => setFormData({ ...formData, autor: e.target.value })}
              required
              disabled={loading}
              size="sm"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Editorial"
                value={formData.editorial}
                onChange={(e) => setFormData({ ...formData, editorial: e.target.value })}
                disabled={loading}
                size="sm"
              />

              <Input
                type="number"
                label="Año"
                value={formData.anio_publicacion?.toString() || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  anio_publicacion: e.target.value ? parseInt(e.target.value) : undefined
                })}
                disabled={loading}
                min="1000"
                max={new Date().getFullYear()}
                size="sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="ISBN"
                placeholder="ISBN"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                disabled={loading}
                size="sm"
              />

              <Select
                label="Estado"
                selectedKeys={[formData.estado]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setFormData({ ...formData, estado: selected as 'en_estante' | 'prestado' | 'otro' });
                }}
                disabled={loading}
                size="sm"
              >
                {statusOptions.map((option) => (
                  <SelectItem key={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <Select
              label="Tipo"
              selectedKeys={[formData.tipo || 'libro']}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setFormData({ ...formData, tipo: selected as 'libro' | 'comic' | 'manga' | 'digital' | 'revista' | 'audiolibro' | 'otro' });
              }}
              disabled={loading}
              size="sm"
            >
              {typeOptions.map((option) => (
                <SelectItem key={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>

            <Checkbox
              isSelected={formData.leido}
              onValueChange={(checked) => setFormData({ ...formData, leido: checked })}
              disabled={loading}
              size="sm"
              className="py-2"
            >
              ¿Ya lo leíste?
            </Checkbox>
          </ModalBody>
          <ModalFooter className="pt-3 gap-2">
            <Button
              variant="light"
              onClick={onClose}
              disabled={loading}
              size="sm"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              color="primary"
              disabled={loading}
              size="sm"
            >
              {loading ? (book ? 'Guardando...' : 'Agregando...') : (book ? 'Guardar' : 'Agregar')}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};