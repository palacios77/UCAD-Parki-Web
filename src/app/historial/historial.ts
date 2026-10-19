import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ParqueoService } from '../servicios/parqueo.service';
import { Paginacion } from '../paginacion/paginacion';
import { VehiculoIcono } from '../vehiculo-icono/vehiculo-icono';
import { TipoVehiculo, colorVehiculo, tipoDe } from '../modelos/tipo-vehiculo';

type Sesion = Awaited<ReturnType<ParqueoService['listarHistorial']>>[number];

@Component({
  selector: 'app-historial',
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    Paginacion,
    VehiculoIcono
  ],
  templateUrl: './historial.html',
  styleUrl: './historial.css',
  styles: [`
    .filtros-historial {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      padding: 0 22px 16px;
    }
    .filtros-historial input,
    .filtros-historial select {
      height: 42px;
      padding: 0 12px;
      font-size: 15px;
      color: #123f6b;
      background: #fff;
      border: 1px solid #c9d3df;
      border-radius: 8px;
      outline: none;
    }
    .filtros-historial input { flex: 1 1 260px; }
    .filtros-fechas {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 12px;
      padding: 0 22px 16px;
    }
    .filtros-fechas label {
      display: block;
      margin-bottom: 4px;
      font-size: 12px;
      color: #6b7a8c;
    }
    .filtros-fechas input[type="date"] {
      height: 38px;
      padding: 0 10px;
      font-size: 14px;
      color: #123f6b;
      background: #fff;
      border: 1px solid #c9d3df;
      border-radius: 8px;
      outline: none;
    }
    .atajos { display: flex; gap: 6px; margin-right: 6px; }
    .atajos button {
      height: 38px;
      padding: 0 14px;
      font-size: 13px;
      font-weight: 600;
      color: #123f6b;
      background: #fff;
      border: 1px solid #c9d3df;
      border-radius: 8px;
      cursor: pointer;
    }
    .atajos button.activo { color: #fff; background: #087fd1; border-color: #087fd1; }
    .total-rango {
      margin-left: auto;
      font-size: 14px;
      color: #536273;
    }
    .total-rango strong { color: #218838; font-size: 17px; }
    .num-ticket {
      font: 700 13px Consolas, "Courier New", monospace;
      color: #087fd1;
    }
    .btn-ticket {
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 600;
      color: #123f6b;
      background: #fff;
      border: 1px solid #c9d3df;
      border-radius: 8px;
      cursor: pointer;
      white-space: nowrap;
    }
    .btn-ticket:hover { color: #087fd1; border-color: #087fd1; }

    .ticket-fondo {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: grid;
      place-items: center;
      padding: 16px;
      background: rgba(7, 32, 56, 0.55);
    }
    .ticket-modal {
      width: 100%;
      max-width: 380px;
      padding: 22px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
    }
    .ticket-cabecera {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 14px;
    }
    .ticket-cabecera .icono-grande {
      flex: none;
      width: 28px;
      height: 50px;
      filter: drop-shadow(0 3px 3px rgba(0, 0, 0, 0.25));
    }
    .ticket-cabecera h3 { margin: 0; font-size: 18px; font-weight: 800; color: #073f73; }
    .ticket-cabecera span { font-size: 13px; color: #6b7a8c; }
    .ticket-papel {
      padding: 16px 18px;
      background: #fffdf6;
      border: 1.5px dashed #9fb0c3;
      border-radius: 6px;
      font-family: Consolas, "Courier New", monospace;
      font-size: 14px;
      color: #1f2d3d;
    }
    .ticket-papel .titulo {
      margin-bottom: 10px;
      text-align: center;
      font-weight: 700;
      letter-spacing: 2px;
    }
    .ticket-papel .linea {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
    }
    .ticket-papel .total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1.5px dashed #9fb0c3;
    }
    .ticket-papel .total strong { font-size: 22px; color: #218838; }
    .btn-cerrar-ticket {
      width: 100%;
      height: 42px;
      margin-top: 16px;
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      background: #087fd1;
      border: 0;
      border-radius: 8px;
      cursor: pointer;
    }
    .placa-con-icono {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .icono-vehiculo {
      flex: none;
      width: 16px;
      height: 30px;
      filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.25));
    }
    .placa-con-icono small {
      display: block;
      font-size: 11px;
      color: #718096;
    }
    .filtros-historial input:focus,
    .filtros-historial select:focus {
      border-color: #087fd1;
      box-shadow: 0 0 0 3px rgba(8, 127, 209, 0.15);
    }
    app-paginacion { display: block; padding: 0 22px 18px; }
  `]
})
export class Historial implements OnInit {
  readonly porPagina = 10;

