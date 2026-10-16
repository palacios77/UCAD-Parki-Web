
import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  onAuthStateChanged,
  signOut,
  Unsubscribe
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase.config';

@Component({
  selector: 'app-sistema-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  templateUrl: './sistema-layout.html',
  styleUrl: './sistema-layout.css'
})
export class SistemaLayout implements OnInit, OnDestroy {

  nombreUsuario: string = 'Usuario';
  correoUsuario: string = '';
  rolUsuario: string = '';

  private cancelarObservador?: Unsubscribe;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.cancelarObservador = onAuthStateChanged(
      auth,
      async (usuario) => {

        if (!usuario) {
          this.nombreUsuario = 'Usuario';
          this.correoUsuario = '';
          this.rolUsuario = '';
          return;
        }

        this.correoUsuario = usuario.email || '';

        try {
          const usuarioRef = doc(db, 'usuarios', usuario.uid);
          const usuarioDoc = await getDoc(usuarioRef);

          if (usuarioDoc.exists()) {
            const datos = usuarioDoc.data();
            this.nombreUsuario = datos['nombre'] || 'Usuario';
            this.rolUsuario = datos['rol'] || '';
          } else {
            this.nombreUsuario = 'Usuario';
            this.rolUsuario = '';
          }

        } catch (error) {
          console.error('Error al obtener usuario:', error);
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.cancelarObservador?.();
  }

  async cerrarSesion(): Promise<void> {
    try {
      await signOut(auth);
      sessionStorage.clear();
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}
