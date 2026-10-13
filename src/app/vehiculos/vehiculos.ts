import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ParqueoService } from '../servicios/parqueo.service';
import { Vehiculo } from '../modelos/vehiculo.model';

@Component({
  selector: 'app-vehiculos',
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './vehiculos.html',
  styleUrl: './vehiculos.css'
})
export class Vehiculos implements OnInit {
  vehiculos = signal<Vehiculo[]>([]);

  mostrarFormulario = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  mensaje = signal('');
  tipoMensaje = signal('');

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
  }

  async cargarVehiculos(): Promise<void> {
    this.cargando.set(true);
    this.mensaje.set('');

    try {
      const vehiculos =
        await this.parqueoService.listarVehiculos();

      vehiculos.sort((a, b) =>
        a.placa.localeCompare(b.placa)
      );

      this.vehiculos.set(vehiculos);

    } catch (error) {
      console.error(
        'Error al cargar vehículos:',
        error
      );

      this.mensaje.set(
        'No fue posible cargar los vehículos.'
      );

      this.tipoMensaje.set('error');

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

    const placa =
      this.nuevoVehiculo.placa
        .trim()
        .toUpperCase();

    const propietario =
      this.nuevoVehiculo.propietario.trim();

    const tipoUsuario =
      this.nuevoVehiculo.tipoUsuario;

    const marca =
      this.nuevoVehiculo.marca.trim();

    const modelo =
      this.nuevoVehiculo.modelo.trim();

    const color =
      this.nuevoVehiculo.color.trim();

    if (
      placa === '' ||
      propietario === '' ||
      tipoUsuario === '' ||
      marca === '' ||
      modelo === '' ||
      color === ''
    ) {
      this.mensaje.set(
        'Complete todos los campos.'
      );

      this.tipoMensaje.set('error');

      return;
    }

    this.guardando.set(true);
    this.mensaje.set('');

    try {
      const vehiculoExistente =
        await this.parqueoService
          .buscarVehiculo(placa);

      if (vehiculoExistente) {
        this.mensaje.set(
          'El vehículo ya está registrado.'
        );

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

      this.mensaje.set(
        'Vehículo registrado correctamente.'
      );

      this.tipoMensaje.set('exito');

      this.mostrarFormulario.set(false);

      await this.cargarVehiculos();

    } catch (error) {
      console.error(
        'Error al registrar vehículo:',
        error
      );

      this.mensaje.set(
        'No fue posible registrar el vehículo.'
      );

      this.tipoMensaje.set('error');

    } finally {
      this.guardando.set(false);
    }
  }
}