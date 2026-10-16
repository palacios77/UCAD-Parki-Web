import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ParqueoService } from '../servicios/parqueo.service';
import { Vehiculo } from '../modelos/vehiculo.model';

@Component({
  selector: 'app-entrada',
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './entrada.html',
  styleUrl: './entrada.css'
})
export class Entrada {

  placa: string = '';

  vehiculoEncontrado: Vehiculo | null = null;

  mostrarFormulario: boolean = false;

  mensaje: string = '';
  tipoMensaje: string = '';

  buscando: boolean = false;
  registrando: boolean = false;

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
    private parqueoService: ParqueoService,
    private cdr: ChangeDetectorRef
  ) {}

  async buscarVehiculo(): Promise<void> {

    if (this.buscando || this.registrando) {
      return;
    }

    this.mensaje = '';
    this.tipoMensaje = '';
    this.vehiculoEncontrado = null;
    this.mostrarFormulario = false;

    const placaBuscada =
      this.placa.trim().toUpperCase();

    if (placaBuscada === '') {
      this.mensaje = 'Ingrese una placa.';
      this.tipoMensaje = 'error';
      return;
    }

    this.placa = placaBuscada;
    this.buscando = true;

    this.cdr.markForCheck();

    try {

      const vehiculo =
        await this.parqueoService
          .buscarVehiculo(placaBuscada);

      if (vehiculo) {

        this.vehiculoEncontrado = vehiculo;

        if (vehiculo.dentro) {

          this.mensaje =
            'El vehículo ya se encuentra dentro del estacionamiento.';

          this.tipoMensaje = 'error';
        }

      } else {

        this.nuevoVehiculo = {
          placa: placaBuscada,
          propietario: '',
          tipoUsuario: '',
          marca: '',
          modelo: '',
          color: '',
          dentro: false
        };

        this.mostrarFormulario = true;
      }

    } catch (error) {

      console.error(
        'Error al buscar vehículo:',
        error
      );

      this.mensaje =
        'No fue posible consultar el vehículo.';

      this.tipoMensaje = 'error';

    } finally {

      this.buscando = false;

      this.cdr.markForCheck();
    }
  }

  async registrarVehiculo(): Promise<void> {

    if (this.registrando) {
      return;
    }

    if (
      this.nuevoVehiculo.propietario.trim() === '' ||
      this.nuevoVehiculo.tipoUsuario === '' ||
      this.nuevoVehiculo.marca.trim() === '' ||
      this.nuevoVehiculo.modelo.trim() === '' ||
      this.nuevoVehiculo.color.trim() === ''
    ) {

      this.mensaje =
        'Complete todos los campos.';

      this.tipoMensaje = 'error';

      return;
    }

    this.registrando = true;

    this.cdr.markForCheck();

    try {

      const id =
        await this.parqueoService
          .registrarVehiculo(
            this.nuevoVehiculo
          );

      this.nuevoVehiculo.id = id;

      this.vehiculoEncontrado =
        this.nuevoVehiculo;

      this.mostrarFormulario = false;

      this.mensaje =
        'Vehículo registrado correctamente.';

      this.tipoMensaje = 'exito';

    } catch (error) {

      console.error(
        'Error al registrar vehículo:',
        error
      );

      this.mensaje =
        'No fue posible registrar el vehículo.';

      this.tipoMensaje = 'error';

    } finally {

      this.registrando = false;

      this.cdr.markForCheck();
    }
  }

  async registrarEntrada(): Promise<void> {

    if (
      !this.vehiculoEncontrado ||
      this.registrando
    ) {
      return;
    }

    if (this.vehiculoEncontrado.dentro) {

      this.mensaje =
        'El vehículo ya se encuentra dentro del estacionamiento.';

      this.tipoMensaje = 'error';

      return;
    }

    this.registrando = true;

    this.mensaje = '';
    this.tipoMensaje = '';

    this.cdr.markForCheck();

    try {

      const resultado =
        await this.parqueoService
          .registrarEntrada(
            this.vehiculoEncontrado
          );

      if (resultado === 'sesion-abierta-existente') {
        this.mensaje =
          'Ya existe una entrada abierta para este vehículo.';

        this.tipoMensaje = 'error';

        return;
      }

      this.vehiculoEncontrado.dentro = true;

      this.mensaje =
        'Entrada registrada correctamente.';

      this.tipoMensaje = 'exito';

    } catch (error) {

      console.error(
        'Error al registrar entrada:',
        error
      );

      this.mensaje =
        'No fue posible registrar la entrada.';

      this.tipoMensaje = 'error';

    } finally {

      this.registrando = false;

      this.cdr.markForCheck();
    }
  }

  cancelarRegistro(): void {

    this.mostrarFormulario = false;
    this.vehiculoEncontrado = null;

    this.mensaje = '';
    this.tipoMensaje = '';

    this.placa = '';

    this.cdr.markForCheck();
  }
}