import { Routes } from '@angular/router';
import path from 'path';
import { Login } from './login/login';
import { DashboardVigilante } from './dashboard-vigilante/dashboard-vigilante';
import { DashboardAdministrador } from './dashboard-administrador/dashboard-administrador';
import { RecuperarContrasena } from './recuperar-contrasena/recuperar-contrasena';

export const routes: Routes = [
    { path: 'login', component: Login},
    { path: 'dashboard/vigilante', component: DashboardVigilante},
    { path: 'dashboard/administrador', component: DashboardAdministrador},
    { path: '', redirectTo: 'login', pathMatch: 'full'},
    { path: 'recuperar-contrasena', component: RecuperarContrasena}
];
