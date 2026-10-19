import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ParqueoService } from '../servicios/parqueo.service';
import { Vehiculo } from '../modelos/vehiculo.model';
import {
  TIPOS_VEHICULO,
  TipoVehiculo,
  VehiculoConTipo,
  colorVehiculo,
  tipoDe
} from '../modelos/tipo-vehiculo';
import { VehiculoIcono } from '../vehiculo-icono/vehiculo-icono';
import { Paginacion } from '../paginacion/paginacion';

@Component({
  selector: 'app-vehiculos',
  imports: [
    CommonModule,
    FormsModule,
    VehiculoIcono,
    Paginacion
  ],
  templateUrl: './vehiculos.html',
  styles: [`
.veh-pagina {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px 40px;
  color: #123f6b;
}

.veh-pagina-titulo {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 18px;
}

.veh-pagina-titulo h1 { margin: 0 0 4px; font-size: 26px; font-weight: 800; color: #073f73; }
.veh-pagina-titulo p { margin: 0; font-size: 14px; color: #6b7a8c; }

.veh-btn-actualizar {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
  color: #123f6b;
  background: #fff;
  border: 1px solid #c9d3df;
  border-radius: 8px;
  cursor: pointer;
}

.veh-btn-actualizar:hover:not(:disabled) { border-color: #087fd1; color: #087fd1; }
.veh-btn-actualizar:disabled { opacity: .6; cursor: not-allowed; }

.veh-pagina-mensaje {
  margin-bottom: 14px;
  padding: 12px 14px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
}
.veh-mensaje-exito { background: #e7f6ec; color: #1d6f34; border: 1px solid #b9e2c6; }
.veh-mensaje-error { background: #fdeaea; color: #a52f2f; border: 1px solid #f3c1c1; }

.veh-card {
  padding: 20px;
  background: #fff;
  border: 1px solid #e1e7ef;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(16, 42, 67, 0.05);
}

.veh-filtros { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 16px; }
.veh-campo { display: flex; flex-direction: column; min-width: 180px; }
.veh-campo-buscar { flex: 1 1 260px; }
.veh-campo label { margin-bottom: 6px; font-size: 13px; color: #6b7a8c; }

.veh-campo input,
.veh-campo select {
  height: 42px;
  padding: 0 12px;
  font-size: 15px;
  color: #123f6b;
  background: #fff;
  border: 1px solid #c9d3df;
  border-radius: 8px;
  outline: none;
  box-sizing: border-box;
}

.veh-campo input:focus,
.veh-campo select:focus,
.veh-select-tipo:focus {
  border-color: #087fd1;
  box-shadow: 0 0 0 3px rgba(8, 127, 209, 0.15);
}

.veh-tabla-scroll { overflow-x: auto; }

.veh-tabla { width: 100%; border-collapse: collapse; font-size: 14px; }

.veh-tabla th {
  padding: 10px 12px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #6b7a8c;
  background: #f1f5f9;
  white-space: nowrap;
}

.veh-tabla td {
  padding: 8px 12px;
  border-bottom: 1px solid #edf1f6;
  vertical-align: middle;
}

.veh-tabla tbody tr:hover td { background: #f8fbff; }

.veh-placa { font-family: Consolas, "Courier New", monospace; font-weight: 700; }
.veh-fila-icono { width: 14px; height: 26px; }

.veh-select-tipo {
  height: 34px;
  padding: 0 8px;
  font-size: 14px;
  color: #123f6b;
  background: #fff;
  border: 1px solid #c9d3df;
  border-radius: 8px;
  outline: none;
}

.veh-chip {
  display: inline-block;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 700;
  color: #8a6100;
  background: #fff1cc;
  border-radius: 999px;
}

.veh-estado {
  display: inline-block;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 999px;
}
.veh-estado.veh-dentro { color: #a52f2f; background: #fdeaea; }
.veh-estado.veh-fuera { color: #1d6f34; background: #e7f6ec; }

.veh-vacio { padding: 22px; text-align: center; font-size: 14px; color: #6b7a8c; }

.veh-resumen-total { padding-top: 12px; text-align: right; font-size: 14px; color: #536273; }
.veh-resumen-total strong { color: #218838; }

  `]
})
export class Vehiculos implements OnInit {
  readonly tipos = TIPOS_VEHICULO;
  readonly porPagina = 10;

  vehiculos = signal<VehiculoConTipo[]>([]);
  cargando = signal(false);
  guardandoId = signal('');
  mensaje = signal('');
  tipoMensaje = signal<'exito' | 'error'>('exito');

  filtro = signal('');
  filtroTipo = signal('');
  pagina = signal(1);

  filtrados = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    const tipo = this.filtroTipo();

    return this.vehiculos().filter(v =>
      (!tipo || tipoDe(v) === tipo) &&
      (!texto ||
        [v.placa, v.propietario, v.marca, v.modelo]
          .join(' ')
          .toLowerCase()
          .includes(texto))
    );
  });

  visibles = computed(() => {
    const inicio = (this.pagina() - 1) * this.porPagina;
    return this.filtrados().slice(inicio, inicio + this.porPagina);
  });

  constructor(
    private parqueoService: ParqueoService
  ) {}

  ngOnInit(): void {
    this.cargarVehiculos();
  }

  async cargarVehiculos(): Promise<void> {
    this.cargando.set(true);

    try {
      const lista = await this.parqueoService.listarVehiculos();

      this.vehiculos.set(
        [...lista].sort((a, b) => a.placa.localeCompare(b.placa))
      );
    } catch (error) {
      console.error('Error al cargar vehículos:', error);
      this.mostrar('No fue posible cargar los vehículos.', 'error');
    } finally {
      this.cargando.set(false);
    }
  }

  cambiarFiltro(texto: string): void {
    this.filtro.set(texto);
    this.pagina.set(1);
  }

  cambiarFiltroTipo(tipo: string): void {
    this.filtroTipo.set(tipo);
    this.pagina.set(1);
  }

  tipoDe(v: Vehiculo): TipoVehiculo {
    return tipoDe(v);
  }

  color(v: Vehiculo): string {
    return colorVehiculo(v.color, v.placa);
  }

  async cambiarTipo(v: VehiculoConTipo, tipo: TipoVehiculo): Promise<void> {
    if (!v.id || tipo === tipoDe(v) || this.guardandoId()) return;

    this.guardandoId.set(v.id);

    try {
      await this.parqueoService.actualizarTipoVehiculo(v.id, tipo);

      this.vehiculos.update(lista =>
        lista.map(x => (x.id === v.id ? { ...x, tipoVehiculo: tipo } : x))
      );

      this.mostrar(`Tipo de ${v.placa} actualizado a ${tipo}.`, 'exito');
    } catch (error) {
      console.error('Error al actualizar tipo:', error);

      const codigo = (error as { code?: string }).code ?? '';

      this.mostrar(
        codigo === 'permission-denied'
          ? 'Firestore no permite modificar el tipo: hay que permitir el campo tipoVehiculo en las reglas de la colección vehiculos.'
          : `No fue posible actualizar el tipo de vehículo${codigo ? ' (' + codigo + ')' : ''}.`,
        'error'
      );
    } finally {
      this.guardandoId.set('');
    }
  }

  private mostrar(texto: string, tipo: 'exito' | 'error'): void {
    this.mensaje.set(texto);
    this.tipoMensaje.set(tipo);
  }
}