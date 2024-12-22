import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, NgIf, PercentPipe } from '@angular/common';

export interface Plan {
  id: number;
  type: 'savings' | 'withdrawal' | 'salary';
  amount: number;
  isPercentage?: boolean;
  startYear: number;
  duration: number;
  yearlyIncrease?: number;
}

@Component({
  selector: 'app-plan',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, PercentPipe, NgIf],
  templateUrl: './plan.component.html',
  styleUrl: './plan.component.sass'
})
export class PlanComponent {
  @Input() plan!: Plan;
  @Output() planChange = new EventEmitter<Plan>();
  @Output() removePlan = new EventEmitter<number>();

  get inputLabel(): string {
    switch(this.plan.type) {
      case 'savings': return this.plan.isPercentage ? 'Percentage of Cash Flow:' : 'Monthly Amount:';
      case 'withdrawal': return 'Yearly Withdrawal:';
      case 'salary': return 'Monthly Salary:';
      default: return '';
    }
  }

  get stepValue(): number {
    switch(this.plan.type) {
      case 'savings': return this.plan.isPercentage ? 1 : 50;
      case 'withdrawal': return 0.1;
      case 'salary': return 100;
      default: return 1;
    }
  }

  get showPercentageToggle(): boolean {
    return this.plan.type === 'savings';
  }

  onInputChange() {
    this.planChange.emit(this.plan);
  }

  onRemove() {
    this.removePlan.emit(this.plan.id);
  }
}
