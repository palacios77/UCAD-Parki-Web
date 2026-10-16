import { inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase.config';

export const rolGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // No redirigir desde el servidor: allí no existe la sesión
  // persistida del navegador.
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  try {
    // Esperar a que Firebase restaure la sesión del navegador.
    await auth.authStateReady();

    const usuario = auth.currentUser;

    console.log(
      'Guard en navegador:',
      isPlatformBrowser(platformId),
      'Usuario autenticado:',
      !!usuario,
      'Ruta:',
      state.url
    );

    if (!usuario) {
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    const referencia = doc(db, 'usuarios', usuario.uid);
    const documento = await getDoc(referencia);

    if (!documento.exists()) {
      return router.createUrlTree(['/servicio-no-disponible']);
    }

    const rol = documento.data()['rol'];
    const rolesPermitidos = route.data?.['roles'] as
      | string[]
      | undefined;

    if (typeof rol !== 'string' || !rol.trim()) {
      return router.createUrlTree(['/servicio-no-disponible']);
    }

    if (!rolesPermitidos || !rolesPermitidos.includes(rol)) {
      return router.createUrlTree(['/acceso-restringido']);
    }

    return true;

  } catch (error) {
    console.error('Error al validar el acceso:', error);

    return router.createUrlTree(['/servicio-no-disponible']);
  }
};
