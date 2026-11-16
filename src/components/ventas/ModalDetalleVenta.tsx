import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Check, Loader2, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ErrorApi, normalizarLista } from '../../services/apiClient';
import type {
  Cliente,
  DetalleVenta,
  DetalleVentaPayload,
  Producto,
  RespuestaPaginada,
  Venta,
  VentaPayload,
} from '../../types/api';
import { formatearMoneda, isoAInputLocal } from '../../utils/formato';
import { AlertaMensaje } from '../ui/AlertaMensaje';
import { Boton } from '../ui/Boton';
import { ModalBase } from '../ui/ModalBase';

interface ModalDetalleVentaProps {
  ventaInicial: Venta;
  clientes: Cliente[];
  productos: Producto[];
  alCerrar: () => void;
  alSincronizar: () => void;
}

/**
 * Modal para inspeccionar, editar cabecera y gestionar líneas (/api/detalles-venta/) de una venta.
 */
export function ModalDetalleVenta({
  ventaInicial,
  clientes,
  productos,
  alCerrar,
  alSincronizar,
}: ModalDetalleVentaProps) {
  const { api } = useAuth();

  const [venta, setVenta] = useState<Venta>(ventaInicial);
  const [detalles, setDetalles] = useState<DetalleVenta[]>([]);
  const [cargandoDetalles, setCargandoDetalles] = useState(true);

  const idClienteInicial =
    typeof ventaInicial.cliente === 'object'
      ? ventaInicial.cliente.id
      : ventaInicial.cliente;

  const [clienteId, setClienteId] = useState<string>(String(idClienteInicial));
  const [fechaLocal, setFechaLocal] = useState<string>(
    isoAInputLocal(ventaInicial.fecha)
  );
  const [guardandoCabecera, setGuardandoCabecera] = useState(false);

  // Estado para edición rápida de cantidad por detalle
  const [cantidadesEditadas, setCantidadesEditadas] = useState<
    Record<number, string>
  >({});
  const [detalleProcesandoId, setDetalleProcesandoId] = useState<number | null>(
    null
  );

  // Estado para agregar un nuevo detalle en /api/detalles-venta/
  const productosActivos = useMemo(
    () => productos.filter((p) => p.activo),
    [productos]
  );
  const [nuevoProductoId, setNuevoProductoId] = useState<string>(
    productosActivos[0] ? String(productosActivos[0].id) : ''
  );
  const [nuevaCantidad, setNuevaCantidad] = useState<string>('1');
  const [nuevoPrecioUnitario, setNuevoPrecioUnitario] = useState<string>(
    productosActivos[0] ? String(productosActivos[0].precio) : '0.00'
  );
  const [agregandoDetalle, setAgregandoDetalle] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const recargarVentaYDetalles = useCallback(async () => {
    setCargandoDetalles(true);
    try {
      const [ventaActualizada, listaDetalles] = await Promise.all([
        api.get<Venta>(`/api/ventas/${ventaInicial.id}/`),
        api.get<DetalleVenta[] | RespuestaPaginada<DetalleVenta>>(
          `/api/detalles-venta/?venta=${ventaInicial.id}`
        ),
      ]);

      setVenta(ventaActualizada);
      const idCli =
        typeof ventaActualizada.cliente === 'object'
          ? ventaActualizada.cliente.id
          : ventaActualizada.cliente;
      setClienteId(String(idCli));
      setFechaLocal(isoAInputLocal(ventaActualizada.fecha));

      // Filtra por venta en cliente por si el backend no tiene filtro por query param
      const todos = normalizarLista(listaDetalles);
      const filtrados = todos.filter((d) => d.venta === ventaInicial.id);

      // Si el backend solo incluye detalles anidados en la venta y no en el listado, úsalos como respaldo
      const detallesAnidados = Array.isArray(ventaActualizada.detalles)
        ? ventaActualizada.detalles.filter(
            (d): d is DetalleVenta => typeof d === 'object' && d !== null
          )
        : [];

      const listaFinal = filtrados.length > 0 ? filtrados : detallesAnidados;
      setDetalles(listaFinal);

      const mapaCantidades: Record<number, string> = {};
      for (const d of listaFinal) {
        mapaCantidades[d.id] = String(d.cantidad);
      }
      setCantidadesEditadas(mapaCantidades);
    } catch (err) {
      if (err instanceof ErrorApi) {
        setError(err.message);
      } else {
        setError('No se pudieron cargar los detalles de la venta.');
      }
    } finally {
      setCargandoDetalles(false);
    }
  }, [api, ventaInicial.id]);

  useEffect(() => {
    void recargarVentaYDetalles();
  }, [recargarVentaYDetalles]);

  const resolverNombreProducto = (detalle: DetalleVenta): string => {
    if (typeof detalle.producto === 'object' && detalle.producto !== null) {
      return detalle.producto.nombre;
    }
    const encontrado = productos.find((p) => p.id === detalle.producto);
    return encontrado ? encontrado.nombre : `Producto #${detalle.producto}`;
  };

  const guardarCabecera = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setError(null);
    setMensajeExito(null);

    if (!clienteId) {
      setError('Selecciona un cliente válido.');
      return;
    }

    const payload: VentaPayload = {
      cliente: Number(clienteId),
    };
    if (fechaLocal) {
      payload.fecha = new Date(fechaLocal).toISOString();
    }

    setGuardandoCabecera(true);
    try {
      await api.patch<Venta>(`/api/ventas/${venta.id}/`, payload);
      await recargarVentaYDetalles();
      alSincronizar();
      setMensajeExito('Datos de la venta actualizados.');
    } catch (err) {
      if (err instanceof ErrorApi) {
        setError(err.message);
      } else {
        setError('No se pudo actualizar la cabecera de la venta.');
      }
    } finally {
      setGuardandoCabecera(false);
    }
  };

  const actualizarCantidadDetalle = async (detalle: DetalleVenta) => {
    setError(null);
    setMensajeExito(null);

    const cantidadNum = Number(cantidadesEditadas[detalle.id]);
    if (!Number.isInteger(cantidadNum) || cantidadNum <= 0) {
      setError('La cantidad debe ser un entero mayor a cero.');
      return;
    }

    setDetalleProcesandoId(detalle.id);
    try {
      await api.patch<DetalleVenta>(`/api/detalles-venta/${detalle.id}/`, {
        cantidad: cantidadNum,
      });
      await recargarVentaYDetalles();
      alSincronizar();
      setMensajeExito('Cantidad actualizada correctamente.');
    } catch (err) {
      if (err instanceof ErrorApi) {
        setError(err.message);
      } else {
        setError('No se pudo actualizar la cantidad del artículo.');
      }
    } finally {
      setDetalleProcesandoId(null);
    }
  };

  const eliminarDetalle = async (detalleId: number) => {
    setError(null);
    setMensajeExito(null);
    setDetalleProcesandoId(detalleId);

    try {
      await api.delete(`/api/detalles-venta/${detalleId}/`);
      await recargarVentaYDetalles();
      alSincronizar();
      setMensajeExito('Artículo eliminado de la venta.');
    } catch (err) {
      if (err instanceof ErrorApi) {
        setError(err.message);
      } else {
        setError('No se pudo quitar el artículo de la venta.');
      }
    } finally {
      setDetalleProcesandoId(null);
    }
  };

  const agregarNuevoDetalle = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setError(null);
    setMensajeExito(null);

    if (!nuevoProductoId) {
      setError('Selecciona un producto para agregar.');
      return;
    }

    const cantidadNum = Number(nuevaCantidad);
    const precioNum = Number(nuevoPrecioUnitario);

    if (!Number.isInteger(cantidadNum) || cantidadNum <= 0) {
      setError('La cantidad debe ser un número entero mayor a cero.');
      return;
    }

    if (Number.isNaN(precioNum) || precioNum < 0) {
      setError('El precio unitario no es válido.');
      return;
    }

    const payload: DetalleVentaPayload = {
      venta: venta.id,
      producto: Number(nuevoProductoId),
      cantidad: cantidadNum,
      precio_unitario: precioNum.toFixed(2),
    };

    setAgregandoDetalle(true);
    try {
      await api.post<DetalleVenta>('/api/detalles-venta/', payload);
      setNuevaCantidad('1');
      await recargarVentaYDetalles();
      alSincronizar();
      setMensajeExito('Artículo agregado a la venta.');
    } catch (err) {
      if (err instanceof ErrorApi) {
        setError(err.message);
      } else {
        setError('No se pudo agregar el artículo a la venta.');
      }
    } finally {
      setAgregandoDetalle(false);
    }
  };

  return (
    <ModalBase
      titulo={`Venta #${venta.id}`}
      subtitulo="Edita el cliente, la fecha o los artículos asociados a esta venta."
      alCerrar={alCerrar}
      anchoMaximo="xl"
    >
      <div className="space-y-6">
        {error && <AlertaMensaje mensaje={error} alCerrar={() => setError(null)} />}
        {mensajeExito && (
          <AlertaMensaje
            tipo="exito"
            mensaje={mensajeExito}
            alCerrar={() => setMensajeExito(null)}
          />
        )}

        {/* Cabecera editable de la venta */}
        <form
          onSubmit={guardarCabecera}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pb-5 border-b border-lineas"
        >
          <div className="sm:col-span-5">
            <label
              htmlFor="editar-venta-cliente"
              className="block text-xs font-medium text-texto-suave mb-1"
            >
              Cliente
            </label>
            <select
              id="editar-venta-cliente"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              disabled={guardandoCabecera}
              className="w-full min-h-10 rounded-xl border border-lineas bg-blanco-rosado px-3 py-2 text-sm text-tinta focus:border-morado focus:outline-none"
            >
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4">
            <label
              htmlFor="editar-venta-fecha"
              className="block text-xs font-medium text-texto-suave mb-1"
            >
              Fecha y hora
            </label>
            <input
              id="editar-venta-fecha"
              type="datetime-local"
              value={fechaLocal}
              onChange={(e) => setFechaLocal(e.target.value)}
              disabled={guardandoCabecera}
              className="w-full min-h-10 rounded-xl border border-lineas bg-blanco-rosado px-3 py-2 text-sm text-tinta focus:border-morado focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <Boton
              type="submit"
              variante="secundario"
              tamano="sm"
              cargando={guardandoCabecera}
              className="w-full min-h-10"
            >
              {guardandoCabecera ? 'Guardando...' : 'Guardar datos'}
            </Boton>
          </div>
        </form>

        {/* Detalles existentes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-titulo text-base font-semibold text-tinta">
              Detalles de la venta
            </h3>
            <p className="text-sm font-semibold text-tinta cifras-tabulares">
              Total: {formatearMoneda(venta.total)}
            </p>
          </div>

          {cargandoDetalles ? (
            <div className="space-y-2 py-3">
              <div className="h-10 rounded-xl bg-lavanda animate-pulse" />
              <div className="h-10 rounded-xl bg-lavanda/80 animate-pulse" />
            </div>
          ) : detalles.length === 0 ? (
            <p className="rounded-xl border border-lineas bg-lavanda/40 px-4 py-4 text-sm text-texto-suave">
              Esta venta todavía no tiene artículos registrados. Agrega uno abajo.
            </p>
          ) : (
            <div className="divide-y divide-lineas rounded-xl border border-lineas overflow-hidden">
              {detalles.map((detalle) => {
                const procesando = detalleProcesandoId === detalle.id;
                const cantidadCambiada =
                  cantidadesEditadas[detalle.id] !== String(detalle.cantidad);

                return (
                  <div
                    key={detalle.id}
                    className="p-3.5 bg-blanco-rosado flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-tinta truncate">
                        {resolverNombreProducto(detalle)}
                      </p>
                      <p className="text-xs text-texto-suave cifras-tabulares">
                        {formatearMoneda(detalle.precio_unitario)} c/u
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        Subtotal: <strong className="text-tinta">{formatearMoneda(detalle.subtotal)}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <label className="sr-only" htmlFor={`cant-det-${detalle.id}`}>
                        Cantidad
                      </label>
                      <input
                        id={`cant-det-${detalle.id}`}
                        type="number"
                        min="1"
                        step="1"
                        value={cantidadesEditadas[detalle.id] ?? String(detalle.cantidad)}
                        onChange={(e) =>
                          setCantidadesEditadas((prev) => ({
                            ...prev,
                            [detalle.id]: e.target.value,
                          }))
                        }
                        disabled={procesando}
                        className="w-20 min-h-9 rounded-lg border border-lineas bg-blanco-rosado px-2.5 py-1 text-sm text-tinta cifras-tabulares focus:border-morado focus:outline-none"
                      />

                      {cantidadCambiada && (
                        <button
                          type="button"
                          onClick={() => void actualizarCantidadDetalle(detalle)}
                          disabled={procesando}
                          aria-label="Guardar cantidad"
                          className="min-h-9 inline-flex items-center gap-1 rounded-lg bg-morado px-2.5 py-1.5 text-xs font-medium text-blanco-rosado hover:bg-morado-oscuro transition-colors cursor-pointer"
                        >
                          {procesando ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          ) : (
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          <span>Aplicar</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => void eliminarDetalle(detalle.id)}
                        disabled={procesando}
                        aria-label="Eliminar línea"
                        className="min-h-9 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-morado-oscuro hover:bg-coral-suave transition-colors cursor-pointer"
                      >
                        {procesando && !cantidadCambiada ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        <span>Quitar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Agregar nuevo detalle a la venta */}
        <form
          onSubmit={agregarNuevoDetalle}
          className="rounded-xl border border-lineas bg-lavanda/35 p-4 space-y-3"
        >
          <p className="text-xs font-semibold text-tinta">
            Agregar artículo a la venta
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-5">
              <label
                htmlFor="agregar-prod"
                className="block text-xs font-medium text-texto-suave mb-1"
              >
                Producto
              </label>
              <select
                id="agregar-prod"
                value={nuevoProductoId}
                onChange={(e) => {
                  const idSel = e.target.value;
                  setNuevoProductoId(idSel);
                  const prod = productos.find((p) => String(p.id) === idSel);
                  if (prod) {
                    setNuevoPrecioUnitario(String(prod.precio));
                  }
                }}
                disabled={agregandoDetalle || productosActivos.length === 0}
                className="w-full min-h-10 rounded-xl border border-lineas bg-blanco-rosado px-3 py-2 text-sm text-tinta focus:border-morado focus:outline-none"
              >
                {productosActivos.length === 0 ? (
                  <option value="">Sin productos activos</option>
                ) : (
                  productosActivos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (Stock: {p.stock})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="agregar-cant"
                className="block text-xs font-medium text-texto-suave mb-1"
              >
                Cantidad
              </label>
              <input
                id="agregar-cant"
                type="number"
                min="1"
                step="1"
                value={nuevaCantidad}
                onChange={(e) => setNuevaCantidad(e.target.value)}
                disabled={agregandoDetalle}
                className="w-full min-h-10 rounded-xl border border-lineas bg-blanco-rosado px-3 py-2 text-sm text-tinta cifras-tabulares focus:border-morado focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="agregar-precio"
                className="block text-xs font-medium text-texto-suave mb-1"
              >
                Precio unitario
              </label>
              <input
                id="agregar-precio"
                type="number"
                min="0"
                step="0.01"
                value={nuevoPrecioUnitario}
                onChange={(e) => setNuevoPrecioUnitario(e.target.value)}
                disabled={agregandoDetalle}
                className="w-full min-h-10 rounded-xl border border-lineas bg-blanco-rosado px-3 py-2 text-sm text-tinta cifras-tabulares focus:border-morado focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <Boton
                type="submit"
                variante="coral"
                tamano="sm"
                cargando={agregandoDetalle}
                disabled={productosActivos.length === 0}
                icono={<Plus className="h-3.5 w-3.5" aria-hidden="true" />}
                className="w-full min-h-10"
              >
                Agregar
              </Boton>
            </div>
          </div>
        </form>

        <div className="flex justify-end pt-2 border-t border-lineas">
          <Boton variante="secundario" onClick={alCerrar}>
            Listo
          </Boton>
        </div>
      </div>
    </ModalBase>
  );
}
