import { Routes } from '@angular/router';

import { Login } from './login/login';
import { RecuperarContrasena } from './recuperar-contrasena/recuperar-contrasena';

import { SistemaLayout } from './layout/sistema-layout';
import { DashboardVigilante } from './dashboard-vigilante/dashboard-vigilante';
import { Entrada } from './entrada/entrada';
import { Salida } from './salida/salida';
import { Historial } from './historial/historial';
import { Vehiculos } from './vehiculos/vehiculos';

import { LayoutAdministrador } from './administrador/layout/layout';
import { Inicio } from './administrador/inicio/inicio';
import {
  Vehiculos as VehiculosAdministrador
} from './administrador/vehiculos/vehiculos';
import { Usuarios } from './administrador/usuarios/usuarios';
import {
  HistorialAdministrador
} from './administrador/historial/historial';
import { Reportes } from './administrador/reportes/reportes';
import { Configuracion } from './administrador/configuracion/configuracion';

import { rolGuard } from './guards/rol-guard';

import { AccesoRestringido } from './acceso-restringido/acceso-restringido';
import { ServicioNoDisponible } from './servicio-no-disponible/servicio-no-disponible';
import { PaginaNoEncontrada } from './pagina-no-encontrada/pagina-no-encontrada';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: 'recuperar-contrasena',
    component: RecuperarContrasena
  },

  // MÓDULO VIGILANTE
  {
    path: 'dashboard/vigilante',
    component: SistemaLayout,
    canMatch: [rolGuard],
    canActivate: [rolGuard],
    data: {
      roles: ['Vigilante']
    },
    children: [
      { path: '', component: DashboardVigilante },
      { path: 'entrada', component: Entrada },
      { path: 'salida', component: Salida },
      { path: 'vehiculos', component: Vehiculos },
      { path: 'historial', component: Historial }
    ]
  },

  // MÓDULO ADMINISTRADOR
  {
    path: 'dashboard/administrador',
    component: LayoutAdministrador,
    canMatch: [rolGuard],
    canActivate: [rolGuard],
    data: {
      roles: ['Administrador']
    },
    children: [
      { path: '', component: Inicio },
      { path: 'vehiculos', component: VehiculosAdministrador },
      { path: 'usuarios', component: Usuarios },
      { path: 'historial', component: HistorialAdministrador },
      { path: 'reportes', component: Reportes },
      { path: 'configuracion', component: Configuracion }
    ]
  },

  {
    path: 'acceso-restringido',
    component: AccesoRestringido
  },
  {
    path: 'servicio-no-disponible',
    component: ServicioNoDisponible
  },

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    component: PaginaNoEncontrada
  }
];

