import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { ParqueoService } from '../servicios/parqueo.service';

@Component({
  selector: 'app-historial',
  imports: [
    CommonModule,
    DatePipe
  ],
  templateUrl: './historial.html',
  styleUrl: './historial.css'
})
export class Historial implements OnInit {
  historial = signal<
    Awaited<ReturnType<ParqueoService['listarHistorial']>>
  >([]);
  cargando = signal(false);

  constructor(
    private parqueoService: ParqueoService
  ) {}

  ngOnInit(): void {
    this.cargarHistorial();
  }

  async cargarHistorial(): Promise<void> {
    this.cargando.set(true);

    try {
      const historial =
        await this.parqueoService.listarHistorial();

      this.historial.set(historial);
    } catch (error) {
      console.error(
        'Error al cargar historial:',
        error
      );
    } finally {
      this.cargando.set(false);
    }
  }
}