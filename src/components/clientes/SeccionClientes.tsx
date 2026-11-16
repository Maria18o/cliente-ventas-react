import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ErrorApi, normalizarLista } from '../../services/apiClient';
import type { Cliente, RespuestaPaginada } from '../../types/api';
import { AlertaMensaje } from '../ui/AlertaMensaje';
import { Boton } from '../ui/Boton';
import { EsqueletoLista } from '../ui/EsqueletoLista';
import { ModalConfirmacion } from '../ui/ModalConfirmacion';
import { ModalCliente } from './ModalCliente';

/**
 * Sección CRUD completa para /api/clientes/.
 */
export function SeccionClientes() {
  const { api } = useAuth();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);

  const [clienteAEliminar, setClienteAEliminar] = useState<Cliente | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  const cargarClientes = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const datos = await api.get<Cliente[] | RespuestaPaginada<Cliente>>(
        '/api/clientes/'
      );
      setClientes(normalizarLista(datos));
    } catch (err) {
      if (err instanceof ErrorApi) {
        setErrorCarga(err.message);
      } else {
        setErrorCarga('No fue posible cargar la lista de clientes.');
      }
    } finally {
      setCargando(false);
    }
  }, [api]);

  useEffect(() => {
    void cargarClientes();
  }, [cargarClientes]);

  const clientesFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return clientes;
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(termino) ||
        c.email.toLowerCase().includes(termino)
    );
  }, [clientes, busqueda]);

  const abrirNuevo = () => {
    setClienteEditando(null);
    setModalAbierto(true);
  };

  const abrirEditar = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setModalAbierto(true);
  };

  const manejarGuardado = (clienteGuardado: Cliente, esEdicion: boolean) => {
    setModalAbierto(false);
    setClienteEditando(null);
    if (esEdicion) {
      setClientes((prev) =>
        prev.map((c) => (c.id === clienteGuardado.id ? clienteGuardado : c))
      );
      setMensajeExito(`Cliente "${clienteGuardado.nombre}" actualizado.`);
    } else {
      setClientes((prev) => [clienteGuardado, ...prev]);
      setMensajeExito(`Cliente "${clienteGuardado.nombre}" registrado.`);
    }
  };

  const confirmarEliminacion = async () => {
    if (!clienteAEliminar) return;
    setEliminando(true);
    setErrorEliminar(null);

    try {
      await api.delete(`/api/clientes/${clienteAEliminar.id}/`);
      setClientes((prev) => prev.filter((c) => c.id !== clienteAEliminar.id));
      setMensajeExito(`Cliente "${clienteAEliminar.nombre}" eliminado.`);
      setClienteAEliminar(null);
    } catch (err) {
      if (err instanceof ErrorApi) {
        setErrorEliminar(err.message);
      } else {
        setErrorEliminar('No se pudo eliminar el cliente.');
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
            Clientes
          </h1>
          <p className="mt-1 text-sm text-texto-suave">
            Gestiona la libreta de clientes frecuentes de tu tienda.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Boton
            variante="secundario"
            onClick={() => void cargarClientes()}
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
            Nuevo cliente
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
              placeholder="Buscar por nombre o correo..."
              aria-label="Buscar clientes"
              className="w-full min-h-10 rounded-xl border border-lineas bg-blanco-rosado pl-10 pr-4 py-2 text-sm text-tinta placeholder:text-texto-suave/70 focus:border-morado focus:outline-none focus:ring-2 focus:ring-lila/60"
            />
          </div>

          {!cargando && (
            <p className="text-xs text-texto-suave cifras-tabulares whitespace-nowrap">
              {clientes.length}{' '}
              {clientes.length === 1 ? 'cliente registrado' : 'clientes registrados'}
            </p>
          )}
        </div>

        {cargando && clientes.length === 0 ? (
          <EsqueletoLista filas={5} columnas={4} />
        ) : clientesFiltrados.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-lavanda text-morado">
              <Users className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="font-titulo text-lg font-semibold text-tinta">
              {clientes.length === 0
                ? 'Aún no tienes clientes registrados'
                : 'Sin coincidencias'}
            </h2>
            <p className="mt-1 text-sm text-texto-suave max-w-sm mx-auto">
              {clientes.length === 0
                ? 'Agrega tus clientes para asignarles ventas rápidamente.'
                : 'No encontramos clientes con ese nombre o correo.'}
            </p>
            {clientes.length === 0 && (
              <div className="mt-5">
                <Boton
                  variante="coral"
                  onClick={abrirNuevo}
                  icono={<Plus className="h-4 w-4" aria-hidden="true" />}
                >
                  Agregar primer cliente
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
                    <th className="py-3.5 px-5 w-20">ID</th>
                    <th className="py-3.5 px-4">Nombre</th>
                    <th className="py-3.5 px-4">Correo electrónico</th>
                    <th className="py-3.5 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lineas/70 text-sm">
                  {clientesFiltrados.map((cliente) => (
                    <tr
                      key={cliente.id}
                      className="hover:bg-lavanda/35 transition-colors"
                    >
                      <td className="py-3.5 px-5 text-texto-suave cifras-tabulares">
                        #{cliente.id}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-tinta">
                        {cliente.nombre}
                      </td>
                      <td className="py-3.5 px-4 text-texto-suave">
                        <span className="inline-flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-morado-medio shrink-0" aria-hidden="true" />
                          <span>{cliente.email}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => abrirEditar(cliente)}
                            aria-label={`Editar ${cliente.nombre}`}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-morado hover:bg-lavanda transition-colors cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setErrorEliminar(null);
                              setClienteAEliminar(cliente);
                            }}
                            aria-label={`Eliminar ${cliente.nombre}`}
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
              {clientesFiltrados.map((cliente) => (
                <div key={cliente.id} className="p-4 space-y-3">
                  <div>
                    <p className="font-medium text-tinta">{cliente.nombre}</p>
                    <p className="mt-0.5 text-xs text-texto-suave break-all">
                      {cliente.email}
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span className="cifras-tabulares">ID #{cliente.id}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => abrirEditar(cliente)}
                      className="min-h-9 inline-flex items-center gap-1.5 rounded-lg border border-lineas px-3 py-1.5 text-xs font-medium text-morado hover:bg-lavanda cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorEliminar(null);
                        setClienteAEliminar(cliente);
                      }}
                      className="min-h-9 inline-flex items-center gap-1.5 rounded-lg border border-coral/40 bg-coral-suave/60 px-3 py-1.5 text-xs font-medium text-morado-oscuro hover:bg-coral-suave cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {modalAbierto && (
        <ModalCliente
          clienteInicial={clienteEditando}
          alCerrar={() => {
            setModalAbierto(false);
            setClienteEditando(null);
          }}
          alGuardarExito={manejarGuardado}
        />
      )}

      {clienteAEliminar && (
        <ModalConfirmacion
          titulo="Eliminar cliente"
          descripcion={`¿Seguro que deseas eliminar a "${clienteAEliminar.nombre}"? Si tiene ventas asociadas, el servidor podría impedir la eliminación.`}
          cargando={eliminando}
          error={errorEliminar}
          alConfirmar={() => void confirmarEliminacion()}
          alCancelar={() => setClienteAEliminar(null)}
        />
      )}
    </motion.section>
  );
}
