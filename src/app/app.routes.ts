import { Routes } from '@angular/router';
import { Login } from './login/login';
import { RecuperarContrasena } from './recuperar-contrasena/recuperar-contrasena';
import { SistemaLayout } from './layout/sistema-layout';
import { DashboardVigilante } from './dashboard-vigilante/dashboard-vigilante';
import { Entrada } from './entrada/entrada';
import { Salida } from './salida/salida';
import { Historial } from './historial/historial';
import { Vehiculos } from './vehiculos/vehiculos';

export const routes: Routes = [

  {
    path: 'login',
    component: Login
  },

  {
    path: 'recuperar-contrasena',
    component: RecuperarContrasena
  },

  {
    path: 'dashboard/vigilante',
    component: SistemaLayout,
    children: [
      {
        path: '',
        component: DashboardVigilante
      },
      {
        path: 'entrada',
        component: Entrada
      },
      {path: 'salida', component: Salida},
      { path: 'vehiculos', component: Vehiculos},
      { path: 'historial', component: Historial}
    ]
  },

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }

];