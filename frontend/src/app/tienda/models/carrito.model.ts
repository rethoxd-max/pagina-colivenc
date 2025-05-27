export interface ItemCarrito {
  productoId: string;
  nombre: string;
  precio: number;
  talla: string;
  imagen: string;
  cantidad: number;
}

export interface Carrito {
  items: ItemCarrito[];
  total: number;
} 