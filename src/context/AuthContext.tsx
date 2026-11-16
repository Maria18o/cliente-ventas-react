import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  API_BASE_URL,
  crearClienteApi,
  ErrorApi,
  extraerMensajeErrorApi,
} from '../services/apiClient';
import type { CredencialesLogin, TokensJWT } from '../types/api';

interface ValorContextoAuth {
  estaAutenticado: boolean;
  nombreUsuario: string | null;
  mensajeSesion: string | null;
  iniciarSesion: (credenciales: CredencialesLogin) => Promise<void>;
  cerrarSesion: (mensaje?: string) => void;
  limpiarMensajeSesion: () => void;
  api: ReturnType<typeof crearClienteApi>;
}

const AuthContext = createContext<ValorContextoAuth | null>(null);

/**
 * Proveedor de autenticación JWT estrictamente en memoria (sin localStorage ni sessionStorage).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<TokensJWT | null>(null);
  const [nombreUsuario, setNombreUsuario] = useState<string | null>(null);
  const [mensajeSesion, setMensajeSesion] = useState<string | null>(null);

  // Referencia sincronizada para leer el token vigente dentro de reintentos asíncronos
  const tokensRef = useRef<TokensJWT | null>(null);
  // Promesa compartida para evitar múltiples llamadas paralelas a /api/token/refresh/
  const refreshEnCursoRef = useRef<Promise<string | null> | null>(null);

  const actualizarTokens = useCallback((nuevosTokens: TokensJWT | null) => {
    tokensRef.current = nuevosTokens;
    setTokens(nuevosTokens);
  }, []);

  const cerrarSesion = useCallback(
    (mensaje?: string) => {
      actualizarTokens(null);
      setNombreUsuario(null);
      setMensajeSesion(mensaje ?? null);
    },
    [actualizarTokens]
  );

  const limpiarMensajeSesion = useCallback(() => {
    setMensajeSesion(null);
  }, []);

  const iniciarSesion = useCallback(
    async (credenciales: CredencialesLogin) => {
      let respuesta: Response;
      try {
        respuesta = await fetch(`${API_BASE_URL}/api/token/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credenciales),
        });
      } catch {
        throw new ErrorApi(
          `No se pudo conectar con la API en ${API_BASE_URL}. Comprueba que el servidor esté encendido.`,
          0
        );
      }

      let datos: unknown = null;
      try {
        datos = await respuesta.json();
      } catch {
        datos = null;
      }

      if (!respuesta.ok) {
        throw new ErrorApi(
          extraerMensajeErrorApi(datos, respuesta.status),
          respuesta.status,
          datos
        );
      }

      const payload = datos as Partial<TokensJWT>;
      if (!payload?.access || !payload?.refresh) {
        throw new ErrorApi('La respuesta de autenticación no incluyó los tokens esperados.', 500);
      }

      actualizarTokens({
        access: payload.access,
        refresh: payload.refresh,
      });
      setNombreUsuario(credenciales.username);
      setMensajeSesion(null);
    },
    [actualizarTokens]
  );

  const renovarAccessToken = useCallback(async (): Promise<string | null> => {
    const refreshActual = tokensRef.current?.refresh;
    if (!refreshActual) {
      cerrarSesion('Tu sesión ha expirado. Inicia sesión nuevamente.');
      return null;
    }

    if (refreshEnCursoRef.current) {
      return refreshEnCursoRef.current;
    }

    const promesaRefresh = (async (): Promise<string | null> => {
      try {
        const respuesta = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshActual }),
        });

        if (!respuesta.ok) {
          cerrarSesion('Tu sesión expiró. Por favor, inicia sesión nuevamente.');
          return null;
        }

        const datos = (await respuesta.json()) as Partial<TokensJWT>;
        if (!datos?.access) {
          cerrarSesion('No fue posible renovar la sesión. Inicia sesión nuevamente.');
          return null;
        }

        const actualizados: TokensJWT = {
          access: datos.access,
          refresh: datos.refresh || refreshActual,
        };
        actualizarTokens(actualizados);
        return actualizados.access;
      } catch {
        cerrarSesion('No se pudo renovar la sesión con el servidor.');
        return null;
      } finally {
        refreshEnCursoRef.current = null;
      }
    })();

    refreshEnCursoRef.current = promesaRefresh;
    return promesaRefresh;
  }, [actualizarTokens, cerrarSesion]);

  const api = useMemo(
    () =>
      crearClienteApi({
        obtenerAccessToken: () => tokensRef.current?.access ?? null,
        renovarAccessToken,
      }),
    [renovarAccessToken]
  );

  const valor = useMemo<ValorContextoAuth>(
    () => ({
      estaAutenticado: Boolean(tokens?.access),
      nombreUsuario,
      mensajeSesion,
      iniciarSesion,
      cerrarSesion,
      limpiarMensajeSesion,
      api,
    }),
    [
      tokens,
      nombreUsuario,
      mensajeSesion,
      iniciarSesion,
      cerrarSesion,
      limpiarMensajeSesion,
      api,
    ]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

/**
 * Hook de acceso al contexto de autenticación y cliente API autenticado.
 */
export function useAuth(): ValorContextoAuth {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider.');
  }
  return contexto;
}
