import { useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ErrorApi } from '../../services/apiClient';
import type { Cliente, ClientePayload } from '../../types/api';
import { AlertaMensaje } from '../ui/AlertaMensaje';
import { Boton } from '../ui/Boton';
import { ModalBase } from '../ui/ModalBase';

interface ModalClienteProps {
  clienteInicial: Cliente | null;
  alCerrar: () => void;
  alGuardarExito: (cliente: Cliente, esEdicion: boolean) => void;
}

/**
 * Modal para crear o editar un cliente en /api/clientes/.
 */
export function ModalCliente({
  clienteInicial,
  alCerrar,
  alGuardarExito,
}: ModalClienteProps) {
  const { api } = useAuth();
  const esEdicion = Boolean(clienteInicial);

  const [nombre, setNombre] = useState(clienteInicial?.nombre ?? '');
  const [email, setEmail] = useState(clienteInicial?.email ?? '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const manejarEnvio = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setError(null);

    const nombreLimpio = nombre.trim();
    const emailLimpio = email.trim();

    if (!nombreLimpio || !emailLimpio) {
      setError('El nombre y el correo electrónico son obligatorios.');
      return;
    }

    const payload: ClientePayload = {
      nombre: nombreLimpio,
      email: emailLimpio,
    };

    setGuardando(true);
    try {
      const resultado =
        esEdicion && clienteInicial
          ? await api.put<Cliente>(`/api/clientes/${clienteInicial.id}/`, payload)
          : await api.post<Cliente>('/api/clientes/', payload);

      alGuardarExito(resultado, esEdicion);
    } catch (err) {
      if (err instanceof ErrorApi) {
        setError(err.message);
      } else {
        setError('No se pudo guardar el cliente.');
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ModalBase
      titulo={esEdicion ? 'Editar cliente' : 'Nuevo cliente'}
      subtitulo={
        esEdicion
          ? 'Modifica los datos de contacto del cliente.'
          : 'Registra un nuevo cliente para asociarlo a tus ventas.'
      }
      alCerrar={alCerrar}
      anchoMaximo="md"
    >
      <form onSubmit={manejarEnvio} className="space-y-4" noValidate>
        {error && <AlertaMensaje mensaje={error} alCerrar={() => setError(null)} />}

        <div>
          <label
            htmlFor="cliente-nombre"
            className="block text-sm font-medium text-tinta mb-1.5"
          >
            Nombre completo
          </label>
          <input
            id="cliente-nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Camila Morales"
            disabled={guardando}
            className="w-full min-h-11 rounded-xl border border-lineas bg-blanco-rosado px-3.5 py-2 text-sm text-tinta placeholder:text-texto-suave/70 focus:border-morado focus:outline-none focus:ring-2 focus:ring-lila/60"
          />
        </div>

        <div>
          <label
            htmlFor="cliente-email"
            className="block text-sm font-medium text-tinta mb-1.5"
          >
            Correo electrónico
          </label>
          <input
            id="cliente-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="camila@correo.com"
            disabled={guardando}
            className="w-full min-h-11 rounded-xl border border-lineas bg-blanco-rosado px-3.5 py-2 text-sm text-tinta placeholder:text-texto-suave/70 focus:border-morado focus:outline-none focus:ring-2 focus:ring-lila/60"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-lineas">
          <Boton
            variante="secundario"
            onClick={alCerrar}
            disabled={guardando}
          >
            Cancelar
          </Boton>
          <Boton type="submit" variante="coral" cargando={guardando}>
            {guardando
              ? 'Guardando...'
              : esEdicion
                ? 'Guardar cambios'
                : 'Crear cliente'}
          </Boton>
        </div>
      </form>
    </ModalBase>
  );
}
