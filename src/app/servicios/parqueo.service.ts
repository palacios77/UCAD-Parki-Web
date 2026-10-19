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
import { TipoVehiculo, tipoDe } from '../modelos/tipo-vehiculo';

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
  plazaId?: string | null;
  placa: string;
  tipoUsuario: string;
  fechaEntrada: Timestamp;
  fechaSalida: Timestamp | null;
  estado: string;
}

export interface PlazaDisponible {
  id: string;
  estado: string;
  placa?: string | null;
  vehiculoId?: string | null;
  sesionId?: string | null;
  fechaAsignacion?: Timestamp | null;
}

interface PlazaResumen {
  id: string;
  estado?: string;
  placa?: string | null;
  vehiculoId?: string | null;
  sesionId?: string | null;
  fechaAsignacion?: Timestamp | null;
}

@Injectable({
  providedIn: 'root'
})
export class ParqueoService {
  private vehiculosRef = collection(db, 'vehiculos');
  private sesionesRef = collection(db, 'sesiones');
  private plazasRef = collection(db, 'plazas');

  /**
   * Devuelve las plazas explícitamente libres y sin asignaciones.
   * No convierte "Sin verificar" en "Libre".
   */
  async listarPlazasDisponibles(): Promise<PlazaDisponible[]> {
    const resultado = await getDocs(this.plazasRef);

    return resultado.docs
      .map(documento => ({
        id: documento.id,
        ...documento.data()
      }) as PlazaDisponible)
      .filter(plaza =>
        plaza.estado === 'Libre' &&
        (plaza.vehiculoId == null || plaza.vehiculoId === '') &&
        (plaza.placa == null || plaza.placa === '') &&
        (plaza.sesionId == null || plaza.sesionId === '') &&
        plaza.fechaAsignacion == null
      )
      .sort((a, b) =>
        a.id.localeCompare(b.id, undefined, { numeric: true })
      );
  }

  async buscarVehiculo(placa: string): Promise<Vehiculo | null> {
    const placaBuscada = placa.trim().toUpperCase();

    const consulta = query(
      this.vehiculosRef,
      where('placa', '==', placaBuscada)
    );

    const resultado = await getDocs(consulta);

    if (resultado.empty) {
      return null;
    }

    const documento = resultado.docs[0];

    return {
      id: documento.id,
      ...documento.data()
    } as Vehiculo;
  }

  async listarVehiculos(): Promise<Vehiculo[]> {
    const resultado = await getDocs(this.vehiculosRef);

    return resultado.docs.map(documento => ({
      id: documento.id,
      ...documento.data()
    })) as Vehiculo[];
  }

  async listarHistorial(): Promise<SesionHistorial[]> {
    const resultado = await getDocs(this.sesionesRef);

    const historial: SesionHistorial[] = resultado.docs.map(documento => {
      const datos = documento.data();

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
        const minutos = Math.floor(
          (fechaSalida.getTime() - fechaEntrada.getTime()) / 60000
        );

        const horas = Math.floor(minutos / 60);
        const minutosRestantes = minutos % 60;

        tiempoEstacionado = `${horas} h ${minutosRestantes} min`;
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
      const fechaA = a.fechaEntrada?.getTime() ?? 0;
      const fechaB = b.fechaEntrada?.getTime() ?? 0;
      return fechaB - fechaA;
    });

    return historial;
  }

  /**
   * Obtiene los indicadores del dashboard administrativo:
   * vehículos dentro, movimientos e ingresos del día,
   * y estado de las plazas.
   */
  async obtenerResumenInicio(): Promise<{
    vehiculosDentro: number;
    entradasHoy: number;
    salidasHoy: number;
    ingresosHoy: number;
    totalPlazas: number;
    plazasLibres: number;
    plazasOcupadas: number;
    plazasSinVerificar: number;
    porcentajeOcupacion: number;
  }> {
    const [vehiculos, historial, resultadoPlazas] = await Promise.all([
      this.listarVehiculos(),
      this.listarHistorial(),
      getDocs(this.plazasRef)
    ]);

    const ahora = new Date();

    const inicioHoy = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate(),
      0, 0, 0, 0
    );

