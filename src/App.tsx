import { useState } from 'react';
import { MotionConfig } from 'motion/react';
import { PantallaLogin } from './components/auth/PantallaLogin';
import { SeccionClientes } from './components/clientes/SeccionClientes';
import { MarcoAplicacion } from './components/layout/MarcoAplicacion';
import { SeccionProductos } from './components/productos/SeccionProductos';
import { SeccionVentas } from './components/ventas/SeccionVentas';
import { AuthProvider, useAuth } from './context/AuthContext';
import type { SeccionActiva } from './types/api';

function ContenidoPrincipal() {
  const { estaAutenticado } = useAuth();
  const [seccionActiva, setSeccionActiva] = useState<SeccionActiva>('productos');

  if (!estaAutenticado) {
    return <PantallaLogin />;
  }

  return (
    <MarcoAplicacion
      seccionActiva={seccionActiva}
      alCambiarSeccion={setSeccionActiva}
    >
      {seccionActiva === 'productos' && <SeccionProductos />}
      {seccionActiva === 'clientes' && <SeccionClientes />}
      {seccionActiva === 'ventas' && <SeccionVentas />}
    </MarcoAplicacion>
  );
}

/**
 * Componente raíz de Punto Norte Market.
 */
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <ContenidoPrincipal />
      </AuthProvider>
    </MotionConfig>
  );
}
