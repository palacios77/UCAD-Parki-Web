import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Salida } from './salida';

describe('Salida', () => {
  let component: Salida;
  let fixture: ComponentFixture<Salida>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Salida],
    }).compileComponents();

    fixture = TestBed.createComponent(Salida);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
