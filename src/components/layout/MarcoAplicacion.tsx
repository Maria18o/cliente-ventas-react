import type { ReactNode } from 'react';
import {
  LogOut,
  Package,
  ReceiptText,
  Store,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { SeccionActiva } from '../../types/api';

interface MarcoAplicacionProps {
  seccionActiva: SeccionActiva;
  alCambiarSeccion: (seccion: SeccionActiva) => void;
  children: ReactNode;
}

const ELEMENTOS_NAVEGACION: Array<{
  id: SeccionActiva;
  etiqueta: string;
  icono: typeof Package;
}> = [
  { id: 'productos', etiqueta: 'Productos', icono: Package },
  { id: 'clientes', etiqueta: 'Clientes', icono: Users },
  { id: 'ventas', etiqueta: 'Ventas', icono: ReceiptText },
];

/**
 * Estructura responsiva principal con barra lateral en escritorio y cabecera compacta en móvil.
 */
export function MarcoAplicacion({
  seccionActiva,
  alCambiarSeccion,
  children,
}: MarcoAplicacionProps) {
  const { nombreUsuario, cerrarSesion } = useAuth();

  return (
    <div className="min-h-screen bg-lavanda text-tinta flex flex-col lg:flex-row">
      {/* Barra lateral en escritorio */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-blanco-rosado border-r border-lineas">
        <div className="px-6 py-6 border-b border-lineas">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lavanda border border-lineas text-morado shrink-0">
              <Store className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="font-titulo text-lg font-semibold text-tinta leading-tight truncate">
                Punto Norte Market
              </p>
              <p className="text-xs text-texto-suave truncate">
                Tu tienda, más simple
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-5 space-y-1.5" aria-label="Navegación principal">
          {ELEMENTOS_NAVEGACION.map((item) => {
            const Icono = item.icono;
            const activa = seccionActiva === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => alCambiarSeccion(item.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                  activa
                    ? 'bg-lavanda text-morado-oscuro border border-lineas'
                    : 'text-texto-suave hover:text-tinta hover:bg-lavanda/60 border border-transparent'
                }`}
              >
                <Icono
                  className={`h-4 w-4 shrink-0 ${
                    activa ? 'text-morado' : 'text-texto-suave'
                  }`}
                  aria-hidden="true"
                />
                <span>{item.etiqueta}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-lineas space-y-3">
          {nombreUsuario && (
            <div className="px-2">
              <p className="text-xs text-texto-suave">Sesión iniciada como</p>
              <p className="text-sm font-medium text-tinta truncate">
                {nombreUsuario}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => cerrarSesion()}
            className="w-full min-h-10 flex items-center justify-center gap-2 rounded-xl border border-lineas bg-blanco-rosado px-4 py-2 text-sm font-medium text-tinta hover:bg-coral-suave/60 hover:border-coral/40 transition-colors cursor-pointer whitespace-nowrap"
          >
            <LogOut className="h-4 w-4 text-morado-oscuro shrink-0" aria-hidden="true" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Cabecera compacta en móvil y tablet */}
      <header className="lg:hidden sticky top-0 z-30 bg-blanco-rosado border-b border-lineas">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lavanda border border-lineas text-morado shrink-0">
              <Store className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="font-titulo text-base font-semibold text-tinta truncate">
              Punto Norte Market
            </span>
          </div>

          <button
            type="button"
            onClick={() => cerrarSesion()}
            aria-label="Cerrar sesión"
            className="inline-flex items-center gap-1.5 rounded-xl border border-lineas px-3 py-1.5 text-xs font-medium text-tinta hover:bg-coral-suave/60 transition-colors shrink-0 whitespace-nowrap cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5 text-morado-oscuro" aria-hidden="true" />
            <span>Salir</span>
          </button>
        </div>

        <nav
          className="flex items-center gap-1.5 px-4 pb-2.5 overflow-x-auto"
          aria-label="Secciones de la tienda"
        >
          {ELEMENTOS_NAVEGACION.map((item) => {
            const Icono = item.icono;
            const activa = seccionActiva === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => alCambiarSeccion(item.id)}
                className={`flex-1 min-h-10 inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activa
                    ? 'bg-morado text-blanco-rosado'
                    : 'bg-lavanda/70 text-tinta hover:bg-lavanda'
                }`}
              >
                <Icono className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.etiqueta}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Área principal de contenido */}
      <main className="flex-1 lg:pl-64 min-w-0">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
