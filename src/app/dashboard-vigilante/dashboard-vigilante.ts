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
  fechaEntrada?: Date;
}

interface ResumenEstacionamiento {
  placa: string;
  propietario: string;
  tipoUsuario: string;
  horaEntrada: string;
  horaSalida: string;
  tiempoEstacionado: string;
  totalPagar: number;
}

@Component({
  selector: 'app-dashboard-vigilante',
  imports: [
    FormsModule,
    CommonModule,
    SistemaLayout
  ],
  templateUrl: './dashboard-vigilante.html',
  styleUrl: './dashboard-vigilante.css'
})
export class DashboardVigilante {

  // =====================================================
  // BÚSQUEDA
  // =====================================================

  placa: string = '';

  mostrarResultado: boolean = false;

  mostrarFormulario: boolean = false;

  vehiculoEncontrado: Vehiculo | null = null;


  // =====================================================
  // MENSAJES
  // =====================================================

  mensaje: string = '';

  tipoMensaje: string = '';


  // =====================================================
  // FORMULARIO DE VEHÍCULO
  // =====================================================

  nuevoVehiculo: Vehiculo = {
    placa: '',
    propietario: '',
    tipoUsuario: '',
    marca: '',
    modelo: '',
    color: '',
    dentro: false
  };


  // =====================================================
  // RESUMEN DE COBRO
  // =====================================================

  resumenEstacionamiento:
    ResumenEstacionamiento | null = null;


  // =====================================================
  // TARIFAS
  // =====================================================

  private readonly TARIFA_FRANJA = 0.50;

  private readonly TARIFA_INVITADO = 0.50;