  historial = signal<Sesion[]>([]);

  /** Tipo y color de cada vehículo, buscados por placa, para dibujar su icono. */
  vehiculosPorPlaca = signal<Map<string, { tipo: TipoVehiculo; color: string }>>(new Map());
  cargando = signal(false);
  error = signal('');

  /** Ticket abierto en la ventana de detalle. */
  ticket = signal<Sesion | null>(null);

  filtro = signal('');
  filtroEstado = signal('');
  desde = signal('');
  hasta = signal('');
  rango = signal<'todo' | 'hoy' | '7dias' | 'personalizado'>('todo');
  pagina = signal(1);

  filtradas = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    const estado = this.filtroEstado();
    const desde = this.desde() ? new Date(this.desde() + 'T00:00:00') : null;
    const hasta = this.hasta() ? new Date(this.hasta() + 'T23:59:59.999') : null;

    return this.historial().filter(s =>
      (!estado || s.estado === estado) &&
      (!desde || (!!s.fechaEntrada && s.fechaEntrada >= desde)) &&
      (!hasta || (!!s.fechaEntrada && s.fechaEntrada <= hasta)) &&
      (!texto ||
        s.placa.toLowerCase().includes(texto) ||
        s.tipoUsuario.toLowerCase().includes(texto) ||
        this.numeroTicket(s).toLowerCase().includes(texto))
    );
  });

  visibles = computed(() => {
    const inicio = (this.pagina() - 1) * this.porPagina;
    return this.filtradas().slice(inicio, inicio + this.porPagina);
  });

  totalCobrado = computed(() =>
    this.filtradas().reduce((suma, s) => suma + (s.monto || 0), 0)
  );

  constructor(
    private parqueoService: ParqueoService
  ) {}

  ngOnInit(): void {
    this.cargarHistorial();
  }

  async cargarHistorial(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');

    try {
      const [historial, vehiculos] = await Promise.all([
        this.parqueoService.listarHistorial(),
        this.parqueoService.listarVehiculos()
      ]);

      this.vehiculosPorPlaca.set(
        new Map(
          vehiculos.map(v => [
            v.placa.toUpperCase(),
            { tipo: tipoDe(v), color: colorVehiculo(v.color, v.placa) }
          ])
        )
      );

      // Más recientes primero
      this.historial.set(
        [...historial].sort(
          (a, b) =>
            (b.fechaEntrada?.getTime() ?? 0) -
            (a.fechaEntrada?.getTime() ?? 0)
        )
      );
    } catch (error) {
      console.error(
        'Error al cargar historial:',
        error
      );
      this.error.set('No fue posible cargar el historial.');
    } finally {
      this.cargando.set(false);
    }
  }

  /** Si el vehículo ya no existe, se muestra como carro gris. */
  vehiculo(placa: string): { tipo: TipoVehiculo; color: string } {
    return (
      this.vehiculosPorPlaca().get(placa.toUpperCase()) ??
      { tipo: 'Carro', color: colorVehiculo('', placa) }
    );
  }

  /** Número de ticket corto, tomado del identificador de la sesión. */
  numeroTicket(sesion: Sesion): string {
    return 'T-' + sesion.id.slice(-6).toUpperCase();
  }

  verTicket(sesion: Sesion): void {
    this.ticket.set(sesion);
  }

  cerrarTicket(): void {
    this.ticket.set(null);
  }

  cambiarFiltro(texto: string): void {
    this.filtro.set(texto);
    this.pagina.set(1);
  }

  /** Atajos de rango: todo, hoy o los últimos 7 días. */
  elegirRango(rango: 'todo' | 'hoy' | '7dias'): void {
    const hoy = new Date();
    const atras = new Date();
    atras.setDate(hoy.getDate() - 6);

    this.rango.set(rango);
    this.desde.set(rango === 'hoy' ? this.fechaISO(hoy) : rango === '7dias' ? this.fechaISO(atras) : '');
    this.hasta.set(rango === 'todo' ? '' : this.fechaISO(hoy));
    this.pagina.set(1);
  }

  cambiarFecha(campo: 'desde' | 'hasta', valor: string): void {
    (campo === 'desde' ? this.desde : this.hasta).set(valor);
    this.rango.set(this.desde() || this.hasta() ? 'personalizado' : 'todo');
    this.pagina.set(1);
  }

  /** yyyy-MM-dd con la fecha local (no UTC). */
  private fechaISO(fecha: Date): string {
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }

  cambiarEstado(estado: string): void {
    this.filtroEstado.set(estado);
    this.pagina.set(1);
  }
}