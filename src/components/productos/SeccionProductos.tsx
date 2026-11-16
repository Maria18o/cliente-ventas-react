import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ErrorApi, normalizarLista } from '../../services/apiClient';
import type { Producto, RespuestaPaginada } from '../../types/api';
import { formatearMoneda } from '../../utils/formato';
import { AlertaMensaje } from '../ui/AlertaMensaje';
import { Boton } from '../ui/Boton';
import { EsqueletoLista } from '../ui/EsqueletoLista';
import { ModalConfirmacion } from '../ui/ModalConfirmacion';
import { ModalProducto } from './ModalProducto';

type FiltroEstado = 'todos' | 'activos' | 'inactivos';

/**
 * Sección CRUD completa para /api/productos/.
 */
export function SeccionProductos() {
  const { api } = useAuth();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);

  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  const cargarProductos = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const datos = await api.get<Producto[] | RespuestaPaginada<Producto>>(
        '/api/productos/'
      );
      setProductos(normalizarLista(datos));
    } catch (err) {
      if (err instanceof ErrorApi) {
        setErrorCarga(err.message);
      } else {
        setErrorCarga('No fue posible cargar los productos.');
      }
    } finally {
      setCargando(false);
    }
  }, [api]);

  useEffect(() => {
    void cargarProductos();
  }, [cargarProductos]);

  const productosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return productos.filter((producto) => {
      const coincideEstado =
        filtroEstado === 'todos' ||
        (filtroEstado === 'activos' && producto.activo) ||
        (filtroEstado === 'inactivos' && !producto.activo);

      if (!coincideEstado) return false;
      if (!termino) return true;

      return (
        producto.nombre.toLowerCase().includes(termino) ||
        producto.sku.toLowerCase().includes(termino)
      );
    });
  }, [productos, busqueda, filtroEstado]);

  const resumen = useMemo(() => {
    const activos = productos.filter((p) => p.activo).length;
    const sinStock = productos.filter((p) => p.stock <= 0).length;
    return { total: productos.length, activos, sinStock };
  }, [productos]);

  const abrirNuevo = () => {
    setProductoEditando(null);
    setModalAbierto(true);
  };

  const abrirEditar = (producto: Producto) => {
    setProductoEditando(producto);
    setModalAbierto(true);
  };

  const manejarGuardado = (productoGuardado: Producto, esEdicion: boolean) => {
    setModalAbierto(false);
    setProductoEditando(null);
    if (esEdicion) {
      setProductos((prev) =>
        prev.map((p) => (p.id === productoGuardado.id ? productoGuardado : p))
      );
      setMensajeExito(`Producto "${productoGuardado.nombre}" actualizado.`);
    } else {
      setProductos((prev) => [productoGuardado, ...prev]);
      setMensajeExito(`Producto "${productoGuardado.nombre}" creado.`);
    }
  };

  const confirmarEliminacion = async () => {
    if (!productoAEliminar) return;
    setEliminando(true);
    setErrorEliminar(null);

    try {
      await api.delete(`/api/productos/${productoAEliminar.id}/`);
      setProductos((prev) => prev.filter((p) => p.id !== productoAEliminar.id));
      setMensajeExito(`Producto "${productoAEliminar.nombre}" eliminado.`);
      setProductoAEliminar(null);
    } catch (err) {
      if (err instanceof ErrorApi) {
        setErrorEliminar(err.message);
      } else {
        setErrorEliminar('No se pudo eliminar el producto.');
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
      {/* Cabecera de sección */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-titulo text-2xl sm:text-3xl font-semibold text-tinta">
            Productos
          </h1>
          <p className="mt-1 text-sm text-texto-suave">
            Administra el catálogo, precios y existencias disponibles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Boton
            variante="secundario"
            onClick={() => void cargarProductos()}
            cargando={cargando}
            icono={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
          >
            Actualizar
          </Boton>
          <Boton
            variante="coral"
            onClick={abrirNuevo}
            icono={<Plus className="h-4 w-4" aria-hidden="true" />}
          >
            Nuevo producto
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

      {/* Tarjeta principal de catálogo */}
      <div className="rounded-2xl bg-blanco-rosado border border-lineas shadow-[var(--shadow-tarjeta)] overflow-hidden">
        {/* Barra de búsqueda y filtros */}
        <div className="p-4 sm:p-5 border-b border-lineas flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div className="relative flex-1 max-w-md">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-texto-suave"
              aria-hidden="true"
            />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o SKU..."
              aria-label="Buscar productos"
              className="w-full min-h-10 rounded-xl border border-lineas bg-blanco-rosado pl-10 pr-4 py-2 text-sm text-tinta placeholder:text-texto-suave/70 focus:border-morado focus:outline-none focus:ring-2 focus:ring-lila/60"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className="inline-flex items-center gap-1 rounded-xl bg-lavanda p-1 border border-lineas/70"
              role="group"
              aria-label="Filtrar por estado"
            >
              {(
                [
                  { id: 'todos', texto: 'Todos' },
                  { id: 'activos', texto: 'Activos' },
                  { id: 'inactivos', texto: 'Inactivos' },
                ] as const
              ).map((opcion) => (
                <button
                  key={opcion.id}
                  type="button"
                  onClick={() => setFiltroEstado(opcion.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    filtroEstado === opcion.id
                      ? 'bg-blanco-rosado text-tinta shadow-xs'
                      : 'text-texto-suave hover:text-tinta'
                  }`}
                >
                  {opcion.texto}
                </button>
              ))}
            </div>

            {!cargando && (
              <p className="text-xs text-texto-suave cifras-tabulares whitespace-nowrap">
                <span>{resumen.total} en total</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span>{resumen.activos} activos</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span>{resumen.sinStock} sin stock</span>
              </p>
            )}
          </div>
        </div>

        {/* Contenido */}
        {cargando && productos.length === 0 ? (
          <EsqueletoLista filas={5} columnas={5} />
        ) : productosFiltrados.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-lavanda text-morado">
              <Package className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="font-titulo text-lg font-semibold text-tinta">
              {productos.length === 0
                ? 'Aún no hay productos registrados'
                : 'Sin coincidencias'}
            </h2>
            <p className="mt-1 text-sm text-texto-suave max-w-sm mx-auto">
              {productos.length === 0
                ? 'Agrega el primer artículo de tu inventario para comenzar a registrar ventas.'
                : 'Prueba con otro nombre, código SKU o cambia el filtro de estado.'}
            </p>
            {productos.length === 0 && (
              <div className="mt-5">
                <Boton
                  variante="coral"
                  onClick={abrirNuevo}
                  icono={<Plus className="h-4 w-4" aria-hidden="true" />}
                >
                  Agregar primer producto
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
                    <th className="py-3.5 px-5">Producto</th>
                    <th className="py-3.5 px-4">SKU</th>
                    <th className="py-3.5 px-4 text-right">Precio</th>
                    <th className="py-3.5 px-4 text-right">Stock</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lineas/70 text-sm">
                  {productosFiltrados.map((producto) => (
                    <tr
                      key={producto.id}
                      className="hover:bg-lavanda/35 transition-colors"
                    >
                      <td className="py-3.5 px-5 font-medium text-tinta">
                        {producto.nombre}
                      </td>
                      <td className="py-3.5 px-4 text-texto-suave font-mono text-xs">
                        {producto.sku}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-tinta cifras-tabulares">
                        {formatearMoneda(producto.precio)}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-medium cifras-tabulares ${
                          producto.stock <= 0
                            ? 'text-morado-oscuro'
                            : 'text-tinta'
                        }`}
                      >
                        {producto.stock}{' '}
                        <span className="text-xs font-normal text-texto-suave">
                          uds.
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                            producto.activo
                              ? 'text-morado'
                              : 'text-texto-suave'
                          }`}
                        >
                          {producto.activo ? (
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          <span>{producto.activo ? 'Activo' : 'Inactivo'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => abrirEditar(producto)}
                            aria-label={`Editar ${producto.nombre}`}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-morado hover:bg-lavanda transition-colors cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setErrorEliminar(null);
                              setProductoAEliminar(producto);
                            }}
                            aria-label={`Eliminar ${producto.nombre}`}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-morado-oscuro hover:bg-coral-suave transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tarjetas en móvil */}
            <div className="md:hidden divide-y divide-lineas/70">
              {productosFiltrados.map((producto) => (
                <div key={producto.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-tinta truncate">
                        {producto.nombre}
                      </p>
                      <p className="mt-0.5 text-xs text-texto-suave">
                        SKU {producto.sku}
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        {producto.activo ? 'Activo' : 'Inactivo'}
                      </p>
                    </div>
                    <p className="font-semibold text-tinta cifras-tabulares shrink-0">
                      {formatearMoneda(producto.precio)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <span className="text-xs text-texto-suave cifras-tabulares">
                      Stock: <strong className="text-tinta">{producto.stock}</strong> uds.
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => abrirEditar(producto)}
                        className="min-h-9 inline-flex items-center gap-1.5 rounded-lg border border-lineas px-3 py-1.5 text-xs font-medium text-morado hover:bg-lavanda cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorEliminar(null);
                          setProductoAEliminar(producto);
                        }}
                        className="min-h-9 inline-flex items-center gap-1.5 rounded-lg border border-coral/40 bg-coral-suave/60 px-3 py-1.5 text-xs font-medium text-morado-oscuro hover:bg-coral-suave cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {modalAbierto && (
        <ModalProducto
          productoInicial={productoEditando}
          alCerrar={() => {
            setModalAbierto(false);
            setProductoEditando(null);
          }}
          alGuardarExito={manejarGuardado}
        />
      )}

      {productoAEliminar && (
        <ModalConfirmacion
          titulo="Eliminar producto"
          descripcion={`¿Seguro que deseas eliminar "${productoAEliminar.nombre}" (SKU ${productoAEliminar.sku})? Esta acción no se puede deshacer.`}
          cargando={eliminando}
          error={errorEliminar}
          alConfirmar={() => void confirmarEliminacion()}
          alCancelar={() => setProductoAEliminar(null)}
        />
      )}
    </motion.section>
  );
}
