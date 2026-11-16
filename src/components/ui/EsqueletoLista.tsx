interface EsqueletoListaProps {
  filas?: number;
  columnas?: number;
}

/**
 * Esqueleto visual que imita las filas de tabla en escritorio y tarjetas en móvil mientras cargan datos.
 */
export function EsqueletoLista({ filas = 5, columnas = 5 }: EsqueletoListaProps) {
  return (
    <div aria-busy="true" aria-label="Cargando registros">
      {/* Vista de escritorio */}
      <div className="hidden md:block overflow-hidden">
        <div className="divide-y divide-lineas/70">
          {Array.from({ length: filas }).map((_, indiceFila) => (
            <div
              key={indiceFila}
              className="grid gap-4 px-5 py-4 items-center"
              style={{
                gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: columnas }).map((__, indiceColumna) => (
                <div
                  key={indiceColumna}
                  className={`h-4 rounded-md bg-lavanda animate-pulse ${
                    indiceColumna === 0 ? 'w-4/5' : 'w-3/5'
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Vista móvil */}
      <div className="md:hidden divide-y divide-lineas/70">
        {Array.from({ length: Math.min(filas, 4) }).map((_, indice) => (
          <div key={indice} className="p-4 space-y-2.5">
            <div className="h-4 w-2/3 rounded-md bg-lavanda animate-pulse" />
            <div className="h-3.5 w-1/2 rounded-md bg-lavanda/80 animate-pulse" />
            <div className="h-3.5 w-1/3 rounded-md bg-lavanda/70 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
