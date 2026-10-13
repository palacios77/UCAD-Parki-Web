import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase.config';

@Component({
  selector: 'app-sistema-layout',
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  templateUrl: './sistema-layout.html',
  styleUrl: './sistema-layout.css'
})
export class SistemaLayout implements OnInit {

  nombreUsuario: string = 'Usuario';
  correoUsuario: string = '';
  rolUsuario: string = '';

  constructor(
    private router: Router
  ) {}

  ngOnInit(): void {

    onAuthStateChanged(auth, async (usuario) => {

      if (!usuario) {
        this.router.navigate(['/login']);
        return;
      }

      this.correoUsuario =
        usuario.email || '';

      try {

        const usuarioRef =
          doc(db, 'usuarios', usuario.uid);

        const usuarioDoc =
          await getDoc(usuarioRef);

        if (usuarioDoc.exists()) {

          const datos =
            usuarioDoc.data();

          this.nombreUsuario =
            datos['nombre'] || 'Usuario';

          this.rolUsuario =
            datos['rol'] || '';

        }

      } catch (error) {

        console.error(
          'Error al obtener usuario:',
          error
        );

      }

    });

  }

  async cerrarSesion(): Promise<void> {

    await signOut(auth);

    sessionStorage.clear();

    this.router.navigate(['/login']);
  }
}