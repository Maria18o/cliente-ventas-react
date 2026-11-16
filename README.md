# Punto Norte Market - Cliente web (React)

## ¿Qué problema resuelve?
La tienda tiene una API REST protegida con JWT. Este cliente permite administrar productos, clientes y ventas desde una interfaz web responsive, sin entrar al panel de Django.

## ¿Cómo usa la API?
1. El usuario inicia sesión: el cliente hace POST a `/api/token/` y recibe un token JWT.
2. El token se guarda solo en memoria y se envía en el header `Authorization: Bearer <token>` en cada petición protegida.
3. Con ese token hace el CRUD sobre `/api/productos/`, `/api/clientes/`, `/api/ventas/` y `/api/detalles-venta/`.
4. Si el token vence, lo renueva con `/api/token/refresh/`.

## Versión publicada
https://punto-norte-market.vercel.app/

## Cómo ejecutarlo
1. `npm install`
2. Crear un archivo `.env` con `VITE_API_URL=http://127.0.0.1:8000` (o la URL del backend publicado).
3. `npm run dev` y abrir http://localhost:5173

## Backend
https://back-end-evaluacion3.vercel.app
