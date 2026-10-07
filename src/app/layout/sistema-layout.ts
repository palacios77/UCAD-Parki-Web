import {
  Component,
  OnInit
} from '@angular/core';

import { Router } from '@angular/router';

import {
  onAuthStateChanged,
  signOut
} from 'firebase/auth';

import {
  doc,
  getDoc
} from 'firebase/firestore';

import { auth, db } from '../firebase.config';


@Component({
  selector: 'app-sistema-layout',
  imports: [],
  templateUrl: './sistema-layout.html',
  styleUrl: './sistema-layout.css'
})
export class SistemaLayout implements OnInit {

  nombreUsuario: string = '';
  correoUsuario: string = '';
  rolUsuario: string = '';

  constructor(
    private router: Router
  ) {}


  ngOnInit(): void {

    /*
     * PRIMERO:
     * Leer inmediatamente la información guardada
     * durante el login.
     */
    const usuarioGuardado =
      sessionStorage.getItem(
        'usuarioLogueado'
      );


    if (usuarioGuardado) {

      try {

        const usuario =
          JSON.parse(usuarioGuardado);


        this.nombreUsuario =
          usuario.nombre ?? '';

        this.correoUsuario =
          usuario.correo ?? '';

        this.rolUsuario =
          usuario.rol ?? '';


      } catch (error) {

        console.error(
          'Error al leer usuario de sesión:',
          error
        );

      }

    }


    /*
     * SEGUNDO:
     * Firebase mantiene la autenticación real.
     */
    onAuthStateChanged(
      auth,
      async (usuario) => {

        if (!usuario) {

          this.nombreUsuario = '';
          this.correoUsuario = '';
          this.rolUsuario = '';

          sessionStorage.removeItem(
            'usuarioLogueado'
          );

          return;
        }


        /*
         * Si Firebase tiene usuario autenticado,
         * actualizamos la información desde Firestore.
         */
        try {

          const referenciaUsuario =
            doc(
              db,
              'usuarios',
              usuario.uid
            );


          const documentoUsuario =
            await getDoc(
              referenciaUsuario
            );


          if (documentoUsuario.exists()) {

            const datos =
              documentoUsuario.data();


            this.nombreUsuario =
              datos['nombre'] ?? '';


            this.correoUsuario =
              datos['correo'] ??
              usuario.email ??
              '';


            this.rolUsuario =
              datos['rol'] ?? '';


            /*
             * Actualizamos también la sesión.
             */
            sessionStorage.setItem(
              'usuarioLogueado',
              JSON.stringify({
                uid: usuario.uid,
                nombre: this.nombreUsuario,
                correo: this.correoUsuario,
                rol: this.rolUsuario
              })
            );

          }

        } catch (error) {

          console.error(
            'Error al actualizar información del usuario:',
            error
          );

        }

      }
    );

  }


  async cerrarSesion(): Promise<void> {

    try {

      /*
       * Cerrar sesión real en Firebase.
       */
      await signOut(auth);


      /*
       * Eliminar información visual de la sesión.
       */
      sessionStorage.removeItem(
        'usuarioLogueado'
      );


      /*
       * Regresar al login.
       */
      await this.router.navigate([
        '/login'
      ]);

    } catch (error) {

      console.error(
        'Error al cerrar sesión:',
        error
      );

    }

  }

}