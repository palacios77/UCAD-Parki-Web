import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  signInWithEmailAndPassword
} from 'firebase/auth';

import {
  doc,
  getDoc
} from 'firebase/firestore';

import { auth, db } from '../firebase.config';

@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    CommonModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  correo: string = '';
  contrasena: string = '';

  mostrarContrasena: boolean = false;

  mensaje: string = '';
  tipoMensaje: string = '';

  constructor(
    private router: Router
  ) {}

  async iniciarSesion(): Promise<void> {

    if (
      this.correo.trim() === '' ||
      this.contrasena.trim() === ''
    ) {
      this.mensaje =
        'Ingrese su correo y contraseña.';

      this.tipoMensaje = 'danger';

      return;
    }

    this.mensaje = '';
    this.tipoMensaje = '';

    try {

      const credencial =
        await signInWithEmailAndPassword(
          auth,
          this.correo.trim(),
          this.contrasena
        );

      const uid =
        credencial.user.uid;

      const referenciaUsuario =
        doc(
          db,
          'usuarios',
          uid
        );

      const documentoUsuario =
        await getDoc(
          referenciaUsuario
        );

      if (!documentoUsuario.exists()) {

        this.mensaje =
          'El usuario no tiene un perfil registrado en el sistema.';

        this.tipoMensaje = 'danger';

        return;
      }

      const datosUsuario =
        documentoUsuario.data();

      const nombre =
        datosUsuario['nombre'] ?? '';

      const correo =
        datosUsuario['correo'] ??
        credencial.user.email ??
        '';

      const rol =
        datosUsuario['rol'] ?? '';

      if (
        rol !== 'Administrador' &&
        rol !== 'Vigilante'
      ) {

        this.mensaje =
          'El usuario no tiene un rol válido.';

        this.tipoMensaje = 'danger';

        return;
      }

      sessionStorage.setItem(
        'usuarioLogueado',
        JSON.stringify({
          uid: uid,
          nombre: nombre,
          correo: correo,
          rol: rol
        })
      );

      if (rol === 'Administrador') {

        await this.router.navigate([
          '/dashboard/administrador'
        ]);

      } else {

        await this.router.navigate([
          '/dashboard/vigilante'
        ]);

      }

    } catch (error: any) {

      console.error(
        'Error al iniciar sesión:',
        error
      );

      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found'
      ) {

        this.mensaje =
          'Correo o contraseña incorrectos.';

      } else if (
        error.code === 'auth/invalid-email'
      ) {

        this.mensaje =
          'El correo electrónico no es válido.';

      } else {

        this.mensaje =
          'No se pudo iniciar sesión. Intente nuevamente.';

      }

      this.tipoMensaje = 'danger';
    }
  }

  alternarContrasena(): void {

    this.mostrarContrasena =
      !this.mostrarContrasena;
  }

  irARecuperarContrasena(): void {

    this.router.navigate([
      '/recuperar-contrasena'
    ]);
  }

}

