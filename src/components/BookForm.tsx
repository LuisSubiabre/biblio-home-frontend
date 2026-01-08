import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Checkbox } from '@heroui/checkbox';
import { Select, SelectItem } from '@heroui/select';
import { Modal, ModalBody, ModalHeader, ModalFooter, ModalContent } from '@heroui/modal';
import { bookService, Book, BookFormData } from '@/services/api';

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
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (book) {
      setFormData({
        titulo: book.titulo,
        autor: book.autor,
        editorial: book.editorial || '',
        anio_publicacion: book.anio_publicacion,
        estado: book.estado,
        leido: book.leido,
      });
    } else {
      setFormData({
        titulo: '',
        autor: '',
        editorial: '',
        anio_publicacion: undefined,
        estado: 'en_estante',
        leido: false,
      });
    }
    setError('');
  }, [book, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (book) {
        await bookService.updateBook(book.id, formData);
      } else {
        await bookService.createBook(formData);
      }
      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar libro');
    } finally {
      setLoading(false);
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
            {error && (
              <div className="text-red-500 text-sm text-center p-2 bg-red-50 rounded">
                {error}
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