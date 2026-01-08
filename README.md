# 📚 Biblioteca Personal

Aplicación web para gestión de biblioteca personal construida con React, Vite y HeroUI.

## 🚀 Características

- 🔐 **Autenticación JWT** - Registro e inicio de sesión seguro
- 📚 **Gestión de Libros** - Agregar, editar, eliminar y buscar libros
- 📊 **Estadísticas** - Visualización de estadísticas de tu biblioteca
- 🔍 **Búsqueda** - Buscar libros por título o autor
- 📱 **Responsive** - Interfaz adaptativa para móviles y desktop
- 🎨 **UI Moderna** - Interfaz construida con HeroUI y Tailwind CSS

## 🛠️ Tecnologías

- **Frontend:**
  - [React](https://reactjs.org/) con [TypeScript](https://www.typescriptlang.org/)
  - [Vite](https://vitejs.dev/) - Build tool rápido
  - [HeroUI](https://heroui.com) - Componentes UI
  - [Tailwind CSS](https://tailwindcss.com) - Estilos
  - [React Router](https://reactrouter.com/) - Routing
  - [Framer Motion](https://www.framer.com/motion) - Animaciones

- **Backend:**
  - API REST con Node.js y Express
  - PostgreSQL para base de datos
  - JWT para autenticación

## 📋 Requisitos

- Node.js 18+
- npm o yarn

## 🚀 Instalación y Uso

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd biblio-front
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Ejecutar servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

> **Nota:** Si tienes problemas de permisos con npm, intenta ejecutar con permisos de administrador o usa un puerto diferente:
> ```bash
> npx vite --host --port 3001
> ```

### 4. Acceder a la aplicación

- **URL:** `http://localhost:5173` (o el puerto que configures)
- **Backend:** Asegúrate de que tu API esté corriendo en `http://149.50.146.106:3101/`

### 4. Configurar Backend

Asegúrate de que el backend esté corriendo en `http://149.50.146.106:3101/`

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── BookForm.tsx    # Formulario de libros
│   ├── BookList.tsx    # Lista de libros
│   ├── LoginForm.tsx   # Formulario de login
│   ├── RegisterForm.tsx # Formulario de registro
│   ├── Stats.tsx       # Estadísticas
│   └── icons.tsx       # Iconos SVG
├── contexts/           # Context API
│   └── AuthContext.tsx # Contexto de autenticación
├── pages/             # Páginas de la aplicación
│   ├── auth.tsx       # Página de autenticación
│   └── dashboard.tsx  # Dashboard principal
├── services/          # Servicios API
│   └── api.ts         # Cliente API
└── types/             # Tipos TypeScript
```

## 🔧 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run preview` - Vista previa del build
- `npm run lint` - Ejecutar linter

## 🎯 Funcionalidades

### Autenticación
- Registro de nuevos usuarios
- Inicio de sesión
- Protección de rutas
- **Mensajes mejorados con Alert** - Notificaciones visuales para éxito/error

### Gestión de Libros
- ✅ Agregar libros nuevos
- ✅ Ver lista de libros
- ✅ Editar información de libros
- ✅ Eliminar libros
- ✅ Buscar por título o autor
- ✅ Filtrar por estado y lectura

### Estados de Libros
- **En estante**: Libro disponible
- **Prestado**: Libro prestado a alguien
- **Otro**: Estado personalizado

### Estadísticas
- Total de libros
- Libros en estante
- Libros prestados
- Libros leídos/no leídos

### Interfaz de Usuario
- **Componente Alert mejorado** - Notificaciones elegantes para feedback en:
  - ✅ Login/Registro (éxito/error)
  - ✅ Agregar/Editar libros (éxito/error)
  - ✅ Eliminar libros (confirmación/éxito/error)
  - ✅ Cargar libros (errores)
- **Manejo inteligente de errores** - Extrae mensajes limpios de respuestas JSON de API
- Diseño responsive
- Tema oscuro/claro
- Animaciones suaves

## 📊 API Endpoints

La aplicación consume la siguiente API:

- `POST /api/usuarios/register` - Registro
- `POST /api/usuarios/login` - Login
- `GET /api/libros` - Listar libros
- `POST /api/libros` - Crear libro
- `PUT /api/libros/:id` - Actualizar libro
- `DELETE /api/libros/:id` - Eliminar libro
- `GET /api/libros/search?q=` - Buscar libros
- `GET /api/libros/stats/estadisticas` - Estadísticas

### Manejo de Errores

Los errores de la API se procesan automáticamente para mostrar mensajes limpios al usuario:

```json
// Respuesta de API: {"error":"Credenciales inválidas"}
// Mensaje mostrado: "Credenciales inválidas"

{
  "error": "Credenciales inválidas"    // → "Credenciales inválidas"
}
```

## 🔧 Resolución de Problemas

### Mensajes de error muestran JSON completo

**Problema:** Aparecen mensajes como `{"error":"Credenciales inválidas"}`
**Solución:** El sistema ya está configurado para extraer mensajes limpios de las respuestas JSON de la API.

### Error: "Failed to resolve import @heroui/card"

**Solución:** Instalar las dependencias faltantes:
```bash
npm install @heroui/card @heroui/badge @heroui/checkbox @heroui/select @heroui/modal
```

### Error: "EPERM: operation not permitted" con npm

**Solución:** Ejecutar con permisos de administrador o usar puerto alternativo:
```bash
sudo npm run dev
# o
npx vite --host --port 3001
```

### Error: "listen EPERM: operation not permitted"

**Solución:** Cambiar el puerto del servidor:
```bash
npx vite --host --port 3001
```

### La aplicación no conecta con el backend

**Verificar:**
1. Que el backend esté corriendo en `http://149.50.146.106:3101/`
2. Que no haya problemas de CORS
3. Que las rutas de la API sean correctas

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
