import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type VarianteBoton = 'coral' | 'morado' | 'secundario' | 'peligro';
type TamanoBoton = 'sm' | 'md';

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  cargando?: boolean;
  icono?: ReactNode;
}

const ESTILOS_VARIANTE: Record<VarianteBoton, string> = {
  // Botón principal coral (#e9798d) con tinta oscura (#332344) para alto contraste
  coral:
    'bg-coral text-tinta hover:bg-[#e1677d] active:bg-[#d8586f] border border-transparent shadow-sm',
  morado:
    'bg-morado text-blanco-rosado hover:bg-morado-oscuro active:bg-tinta border border-transparent shadow-sm',
  secundario:
    'bg-blanco-rosado text-tinta hover:bg-lavanda border border-lineas',
  peligro:
    'bg-coral-suave text-morado-oscuro hover:bg-[#f3c5d5] border border-coral/40',
};

const ESTILOS_TAMANO: Record<TamanoBoton, string> = {
  sm: 'min-h-9 px-3.5 py-1.5 text-sm',
  md: 'min-h-11 px-5 py-2.5 text-sm',
};

/**
 * Botón reutilizable con soporte de estado de carga y variantes de Punto Norte Market.
 */
export function Boton({
  variante = 'coral',
  tamano = 'md',
  cargando = false,
  icono,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}: BotonProps) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-morado disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${ESTILOS_VARIANTE[variante]} ${ESTILOS_TAMANO[tamano]} ${className}`}
      {...props}
    >
      {cargando ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
      ) : (
        icono && <span className="shrink-0">{icono}</span>
      )}
      <span>{children}</span>
    </button>
  );
}
