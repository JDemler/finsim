import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MoneydisplayComponent } from './moneydisplay/moneydisplay.component';
import { MonteCarloSimulationComponent } from './monte-carlo-simulation/monte-carlo-simulation.component';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MoneydisplayComponent, MonteCarloSimulationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass'
})
export class AppComponent {
  title = 'planner';
}
