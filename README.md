# Taller y Repuestos JD - Backoffice

Panel de administración (React + TypeScript + Vite) del sistema Taller y Repuestos JD.

**Fase actual:** inicio de sesión, gestión de usuarios, consulta de roles y administración del catálogo (**repuestos**, **marcas** y **categorías**) con CRUD completo contra el backend. Usa el mismo estilo del sitio público (colores, variables CSS y tipografía).

## Requisitos

- Node.js 20 o superior
- El backend `taller-jd-backend` en ejecución (por defecto en http://localhost:3000)
- Un usuario ADMIN creado con el Setup
- La base de datos con las tablas `roles`, `users`, `brands`, `categories`, `parts` y `part_images` (ver `database/schema.sql` en el backend)

## Configuración

1. Copie `.env.example` a `.env`.
2. Si el backend no está en `http://localhost:3000`, cambie `VITE_API_URL`.
3. En el `.env` del **backend**, `FRONTEND_URLS` debe incluir el origen del backoffice y el del Front Office (separados por coma, sin `/` al final):

```
FRONTEND_URLS=http://localhost:5173,http://localhost:5174
```

Si el backoffice o el Front Office se publican, agregue también su URL pública.

## Ejecutar

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # revisa tipos y genera dist/
npm run preview   # prueba la versión compilada
```

## Estructura

```
public/logo-jd.png            Logo (también es el favicon)
src/
├── main.tsx                  Punto de entrada
├── app.router.tsx            Rutas: /login, /parts, /brands, /categories, /users, /roles
├── index.css                 Variables del sitio + botones, formularios, modales
├── css/                      login.css · layout.css · users.css · parts.css
├── config/api.ts             URL del backend (VITE_API_URL)
├── auth/
│   ├── session.ts            Token y usuario en localStorage, roles permitidos
│   └── pages/LoginPage.tsx
├── services/                 http.ts · auth · users · roles · parts · brands · categories
├── components/               ProtectedRoute · ConfirmModal · Pagination
└── admin/
    ├── layouts/AdminLayout.tsx   Barra lateral y encabezado
    └── pages/parts · brands · categories · users · roles
```

## Pantallas

| Ruta | Acceso | Qué hace |
|---|---|---|
| `/login` | Público | Inicia sesión (solo entran los roles de `BACKOFFICE_ROLES`) |
| `/parts` | ADMIN | Repuestos: lista con búsqueda (nombre o SKU), filtros por marca, categoría y estado, y paginación; crear, editar, desactivar y activar; gestión de imágenes por URL (imagen principal, agregar y eliminar) |
| `/brands` | ADMIN | Marcas: lista, crear, editar, desactivar y activar |
| `/categories` | ADMIN | Categorías: lista, crear, editar (nombre y descripción), desactivar y activar |
| `/users` | ADMIN | Lista con búsqueda y paginación, crear, editar, activar y desactivar |
| `/roles` | ADMIN | Lista de roles (solo lectura) |

## Reglas del catálogo

- Eliminar un repuesto, una marca o una categoría **no borra** el registro: lo desactiva (`status = 0`) y pide confirmación.
- Para crear un repuesto debe existir al menos una marca y una categoría **activas**.
- El backend impide desactivar una marca o categoría que tenga repuestos activos, y activar un repuesto cuya marca o categoría esté inactiva; el mensaje se muestra en pantalla.
- Solo los repuestos activos (con marca y categoría activas) aparecen en el Front Office.
- Las imágenes se registran con la **URL directa de la imagen** (debe terminar en un archivo de imagen, no ser la dirección de una página). La primera imagen queda como principal; máximo 10 por repuesto.
- Los datos se validan en el formulario y de nuevo en el backend; los errores del servidor (SKU o nombre duplicado, referencias inválidas, etc.) se muestran al usuario.

## Estilo

Usa las mismas variables que `App.css` del sitio público: `--color-primario`, `--color-secundario`, `--color-acento`, `--color-blanco`, `--color-claro`, `--color-gris`, `--color-footer`, `--radio`, `--sombra` y `--transicion`.

Las fuentes `Bungee` y `Racing Sans One` están declaradas igual que en el sitio, pero ninguno de los dos proyectos las carga, así que en pantalla se ve Arial. Para activarlas en ambos, descomente el `<link>` de Google Fonts en `index.html` (y agregue el mismo en el `index.html` del sitio público).

## Cómo agregar más módulos

1. Cree el servicio en `src/services/` con `request()` de `http.ts`.
2. Cree la página en `src/admin/pages/<modulo>/`.
3. Agregue la ruta en `app.router.tsx` dentro de `ProtectedRoute`.
4. Agregue el enlace en `NAVIGATION` de `AdminLayout.tsx`.
5. Si los empleados deben entrar, agregue `"EMPLOYEE"` a `BACKOFFICE_ROLES` en `session.ts` y a `allowedRoles` de las rutas que les correspondan (el backend también debe permitirlo).

## Seguridad

- Cada solicitud envía el token JWT; si el backend responde 401 se cierra la sesión.
- El token expira a las 2 horas y se revisa antes de entrar a cada ruta.
- Un usuario no puede desactivarse ni cambiarse el rol a sí mismo, y el backend garantiza que siempre quede un ADMIN activo.
- Las rutas del frontend se protegen por comodidad; la seguridad real la aplica el backend.
