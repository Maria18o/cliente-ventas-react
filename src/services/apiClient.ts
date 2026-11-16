import type { RespuestaPaginada } from '../types/api';

/**
 * URL base de la API REST de Django configurada mediante VITE_API_URL.
 */
const urlCruda = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
export const API_BASE_URL = urlCruda.replace(/\/+$/, '');

/**
 * Error personalizado que conserva el código HTTP y el mensaje legible de la API.
 */
export class ErrorApi extends Error {
  status: number;
  datos?: unknown;

  constructor(mensaje: string, status = 0, datos?: unknown) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.status = status;
    this.datos = datos;
  }
}

const NOMBRES_CAMPOS: Record<string, string> = {
  username: 'Usuario',
  password: 'Contraseña',
  nombre: 'Nombre',
  sku: 'SKU',
  precio: 'Precio',
  stock: 'Stock',
  activo: 'Estado',
  email: 'Correo electrónico',
  cliente: 'Cliente',
  fecha: 'Fecha',
  venta: 'Venta',
  producto: 'Producto',
  cantidad: 'Cantidad',
  precio_unitario: 'Precio unitario',
};

/**
 * Extrae un mensaje claro y legible desde los formatos de error habituales de Django REST Framework.
 */
export function extraerMensajeErrorApi(datos: unknown, status?: number): string {
  if (!datos) {
    if (status === 401) return 'Credenciales inválidas o sesión expirada.';
    if (status === 403) return 'No tienes permisos para realizar esta acción.';
    if (status === 404) return 'No se encontró el registro solicitado.';
    if (status && status >= 500) return 'Error interno en el servidor de la API.';
    return 'Ocurrió un error al comunicarse con el servidor.';
  }

  if (typeof datos === 'string') {
    // Evita mostrar HTML crudo si Django devuelve una página de depuración
    if (datos.trim().startsWith('<')) {
      return status && status >= 500
        ? 'Error interno en el servidor de Django (500).'
        : 'El servidor devolvió una respuesta inesperada.';
    }
    return datos;
  }

  if (Array.isArray(datos)) {
    const textos = datos.map((item) => extraerMensajeErrorApi(item, status)).filter(Boolean);
    return textos.join(' ') || 'Error de validación en la solicitud.';
  }

  if (typeof datos === 'object') {
    const registro = datos as Record<string, unknown>;

    if (typeof registro.detail === 'string') {
      return registro.detail;
    }

    if (typeof registro.error === 'string') {
      return registro.error;
    }

    if (typeof registro.message === 'string') {
      return registro.message;
    }

    if (registro.non_field_errors) {
      return extraerMensajeErrorApi(registro.non_field_errors, status);
    }

    const mensajesCampos: string[] = [];
    for (const [clave, valor] of Object.entries(registro)) {
      const etiqueta = NOMBRES_CAMPOS[clave] || clave;
      const detalle = extraerMensajeErrorApi(valor, status);
      if (detalle) {
        mensajesCampos.push(`${etiqueta}: ${detalle}`);
      }
    }

    if (mensajesCampos.length > 0) {
      return mensajesCampos.join(' · ');
    }
  }

  return 'No se pudo completar la operación solicitada.';
}

/**
 * Normaliza respuestas de listas de DRF (tanto arreglos directos como objetos paginados con results).
 */
export function normalizarLista<T>(datos: T[] | RespuestaPaginada<T>): T[] {
  if (Array.isArray(datos)) {
    return datos;
  }
  if (datos && typeof datos === 'object' && Array.isArray(datos.results)) {
    return datos.results;
  }
  return [];
}

export interface ConfiguracionClienteApi {
  obtenerAccessToken: () => string | null;
  renovarAccessToken: () => Promise<string | null>;
}

/**
 * Crea un cliente HTTP con soporte automático de Bearer token y renovación ante 401.
 */
export function crearClienteApi(config: ConfiguracionClienteApi) {
  async function solicitar<T>(
    ruta: string,
    opciones: RequestInit = {},
    reintentarTrasRefresh = true
  ): Promise<T> {
    const url = `${API_BASE_URL}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
    const headers = new Headers(opciones.headers || {});

    if (!headers.has('Content-Type') && opciones.body && !(opciones.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const tokenActual = config.obtenerAccessToken();
    if (tokenActual) {
      headers.set('Authorization', `Bearer ${tokenActual}`);
    }

    let respuesta: Response;
    try {
      respuesta = await fetch(url, {
        ...opciones,
        headers,
      });
    } catch {
      throw new ErrorApi(
        `No se pudo conectar con la API en ${API_BASE_URL}. Verifica que el servidor de Django esté activo.`,
        0
      );
    }

    // Si el access token venció, intenta renovarlo una sola vez y reintenta la petición original
    if (respuesta.status === 401 && reintentarTrasRefresh) {
      const nuevoAccess = await config.renovarAccessToken();
      if (nuevoAccess) {
        const headersReintento = new Headers(opciones.headers || {});
        if (
          !headersReintento.has('Content-Type') &&
          opciones.body &&
          !(opciones.body instanceof FormData)
        ) {
          headersReintento.set('Content-Type', 'application/json');
        }
        headersReintento.set('Authorization', `Bearer ${nuevoAccess}`);

        let respuestaReintento: Response;
        try {
          respuestaReintento = await fetch(url, {
            ...opciones,
            headers: headersReintento,
          });
        } catch {
          throw new ErrorApi(
            `Se perdió la conexión con la API en ${API_BASE_URL} al reintentar la solicitud.`,
            0
          );
        }

        return procesarRespuesta<T>(respuestaReintento);
      }

      throw new ErrorApi('Tu sesión ha expirado. Inicia sesión nuevamente.', 401);
    }

    return procesarRespuesta<T>(respuesta);
  }

  return {
    get: <T>(ruta: string) => solicitar<T>(ruta, { method: 'GET' }),
    post: <T>(ruta: string, cuerpo?: unknown) =>
      solicitar<T>(ruta, {
        method: 'POST',
        body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      }),
    put: <T>(ruta: string, cuerpo?: unknown) =>
      solicitar<T>(ruta, {
        method: 'PUT',
        body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      }),
    patch: <T>(ruta: string, cuerpo?: unknown) =>
      solicitar<T>(ruta, {
        method: 'PATCH',
        body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      }),
    delete: <T = void>(ruta: string) => solicitar<T>(ruta, { method: 'DELETE' }),
  };
}

async function procesarRespuesta<T>(respuesta: Response): Promise<T> {
  if (respuesta.status === 204) {
    return undefined as T;
  }

  const tipoContenido = respuesta.headers.get('content-type') || '';
  let datos: unknown = null;

  if (tipoContenido.includes('application/json')) {
    try {
      datos = await respuesta.json();
    } catch {
      datos = null;
    }
  } else {
    try {
      const texto = await respuesta.text();
      datos = texto || null;
    } catch {
      datos = null;
    }
  }

  if (!respuesta.ok) {
    throw new ErrorApi(extraerMensajeErrorApi(datos, respuesta.status), respuesta.status, datos);
  }

  return datos as T;
}
