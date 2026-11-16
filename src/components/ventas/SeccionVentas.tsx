import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Eye,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ErrorApi, normalizarLista } from '../../services/apiClient';
import type {
  Cliente,
  Producto,
  RespuestaPaginada,
  Venta,
} from '../../types/api';
import { formatearFecha, formatearMoneda } from '../../utils/formato';
import { AlertaMensaje } from '../ui/AlertaMensaje';
import { Boton } from '../ui/Boton';
import { EsqueletoLista } from '../ui/EsqueletoLista';
import { ModalConfirmacion } from '../ui/ModalConfirmacion';
import { ModalDetalleVenta } from './ModalDetalleVenta';
import { ModalNuevaVenta } from './ModalNuevaVenta';

/**
 * Sección CRUD completa para /api/ventas/ y sus detalles en /api/detalles-venta/.
 */
export function SeccionVentas() {
  const { api } = useAuth();

  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [modalNuevaAbierto, setModalNuevaAbierto] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(null);

  const [ventaAEliminar, setVentaAEliminar] = useState<Venta | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  const cargarTodo = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const [resVentas, resClientes, resProductos] = await Promise.all([
        api.get<Venta[] | RespuestaPaginada<Venta>>('/api/ventas/'),
        api.get<Cliente[] | RespuestaPaginada<Cliente>>('/api/clientes/'),
        api.get<Producto[] | RespuestaPaginada<Producto>>('/api/productos/'),
      ]);

      setVentas(normalizarLista(resVentas));
      setClientes(normalizarLista(resClientes));
      setProductos(normalizarLista(resProductos));
    } catch (err) {
      if (err instanceof ErrorApi) {
        setErrorCarga(err.message);
      } else {
        setErrorCarga('No fue posible cargar las ventas.');
      }
    } finally {
      setCargando(false);
    }
  }, [api]);

  useEffect(() => {
    void cargarTodo();
  }, [cargarTodo]);

  const resolverNombreCliente = useCallback(
    (venta: Venta): string => {
      if (typeof venta.cliente === 'object' && venta.cliente !== null) {
        return venta.cliente.nombre;
      }
      const encontrado = clientes.find((c) => c.id === venta.cliente);
      return encontrado ? encontrado.nombre : `Cliente #${venta.cliente}`;
    },
    [clientes]
  );

  const ventasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return ventas;

    return ventas.filter((venta) => {
      const nombreCliente = resolverNombreCliente(venta).toLowerCase();
      return (
        String(venta.id).includes(termino) ||
        nombreCliente.includes(termino)
      );
    });
  }, [ventas, busqueda, resolverNombreCliente]);

  const totalAcumulado = useMemo(
    () =>
      ventas.reduce((suma, venta) => suma + (Number(venta.total) || 0), 0),
    [ventas]
  );

  const confirmarEliminacion = async () => {
    if (!ventaAEliminar) return;
    setEliminando(true);
    setErrorEliminar(null);

    try {
      await api.delete(`/api/ventas/${ventaAEliminar.id}/`);
      setVentas((prev) => prev.filter((v) => v.id !== ventaAEliminar.id));
      setMensajeExito(`Venta #${ventaAEliminar.id} eliminada.`);
      setVentaAEliminar(null);
    } catch (err) {
      if (err instanceof ErrorApi) {
        setErrorEliminar(err.message);
      } else {
        setErrorEliminar('No se pudo eliminar la venta.');
      }
    } finally {
      setEliminando(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-titulo text-2xl sm:text-3xl font-semibold text-tinta">
            Ventas
          </h1>
          <p className="mt-1 text-sm text-texto-suave">
            Registra ventas, consulta montos y edita sus artículos en detalle.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Boton
            variante="secundario"
            onClick={() => void cargarTodo()}
            cargando={cargando}
            icono={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
          >
            Actualizar
          </Boton>
          <Boton
            variante="coral"
            onClick={() => setModalNuevaAbierto(true)}
            icono={<Plus className="h-4 w-4" aria-hidden="true" />}
          >
            Nueva venta
          </Boton>
        </div>
      </div>

      {errorCarga && (
        <AlertaMensaje
          mensaje={errorCarga}
          alCerrar={() => setErrorCarga(null)}
        />
      )}

      {mensajeExito && (
        <AlertaMensaje
          tipo="exito"
          mensaje={mensajeExito}
          alCerrar={() => setMensajeExito(null)}
        />
      )}

      <div className="rounded-2xl bg-blanco-rosado border border-lineas shadow-[var(--shadow-tarjeta)] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-lineas flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-texto-suave"
              aria-hidden="true"
            />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por número de venta o cliente..."
              aria-label="Buscar ventas"
              className="w-full min-h-10 rounded-xl border border-lineas bg-blanco-rosado pl-10 pr-4 py-2 text-sm text-tinta placeholder:text-texto-suave/70 focus:border-morado focus:outline-none focus:ring-2 focus:ring-lila/60"
            />
          </div>

          {!cargando && (
            <p className="text-xs text-texto-suave cifras-tabulares whitespace-nowrap">
              <span>{ventas.length} ventas</span>
              <span className="mx-1.5" aria-hidden="true">·</span>
              <span>
                Total acumulado{' '}
                <strong className="text-tinta">
                  {formatearMoneda(totalAcumulado)}
                </strong>
              </span>
            </p>
          )}
        </div>

        {cargando && ventas.length === 0 ? (
          <EsqueletoLista filas={5} columnas={5} />
        ) : ventasFiltradas.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-lavanda text-morado">
              <ReceiptText className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="font-titulo text-lg font-semibold text-tinta">
              {ventas.length === 0
                ? 'Aún no hay ventas registradas'
                : 'Sin coincidencias'}
            </h2>
            <p className="mt-1 text-sm text-texto-suave max-w-sm mx-auto">
              {ventas.length === 0
                ? 'Registra la primera venta seleccionando un cliente y sus productos.'
                : 'No encontramos ventas para esa búsqueda.'}
            </p>
            {ventas.length === 0 && (
              <div className="mt-5">
                <Boton
                  variante="coral"
                  onClick={() => setModalNuevaAbierto(true)}
                  icono={<Plus className="h-4 w-4" aria-hidden="true" />}
                >
                  Registrar primera venta
                </Boton>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Tabla en escritorio */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-lineas bg-lavanda/45 text-xs font-semibold text-texto-suave">
                    <th className="py-3.5 px-5 w-24">Venta</th>
                    <th className="py-3.5 px-4">Cliente</th>
                    <th className="py-3.5 px-4">Fecha</th>
                    <th className="py-3.5 px-4 text-right">Artículos</th>
                    <th className="py-3.5 px-4 text-right">Total</th>
                    <th className="py-3.5 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lineas/70 text-sm">
                  {ventasFiltradas.map((venta) => {
                    const cantidadDetalles = Array.isArray(venta.detalles)
                      ? venta.detalles.length
                      : 0;

                    return (
                      <tr
                        key={venta.id}
                        className="hover:bg-lavanda/35 transition-colors"
                      >
                        <td className="py-3.5 px-5 font-medium text-morado cifras-tabulares">
                          #{venta.id}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-tinta">
                          {resolverNombreCliente(venta)}
                        </td>
                        <td className="py-3.5 px-4 text-texto-suave cifras-tabulares">
                          {formatearFecha(venta.fecha)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-texto-suave cifras-tabulares">
                          {cantidadDetalles}{' '}
                          {cantidadDetalles === 1 ? 'línea' : 'líneas'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-tinta cifras-tabulares">
                          {formatearMoneda(venta.total)}
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setVentaSeleccionada(venta)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-morado hover:bg-lavanda transition-colors cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Ver y editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setErrorEliminar(null);
                                setVentaAEliminar(venta);
                              }}
                              aria-label={`Eliminar venta #${venta.id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-morado-oscuro hover:bg-coral-suave transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Tarjetas en móvil */}
            <div className="md:hidden divide-y divide-lineas/70">
              {ventasFiltradas.map((venta) => {
                const cantidadDetalles = Array.isArray(venta.detalles)
                  ? venta.detalles.length
                  : 0;

                return (
                  <div key={venta.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-tinta truncate">
                          Venta #{venta.id} · {resolverNombreCliente(venta)}
                        </p>
                        <p className="mt-0.5 text-xs text-texto-suave cifras-tabulares">
                          {formatearFecha(venta.fecha)}
                          <span className="mx-1.5" aria-hidden="true">·</span>
                          {cantidadDetalles}{' '}
                          {cantidadDetalles === 1 ? 'línea' : 'líneas'}
                        </p>
                      </div>
                      <p className="font-semibold text-tinta cifras-tabulares shrink-0">
                        {formatearMoneda(venta.total)}
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setVentaSeleccionada(venta)}
                        className="min-h-9 inline-flex items-center gap-1.5 rounded-lg border border-lineas px-3 py-1.5 text-xs font-medium text-morado hover:bg-lavanda cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Ver y editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorEliminar(null);
                          setVentaAEliminar(venta);
                        }}
                        className="min-h-9 inline-flex items-center gap-1.5 rounded-lg border border-coral/40 bg-coral-suave/60 px-3 py-1.5 text-xs font-medium text-morado-oscuro hover:bg-coral-suave cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {modalNuevaAbierto && (
        <ModalNuevaVenta
          clientes={clientes}
          productos={productos}
          alCerrar={() => setModalNuevaAbierto(false)}
          alVentaCreada={(ventaId) => {
            setModalNuevaAbierto(false);
            setMensajeExito(`Venta #${ventaId} registrada correctamente.`);
            void cargarTodo();
          }}
        />
      )}

      {ventaSeleccionada && (
        <ModalDetalleVenta
          ventaInicial={ventaSeleccionada}
          clientes={clientes}
          productos={productos}
          alCerrar={() => setVentaSeleccionada(null)}
          alSincronizar={() => void cargarTodo()}
        />
      )}

      {ventaAEliminar && (
        <ModalConfirmacion
          titulo="Eliminar venta"
          descripcion={`¿Seguro que deseas eliminar la venta #${ventaAEliminar.id} de ${resolverNombreCliente(ventaAEliminar)}? Esta acción eliminará también sus líneas asociadas.`}
          cargando={eliminando}
          error={errorEliminar}
          alConfirmar={() => void confirmarEliminacion()}
          alCancelar={() => setVentaAEliminar(null)}
        />
      )}
    </motion.section>
  );
}
