import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';

import { auth, db } from '../firebase.config';
import { Vehiculo } from '../modelos/vehiculo.model';

interface SesionHistorial {
  id: string;
  placa: string;
  tipoUsuario: string;
  fechaEntrada: Date | null;
  fechaSalida: Date | null;
  estado: string;
  monto: number;
  tiempoEstacionado: string;
}

interface SesionAbierta {
  id: string;
  vehiculoId: string;
  placa: string;
  tipoUsuario: string;
  fechaEntrada: Timestamp;
  fechaSalida: Timestamp | null;
  estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class ParqueoService {

  private vehiculosRef =
    collection(db, 'vehiculos');

  private sesionesRef =
    collection(db, 'sesiones');

  async buscarVehiculo(
    placa: string
  ): Promise<Vehiculo | null> {

    const placaBuscada =
      placa.trim().toUpperCase();

    console.time('CONSULTA VEHICULO');

    const consulta = query(
      this.vehiculosRef,
      where('placa', '==', placaBuscada)
    );

    const resultado =
      await getDocs(consulta);

    console.timeEnd('CONSULTA VEHICULO');

    if (resultado.empty) {
      return null;
    }

    const documento =
      resultado.docs[0];

    return {
      id: documento.id,
      ...documento.data()
    } as Vehiculo;
  }

  async listarVehiculos(): Promise<Vehiculo[]> {

    const resultado =
      await getDocs(this.vehiculosRef);

    return resultado.docs.map(documento => ({
      id: documento.id,
      ...documento.data()
    })) as Vehiculo[];
  }

  async listarHistorial(): Promise<SesionHistorial[]> {

    const resultado =
      await getDocs(this.sesionesRef);

    const historial =
      resultado.docs.map(documento => {

        const datos =
          documento.data();

        const fechaEntrada =
          datos['fechaEntrada'] instanceof Timestamp
            ? datos['fechaEntrada'].toDate()
            : null;

        const fechaSalida =
          datos['fechaSalida'] instanceof Timestamp
            ? datos['fechaSalida'].toDate()
            : null;

        let tiempoEstacionado = '';

        if (fechaEntrada && fechaSalida) {

          const minutos =
            Math.floor(
              (fechaSalida.getTime() -
                fechaEntrada.getTime()) / 60000
            );

          const horas =
            Math.floor(minutos / 60);

          const minutosRestantes =
            minutos % 60;

          tiempoEstacionado =
            `${horas} h ${minutosRestantes} min`;
        }

        return {
          id: documento.id,
          placa: datos['placa'],
          tipoUsuario: datos['tipoUsuario'],
          fechaEntrada,
          fechaSalida,
          estado: datos['estado'],
          monto: datos['monto'] || 0,
          tiempoEstacionado
        };
      });

    historial.sort((a, b) => {

      const fechaA =
        a.fechaEntrada
          ? a.fechaEntrada.getTime()
          : 0;

      const fechaB =
        b.fechaEntrada
          ? b.fechaEntrada.getTime()
          : 0;

      return fechaB - fechaA;
    });

    return historial;
  }

  async obtenerResumenInicio(): Promise<{
    vehiculosDentro: number;
    entradasHoy: number;
    salidasHoy: number;
    ingresosHoy: number;
  }> {

    const vehiculos =
      await this.listarVehiculos();

    const historial =
      await this.listarHistorial();

    const ahora =
      new Date();

    const inicioHoy =
      new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate(),
        0,
        0,
        0,
        0
      );

    const finHoy =
      new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate(),
        23,
        59,
        59,
        999
      );

    let vehiculosDentro = 0;

    for (const vehiculo of vehiculos) {
      if (vehiculo.dentro) {
        vehiculosDentro = vehiculosDentro + 1;
      }
    }

    let entradasHoy = 0;
    let salidasHoy = 0;
    let ingresosHoy = 0;

    for (const sesion of historial) {
      if (
        sesion.fechaEntrada &&
        sesion.fechaEntrada >= inicioHoy &&
        sesion.fechaEntrada <= finHoy
      ) {
        entradasHoy = entradasHoy + 1;
      }

      if (
        sesion.fechaSalida &&
        sesion.fechaSalida >= inicioHoy &&
        sesion.fechaSalida <= finHoy
      ) {
        salidasHoy = salidasHoy + 1;
      }

      if (
        sesion.fechaSalida &&
        sesion.fechaSalida >= inicioHoy &&
        sesion.fechaSalida <= finHoy
      ) {
        ingresosHoy =
          ingresosHoy + Number(sesion.monto || 0);
      }
    }

