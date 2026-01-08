import { useState } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Alert } from '@heroui/alert';
import { useAuth } from '@/contexts/AuthContext';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    type: 'success' | 'error';
    title: string;
    description: string;
  } | null>(null);

  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (password !== confirmPassword) {
      setAlert({
        type: 'error',
        title: 'Error de validación',
        description: 'Las contraseñas no coinciden.'
      });
      return;
    }

    if (password.length < 6) {
      setAlert({
        type: 'error',
        title: 'Error de validación',
        description: 'La contraseña debe tener al menos 6 caracteres.'
      });
      return;
    }

    setLoading(true);

    try {
      await register(nombre, email, password);
      setAlert({
        type: 'success',
        title: '¡Registro exitoso!',
        description: 'Tu cuenta ha sido creada correctamente.'
      });
      // El redirect se maneja en el contexto de auth
    } catch (err) {
      setAlert({
        type: 'error',
        title: 'Error al registrar',
        description: err instanceof Error ? err.message : 'Ha ocurrido un error inesperado.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <h1 className="text-2xl font-bold">Registro</h1>
      </CardHeader>
      <CardBody>
        {alert && (
          <Alert
            color={alert.type === 'success' ? 'success' : 'danger'}
            title={alert.title}
            description={alert.description}
            className="mb-4"
          />
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            disabled={loading}
          />
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <Input
            type="password"
            label="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <Input
            type="password"
            label="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />
          <Button
            type="submit"
            color="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </Button>
          <div className="text-center">
            <Button
              variant="light"
              onClick={onSwitchToLogin}
              disabled={loading}
            >
              ¿Ya tienes cuenta? Inicia sesión
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
};