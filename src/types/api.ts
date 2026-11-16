/**
 * Tipos de datos para los recursos de la API REST de Punto Norte Market.
 */

export interface TokensJWT {
  access: string;
  refresh: string;
}

export interface CredencialesLogin {
  username: string;
  password: string;
}

export interface Producto {
  id: number;
  nombre: string;
  sku: string;
  precio: string | number;
  stock: number;
  activo: boolean;
}

export interface ProductoPayload {
  nombre: string;
  sku: string;
  precio: number | string;
  stock: number;
  activo: boolean;
}

export interface Cliente {
  id: number;
  nombre: string;
  email: string;
}

export interface ClientePayload {
  nombre: string;
  email: string;
}

export interface ProductoResumen {
  id: number;
  nombre: string;
  sku?: string;
  precio?: string | number;
}

export interface ClienteResumen {
  id: number;
  nombre: string;
  email?: string;
}

export interface DetalleVenta {
  id: number;
  venta: number;
  producto: number | ProductoResumen;
  cantidad: number;
  precio_unitario: string | number;
  subtotal: string | number;
}

export interface DetalleVentaPayload {
  venta: number;
  producto: number;
  cantidad: number;
  precio_unitario: number | string;
}

export interface Venta {
  id: number;
  cliente: number | ClienteResumen;
  fecha: string;
  detalles?: Array<DetalleVenta | number>;
  total: string | number;
}

export interface VentaPayload {
  cliente: number;
  fecha?: string;
}

/**
 * Respuesta opcional paginada de Django REST Framework.
 */
export interface RespuestaPaginada<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type SeccionActiva = 'productos' | 'clientes' | 'ventas';