    return {
      vehiculosDentro,
      entradasHoy,
      salidasHoy,
      ingresosHoy
    };
  }

  async registrarVehiculo(
    vehiculo: Vehiculo
  ): Promise<string> {

    const documento =
      await addDoc(
        this.vehiculosRef,
        {
          placa:
            vehiculo.placa
              .trim()
              .toUpperCase(),

          propietario:
            vehiculo.propietario.trim(),

          tipoUsuario:
            vehiculo.tipoUsuario,

          marca:
            vehiculo.marca.trim(),

          modelo:
            vehiculo.modelo.trim(),

          color:
            vehiculo.color.trim(),

          dentro: false
        }
      );

    return documento.id;
  }


  async registrarEntrada(
    vehiculo: Vehiculo
  ): Promise<'registrada' | 'sesion-abierta-existente'> {

    if (!vehiculo.id) {
      throw new Error(
        'El vehículo no tiene un identificador.'
      );
    }

    const consultaSesionesAbiertas =
      query(
        this.sesionesRef,
        where('vehiculoId', '==', vehiculo.id)
      );

    const sesionesEncontradas =
      await getDocs(consultaSesionesAbiertas);

    for (const documento of sesionesEncontradas.docs) {
      const datos = documento.data();

      if (datos['estado'] === 'Abierta') {
        return 'sesion-abierta-existente';
      }
    }

    const ahora =
      Timestamp.now();

    const vehiculoRef =
      doc(
        db,
        'vehiculos',
        vehiculo.id
      );

    await updateDoc(
      vehiculoRef,
      {
        dentro: true,
        fechaEntrada: ahora
      }
    );

    const usuario =
      auth.currentUser;

    await addDoc(
      this.sesionesRef,
      {
        vehiculoId:
          vehiculo.id,

        placa:
          vehiculo.placa,

        tipoUsuario:
          vehiculo.tipoUsuario,

        fechaEntrada:
          ahora,

        fechaSalida:
          null,

        estado:
          'Abierta',

        vigilanteUid:
          usuario?.uid || '',

        vigilanteCorreo:
          usuario?.email || ''
      }
    );

    return 'registrada';
  }


  async buscarSesionAbierta(
    placa: string
  ): Promise<SesionAbierta | null> {

    const placaBuscada =
      placa.trim().toUpperCase();

    const consulta =
      query(
        this.sesionesRef,
        where(
          'placa',
          '==',
          placaBuscada
        )
      );

    const resultado =
      await getDocs(consulta);

    if (resultado.empty) {
      return null;
    }

    for (const documento of resultado.docs) {

      const datos =
        documento.data();

      if (datos['estado'] === 'Abierta') {

        return {
          id: documento.id,
          ...datos
        } as SesionAbierta;
      }
    }

    return null;
  }


  calcularCobro(
    tipoUsuario: string,
    fechaEntrada: Timestamp,
    fechaSalida: Timestamp
  ): number {

    if (
      tipoUsuario === 'Docente' ||
      tipoUsuario === 'Administrativo' ||
      tipoUsuario === 'Empleado' ||
      tipoUsuario === 'Vigilante'
    ) {
      return 0;
    }

    const entrada =
      fechaEntrada.toDate();

    const salida =
      fechaSalida.toDate();

    if (salida <= entrada) {
      return 0;
    }

    const minutos =
      (salida.getTime() -
        entrada.getTime()) / 60000;

    const bloques =
      Math.ceil(minutos / 240);

    return bloques * 0.50;
  }


  async registrarSalida(
    sesion: SesionAbierta
  ): Promise<number> {

    if (!sesion.id) {
      throw new Error(
        'La sesión no tiene un identificador.'
      );
    }

    if (!sesion.vehiculoId) {
      throw new Error(
        'La sesión no tiene un vehículo asociado.'
      );
    }

    const fechaSalida =
      Timestamp.now();

    const sesionRef =
      doc(
        db,
        'sesiones',
        sesion.id
      );

    const monto =
      await runTransaction(
        db,
        async (transaccion) => {
          const documentoSesion =
            await transaccion.get(sesionRef);

          if (!documentoSesion.exists()) {
            throw new Error(
              'La sesión no existe.'
            );
          }

          const datosSesion =
            documentoSesion.data();

          if (datosSesion['estado'] !== 'Abierta') {
            throw new Error(
              'La sesión ya no está abierta.'
            );
          }

          const vehiculoId =
            datosSesion['vehiculoId'];
          const tipoUsuario =
            datosSesion['tipoUsuario'];
          const fechaEntrada =
            datosSesion['fechaEntrada'];

          if (
            typeof vehiculoId !== 'string' ||
            vehiculoId !== sesion.vehiculoId
          ) {
            throw new Error(
              'El vehículo asociado a la sesión no coincide.'
            );
          }

          if (
            typeof tipoUsuario !== 'string' ||
            !(fechaEntrada instanceof Timestamp)
          ) {
            throw new Error(
              'La sesión no contiene los datos necesarios para calcular el cobro.'
            );
          }

          const vehiculoRef =
            doc(
              db,
              'vehiculos',
              vehiculoId
            );

          const documentoVehiculo =
            await transaccion.get(vehiculoRef);

          if (!documentoVehiculo.exists()) {
            throw new Error(
              'El vehículo asociado a la sesión no existe.'
            );
          }

          const montoCalculado =
            this.calcularCobro(
              tipoUsuario,
              fechaEntrada,
              fechaSalida
            );

          transaccion.update(
            sesionRef,
            {
              fechaSalida,
              monto: montoCalculado,
              estado: 'Cerrada'
            }
          );

          transaccion.update(
            vehiculoRef,
            {
              dentro: false
            }
          );

          return montoCalculado;
        }
      );

    return monto;
  }

}