import { useEffect, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface ModalBaseProps {
  titulo: string;
  subtitulo?: string;
  alCerrar: () => void;
  anchoMaximo?: 'md' | 'lg' | 'xl';
  children: ReactNode;
}

const ANCHOS: Record<'md' | 'lg' | 'xl', string> = {
  md: 'max-w-md',
  lg: 'max-w-xl',
  xl: 'max-w-3xl',
};

/**
 * Contenedor modal accesible con animación suave de entrada y cierre con Escape.
 */
export function ModalBase({
  titulo,
  subtitulo,
  alCerrar,
  anchoMaximo = 'lg',
  children,
}: ModalBaseProps) {
  useEffect(() => {
    const manejarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        alCerrar();
      }
    };
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [alCerrar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tinta/40 backdrop-blur-[2px] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) {
          alCerrar();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className={`w-full ${ANCHOS[anchoMaximo]} rounded-2xl bg-blanco-rosado border border-lineas shadow-[var(--shadow-modal)] my-auto`}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-lineas">
          <div className="min-w-0">
            <h2
              id="modal-titulo"
              className="font-titulo text-xl font-semibold text-tinta leading-snug"
            >
              {titulo}
            </h2>
            {subtitulo && (
              <p className="mt-1 text-sm text-texto-suave">{subtitulo}</p>
            )}
          </div>
          <button
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar ventana"
            className="rounded-xl p-2 text-texto-suave hover:text-tinta hover:bg-lavanda transition-colors cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>
      </motion.div>
    </div>
  );
}
