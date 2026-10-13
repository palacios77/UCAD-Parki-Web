import { Component, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Timestamp } from 'firebase/firestore';

import { ParqueoService } from '../servicios/parqueo.service';

@Component({
  selector: 'app-salida',
  imports: [
    CommonModule,
    FormsModule,
    DatePipe
  ],
  templateUrl: './salida.html',
  styleUrl: './salida.css'
})
export class Salida {
  placa: string = '';
  mensaje = signal('');
  tipoMensaje = signal('');
  sesionEncontrada = signal<any | null>(null);
  buscando = signal(false);
  procesandoSalida = signal(false);
  montoCalculado = signal(0);

  constructor(
    private parqueoService: ParqueoService
  ) {}

  async buscarSesion(): Promise<void> {
    if (
      this.buscando() ||
      this.procesandoSalida()
    ) {
      return;
    }

    this.mensaje.set('');
    this.tipoMensaje.set('');
    this.sesionEncontrada.set(null);
    this.montoCalculado.set(0);

    const placaBuscada = this.placa.trim().toUpperCase();

    if (placaBuscada === '') {
      this.mensaje.set(
        'Ingrese una placa.'
      );
      this.tipoMensaje.set('error');
      return;
    }

    this.placa = placaBuscada;
    this.buscando.set(true);

    try {
      const sesion =
        await this.parqueoService
          .buscarSesionAbierta(
            placaBuscada
          );

      if (!sesion) {
        this.mensaje.set(
          'No hay una entrada abierta para esta placa.'
        );
        this.tipoMensaje.set('error');
        return;
      }

      this.sesionEncontrada.set(sesion);

      const fechaSalida =
        Timestamp.now();

      const monto =
        this.parqueoService.calcularCobro(
          sesion.tipoUsuario,
          sesion.fechaEntrada,
          fechaSalida
        );

      this.montoCalculado.set(monto);
    } catch (error) {
      console.error(
        'Error al buscar sesión:',
        error
      );
      this.mensaje.set(
        'No fue posible consultar la salida.'
      );
      this.tipoMensaje.set('error');
    } finally {
      this.buscando.set(false);
    }
  }

  async registrarSalida(): Promise<void> {
    const sesion =
      this.sesionEncontrada();

    if (
      !sesion ||
      this.procesandoSalida()
    ) {
      return;
    }

    this.procesandoSalida.set(true);
    this.mensaje.set('');
    this.tipoMensaje.set('');

    try {
      const monto =
        await this.parqueoService
          .registrarSalida(sesion);

      this.montoCalculado.set(monto);
      this.mensaje.set(
        'Salida registrada correctamente.'
      );
      this.tipoMensaje.set('exito');
      this.sesionEncontrada.set(null);
      this.placa = '';
    } catch (error) {
      console.error(
        'Error al registrar salida:',
        error
      );
      this.mensaje.set(
        'No fue posible registrar la salida.'
      );
      this.tipoMensaje.set('error');
    } finally {
      this.procesandoSalida.set(false);
    }
  }
}