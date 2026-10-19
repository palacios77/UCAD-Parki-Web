import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ParqueoService, PlazaDisponible } from '../servicios/parqueo.service';
import { Vehiculo } from '../modelos/vehiculo.model';
import { TipoVehiculo, colorVehiculo, tipoDe } from '../modelos/tipo-vehiculo';
import { VehiculoIcono } from '../vehiculo-icono/vehiculo-icono';

const RUTA_ENTRADA = '/dashboard/vigilante/entrada';
const RUTA_SALIDA = '/dashboard/vigilante/salida';

const PLAZAS_POR_FILA = 10;
const CIRCUNFERENCIA = 2 * Math.PI * 26;

interface PlazaMapa {
  id: string;
  estado: 'libre' | 'ocupada' | 'sin-verificar';
  placa: string;
  color: string;
  tipo: TipoVehiculo;
  propietario: string;
  tipoUsuario: string;
  desde: string;
  tiempo: string;
}

interface FilaMapa {
  indice: number;
  plazas: PlazaMapa[];
}

@Component({
  selector: 'app-dashboard-vigilante',
  imports: [
    CommonModule,
    VehiculoIcono
  ],
  templateUrl: './dashboard-vigilante.html',
  styleUrl: './dashboard-vigilante.css'
})
export class DashboardVigilante implements OnInit {
  plazas = signal<PlazaMapa[]>([]);
  cargando = signal(false);

  plazasLibres = computed(
    () => this.plazas().filter(p => p.estado === 'libre').length
  );
  plazasOcupadas = computed(
    () => this.plazas().filter(p => p.estado === 'ocupada').length
  );
  plazasSinVerificar = computed(
    () => this.plazas().filter(p => p.estado === 'sin-verificar').length
  );
  porcentajeOcupacion = computed(() => {
    const total = this.plazas().length;

    return total > 0
      ? Math.round((this.plazasOcupadas() / total) * 100)
      : 0;
  });

  /** Longitud del arco del anillo de ocupación. */
  arcoOcupacion = computed(
    () => (this.porcentajeOcupacion() / 100) * CIRCUNFERENCIA
  );
  readonly circunferencia = CIRCUNFERENCIA;

  /** Las plazas agrupadas en filas; entre pares de filas se dibuja un carril. */
  filas = computed<FilaMapa[]>(() => {
    const todas = this.plazas();
    const filas: FilaMapa[] = [];

    for (let i = 0; i < todas.length; i += PLAZAS_POR_FILA) {
      filas.push({
        indice: filas.length,
        plazas: todas.slice(i, i + PLAZAS_POR_FILA)
      });
    }

    return filas;
  });

  constructor(
    private parqueoService: ParqueoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarInicio();
  }

  async cargarInicio(): Promise<void> {
    this.cargando.set(true);

    try {
      const [plazas, vehiculos] = await Promise.all([
        this.parqueoService.listarPlazas(),
        this.parqueoService.listarVehiculos()
      ]);

      this.plazas.set(this.armarMapa(plazas, vehiculos));
    } catch (error) {
      console.error('Error al cargar inicio:', error);
    } finally {
      this.cargando.set(false);
    }
  }

  /**
   * Plaza libre → pantalla Entrada con esa plaza ya asignada.
   * Plaza ocupada → pantalla Salida con ese vehículo ya seleccionado.
   */
  abrirPlaza(plaza: PlazaMapa): void {
    if (plaza.estado === 'sin-verificar') {
      return;
    }

    if (plaza.estado === 'libre') {
      void this.router.navigate([RUTA_ENTRADA], {
        queryParams: { plaza: plaza.id }
      });
    } else {
      void this.router.navigate([RUTA_SALIDA], {
        queryParams: { plaza: plaza.id, placa: plaza.placa }
      });
    }
  }

  private armarMapa(plazas: PlazaDisponible[], vehiculos: Vehiculo[]): PlazaMapa[] {
    const porId = new Map<string, Vehiculo>();
    vehiculos.forEach(v => {
      if (v.id) {
        porId.set(v.id, v);
      }
    });

    return plazas.map(plaza => {
      const placa = plaza.placa ?? '';
      const vehiculo = plaza.vehiculoId ? porId.get(plaza.vehiculoId) : undefined;

      const estado: PlazaMapa['estado'] =
        plaza.estado === 'Libre' ? 'libre'
          : plaza.estado === 'Ocupada' ? 'ocupada'
            : 'sin-verificar';

      const desde = plaza.fechaAsignacion?.toDate() ?? null;

      return {
        id: plaza.id,
        estado,
        placa,
        color: colorVehiculo(vehiculo?.color, placa),
        tipo: tipoDe(vehiculo ?? {}),
        propietario: vehiculo?.propietario ?? '',
        tipoUsuario: vehiculo?.tipoUsuario ?? '',
        desde: desde
          ? desde.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })
          : '',
        tiempo: desde ? this.formatearTiempo(desde) : ''
      };
    });
  }

  private formatearTiempo(desde: Date): string {
    const minutos = Math.max(0, Math.round((Date.now() - desde.getTime()) / 60000));

    if (minutos < 60) {
      return `${minutos} min`;
    }

    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;

    return resto ? `${horas} h ${resto} min` : `${horas} h`;
  }
}