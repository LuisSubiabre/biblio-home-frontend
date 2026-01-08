import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Alert } from "@heroui/alert";

import { useAuth } from "@/contexts/AuthContext";

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    title: string;
    description: string;
  } | null>(null);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    try {
      await login(email, password);
      setAlert({
        type: "success",
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente.",
      });
      // El redirect se maneja en el contexto de auth
    } catch (err) {
      setAlert({
        type: "error",
        title: "Error al iniciar sesión",
        description:
          err instanceof Error
            ? err.message
            : "Ha ocurrido un error inesperado.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <h1 className="text-2xl font-bold">Iniciar Sesión</h1>
      </CardHeader>
      <CardBody>
        {alert && (
          <Alert
            className="mb-4"
            color={alert.type === "success" ? "success" : "danger"}
            description={alert.description}
            title={alert.title}
          />
        )}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            required
            disabled={loading}
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            required
            disabled={loading}
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            className="w-full"
            color="primary"
            disabled={loading}
            type="submit"
          >
            {loading ? "Iniciando..." : "Iniciar Sesión"}
          </Button>
          <div className="text-center">
            <Button
              disabled={loading}
              variant="light"
              onClick={onSwitchToRegister}
            >
              ¿No tienes cuenta? Regístrate
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
};
