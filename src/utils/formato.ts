/**
 * Utilidades de formato para moneda, fechas y resolución de referencias.
 */

const formateadorMoneda = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formateadorFecha = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Convierte un número o cadena numérica en formato monetario legible.
 */
export function formatearMoneda(valor: number | string | null | undefined): string {
  const numero = Number(valor ?? 0);
  if (Number.isNaN(numero)) return '$0.00';
  return formateadorMoneda.format(numero);
}

/**
 * Formatea una fecha ISO de Django a un texto corto en español.
 */
export function formatearFecha(fechaIso: string | null | undefined): string {
  if (!fechaIso) return 'Sin fecha';
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return fechaIso;
  return formateadorFecha.format(fecha);
}

/**
 * Convierte una fecha ISO a formato compatible con input datetime-local.
 */
export function isoAInputLocal(fechaIso: string | null | undefined): string {
  if (!fechaIso) return '';
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return '';
  const offset = fecha.getTimezoneOffset();
  const local = new Date(fecha.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}
