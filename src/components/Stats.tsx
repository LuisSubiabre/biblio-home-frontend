import { Card, CardBody } from '@heroui/card';
import { Book } from '@/services/api';

interface LibraryStatsProps {
  books: Book[];
}

export const LibraryStats: React.FC<LibraryStatsProps> = ({ books }) => {
  // Calcular estadísticas a partir de la lista de libros
  const calculateStats = () => {
    const total_libros = books.length;
    const libros_en_estante = books.filter(book => book.estado === 'en_estante').length;
    const libros_prestados = books.filter(book => book.estado === 'prestado').length;
    const libros_leidos = books.filter(book => book.leido).length;
    const libros_no_leidos = total_libros - libros_leidos;

    return {
      total_libros,
      libros_en_estante,
      libros_prestados,
      libros_leidos,
      libros_no_leidos
    };
  };

  const stats = calculateStats();

  const statCards = [
    {
      title: 'Total de Libros',
      value: stats.total_libros,
      color: 'text-blue-600',
    },
    {
      title: 'En Estante',
      value: stats.libros_en_estante,
      color: 'text-green-600',
    },
    {
      title: 'Prestados',
      value: stats.libros_prestados,
      color: 'text-orange-600',
    },
    {
      title: 'Leídos',
      value: stats.libros_leidos,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardBody className="p-6 text-center">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {stat.title}
            </h3>
            <div className={`text-3xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};