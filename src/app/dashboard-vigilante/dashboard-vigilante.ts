import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { ParqueoService } from '../servicios/parqueo.service';

@Component({
  selector: 'app-dashboard-vigilante',
  imports: [
    CommonModule,
    DatePipe
  ],
  templateUrl: './dashboard-vigilante.html',
  styleUrl: './dashboard-vigilante.css'
})
export class DashboardVigilante implements OnInit {
  vehiculosDentro = signal(0);
  entradasHoy = signal(0);
  salidasHoy = signal(0);
  ingresosHoy = signal(0);
  historial = signal<any[]>([]);
  cargando = signal(false);

  constructor(
    private parqueoService: ParqueoService
  ) {}

  ngOnInit(): void {
    this.cargarInicio();
  }

  async cargarInicio(): Promise<void> {
    this.cargando.set(true);

    try {
      const resumen =
        await this.parqueoService
          .obtenerResumenInicio();

      const movimientos =
        await this.parqueoService
          .listarHistorial();

      this.vehiculosDentro.set(
        resumen.vehiculosDentro
      );
      this.entradasHoy.set(
        resumen.entradasHoy
      );
      this.salidasHoy.set(
        resumen.salidasHoy
      );
      this.ingresosHoy.set(
        resumen.ingresosHoy
      );

      this.historial.set(
        movimientos.slice(0, 5)
      );
    } catch (error) {
      console.error(
        'Error al cargar inicio:',
        error
      );
    } finally {
      this.cargando.set(false);
    }
  }
}