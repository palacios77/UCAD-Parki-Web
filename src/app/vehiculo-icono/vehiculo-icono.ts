import { Component, input } from '@angular/core';
import { TipoVehiculo } from '../modelos/tipo-vehiculo';

/**
 * Dibuja el vehículo visto desde arriba según su tipo.
 * Se usa igual en el mapa y en las listas; el tamaño lo da quien lo usa (width y height).
 */
@Component({
  selector: 'app-vehiculo-icono',
  template: `
    <svg viewBox="0 0 40 72" aria-hidden="true">
      @switch (tipo()) {

        @case ('Moto') {
          <rect x="16.5" y="3" width="7" height="19" rx="3.5" fill="#0c0d10"/>
          <rect x="16.5" y="50" width="7" height="19" rx="3.5" fill="#0c0d10"/>
          <rect x="12" y="20" width="16" height="34" rx="8" [attr.fill]="color()" stroke="rgba(0,0,0,.5)"/>
          <rect x="15" y="38" width="10" height="13" rx="4" fill="#2b3d50"/>
          <rect x="4" y="15" width="32" height="4" rx="2" fill="#3a4452"/>
          <circle cx="4.5" cy="17" r="3" fill="#0c0d10"/>
          <circle cx="35.5" cy="17" r="3" fill="#0c0d10"/>
          <circle cx="20" cy="9" r="2.6" fill="#fff7c2"/>
        }

        @case ('Bicicleta') {
          <rect x="18.4" y="3" width="3.2" height="23" rx="1.6" fill="#0c0d10"/>
          <rect x="18.4" y="46" width="3.2" height="23" rx="1.6" fill="#0c0d10"/>
          <rect x="18.2" y="22" width="3.6" height="28" rx="1.8" [attr.fill]="color()" stroke="rgba(0,0,0,.45)"/>
          <rect x="10" y="33" width="20" height="2.4" rx="1.2" fill="#7f8b97"/>
          <rect x="6" y="16" width="28" height="3" rx="1.5" fill="#3a4452"/>
          <circle cx="6" cy="17.5" r="2.4" fill="#0c0d10"/>
          <circle cx="34" cy="17.5" r="2.4" fill="#0c0d10"/>
          <ellipse cx="20" cy="44" rx="4.2" ry="5.5" fill="#2b3d50" stroke="rgba(0,0,0,.5)"/>
        }

        @case ('Patín eléctrico') {
          <rect x="17" y="4" width="6" height="11" rx="3" fill="#0c0d10"/>
          <rect x="18.8" y="13" width="2.4" height="16" rx="1.2" fill="#7f8b97"/>
          <rect x="8" y="10" width="24" height="3.4" rx="1.7" fill="#3a4452"/>
          <circle cx="8" cy="11.7" r="2.6" fill="#0c0d10"/>
          <circle cx="32" cy="11.7" r="2.6" fill="#0c0d10"/>
          <rect x="13.5" y="27" width="13" height="36" rx="5" [attr.fill]="color()" stroke="rgba(0,0,0,.5)"/>
          <rect x="16" y="36" width="8" height="12" rx="2.5" fill="#fff" opacity=".22"/>
          <circle cx="20" cy="31" r="1.6" fill="#6fdca8"/>
          <rect x="16.5" y="60" width="7" height="9" rx="3" fill="#0c0d10"/>
        }

        @default {
          <rect x="3" y="8" width="5" height="12" rx="2" fill="#0c0d10"/>
          <rect x="32" y="8" width="5" height="12" rx="2" fill="#0c0d10"/>
          <rect x="3" y="48" width="5" height="12" rx="2" fill="#0c0d10"/>
          <rect x="32" y="48" width="5" height="12" rx="2" fill="#0c0d10"/>
          <rect x="5" y="1" width="30" height="70" rx="12" [attr.fill]="color()" stroke="rgba(0,0,0,.5)"/>
          <path d="M10 24 Q20 19 30 24 L28 34 L12 34Z" fill="#2b3d50"/>
          <rect x="11" y="36" width="18" height="14" rx="4" fill="#fff" opacity=".18"/>
          <path d="M12 52 L28 52 L30 59 Q20 62 10 59Z" fill="#2b3d50"/>
          <rect x="8" y="3" width="7" height="3" rx="1.5" fill="#fff7c2"/>
          <rect x="25" y="3" width="7" height="3" rx="1.5" fill="#fff7c2"/>
        }

      }
    </svg>
  `,
  styles: [`
    :host { display: inline-block; line-height: 0; }
    svg { display: block; width: 100%; height: 100%; }
  `]
})
export class VehiculoIcono {
  tipo = input<TipoVehiculo>('Carro');
  color = input<string>('#8fa3b3');
}