import { Boton } from './Boton';
import { AlertaMensaje } from './AlertaMensaje';
import { ModalBase } from './ModalBase';

interface ModalConfirmacionProps {
  titulo: string;
  descripcion: string;
  textoConfirmar?: string;
  cargando?: boolean;
  error?: string | null;
  alConfirmar: () => void;
  alCancelar: () => void;
}

/**
 * Diálogo de confirmación para eliminaciones seguras.
 */
export function ModalConfirmacion({
  titulo,
  descripcion,
  textoConfirmar = 'Eliminar',
  cargando = false,
  error,
  alConfirmar,
  alCancelar,
}: ModalConfirmacionProps) {
  return (
    <ModalBase titulo={titulo} alCerrar={alCancelar} anchoMaximo="md">
      <div className="space-y-4">
        <p className="text-sm text-tinta leading-relaxed">{descripcion}</p>

        {error && <AlertaMensaje mensaje={error} />}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Boton
            variante="secundario"
            onClick={alCancelar}
            disabled={cargando}
          >
            Cancelar
          </Boton>
          <Boton
            variante="peligro"
            onClick={alConfirmar}
            cargando={cargando}
          >
            {textoConfirmar}
          </Boton>
        </div>
      </div>
    </ModalBase>
  );
}
