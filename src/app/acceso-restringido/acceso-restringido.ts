import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import { Router, RouterLink } from '@angular/router';
import { auth, db } from '../firebase.config';
import { doc, getDoc } from 'firebase/firestore';

@Component({
  selector: 'app-acceso-restringido',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './acceso-restringido.html',
  styleUrl: './acceso-restringido.css'
})
export class AccesoRestringido implements OnInit {

  cargando = true;
  rutaAutorizada = '';

  constructor(
    private router: Router,
    private changeDetector: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      await auth.authStateReady();

      const usuario = auth.currentUser;

      if (!usuario) {
        await this.router.navigate(['/login']);
        return;
      }

      const referencia = doc(db, 'usuarios', usuario.uid);
      const resultado = await getDoc(referencia);

      if (!resultado.exists()) {
        console.error('No existe el perfil del usuario.');
        return;
      }

      const rol = resultado.data()['rol'];

      if (rol === 'Administrador') {
        this.rutaAutorizada = '/dashboard/administrador';
      } else if (rol === 'Vigilante') {
        this.rutaAutorizada = '/dashboard/vigilante';
      } else {
        console.error('Rol no reconocido:', rol);
      }

    } catch (error) {
      console.error('Error al verificar el usuario:', error);
    } finally {
      this.cargando = false;
      this.changeDetector.detectChanges();
    }
  }

  volverAlModulo(): void {
    if (!this.rutaAutorizada) {
      return;
    }

    void this.router.navigateByUrl(this.rutaAutorizada);
  }
}

