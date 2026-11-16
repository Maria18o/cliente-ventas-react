import { useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ErrorApi } from '../../services/apiClient';
import type { Producto, ProductoPayload } from '../../types/api';
import { AlertaMensaje } from '../ui/AlertaMensaje';
import { Boton } from '../ui/Boton';
import { ModalBase } from '../ui/ModalBase';

interface ModalProductoProps {
  productoInicial: Producto | null;
  alCerrar: () => void;
  alGuardarExito: (producto: Producto, esEdicion: boolean) => void;
}

/**
 * Modal para crear o editar un producto en /api/productos/.
 */
export function ModalProducto({
  productoInicial,
  alCerrar,
  alGuardarExito,
}: ModalProductoProps) {
  const { api } = useAuth();
  const esEdicion = Boolean(productoInicial);

  const [nombre, setNombre] = useState(productoInicial?.nombre ?? '');
  const [sku, setSku] = useState(productoInicial?.sku ?? '');
  const [precio, setPrecio] = useState(
    productoInicial ? String(productoInicial.precio) : ''
  );
  const [stock, setStock] = useState(
    productoInicial ? String(productoInicial.stock) : '0'
  );
  const [activo, setActivo] = useState(productoInicial?.activo ?? true);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const manejarEnvio = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setError(null);

    const nombreLimpio = nombre.trim();
    const skuLimpio = sku.trim();
    const precioNumero = Number(precio);
    const stockNumero = Number(stock);

    if (!nombreLimpio || !skuLimpio) {
      setError('El nombre y el SKU del producto son obligatorios.');
      return;
    }

    if (Number.isNaN(precioNumero) || precioNumero < 0) {
      setError('Ingresa un precio válido mayor o igual a cero.');
      return;
    }

    if (!Number.isInteger(stockNumero) || stockNumero < 0) {
      setError('El stock debe ser un número entero mayor o igual a cero.');
      return;
    }

    const payload: ProductoPayload = {
      nombre: nombreLimpio,
      sku: skuLimpio,
      precio: precioNumero.toFixed(2),
      stock: stockNumero,
      activo,
    };

    setGuardando(true);
    try {
      const resultado = esEdicion && productoInicial
        ? await api.put<Producto>(`/api/productos/${productoInicial.id}/`, payload)
        : await api.post<Producto>('/api/productos/', payload);

      alGuardarExito(resultado, esEdicion);
    } catch (err) {
      if (err instanceof ErrorApi) {
        setError(err.message);
      } else {
        setError('No se pudo guardar el producto.');
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ModalBase
      titulo={esEdicion ? 'Editar producto' : 'Nuevo producto'}
      subtitulo={
        esEdicion
          ? 'Actualiza los datos o existencias del artículo.'
          : 'Registra un artículo en el catálogo de la tienda.'
      }
      alCerrar={alCerrar}
      anchoMaximo="md"
    >
      <form onSubmit={manejarEnvio} className="space-y-4" noValidate>
        {error && <AlertaMensaje mensaje={error} alCerrar={() => setError(null)} />}

        <div>
          <label
            htmlFor="producto-nombre"
            className="block text-sm font-medium text-tinta mb-1.5"
          >
            Nombre
          </label>
          <input
            id="producto-nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Café molido artesanal 250g"
            disabled={guardando}
            className="w-full min-h-11 rounded-xl border border-lineas bg-blanco-rosado px-3.5 py-2 text-sm text-tinta placeholder:text-texto-suave/70 focus:border-morado focus:outline-none focus:ring-2 focus:ring-lila/60"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="producto-sku"
              className="block text-sm font-medium text-tinta mb-1.5"
            >
              SKU
            </label>
            <input
              id="producto-sku"
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Ej. CAF-250"
              disabled={guardando}
              className="w-full min-h-11 rounded-xl border border-lineas bg-blanco-rosado px-3.5 py-2 text-sm text-tinta placeholder:text-texto-suave/70 focus:border-morado focus:outline-none focus:ring-2 focus:ring-lila/60"
            />
          </div>

          <div>
            <label
              htmlFor="producto-precio"
              className="block text-sm font-medium text-tinta mb-1.5"
            >
              Precio
            </label>
            <input
              id="producto-precio"
              type="number"
              step="0.01"
              min="0"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="0.00"
              disabled={guardando}
              className="w-full min-h-11 rounded-xl border border-lineas bg-blanco-rosado px-3.5 py-2 text-sm text-tinta cifras-tabulares placeholder:text-texto-suave/70 focus:border-morado focus:outline-none focus:ring-2 focus:ring-lila/60"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label
              htmlFor="producto-stock"
              className="block text-sm font-medium text-tinta mb-1.5"
            >
              Stock disponible
            </label>
            <input
              id="producto-stock"
              type="number"
              step="1"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              disabled={guardando}
              className="w-full min-h-11 rounded-xl border border-lineas bg-blanco-rosado px-3.5 py-2 text-sm text-tinta cifras-tabulares focus:border-morado focus:outline-none focus:ring-2 focus:ring-lila/60"
            />
          </div>

          <label className="flex items-center gap-3 min-h-11 rounded-xl border border-lineas bg-lavanda/40 px-3.5 py-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              disabled={guardando}
              className="h-4 w-4 rounded accent-morado cursor-pointer"
            />
            <span className="text-sm font-medium text-tinta">
              Producto activo
            </span>
          </label>
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
                : 'Crear producto'}
          </Boton>
        </div>
      </form>
    </ModalBase>
  );
}
