import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Timestamp } from 'firebase/firestore';

import { ParqueoService } from '../servicios/parqueo.service';
import { Vehiculo } from '../modelos/vehiculo.model';
import { TipoVehiculo, colorVehiculo, tipoDe } from '../modelos/tipo-vehiculo';
import { VehiculoIcono } from '../vehiculo-icono/vehiculo-icono';

type SesionAbierta = NonNullable<
  Awaited<ReturnType<ParqueoService['buscarSesionAbierta']>>
>;

interface FilaSalida {
  plaza: string;
  placa: string;
  tipoUsuario: string;
  tipoVehiculo: TipoVehiculo;
  color: string;
}

@Component({
  selector: 'app-salida',
  imports: [CommonModule, FormsModule, RouterLink, VehiculoIcono],
  templateUrl: './salida.html',
  styleUrl: './salida.css'
})
export class Salida implements OnInit {
  filas: FilaSalida[] = [];
  filtro = '';

  seleccionada: FilaSalida | null = null;
  sesion: SesionAbierta | null = null;

  // Datos del ticket
  entrada = '';
  tiempo = '';
  total = 0;

  cargando = false;
  procesando = false;
  mensaje = '';
  tipoMensaje: 'exito' | 'error' | '' = '';

  constructor(
    private parqueoService: ParqueoService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargarOcupadas();

    // Si llegas desde el mapa, el vehículo ya viene seleccionado.
    const params = this.route.snapshot.queryParamMap;
    const plaza = params.get('plaza');
    const placa = params.get('placa');

    const fila = this.filas.find(
      f => (placa && f.placa === placa.toUpperCase()) || (plaza && f.plaza === plaza)
    );

    if (fila) {
      await this.seleccionar(fila);
    } else if (plaza || placa) {
      this.mostrar('Esa plaza ya no tiene un vehículo dentro.', 'error');
    }
  }

  get filasFiltradas(): FilaSalida[] {
    const texto = this.filtro.trim().toLowerCase();

    return texto
      ? this.filas.filter(
          f =>
            f.placa.toLowerCase().includes(texto) ||
            f.plaza.toLowerCase().includes(texto)
        )
      : this.filas;
  }

  async cargarOcupadas(): Promise<void> {
    this.cargando = true;

    try {
      const [plazas, vehiculos] = await Promise.all([
        this.parqueoService.listarPlazas(),
        this.parqueoService.listarVehiculos()
      ]);

      const porId = new Map<string, Vehiculo>();
      vehiculos.forEach(v => v.id && porId.set(v.id, v));

      this.filas = plazas
        .filter(p => p.estado === 'Ocupada' && !!p.placa)
        .map(p => {
          const v = p.vehiculoId ? porId.get(p.vehiculoId) : undefined;
          const placa = (p.placa ?? '').toUpperCase();

          return {
            plaza: p.id,
            placa,
            tipoUsuario: v?.tipoUsuario ?? '',
            tipoVehiculo: tipoDe(v ?? {}),
            color: colorVehiculo(v?.color, placa)
          };
        });
    } catch (error) {
      console.error('Error al cargar vehículos dentro:', error);
      this.mostrar('No fue posible consultar los vehículos.', 'error');
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  async seleccionar(fila: FilaSalida): Promise<void> {
    this.mensaje = '';
    this.tipoMensaje = '';
    this.seleccionada = fila;
    this.sesion = null;

    try {
      const sesion = await this.parqueoService.buscarSesionAbierta(fila.placa);

      if (!sesion) {
        this.seleccionada = null;
        this.mostrar('Este vehículo no tiene una entrada abierta.', 'error');
        return;
      }

      this.sesion = sesion;
      this.calcularTicket();
    } catch (error) {
      console.error('Error al buscar sesión:', error);
      this.seleccionada = null;
      this.mostrar('No fue posible consultar la entrada del vehículo.', 'error');
    } finally {
      this.cdr.markForCheck();
    }
  }

  cancelar(): void {
    this.seleccionada = null;
    this.sesion = null;
  }

  private calcularTicket(): void {
    if (!this.sesion) return;

    const ahora = Timestamp.now();
    const fechaEntrada = this.sesion.fechaEntrada;
    const minutos = Math.max(
      0,
      Math.round((ahora.toMillis() - fechaEntrada.toMillis()) / 60000)
    );

    this.entrada = fechaEntrada.toDate().toLocaleTimeString('es-SV', {
      hour: '2-digit',
      minute: '2-digit'
    });

    this.tiempo =
      minutos >= 60
        ? `${Math.floor(minutos / 60)} h ${minutos % 60} min`
        : `${minutos} min`;

    this.total = this.parqueoService.calcularCobro(
      this.sesion.tipoUsuario,
      fechaEntrada,
      ahora
    );
  }

  async cobrarYRegistrar(): Promise<void> {
    if (!this.sesion || !this.seleccionada || this.procesando) return;

    this.procesando = true;
    this.cdr.markForCheck();

    const { placa, plaza } = this.seleccionada;

    try {
      const monto = await this.parqueoService.registrarSalida(this.sesion);

      this.mostrar(
        monto > 0
          ? `Salida registrada: ${placa} (plaza ${plaza}). Cobrado: $${monto.toFixed(2)}.`
          : `Salida registrada: ${placa} (plaza ${plaza}). Sin cobro.`,
        'exito'
      );

      this.seleccionada = null;
      this.sesion = null;
      await this.cargarOcupadas();
    } catch (error) {
      console.error('Error al registrar salida:', error);
      this.mostrar('No fue posible registrar la salida.', 'error');
    } finally {
      this.procesando = false;
      this.cdr.markForCheck();
    }
  }

  private mostrar(texto: string, tipo: 'exito' | 'error'): void {
    this.mensaje = texto;
    this.tipoMensaje = tipo;
    this.cdr.markForCheck();
  }
}