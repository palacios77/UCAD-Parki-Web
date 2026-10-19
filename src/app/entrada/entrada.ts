import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ParqueoService, PlazaDisponible } from '../servicios/parqueo.service';
import { Vehiculo } from '../modelos/vehiculo.model';
import { TIPOS_VEHICULO, VehiculoConTipo, colorVehiculo, tipoDe } from '../modelos/tipo-vehiculo';
import { VehiculoIcono } from '../vehiculo-icono/vehiculo-icono';

function vehiculoVacio(placa = ''): VehiculoConTipo {
  return {
    placa,
    propietario: '',
    tipoUsuario: '',
    tipoVehiculo: 'Carro',
    marca: '',
    modelo: '',
    color: '',
    dentro: false
  };
}

@Component({
  selector: 'app-entrada',
  imports: [CommonModule, FormsModule, RouterLink, VehiculoIcono],
  templateUrl: './entrada.html',
  styleUrl: './entrada.css'
})
export class Entrada implements OnInit {
  readonly tiposVehiculo = TIPOS_VEHICULO;
  readonly tipoDe = tipoDe;
  readonly colorVehiculo = colorVehiculo;

  placa = '';
  vehiculoEncontrado: Vehiculo | null = null;
  mostrarFormulario = false;

  mensaje = '';
  tipoMensaje = '';

  buscando = false;
  registrando = false;
  cargandoPlazas = false;

  plazasDisponibles: PlazaDisponible[] = [];

  /** Plaza que se usará en la entrada. Se asigna sola: no hay que elegirla. */
  plazaSeleccionada = '';

  /** Plaza elegida en el mapa de Inicio (llega en la URL como ?plaza=P03). */
  plazaPreferida = '';

  nuevoVehiculo: VehiculoConTipo = vehiculoVacio();

  constructor(
    private parqueoService: ParqueoService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.plazaPreferida =
      (this.route.snapshot.queryParamMap.get('plaza') ?? '').trim();

    void this.cargarPlazasDisponibles();
  }

