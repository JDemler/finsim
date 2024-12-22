import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MoneydisplayComponent } from './moneydisplay/moneydisplay.component';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MoneydisplayComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass'
})
export class AppComponent {
  title = 'planner';
}
