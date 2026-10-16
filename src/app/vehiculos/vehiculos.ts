
import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ParqueoService } from '../servicios/parqueo.service';
import { Vehiculo } from '../modelos/vehiculo.model';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './vehiculos.html',
  styleUrl: './vehiculos.css'
})
export class Vehiculos implements OnInit, OnDestroy {
  vehiculos = signal<Vehiculo[]>([]);

  mostrarFormulario = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  mensaje = signal('');
  tipoMensaje = signal('');

  private intervaloActualizacion?: ReturnType<typeof setInterval>;

  nuevoVehiculo: Vehiculo = {
    placa: '',
    propietario: '',
    tipoUsuario: '',
    marca: '',
    modelo: '',
    color: '',
    dentro: false
  };

  constructor(
    private parqueoService: ParqueoService
  ) {}

  ngOnInit(): void {
    this.cargarVehiculos();

    // Actualiza los estados mientras la pantalla está abierta.
    this.intervaloActualizacion = setInterval(() => {
      if (!this.cargando() && !this.guardando()) {
        this.cargarVehiculos(true);
      }
    }, 10000);
  }

  ngOnDestroy(): void {
    if (this.intervaloActualizacion) {
      clearInterval(this.intervaloActualizacion);
    }
  }

  async cargarVehiculos(silencioso = false): Promise<void> {
    if (this.cargando()) {
      return;
    }

    this.cargando.set(true);

    if (!silencioso) {
      this.mensaje.set('');
    }

    try {
      const lista = await this.parqueoService.listarVehiculos();

      lista.sort((a, b) =>
        a.placa.localeCompare(b.placa)
      );

      this.vehiculos.set(lista);

    } catch (error) {
      console.error('Error al cargar vehículos:', error);

      if (!silencioso) {
        this.mensaje.set(
          'No fue posible cargar los vehículos.'
        );
        this.tipoMensaje.set('error');
      }

    } finally {
      this.cargando.set(false);
    }
  }

  abrirFormulario(): void {
    this.nuevoVehiculo = {
      placa: '',
      propietario: '',
      tipoUsuario: '',
      marca: '',
      modelo: '',
      color: '',
      dentro: false
    };

    this.mensaje.set('');
    this.tipoMensaje.set('');
    this.mostrarFormulario.set(true);
  }

  cerrarFormulario(): void {
    this.mostrarFormulario.set(false);
  }

  async registrarVehiculo(): Promise<void> {
    if (this.guardando()) {
      return;
    }

    const placa = this.nuevoVehiculo.placa.trim().toUpperCase();
    const propietario = this.nuevoVehiculo.propietario.trim();
    const tipoUsuario = this.nuevoVehiculo.tipoUsuario;
    const marca = this.nuevoVehiculo.marca.trim();
    const modelo = this.nuevoVehiculo.modelo.trim();
    const color = this.nuevoVehiculo.color.trim();

    if (
      !placa ||
      !propietario ||
      !tipoUsuario ||
      !marca ||
      !modelo ||
      !color
    ) {
      this.mensaje.set('Complete todos los campos.');
      this.tipoMensaje.set('error');
      return;
    }

    this.guardando.set(true);
    this.mensaje.set('');

    try {
      const existente =
        await this.parqueoService.buscarVehiculo(placa);

      if (existente) {
        this.mensaje.set('El vehículo ya está registrado.');
        this.tipoMensaje.set('error');
        return;
      }

      await this.parqueoService.registrarVehiculo({
        placa,
        propietario,
        tipoUsuario,
        marca,
        modelo,
        color,
        dentro: false
      });

      this.mensaje.set('Vehículo registrado correctamente.');
      this.tipoMensaje.set('exito');
      this.mostrarFormulario.set(false);

      await this.cargarVehiculos();

    } catch (error) {
      console.error('Error al registrar vehículo:', error);

      this.mensaje.set(
        'No fue posible registrar el vehículo. Verifique sus permisos.'
      );
      this.tipoMensaje.set('error');

    } finally {
      this.guardando.set(false);
    }
  }
}
