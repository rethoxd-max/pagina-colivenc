import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TiendaService } from '../../../tienda/services/tienda.service';
import { Producto } from '../../../tienda/models/producto.model';

@Component({
  selector: 'app-tienda-preview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tienda-preview.component.html',
  styleUrls: ['./tienda-preview.component.css']
})
export class TiendaPreviewComponent implements OnInit {
  productos: Producto[] = [];

  constructor(private tiendaService: TiendaService) {}

  ngOnInit(): void {
    this.tiendaService.getProductos().subscribe(
      (data: Producto[]) => {
        this.productos = data.slice(0, 4);
      },
      (error) => {
        console.error('Error al cargar productos:', error);
      }
    );
  }

  getImagenUrl(imagen: string): string {
    return this.tiendaService.getImagenUrl(imagen);
  }
}
