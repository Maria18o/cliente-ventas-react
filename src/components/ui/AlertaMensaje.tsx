import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface AlertaMensajeProps {
  tipo?: 'error' | 'exito';
  mensaje: string;
  alCerrar?: () => void;
  className?: string;
}

/**
 * Banner de alerta claro para mostrar errores devueltos por la API o confirmaciones.
 */
export function AlertaMensaje({
  tipo = 'error',
  mensaje,
  alCerrar,
  className = '',
}: AlertaMensajeProps) {
  if (!mensaje) return null;

  const esError = tipo === 'error';

  return (
    <div
      role={esError ? 'alert' : 'status'}
      className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
        esError
          ? 'bg-coral-suave border-coral/50 text-tinta'
          : 'bg-lavanda border-lila text-tinta'
      } ${className}`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        {esError ? (
          <AlertCircle
            className="h-4 w-4 text-morado-oscuro shrink-0 mt-0.5"
            aria-hidden="true"
          />
        ) : (
          <CheckCircle2
            className="h-4 w-4 text-morado shrink-0 mt-0.5"
            aria-hidden="true"
          />
        )}
        <div className="min-w-0">
          <span className="font-semibold mr-1.5">
            {esError ? 'No se pudo completar:' : 'Listo:'}
          </span>
          <span className="break-words">{mensaje}</span>
        </div>
      </div>

      {alCerrar && (
        <button
          type="button"
          onClick={alCerrar}
          aria-label="Cerrar mensaje"
          className="rounded-lg p-1 text-texto-suave hover:text-tinta hover:bg-blanco-rosado/60 transition-colors shrink-0 cursor-pointer"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
