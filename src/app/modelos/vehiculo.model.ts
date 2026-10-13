import { Timestamp } from 'firebase/firestore';

export interface Vehiculo {
  id?: string;
  placa: string;
  propietario: string;
  tipoUsuario: string;
  marca: string;
  modelo: string;
  color: string;
  dentro: boolean;
  fechaEntrada?: Timestamp;
}