import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SistemaLayout } from '../layout/sistema-layout';

interface Vehiculo {
  placa: string;
  propietario: string;
  tipoUsuario: string;
  marca: string;
  modelo: string;
  color: string;
  dentro: boolean;
  horaEntrada?: string;
}

@Component({
  selector: 'app-dashboard-vigilante',
  imports: [FormsModule, CommonModule, SistemaLayout],
  templateUrl: './dashboard-vigilante.html',
  styleUrl: './dashboard-vigilante.css'
})
export class DashboardVigilante {

  placa: string = '';

  mostrarResultado: boolean = false;

  mostrarFormulario: boolean = false;

  vehiculoEncontrado: Vehiculo | null = null;

  nuevoVehiculo: Vehiculo = {
    placa: '',
    propietario: '',
    tipoUsuario: '',
    marca: '',
    modelo: '',
    color: '',
    dentro: false
  };


  // Datos temporales para las pruebas
  vehiculos: Vehiculo[] = [
    {
      placa: 'ABC-123',
      propietario: 'Juan Pérez',
      tipoUsuario: 'Estudiante',
      marca: 'Toyota',
      modelo: 'Corolla',
      color: 'Blanco',
      dentro: false
    },
    {
      placa: 'XYZ-456',
      propietario: 'María López',
      tipoUsuario: 'Docente',
      marca: 'Kia',
      modelo: 'Rio',
      color: 'Gris',
      dentro: true,
      horaEntrada: '07:30 AM'
    },
    {
      placa: 'DEF-789',
      propietario: 'Carlos Martínez',
      tipoUsuario: 'Invitado',
      marca: 'Hyundai',
      modelo: 'Accent',
      color: 'Negro',
      dentro: false
    }
  ];


  buscarVehiculo(): void {

    if (this.placa.trim() === '') {
      this.mostrarResultado = false;
      this.mostrarFormulario = false;
      this.vehiculoEncontrado = null;
      return;
    }

    const placaBuscada = this.placa
      .trim()
      .toUpperCase();

    const vehiculo = this.vehiculos.find(
      v => v.placa === placaBuscada
    );

    this.mostrarResultado = true;
    this.mostrarFormulario = false;

    if (vehiculo) {
      this.vehiculoEncontrado = vehiculo;
    } else {
      this.vehiculoEncontrado = null;

      this.nuevoVehiculo.placa = placaBuscada;
    }

  }


  mostrarRegistroVehiculo(): void {

    this.mostrarFormulario = true;

    this.nuevoVehiculo.placa =
      this.placa.trim().toUpperCase();

  }


  cancelarRegistroVehiculo(): void {

    this.mostrarFormulario = false;

  }


  registrarVehiculo(): void {

    if (
      this.nuevoVehiculo.placa === '' ||
      this.nuevoVehiculo.propietario === '' ||
      this.nuevoVehiculo.tipoUsuario === '' ||
      this.nuevoVehiculo.marca === '' ||
      this.nuevoVehiculo.modelo === '' ||
      this.nuevoVehiculo.color === ''
    ) {
      return;
    }


    const vehiculo: Vehiculo = {
      placa: this.nuevoVehiculo.placa
        .trim()
        .toUpperCase(),

      propietario:
        this.nuevoVehiculo.propietario.trim(),

      tipoUsuario:
        this.nuevoVehiculo.tipoUsuario,

      marca:
        this.nuevoVehiculo.marca.trim(),

      modelo:
        this.nuevoVehiculo.modelo.trim(),

      color:
        this.nuevoVehiculo.color.trim(),

      dentro: false
    };


    this.vehiculos.push(vehiculo);

    this.vehiculoEncontrado = vehiculo;

    this.mostrarFormulario = false;

    this.mostrarResultado = true;

    this.placa = vehiculo.placa;

  }


  registrarEntrada(): void {

    if (!this.vehiculoEncontrado) {
      return;
    }

    this.vehiculoEncontrado.dentro = true;

    this.vehiculoEncontrado.horaEntrada =
      new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });

  }


  registrarSalida(): void {

    if (!this.vehiculoEncontrado) {
      return;
    }

    this.vehiculoEncontrado.dentro = false;

    console.log(
      'Salida registrada:',
      this.vehiculoEncontrado.placa
    );

  }

}