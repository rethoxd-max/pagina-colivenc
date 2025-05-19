export interface Producto {
    _id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    imagen: string;
    tallas: string[];
    stock: number;
    categoria: string;
} 