    const finHoy = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate(),
      23, 59, 59, 999
    );

    const vehiculosDentro = vehiculos.filter(
      vehiculo => vehiculo.dentro === true
    ).length;

    let entradasHoy = 0;
    let salidasHoy = 0;
    let ingresosHoy = 0;

    for (const sesion of historial) {
      if (
        sesion.fechaEntrada &&
        sesion.fechaEntrada >= inicioHoy &&
        sesion.fechaEntrada <= finHoy
      ) {
        entradasHoy++;
      }

      if (
        sesion.fechaSalida &&
        sesion.fechaSalida >= inicioHoy &&
        sesion.fechaSalida <= finHoy
      ) {
        salidasHoy++;
        ingresosHoy += Number(sesion.monto || 0);
      }
    }

    // Se especifica el tipo para que TypeScript reconozca
    // las propiedades de cada documento de plazas.
    const plazas: PlazaResumen[] = resultadoPlazas.docs.map(documento => {
      const datos = documento.data();

      return {
        id: documento.id,
        estado: datos['estado'] as string | undefined,
        placa: datos['placa'] as string | null | undefined,
        vehiculoId: datos['vehiculoId'] as string | null | undefined,
        sesionId: datos['sesionId'] as string | null | undefined,
        fechaAsignacion:
          datos['fechaAsignacion'] as Timestamp | null | undefined
      };
    });

    const totalPlazas = plazas.length;

    const plazasLibres = plazas.filter(plaza =>
      plaza.estado === 'Libre' &&
      (plaza.vehiculoId == null || plaza.vehiculoId === '') &&
      (plaza.placa == null || plaza.placa === '') &&
      (plaza.sesionId == null || plaza.sesionId === '') &&
      plaza.fechaAsignacion == null
    ).length;

    const plazasOcupadas = plazas.filter(
      plaza => plaza.estado === 'Ocupada'
    ).length;

    const plazasSinVerificar = plazas.filter(
      plaza => plaza.estado === 'Sin verificar'
    ).length;

    const porcentajeOcupacion = totalPlazas > 0
      ? Math.round((plazasOcupadas / totalPlazas) * 1000) / 10
      : 0;

    return {
      vehiculosDentro,
      entradasHoy,
      salidasHoy,
      ingresosHoy,
      totalPlazas,
      plazasLibres,
      plazasOcupadas,
      plazasSinVerificar,
      porcentajeOcupacion
    };
  }

  async registrarVehiculo(vehiculo: Vehiculo): Promise<string> {
    const documento = await addDoc(this.vehiculosRef, {
      placa: vehiculo.placa.trim().toUpperCase(),
      propietario: vehiculo.propietario.trim(),
      tipoUsuario: vehiculo.tipoUsuario,
      tipoVehiculo: tipoDe(vehiculo),
      marca: vehiculo.marca.trim(),
      modelo: vehiculo.modelo.trim(),
      color: vehiculo.color.trim(),
      dentro: false
    });

    return documento.id;
  }

  /** Cambia el tipo de vehículo (carro, moto, bicicleta o patín eléctrico). */
  async actualizarTipoVehiculo(
    vehiculoId: string,
    tipo: TipoVehiculo
  ): Promise<void> {
    await updateDoc(doc(db, 'vehiculos', vehiculoId), {
      tipoVehiculo: tipo
    });
  }

  /**
   * Registra la entrada y asigna una plaza en una transacción.
   */
  async registrarEntrada(
    vehiculo: Vehiculo,
    plazaId: string
  ): Promise<
    | 'registrada'
    | 'sesion-abierta-existente'
    | 'plaza-no-disponible'
    | 'vehiculo-no-existe'
  > {
    if (!vehiculo.id) {
      throw new Error('El vehículo no tiene un identificador.');
    }

    if (!plazaId || !plazaId.trim()) {
      throw new Error('Debes seleccionar una plaza.');
    }

    const consultaSesionesAbiertas = query(
      this.sesionesRef,
      where('vehiculoId', '==', vehiculo.id)
    );

    const sesionesEncontradas = await getDocs(consultaSesionesAbiertas);

    for (const documento of sesionesEncontradas.docs) {
      const datos = documento.data();

      if (datos['estado'] === 'Abierta') {
        return 'sesion-abierta-existente';
      }
    }

    const usuario = auth.currentUser;
    const ahora = Timestamp.now();

    const vehiculoRef = doc(db, 'vehiculos', vehiculo.id);
    const plazaRef = doc(db, 'plazas', plazaId);
    const nuevaSesionRef = doc(collection(db, 'sesiones'));

    return await runTransaction(db, async transaccion => {
      const documentoVehiculo = await transaccion.get(vehiculoRef);
      const documentoPlaza = await transaccion.get(plazaRef);

      if (!documentoVehiculo.exists()) {
        return 'vehiculo-no-existe';
      }

      if (!documentoPlaza.exists()) {
        throw new Error('La plaza seleccionada no existe.');
      }

      const datosVehiculo = documentoVehiculo.data();

      const datosPlaza = documentoPlaza.data() as {
        estado?: string;
        placa?: string | null;
        vehiculoId?: string | null;
        sesionId?: string | null;
        fechaAsignacion?: Timestamp | null;
      };

      if (datosVehiculo['dentro'] === true) {
        return 'sesion-abierta-existente';
      }

      const plazaLibre =
        datosPlaza.estado === 'Libre' &&
        (datosPlaza.vehiculoId == null || datosPlaza.vehiculoId === '') &&
        (datosPlaza.placa == null || datosPlaza.placa === '') &&
        (datosPlaza.sesionId == null || datosPlaza.sesionId === '') &&
        datosPlaza.fechaAsignacion == null;

      if (!plazaLibre) {
        return 'plaza-no-disponible';
      }

      const placaNormalizada = vehiculo.placa.trim().toUpperCase();

      transaccion.update(plazaRef, {
        estado: 'Ocupada',
        fechaAsignacion: ahora,
        placa: placaNormalizada,
        vehiculoId: vehiculo.id,
        sesionId: nuevaSesionRef.id
      });

      transaccion.update(vehiculoRef, {
        dentro: true,
        fechaEntrada: ahora,
        plazaId
      });

      transaccion.set(nuevaSesionRef, {
        vehiculoId: vehiculo.id,
        plazaId,
        placa: placaNormalizada,
        tipoUsuario: vehiculo.tipoUsuario,
        fechaEntrada: ahora,
        fechaSalida: null,
        estado: 'Abierta',
        vigilanteUid: usuario?.uid || '',
        vigilanteCorreo: usuario?.email || ''
      });

      return 'registrada';
    });
  }

  async buscarSesionAbierta(
    placa: string
  ): Promise<SesionAbierta | null> {
    const placaBuscada = placa.trim().toUpperCase();

    const consulta = query(
      this.sesionesRef,
      where('placa', '==', placaBuscada)
    );

    const resultado = await getDocs(consulta);

    if (resultado.empty) {
      return null;
    }

    for (const documento of resultado.docs) {
      const datos = documento.data();

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

    const entrada = fechaEntrada.toDate();
    const salida = fechaSalida.toDate();

    if (salida <= entrada) {
      return 0;
    }

    const minutos = (salida.getTime() - entrada.getTime()) / 60000;
    const bloques = Math.ceil(minutos / 240);

    return bloques * 0.50;
  }

  /**
   * Cierra una sesión y libera su plaza si sigue asignada
   * a esa misma sesión y vehículo.
   */
  async registrarSalida(sesion: SesionAbierta): Promise<number> {
    if (!sesion.id) {
      throw new Error('La sesión no tiene un identificador.');
    }

    if (!sesion.vehiculoId) {
      throw new Error('La sesión no tiene un vehículo asociado.');
    }

    const fechaSalida = Timestamp.now();
    const sesionRef = doc(db, 'sesiones', sesion.id);

    const monto = await runTransaction(db, async transaccion => {
      const documentoSesion = await transaccion.get(sesionRef);

      if (!documentoSesion.exists()) {
        throw new Error('La sesión no existe.');
      }

      const datosSesion = documentoSesion.data();

      if (datosSesion['estado'] !== 'Abierta') {
        throw new Error('La sesión ya no está abierta.');
      }

      const vehiculoId = datosSesion['vehiculoId'];
      const tipoUsuario = datosSesion['tipoUsuario'];
      const fechaEntrada = datosSesion['fechaEntrada'];
      const plazaId = datosSesion['plazaId'];

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

      const vehiculoRef = doc(db, 'vehiculos', vehiculoId);
      const documentoVehiculo = await transaccion.get(vehiculoRef);

      if (!documentoVehiculo.exists()) {
        throw new Error('El vehículo asociado a la sesión no existe.');
      }

      let plazaRef: ReturnType<typeof doc> | undefined;
      let documentoPlaza:
        Awaited<ReturnType<typeof transaccion.get>> | undefined;

      if (typeof plazaId === 'string' && plazaId.trim() !== '') {
        plazaRef = doc(db, 'plazas', plazaId);
        documentoPlaza = await transaccion.get(plazaRef);
      }

      const montoCalculado = this.calcularCobro(
        tipoUsuario,
        fechaEntrada,
        fechaSalida
      );

      transaccion.update(sesionRef, {
        fechaSalida,
        monto: montoCalculado,
        estado: 'Cerrada'
      });

      transaccion.update(vehiculoRef, {
        dentro: false,
        plazaId: null
      });

      if (plazaRef && documentoPlaza?.exists()) {
        const datosPlaza = documentoPlaza.data() as Record<string, unknown>;

        if (
          datosPlaza['sesionId'] === sesion.id &&
          datosPlaza['vehiculoId'] === vehiculoId
        ) {
          transaccion.update(plazaRef, {
            estado: 'Libre',
            fechaAsignacion: null,
            placa: null,
            vehiculoId: null,
            sesionId: null
          });
        }
      }

      return montoCalculado;
    });

    return monto;
  }

  
async listarPlazas(): Promise<PlazaDisponible[]> {
  const resultado = await getDocs(this.plazasRef);

  return resultado.docs
    .map(documento => ({
      id: documento.id,
      ...documento.data()
    }) as PlazaDisponible)
    .sort((a, b) =>
      a.id.localeCompare(
        b.id,
        undefined,
        { numeric: true }
      )
    );
}

}