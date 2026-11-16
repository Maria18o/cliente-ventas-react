import { useMemo, useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ErrorApi } from '../../services/apiClient';
import type {
  Cliente,
  DetalleVenta,
  DetalleVentaPayload,
  Producto,
  Venta,
  VentaPayload,
} from '../../types/api';
import { formatearMoneda } from '../../utils/formato';
import { AlertaMensaje } from '../ui/AlertaMensaje';
import { Boton } from '../ui/Boton';
import { ModalBase } from '../ui/ModalBase';

interface LineaBorrador {
  claveLocal: string;
  productoId: string;
  cantidad: number;
  precioUnitario: string;
  enviada: boolean;
}

interface ModalNuevaVentaProps {
  clientes: Cliente[];
  productos: Producto[];
  alCerrar: () => void;
  alVentaCreada: (ventaId: number) => void;
}

/**
 * Modal para registrar una nueva venta (/api/ventas/) junto con sus detalles (/api/detalles-venta/).
 */
export function ModalNuevaVenta({
  clientes,
  productos,
  alCerrar,
  alVentaCreada,
}: ModalNuevaVentaProps) {
  const { api } = useAuth();

  const productosDisponibles = useMemo(
    () => productos.filter((p) => p.activo),
    [productos]
  );

  const [clienteId, setClienteId] = useState<string>(
    clientes[0] ? String(clientes[0].id) : ''
  );
  const [fechaLocal, setFechaLocal] = useState('');
  const [lineas, setLineas] = useState<LineaBorrador[]>(() => {
    const primero = productosDisponibles[0];
    return primero
      ? [
          {
            claveLocal: crypto.randomUUID(),
            productoId: String(primero.id),
            cantidad: 1,
            precioUnitario: String(primero.precio),
            enviada: false,
          },
        ]
      : [];
  });

  // Si la cabecera de venta ya se creó pero falló una línea (ej. stock insuficiente), evitamos duplicar la venta
  const [ventaCreadaId, setVentaCreadaId] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalEstimado = useMemo(() => {
    return lineas.reduce((acum, linea) => {
      const precio = Number(linea.precioUnitario) || 0;
      const cant = Number(linea.cantidad) || 0;
      return acum + precio * cant;
    }, 0);
  }, [lineas]);

  const agregarLinea = () => {
    const primero = productosDisponibles[0];
    setLineas((prev) => [
      ...prev,
      {
        claveLocal: crypto.randomUUID(),
        productoId: primero ? String(primero.id) : '',
        cantidad: 1,
        precioUnitario: primero ? String(primero.precio) : '0.00',
        enviada: false,
      },
    ]);
  };

  const eliminarLinea = (claveLocal: string) => {
    setLineas((prev) => prev.filter((l) => l.claveLocal !== claveLocal));
  };

  const actualizarLinea = (
    claveLocal: string,
    cambios: Partial<LineaBorrador>
  ) => {
    setLineas((prev) =>
      prev.map((l) => (l.claveLocal === claveLocal ? { ...l, ...cambios } : l))
    );
  };

  const cambiarProductoLinea = (claveLocal: string, nuevoProductoId: string) => {
    const producto = productos.find((p) => String(p.id) === nuevoProductoId);
    actualizarLinea(claveLocal, {
      productoId: nuevoProductoId,
      precioUnitario: producto ? String(producto.precio) : '0.00',
    });
  };

  const manejarEnvio = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setError(null);

    if (!clienteId) {
      setError('Selecciona un cliente para registrar la venta.');
      return;
    }

    for (const linea of lineas) {
      if (!linea.productoId) {
        setError('Selecciona un producto en cada línea de detalle.');
        return;
      }
      if (!Number.isInteger(linea.cantidad) || linea.cantidad <= 0) {
        setError('La cantidad de cada producto debe ser mayor a cero.');
        return;
      }
      const precioNum = Number(linea.precioUnitario);
      if (Number.isNaN(precioNum) || precioNum < 0) {
        setError('El precio unitario debe ser un número válido.');
        return;
      }
    }

    setGuardando(true);
    let idVentaActual = ventaCreadaId;

    try {
      // Paso 1: Crear cabecera de venta si aún no existe
      if (!idVentaActual) {
        const payloadVenta: VentaPayload = {
          cliente: Number(clienteId),
        };
        if (fechaLocal) {
          payloadVenta.fecha = new Date(fechaLocal).toISOString();
        }
        const ventaCreada = await api.post<Venta>('/api/ventas/', payloadVenta);
        idVentaActual = ventaCreada.id;
        setVentaCreadaId(ventaCreada.id);
      }

      // Paso 2: Registrar los detalles pendientes en /api/detalles-venta/
      for (const linea of lineas) {
        if (linea.enviada) continue;

        const payloadDetalle: DetalleVentaPayload = {
          venta: idVentaActual,
          producto: Number(linea.productoId),
          cantidad: linea.cantidad,
          precio_unitario: Number(linea.precioUnitario).toFixed(2),
        };

        await api.post<DetalleVenta>('/api/detalles-venta/', payloadDetalle);
        // Marca la línea como registrada por si otra línea posterior falla
        setLineas((prev) =>
          prev.map((item) =>
            item.claveLocal === linea.claveLocal
              ? { ...item, enviada: true }
              : item
          )
        );
      }

      alVentaCreada(idVentaActual);
    } catch (err) {
      if (err instanceof ErrorApi) {
        setError(err.message);
      } else {
        setError('No se pudo completar el registro de la venta.');
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ModalBase
      titulo={ventaCreadaId ? `Completar venta #${ventaCreadaId}` : 'Nueva venta'}
      subtitulo="Selecciona el cliente y los artículos que componen la venta."
      alCerrar={() => {
        if (ventaCreadaId) {
          alVentaCreada(ventaCreadaId);
        } else {
          alCerrar();
        }
      }}
      anchoMaximo="xl"
    >
      <form onSubmit={manejarEnvio} className="space-y-5" noValidate>
        {error && <AlertaMensaje mensaje={error} alCerrar={() => setError(null)} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="venta-cliente"
              className="block text-sm font-medium text-tinta mb-1.5"
            >
              Cliente
            </label>
            <select
              id="venta-cliente"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              disabled={guardando || Boolean(ventaCreadaId)}
              className="w-full min-h-11 rounded-xl border border-lineas bg-blanco-rosado px-3.5 py-2 text-sm text-tinta focus:border-morado focus:outline-none focus:ring-2 focus:ring-lila/60"
            >
              {clientes.length === 0 ? (
                <option value="">No hay clientes registrados</option>
              ) : (
                clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.email})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="venta-fecha"
              className="block text-sm font-medium text-tinta mb-1.5"
            >
              Fecha (opcional)
            </label>
            <input
              id="venta-fecha"
              type="datetime-local"
              value={fechaLocal}
              onChange={(e) => setFechaLocal(e.target.value)}
              disabled={guardando || Boolean(ventaCreadaId)}
              className="w-full min-h-11 rounded-xl border border-lineas bg-blanco-rosado px-3.5 py-2 text-sm text-tinta focus:border-morado focus:outline-none focus:ring-2 focus:ring-lila/60"
            />
          </div>
        </div>

        {/* Líneas de productos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-titulo text-base font-semibold text-tinta">
              Artículos de la venta
            </h3>
            <Boton
              variante="secundario"
              tamano="sm"
              onClick={agregarLinea}
              disabled={guardando || productosDisponibles.length === 0}
              icono={<Plus className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              Agregar producto
            </Boton>
          </div>

          {productosDisponibles.length === 0 ? (
            <p className="rounded-xl border border-lineas bg-lavanda/50 px-4 py-3 text-sm text-texto-suave">
              No hay productos activos disponibles. Puedes crear la venta ahora y
              agregar detalles después.
            </p>
          ) : lineas.length === 0 ? (
            <p className="rounded-xl border border-lineas bg-lavanda/50 px-4 py-3 text-sm text-texto-suave">
              Sin artículos iniciales. Pulsa &quot;Agregar producto&quot; si deseas
              incluir líneas de detalle ahora.
            </p>
          ) : (
            <div className="divide-y divide-lineas rounded-xl border border-lineas bg-lavanda/25">
              {lineas.map((linea, indice) => {
                const productoActual = productos.find(
                  (p) => String(p.id) === linea.productoId
                );
                const subtotal =
                  (Number(linea.precioUnitario) || 0) *
                  (Number(linea.cantidad) || 0);

                return (
                  <div
                    key={linea.claveLocal}
                    className="p-3.5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                  >
                    <div className="sm:col-span-5">
                      <label
                        htmlFor={`linea-prod-${indice}`}
                        className="block text-xs font-medium text-texto-suave mb-1"
                      >
                        Producto {linea.enviada ? '· Registrado' : ''}
                      </label>
                      <select
                        id={`linea-prod-${indice}`}
                        value={linea.productoId}
                        onChange={(e) =>
                          cambiarProductoLinea(linea.claveLocal, e.target.value)
                        }
                        disabled={guardando || linea.enviada}
                        className="w-full min-h-10 rounded-xl border border-lineas bg-blanco-rosado px-3 py-2 text-sm text-tinta focus:border-morado focus:outline-none"
                      >
                        {productosDisponibles.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} (Stock: {p.stock})
                          </option>
                        ))}
                      </select>
                      {productoActual && (
                        <p className="mt-1 text-xs text-texto-suave cifras-tabulares">
                          SKU {productoActual.sku} · Disponible: {productoActual.stock}
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor={`linea-cant-${indice}`}
                        className="block text-xs font-medium text-texto-suave mb-1"
                      >
                        Cantidad
                      </label>
                      <input
                        id={`linea-cant-${indice}`}
                        type="number"
                        min="1"
                        step="1"
                        value={linea.cantidad}
                        onChange={(e) =>
                          actualizarLinea(linea.claveLocal, {
                            cantidad: Number(e.target.value),
                          })
                        }
                        disabled={guardando || linea.enviada}
                        className="w-full min-h-10 rounded-xl border border-lineas bg-blanco-rosado px-3 py-2 text-sm text-tinta cifras-tabulares focus:border-morado focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label
                        htmlFor={`linea-precio-${indice}`}
                        className="block text-xs font-medium text-texto-suave mb-1"
                      >
                        Precio unitario
                      </label>
                      <input
                        id={`linea-precio-${indice}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={linea.precioUnitario}
                        onChange={(e) =>
                          actualizarLinea(linea.claveLocal, {
                            precioUnitario: e.target.value,
                          })
                        }
                        disabled={guardando || linea.enviada}
                        className="w-full min-h-10 rounded-xl border border-lineas bg-blanco-rosado px-3 py-2 text-sm text-tinta cifras-tabulares focus:border-morado focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 min-h-10">
                      <span className="text-sm font-semibold text-tinta cifras-tabulares">
                        {formatearMoneda(subtotal)}
                      </span>
                      {!linea.enviada && (
                        <button
                          type="button"
                          onClick={() => eliminarLinea(linea.claveLocal)}
                          disabled={guardando}
                          aria-label="Quitar línea"
                          className="rounded-lg p-2 text-morado-oscuro hover:bg-coral-suave transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resumen y botones */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-lineas">
          <div>
            <p className="text-xs text-texto-suave">Total estimado</p>
            <p className="font-titulo text-2xl font-semibold text-tinta cifras-tabulares">
              {formatearMoneda(totalEstimado)}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Boton
              variante="secundario"
              onClick={() => {
                if (ventaCreadaId) {
                  alVentaCreada(ventaCreadaId);
                } else {
                  alCerrar();
                }
              }}
              disabled={guardando}
            >
              {ventaCreadaId ? 'Cerrar y actualizar' : 'Cancelar'}
            </Boton>
            <Boton
              type="submit"
              variante="coral"
              cargando={guardando}
              disabled={clientes.length === 0}
            >
              {guardando
                ? 'Registrando...'
                : ventaCreadaId
                  ? 'Reintentar líneas pendientes'
                  : 'Registrar venta'}
            </Boton>
          </div>
        </div>
      </form>
    </ModalBase>
  );
}
