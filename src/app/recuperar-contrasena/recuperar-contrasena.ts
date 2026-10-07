import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { sendPasswordResetEmail } from 'firebase/auth';

import { auth } from '../firebase.config';

@Component({
  selector: 'app-recuperar-contrasena',
  imports: [
    FormsModule,
    CommonModule
  ],
  templateUrl: './recuperar-contrasena.html',
  styleUrl: './recuperar-contrasena.css'
})
export class RecuperarContrasena {

  correo: string = '';

  mensaje: string = '';

  tipoMensaje: string = '';

  enviando: boolean = false;


  constructor(
    private router: Router
  ) {}


  async enviarEnlace(): Promise<void> {

    if (this.correo.trim() === '') {

      this.mensaje =
        'Ingrese su correo electrónico.';

      this.tipoMensaje = 'danger';

      return;
    }


    if (
      !this.correo.includes('@') ||
      !this.correo.includes('.')
    ) {

      this.mensaje =
        'Ingrese un correo electrónico válido.';

      this.tipoMensaje = 'danger';

      return;
    }


    this.mensaje = '';

    this.tipoMensaje = '';

    this.enviando = true;


    try {

      await sendPasswordResetEmail(
        auth,
        this.correo.trim()
      );


      this.mensaje =
        'Se ha enviado un enlace para restablecer su contraseña. Revise su correo electrónico y la carpeta de spam.';

      this.tipoMensaje = 'success';

      this.correo = '';

    } catch (error: any) {

      console.error(
        'Error al enviar recuperación de contraseña:',
        error
      );


      if (
        error.code === 'auth/invalid-email'
      ) {

        this.mensaje =
          'El correo electrónico no es válido.';

      } else if (
        error.code === 'auth/missing-email'
      ) {

        this.mensaje =
          'Ingrese su correo electrónico.';

      } else if (
        error.code === 'auth/too-many-requests'
      ) {

        this.mensaje =
          'Se realizaron demasiadas solicitudes. Espere unos minutos e intente nuevamente.';

      } else {

        this.mensaje =
          'No se pudo enviar el enlace de recuperación. Intente nuevamente.';

      }


      this.tipoMensaje = 'danger';

    } finally {

      this.enviando = false;

    }

  }


  volverAlLogin(): void {

    this.router.navigate([
      '/login'
    ]);

  }

}