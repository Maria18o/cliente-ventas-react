import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Lock, Store, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL, ErrorApi } from '../../services/apiClient';
import { AlertaMensaje } from '../ui/AlertaMensaje';
import { Boton } from '../ui/Boton';

/**
 * Pantalla de inicio de sesión JWT contra {API}/api/token/.
 */
export function PantallaLogin() {
  const { iniciarSesion, mensajeSesion, limpiarMensajeSesion } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const manejarEnvio = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setError(null);
    limpiarMensajeSesion();

    const usuarioLimpio = username.trim();
    if (!usuarioLimpio || !password) {
      setError('Ingresa tu usuario y contraseña para continuar.');
      return;
    }

    setCargando(true);
    try {
      await iniciarSesion({ username: usuarioLimpio, password });
    } catch (err) {
      if (err instanceof ErrorApi) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado al iniciar sesión.');
      }
    } finally {
      setCargando(false);
    }
  };

  const mensajeActivo = error || mensajeSesion;

  return (
    <div className="min-h-screen bg-lavanda flex flex-col items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="rounded-3xl bg-blanco-rosado border border-lineas shadow-[var(--shadow-tarjeta)] p-7 sm:p-9">
          {/* Cabecera de marca */}
          <div className="text-center mb-7">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-lavanda border border-lineas text-morado">
              <Store className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="font-titulo text-3xl font-semibold text-tinta tracking-tight">
              Punto Norte Market
            </h1>
            <p className="mt-1.5 text-sm text-texto-suave">
              Tu tienda, más simple
            </p>
          </div>

          {mensajeActivo && (
            <div className="mb-5">
              <AlertaMensaje
                mensaje={mensajeActivo}
                alCerrar={() => {
                  setError(null);
                  limpiarMensajeSesion();
                }}
              />
            </div>
          )}

          <form onSubmit={manejarEnvio} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="login-usuario"
                className="block text-sm font-medium text-tinta mb-1.5"
              >
                Usuario
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-texto-suave"
                  aria-hidden="true"
                />
                <input
                  id="login-usuario"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Tu nombre de usuario"
                  disabled={cargando}
                  className="w-full min-h-11 rounded-xl border border-lineas bg-blanco-rosado pl-10 pr-4 py-2.5 text-sm text-tinta placeholder:text-texto-suave/70 focus:border-morado focus:outline-none focus:ring-2 focus:ring-lila/60 transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-contrasena"
                className="block text-sm font-medium text-tinta mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-texto-suave"
                  aria-hidden="true"
                />
                <input
                  id="login-contrasena"
                  type={mostrarContrasena ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  disabled={cargando}
                  className="w-full min-h-11 rounded-xl border border-lineas bg-blanco-rosado pl-10 pr-11 py-2.5 text-sm text-tinta placeholder:text-texto-suave/70 focus:border-morado focus:outline-none focus:ring-2 focus:ring-lila/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasena((prev) => !prev)}
                  aria-label={
                    mostrarContrasena
                      ? 'Ocultar contraseña'
                      : 'Mostrar contraseña'
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-texto-suave hover:text-tinta hover:bg-lavanda transition-colors cursor-pointer"
                >
                  {mostrarContrasena ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Boton
                type="submit"
                variante="coral"
                cargando={cargando}
                className="w-full"
              >
                {cargando ? 'Ingresando...' : 'Iniciar sesión'}
              </Boton>
            </div>
          </form>

          <p className="mt-6 pt-5 border-t border-lineas text-center text-xs text-texto-suave break-all">
            Conectado a <span className="font-medium text-tinta">{API_BASE_URL}</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
