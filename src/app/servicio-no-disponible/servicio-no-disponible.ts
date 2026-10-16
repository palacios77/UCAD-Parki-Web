import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-servicio-no-disponible',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './servicio-no-disponible.html',
  styleUrl: './servicio-no-disponible.css'
})
export class ServicioNoDisponible {
  constructor(private router: Router) {}

  reintentar(): void {
    window.location.reload();
  }
}