  // =====================================================
  // DATOS TEMPORALES
  // =====================================================

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
      dentro: false
    },

    {
      placa: 'DEF-789',
      propietario: 'Carlos Martínez',
      tipoUsuario: 'Invitado',
      marca: 'Hyundai',
      modelo: 'Accent',
      color: 'Negro',
      dentro: false
    },

    {
      placa: 'GHI-321',
      propietario: 'Ana Rodríguez',
      tipoUsuario: 'Empleado administrativo',
      marca: 'Nissan',
      modelo: 'Sentra',
      color: 'Azul',
      dentro: false
    },

    {
      placa: 'JKL-654',
      propietario: 'Pedro López',
      tipoUsuario: 'Vigilante',
      marca: 'Toyota',
      modelo: 'Yaris',
      color: 'Rojo',
      dentro: false
    }

  ];


  // =====================================================
  // BUSCAR VEHÍCULO POR PLACA
  // =====================================================

  buscarVehiculo(): void {

    this.mensaje = '';
    this.tipoMensaje = '';

    this.resumenEstacionamiento = null;


    if (this.placa.trim() === '') {

      this.mostrarResultado = false;

      this.mostrarFormulario = false;

      this.vehiculoEncontrado = null;

      return;
    }


    const placaBuscada =
      this.placa
        .trim()
        .toUpperCase();


    const vehiculo =
      this.vehiculos.find(
        v => v.placa === placaBuscada
      );


    this.mostrarResultado = true;

    this.mostrarFormulario = false;


    if (vehiculo) {

      this.vehiculoEncontrado =
        vehiculo;

    } else {

      this.vehiculoEncontrado =
        null;

      this.nuevoVehiculo.placa =
        placaBuscada;

    }

  }


  // =====================================================
  // MOSTRAR FORMULARIO
  // =====================================================

  mostrarRegistroVehiculo(): void {

    this.mostrarFormulario = true;

    this.nuevoVehiculo.placa =
      this.placa
        .trim()
        .toUpperCase();

  }


  // =====================================================
  // CANCELAR REGISTRO
  // =====================================================

  cancelarRegistroVehiculo(): void {

    this.mostrarFormulario = false;

  }


  // =====================================================
  // REGISTRAR VEHÍCULO
  // =====================================================

  registrarVehiculo(): void {

    if (

      this.nuevoVehiculo.placa.trim() === '' ||

      this.nuevoVehiculo.propietario.trim() === '' ||

      this.nuevoVehiculo.tipoUsuario.trim() === '' ||

      this.nuevoVehiculo.marca.trim() === '' ||

      this.nuevoVehiculo.modelo.trim() === '' ||

      this.nuevoVehiculo.color.trim() === ''

    ) {

      this.mensaje =
        'Complete todos los campos del vehículo.';

      this.tipoMensaje = 'error';

      return;
    }


    const placa =
      this.nuevoVehiculo.placa
        .trim()
        .toUpperCase();


    const existe =
      this.vehiculos.some(
        v => v.placa === placa
      );


    if (existe) {

      this.mensaje =
        'El vehículo ya está registrado.';

      this.tipoMensaje = 'error';

      return;
    }


    const vehiculo: Vehiculo = {

      placa,

      propietario:
        this.nuevoVehiculo
          .propietario
          .trim(),

      tipoUsuario:
        this.nuevoVehiculo
          .tipoUsuario
          .trim(),

      marca:
        this.nuevoVehiculo
          .marca
          .trim(),

      modelo:
        this.nuevoVehiculo
          .modelo
          .trim(),

      color:
        this.nuevoVehiculo
          .color
          .trim(),

      dentro: false

    };


    this.vehiculos.push(vehiculo);


    this.vehiculoEncontrado =
      vehiculo;


    this.mostrarFormulario =
      false;


    this.mostrarResultado =
      true;


    this.placa =
      vehiculo.placa;


    this.mensaje =
      'Vehículo registrado correctamente.';

    this.tipoMensaje =
      'exito';

  }


  // =====================================================
  // REGISTRAR ENTRADA
  // =====================================================

  registrarEntrada(): void {

    if (!this.vehiculoEncontrado) {
      return;
    }


    if (
      this.vehiculoEncontrado.dentro
    ) {

      this.mensaje =
        'El vehículo ya se encuentra dentro del estacionamiento.';

      this.tipoMensaje =
        'error';

      return;
    }


    const ahora =
      new Date();


    this.vehiculoEncontrado.dentro =
      true;


    this.vehiculoEncontrado.fechaEntrada =
      ahora;


    this.vehiculoEncontrado.horaEntrada =
      this.formatearHora(ahora);


    this.resumenEstacionamiento =
      null;


    this.mensaje =
      'Entrada registrada correctamente.';

    this.tipoMensaje =
      'exito';

  }


  // =====================================================
  // REGISTRAR SALIDA
  // =====================================================

  registrarSalida(): void {

    if (!this.vehiculoEncontrado) {
      return;
    }


    if (
      !this.vehiculoEncontrado.dentro
    ) {

      this.mensaje =
        'El vehículo no se encuentra dentro del estacionamiento.';

      this.tipoMensaje =
        'error';

      return;
    }


    if (
      !this.vehiculoEncontrado.fechaEntrada
    ) {

      this.mensaje =
        'No se encontró la hora de entrada.';

      this.tipoMensaje =
        'error';

      return;
    }


    const entrada =
      this.vehiculoEncontrado
        .fechaEntrada;


    const salida =
      new Date();


    // =================================================
    // TIEMPO ESTACIONADO
    // =================================================

    const tiempoEstacionado =
      this.calcularTiempoEstacionado(
        entrada,
        salida
      );


    // =================================================
    // COBRO
    // =================================================

    const totalPagar =
      this.calcularCobro(
        this.vehiculoEncontrado
          .tipoUsuario,
        entrada,
        salida
      );


    // =================================================
    // CREAR RESUMEN
    // =================================================

    this.resumenEstacionamiento = {

      placa:
        this.vehiculoEncontrado
          .placa,

      propietario:
        this.vehiculoEncontrado
          .propietario,

      tipoUsuario:
        this.vehiculoEncontrado
          .tipoUsuario,

      horaEntrada:
        this.formatearHora(
          entrada
        ),

      horaSalida:
        this.formatearHora(
          salida
        ),

      tiempoEstacionado,

      totalPagar

    };


    // =================================================
    // ACTUALIZAR ESTADO
    // =================================================

    this.vehiculoEncontrado.dentro =
      false;


    this.vehiculoEncontrado.fechaEntrada =
      undefined;


    this.vehiculoEncontrado.horaEntrada =
      undefined;


    this.mensaje =
      'Salida registrada correctamente.';

    this.tipoMensaje =
      'exito';

  }


  // =====================================================
  // CALCULAR TIEMPO ESTACIONADO
  // =====================================================

  private calcularTiempoEstacionado(
    entrada: Date,
    salida: Date
  ): string {

    const diferencia =
      Math.max(
        0,
        salida.getTime() -
        entrada.getTime()
      );


    const minutos =
      Math.floor(
        diferencia / 60000
      );


    const horas =
      Math.floor(
        minutos / 60
      );


    const minutosRestantes =
      minutos % 60;


    return `${horas} h ${minutosRestantes} min`;

  }


  // =====================================================
  // CALCULAR COBRO
  // =====================================================

  private calcularCobro(
    tipoUsuario: string,
    entrada: Date,
    salida: Date
  ): number {

    const tipo =
      tipoUsuario
        .trim()
        .toLowerCase();


    // =================================================
    // DOCENTES
    // =================================================

    if (
      tipo === 'docente'
    ) {

      return 0;

    }


    // =================================================
    // ADMINISTRATIVOS
    // =================================================

    if (

      tipo === 'administrativo' ||

      tipo === 'empleado' ||

      tipo === 'empleado administrativo'

    ) {

      return 0;

    }


    // =================================================
    // VIGILANTES
    // =================================================

    if (
      tipo === 'vigilante'
    ) {

      return 0;

    }


    // =================================================
    // INVITADOS
    // =================================================

    if (
      tipo === 'invitado'
    ) {

      return this.calcularCobroInvitado(
        entrada,
        salida
      );

    }


    // =================================================
    // ESTUDIANTES
    // =================================================

    if (
      tipo === 'estudiante'
    ) {

      return this.calcularCobroEstudiante(
        entrada,
        salida
      );

    }


    return 0;

  }


  // =====================================================
  // COBRO DE INVITADOS
  // =====================================================

  private calcularCobroInvitado(
    entrada: Date,
    salida: Date
  ): number {

    const diferencia =
      salida.getTime() -
      entrada.getTime();


    const horas =
      Math.ceil(
        diferencia /
        (1000 * 60 * 60)
      );


    return Math.max(
      this.TARIFA_INVITADO,
      horas *
      this.TARIFA_INVITADO
    );

  }


  // =====================================================
  // COBRO DE ESTUDIANTES
  // =====================================================

  private calcularCobroEstudiante(
    entrada: Date,
    salida: Date
  ): number {

    let totalFranjas =
      0;


    /*
     * Revisamos todos los días comprendidos
     * entre la entrada y la salida.
     *
     * Esto permite manejar correctamente
     * una estancia que atraviese medianoche.
     */

    const diaActual =
      new Date(entrada);


    diaActual.setHours(
      0,
      0,
      0,
      0
    );


    const ultimoDia =
      new Date(salida);


    ultimoDia.setHours(
      0,
      0,
      0,
      0
    );


    while (
      diaActual <= ultimoDia
    ) {

      const diaSemana =
        diaActual.getDay();


      /*
       * Domingo:
       *
       * No existen franjas académicas.
       */

      if (
        diaSemana !== 0
      ) {


        /*
         * Lunes a viernes:
         *
         * 4 franjas.
         *
         * Sábado:
         *
         * solamente las primeras
         * 2 franjas.
         */

        const cantidadFranjas =
          diaSemana === 6
            ? 2
            : 4;


        for (
          let i = 0;
          i < cantidadFranjas;
          i++
        ) {

          const franja =
            this.obtenerFranja(
              i
            );


          const inicioFranja =
            new Date(diaActual);


          inicioFranja.setHours(
            Math.floor(
              franja.inicio / 60
            ),
            franja.inicio % 60,
            0,
            0
          );


          const finFranja =
            new Date(diaActual);


          finFranja.setHours(
            Math.floor(
              franja.fin / 60
            ),
            franja.fin % 60,
            0,
            0
          );


          /*
           * Si existe aunque sea UN MINUTO
           * de coincidencia con la franja,
           * se cobra $0.50.
           *
           * Ejemplo:
           *
           * 07:00 - 07:01
           *
           * Coincide con:
           *
           * 06:20 - 08:10
           *
           * Entonces:
           *
           * $0.50
           */

          const coincide =
            entrada.getTime() <
              finFranja.getTime() &&

            salida.getTime() >
              inicioFranja.getTime();


          if (coincide) {

            totalFranjas++;

          }

        }

      }


      diaActual.setDate(
        diaActual.getDate() + 1
      );

    }


    return this.redondear(
      totalFranjas *
      this.TARIFA_FRANJA
    );

  }


  // =====================================================
  // OBTENER FRANJA
  // =====================================================

  private obtenerFranja(
    indice: number
  ): {
    inicio: number;
    fin: number;
  } {

    const franjas = [

      {
        inicio: 6 * 60 + 20,
        fin: 8 * 60 + 10
      },

      {
        inicio: 8 * 60 + 10,
        fin: 10 * 60 + 10
      },

      {
        inicio: 16 * 60 + 40,
        fin: 18 * 60 + 30
      },

      {
        inicio: 18 * 60 + 30,
        fin: 20 * 60 + 20
      }

    ];


    return franjas[indice];

  }


  // =====================================================
  // FORMATEAR HORA
  // =====================================================

  private formatearHora(
    fecha: Date
  ): string {

    return fecha.toLocaleTimeString(
      'es-SV',
      {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }
    );

  }


  // =====================================================
  // REDONDEAR DINERO
  // =====================================================

  private redondear(
    cantidad: number
  ): number {

    return Math.round(
      cantidad * 100
    ) / 100;

  }


  // =====================================================
  // MENSAJE DEL COBRO
  // =====================================================

  obtenerMensajeCobro(): string {

    if (
      !this.resumenEstacionamiento
    ) {

      return '';

    }


    const tipo =
      this.resumenEstacionamiento
        .tipoUsuario
        .trim()
        .toLowerCase();


    if (
      tipo === 'docente'
    ) {

      return 'El docente no paga estacionamiento.';

    }


    if (

      tipo === 'administrativo' ||

      tipo === 'empleado' ||

      tipo === 'empleado administrativo'

    ) {

      return 'El empleado administrativo no paga estacionamiento.';

    }


    if (
      tipo === 'vigilante'
    ) {

      return 'El vigilante no paga estacionamiento.';

    }


    if (
      tipo === 'estudiante'
    ) {

      return 'Cobro de $0.50 por cada franja de clase utilizada.';

    }


    if (
      tipo === 'invitado'
    ) {

      return 'Cobro de $0.50 por cada hora o fracción.';

    }


    return '';

  }

}