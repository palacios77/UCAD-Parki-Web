import { Vehiculo } from './vehiculo.model';

/** Vehiculo + tipoVehiculo: sirve aunque tu vehiculo.model.ts todavía no tenga el campo. */
export type VehiculoConTipo = Vehiculo & { tipoVehiculo?: string };

export type TipoVehiculo = 'Carro' | 'Moto' | 'Bicicleta' | 'Patín eléctrico';

export const TIPOS_VEHICULO: TipoVehiculo[] = [
  'Carro',
  'Moto',
  'Bicicleta',
  'Patín eléctrico'
];

/** Los vehículos registrados antes de existir este campo se tratan como "Carro". */
export function tipoDe(vehiculo: object | null | undefined): TipoVehiculo {
  const tipo = (vehiculo as { tipoVehiculo?: string } | null | undefined)?.tipoVehiculo;

  return TIPOS_VEHICULO.includes(tipo as TipoVehiculo)
    ? (tipo as TipoVehiculo)
    : 'Carro';
}

/** Color del vehículo según el texto guardado en el campo "color" (el primero que coincide). */
const COLORES: [string, string][] = [
  ['rojo', '#d93636'], ['vino', '#7a1f2b'], ['celeste', '#6cb8f0'], ['azul', '#2f7fe0'],
  ['blanco', '#eceff3'], ['negro', '#1c1f24'], ['gris', '#8fa3b3'], ['plat', '#b9c2cc'],
  ['verde', '#2fa36b'], ['amarillo', '#f2c230'], ['naranja', '#f0842a'], ['morado', '#8a44c4'],
  ['cafe', '#7a4a2b'], ['marron', '#7a4a2b'], ['beige', '#d9c7a3'], ['dorado', '#c9a227']
];

const COLORES_RESPALDO = [
  '#d93636', '#2f7fe0', '#eceff3', '#f2c230', '#2fa36b', '#8a44c4', '#f0842a', '#8fa3b3'
];

export function colorVehiculo(color: string | undefined | null, placa: string): string {
  const texto = (color ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

  const coincide = COLORES.find(([nombre]) => texto.includes(nombre));

  if (coincide) {
    return coincide[1];
  }

  const suma = [...placa].reduce((a, c) => a + c.charCodeAt(0), 0);
  return COLORES_RESPALDO[suma % COLORES_RESPALDO.length];
}