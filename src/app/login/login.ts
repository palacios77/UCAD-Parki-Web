import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  correo: string = '';
  contrasena: string = '';
  mensaje: string = '';

  constructor(private router: Router) {}

  iniciarSesion(): void {

    if (this.correo === '' || this.contrasena === '') {
      this.mensaje = 'Ingrese su correo y contraseña.';
      return;
    }

    this.mensaje = '';

    this.router.navigate(['/dashboard']);

  }

}