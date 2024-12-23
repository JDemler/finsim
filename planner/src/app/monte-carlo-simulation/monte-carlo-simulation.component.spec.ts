import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonteCarloSimulationComponent } from './monte-carlo-simulation.component';

describe('MonteCarloSimulationComponent', () => {
  let component: MonteCarloSimulationComponent;
  let fixture: ComponentFixture<MonteCarloSimulationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonteCarloSimulationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonteCarloSimulationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
