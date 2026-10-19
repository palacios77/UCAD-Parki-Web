import { Component, computed, input, output } from '@angular/core';

/** Paginación reutilizable: <app-paginacion [total]="n" [pagina]="p" [porPagina]="10" (cambio)="p = $event" /> */
@Component({
  selector: 'app-paginacion',
  template: `
    @if (total() > 0) {
      <div class="pag">
        <span class="pag-info">
          Mostrando {{ desde() }}–{{ hasta() }} de {{ total() }}
        </span>

        <div class="pag-botones">
          <button type="button" (click)="ir(pagina() - 1)" [disabled]="pagina() <= 1" aria-label="Anterior">
            ‹
          </button>

          @for (n of numeros(); track $index) {
            @if (n === 0) {
              <span class="pag-puntos">…</span>
            } @else {
              <button
                type="button"
                [class.activa]="n === pagina()"
                (click)="ir(n)">
                {{ n }}
              </button>
            }
          }

          <button type="button" (click)="ir(pagina() + 1)" [disabled]="pagina() >= totalPaginas()" aria-label="Siguiente">
            ›
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .pag {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      padding-top: 14px;
      font-size: 13px;
      color: #6b7a8c;
    }
    .pag-botones { display: flex; gap: 4px; align-items: center; }
    .pag-botones button {
      min-width: 34px;
      height: 34px;
      padding: 0 8px;
      font-size: 14px;
      font-weight: 600;
      color: #123f6b;
      background: #fff;
      border: 1px solid #c9d3df;
      border-radius: 8px;
      cursor: pointer;
    }
    .pag-botones button:hover:not(:disabled) { border-color: #087fd1; color: #087fd1; }
    .pag-botones button.activa { color: #fff; background: #087fd1; border-color: #087fd1; }
    .pag-botones button:disabled { opacity: .45; cursor: not-allowed; }
    .pag-puntos { padding: 0 4px; color: #9aa8b7; }
  `]
})
export class Paginacion {
  total = input.required<number>();
  pagina = input<number>(1);
  porPagina = input<number>(10);
  cambio = output<number>();

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / this.porPagina())));
  desde = computed(() => (this.total() === 0 ? 0 : (this.pagina() - 1) * this.porPagina() + 1));
  hasta = computed(() => Math.min(this.pagina() * this.porPagina(), this.total()));

  /** 0 = puntos suspensivos */
  numeros = computed(() => {
    const total = this.totalPaginas();
    const actual = this.pagina();

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const lista = new Set([1, total, actual - 1, actual, actual + 1]);
    const orden = [...lista].filter(n => n >= 1 && n <= total).sort((a, b) => a - b);
    const salida: number[] = [];

    orden.forEach((n, i) => {
      if (i > 0 && n - orden[i - 1] > 1) {
        salida.push(0);
      }
      salida.push(n);
    });

    return salida;
  });

  ir(n: number): void {
    if (n >= 1 && n <= this.totalPaginas() && n !== this.pagina()) {
      this.cambio.emit(n);
    }
  }
}