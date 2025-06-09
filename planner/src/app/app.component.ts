import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FinancialPlannerComponent } from './financial-planner/financial-planner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FinancialPlannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass'
})
export class AppComponent {
  title = 'planner';
}