  async cargarPlazasDisponibles(): Promise<void> {
    this.cargandoPlazas = true;

    try {
      this.plazasDisponibles =
        await this.parqueoService.listarPlazasDisponibles();

      this.asignarPlaza();
    } catch (error) {
      console.error('Error al consultar plazas:', error);
      this.plazasDisponibles = [];
      this.plazaSeleccionada = '';
      this.mensaje =
        'No fue posible consultar las plazas. Verifique los permisos de Firestore.';
      this.tipoMensaje = 'error';
    } finally {
      this.cargandoPlazas = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * La plaza del mapa si sigue libre; si no, la primera plaza libre.
   * Las plazas "Sin verificar" nunca se asignan.
   */
  private asignarPlaza(): void {
    const libres = this.plazasDisponibles.map(plaza => plaza.id);

    if (this.plazaSeleccionada && libres.includes(this.plazaSeleccionada)) {
      return;
    }

    let asignada = '';

    if (this.plazaPreferida && libres.includes(this.plazaPreferida)) {
      asignada = this.plazaPreferida;
    } else {
      asignada = libres[0] ?? '';

      if (this.plazaPreferida) {
        this.mensaje = asignada
          ? `La plaza ${this.plazaPreferida} ya no está disponible. Se asignó la plaza ${asignada}.`
          : `La plaza ${this.plazaPreferida} ya no está disponible y no quedan plazas libres.`;
        this.tipoMensaje = 'error';
        this.plazaPreferida = '';
      }
    }

    if (!asignada && !this.mensaje) {
      this.mensaje = 'No hay plazas libres en este momento.';
      this.tipoMensaje = 'error';
    }

    this.plazaSeleccionada = asignada;
  }

  async buscarVehiculo(): Promise<void> {
    if (this.buscando || this.registrando) return;

    this.mensaje = '';
    this.tipoMensaje = '';
    this.vehiculoEncontrado = null;
    this.mostrarFormulario = false;

    const placaBuscada = this.placa.trim().toUpperCase();

    if (!placaBuscada) {
      this.mensaje = 'Ingrese una placa.';
      this.tipoMensaje = 'error';
      return;
    }

    this.placa = placaBuscada;
    this.buscando = true;
    this.cdr.markForCheck();

    try {
      const vehiculo =
        await this.parqueoService.buscarVehiculo(placaBuscada);

      if (vehiculo) {
        this.vehiculoEncontrado = vehiculo;

        if (vehiculo.dentro) {
          this.mensaje =
            'El vehículo ya se encuentra dentro del estacionamiento.';
          this.tipoMensaje = 'error';
        } else {
          await this.cargarPlazasDisponibles();
        }
      } else {
        this.nuevoVehiculo = vehiculoVacio(placaBuscada);
        this.mostrarFormulario = true;
      }
    } catch (error) {
      console.error('Error al buscar vehículo:', error);
      this.mensaje = 'No fue posible consultar el vehículo.';
      this.tipoMensaje = 'error';
    } finally {
      this.buscando = false;
      this.cdr.markForCheck();
    }
  }

  /** Registra el vehículo nuevo y, enseguida, su entrada en la plaza asignada. */
  async registrarVehiculo(): Promise<void> {
    if (this.registrando) return;

    if (
      !this.nuevoVehiculo.propietario.trim() ||
      !this.nuevoVehiculo.tipoUsuario ||
      !this.nuevoVehiculo.marca.trim() ||
      !this.nuevoVehiculo.modelo.trim() ||
      !this.nuevoVehiculo.color.trim()
    ) {
      this.mensaje = 'Complete todos los campos.';
      this.tipoMensaje = 'error';
      return;
    }

    this.registrando = true;
    this.mensaje = '';
    this.tipoMensaje = '';
    this.cdr.markForCheck();

    let registrado = false;

    try {
      const id =
        await this.parqueoService.registrarVehiculo(this.nuevoVehiculo);

      this.nuevoVehiculo.id = id;
      this.vehiculoEncontrado = { ...this.nuevoVehiculo };
      this.mostrarFormulario = false;
      registrado = true;
    } catch (error) {
      console.error('Error al registrar vehículo:', error);
      this.mensaje = 'No fue posible registrar el vehículo.';
      this.tipoMensaje = 'error';
    } finally {
      this.registrando = false;
      this.cdr.markForCheck();
    }

    if (registrado) {
      await this.registrarEntrada();
    }
  }

  async registrarEntrada(): Promise<void> {
    if (!this.vehiculoEncontrado || this.registrando) return;

    if (this.vehiculoEncontrado.dentro) {
      this.mensaje =
        'El vehículo ya se encuentra dentro del estacionamiento.';
      this.tipoMensaje = 'error';
      return;
    }

    if (!this.plazaSeleccionada) {
      this.mensaje = 'No hay plazas libres en este momento.';
      this.tipoMensaje = 'error';
      return;
    }

    const plaza = this.plazaSeleccionada;

    this.registrando = true;
    this.mensaje = '';
    this.tipoMensaje = '';
    this.cdr.markForCheck();

    try {
      const resultado =
        await this.parqueoService.registrarEntrada(
          this.vehiculoEncontrado,
          plaza
        );

      if (resultado === 'sesion-abierta-existente') {
        this.mensaje =
          'Ya existe una entrada abierta para este vehículo.';
        this.tipoMensaje = 'error';
      } else if (resultado === 'vehiculo-no-existe') {
        this.mensaje =
          'El vehículo ya no existe en Firestore. Vuelva a buscar la placa.';
        this.tipoMensaje = 'error';
      } else if (resultado === 'plaza-no-disponible') {
        this.plazaSeleccionada = '';
        this.plazaPreferida = '';
        await this.cargarPlazasDisponibles();

        this.mensaje = this.plazaSeleccionada
          ? `La plaza ${plaza} ya no estaba disponible. Se asignó la plaza ${this.plazaSeleccionada}; vuelva a registrar la entrada.`
          : `La plaza ${plaza} ya no estaba disponible y no quedan plazas libres.`;
        this.tipoMensaje = 'error';
      } else {
        // Listo: se limpia el formulario para el siguiente vehículo.
        this.mensaje = `Entrada registrada correctamente. Plaza asignada: ${plaza}.`;
        this.tipoMensaje = 'exito';
        this.vehiculoEncontrado = null;
        this.nuevoVehiculo = vehiculoVacio();
        this.placa = '';
        this.plazaSeleccionada = '';
        this.plazaPreferida = '';
        await this.cargarPlazasDisponibles();
      }
    } catch (error) {
      console.error('Error al registrar entrada:', error);
      this.mensaje =
        'No fue posible registrar la entrada. Compruebe las reglas de Firestore y el estado de la plaza.';
      this.tipoMensaje = 'error';
    } finally {
      this.registrando = false;
      this.cdr.markForCheck();
    }
  }

  cancelarRegistro(): void {
    this.mostrarFormulario = false;
    this.vehiculoEncontrado = null;
    this.nuevoVehiculo = vehiculoVacio();
    this.mensaje = '';
    this.tipoMensaje = '';
    this.placa = '';
    this.cdr.markForCheck();
  }
}