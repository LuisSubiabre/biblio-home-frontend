import { useState, useEffect } from 'react';
import { Card, CardBody } from '@heroui/card';
import { bookService, Stats } from '@/services/api';

interface LibraryStatsProps {
  refreshTrigger?: number;
}

export const LibraryStats: React.FC<LibraryStatsProps> = ({ refreshTrigger }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, [refreshTrigger]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await bookService.getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardBody className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-4">
        <div className="text-red-500">{error || 'Error al cargar estadísticas'}</div>
      </div>
    );
  }

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