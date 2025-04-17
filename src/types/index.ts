

// Dispositivo/Producto
export interface Device {
  id: string;
  name: string;
  description: string;
  price: number;
  brand: string;
  type: string;
  image: string;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

// Filtros para los dispositivos
export interface DeviceFilters {
  type: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
  searchTerm: string;
}

// Opciones de filtrado disponibles
export interface FilterOptions {
  types: string[];
  brands: string[];
}

// Item del carrito
export interface CartItem extends Device {
  quantity: number;
}

// Información del cliente
export interface Customer {
  name: string;
  email: string;
  phone: string;
  department?: string;
  comments?: string;
}

// Estado de la reserva
export type ReservationStatus = 'pending' | 'completed';

// Item de reserva
export interface ReservationItem {
  id: string;
  reservationId: string;
  deviceId: string;
  price: number;
  quantity: number;
  device: Device;
}

// Reserva
export interface Reservation {
  id: string;
  code: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerDepartment?: string;
  comments?: string;
  status: ReservationStatus;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  items: ReservationItem[];
}
