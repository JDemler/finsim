import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, NgFor, PercentPipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { PlanComponent, Plan } from '../plan/plan.component';

@Component({
  selector: 'app-moneydisplay',
  imports: [FormsModule, CurrencyPipe, PercentPipe, BaseChartDirective, NgFor, PlanComponent],
  templateUrl: './moneydisplay.component.html',
  styleUrl: './moneydisplay.component.sass'
})
export class MoneydisplayComponent {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  totalMoney = 1000;
  interestRate = 0.05;
  plans: Plan[] = [];
  nextPlanId = 1;

  public lineChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [],
        label: 'Without Plans',
        borderColor: 'rgba(148,159,177,1)',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        tension: 0.5,
      },
      {
        data: [],
        label: 'With Plans',
        borderColor: 'rgba(77,183,96,1)',
        pointBackgroundColor: 'rgba(77,183,96,1)',
        tension: 0.5,
      },
      {
        data: [],
        label: 'Cash Flow',
        borderColor: 'rgba(255,140,0,1)',
        pointBackgroundColor: 'rgba(255,140,0,1)',
        tension: 0.5,
        yAxisID: 'cashflow'
      }
    ],
    labels: []
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        position: 'left',
        ticks: {
          callback: (value) => '€' + value
        }
      },
      cashflow: {
        beginAtZero: true,
        position: 'right',
        ticks: {
          callback: (value) => '€' + value + '/yr'
        },
        grid: {
          drawOnChartArea: false
        }
      }
    }
  };

  public lineChartType: ChartType = 'line';

  ngOnInit() {
    this.calculateProjections();
  }

  onInputChange() {
    this.calculateProjections();
  }

  onPlanChange(plan: Plan) {
    this.calculateProjections();
  }

  addPlan(type: 'savings' | 'withdrawal' | 'salary') {
    this.plans.push({
      id: this.nextPlanId++,
      type,
      amount: type === 'withdrawal' ? 4 : 1000, // Default €1000 for salary/savings, 4% for withdrawal
      startYear: 0,
      duration: 10,
      yearlyIncrease: type === 'salary' ? 2 : undefined // 2% default increase for salary
    });
    this.calculateProjections();
  }

  removePlan(id: number) {
    this.plans = this.plans.filter(plan => plan.id !== id);
    this.calculateProjections();
  }

  calculateProjections() {
    const withoutPlans = [];
    const withPlans = [];
    const cashFlow = [];
    let baseAmount = this.totalMoney;
    let plannedAmount = this.totalMoney;

    // Clear previous data
    this.lineChartData.datasets[0].data = [];
    this.lineChartData.datasets[1].data = [];
    this.lineChartData.datasets[2].data = [];
    this.lineChartData.labels = [];

    // Calculate for next 25 years
    for (let year = 0; year <= 25; year++) {
      let yearlyIncome = 0;
      let yearlyExpenses = 0;

      withoutPlans.push(baseAmount);
      withPlans.push(plannedAmount);
      this.lineChartData.labels?.push('Year ' + year);

      // Base calculation (without plans)
      baseAmount *= (1 + this.interestRate);

      // With plans calculation
      plannedAmount *= (1 + this.interestRate);

      // Apply all active plans for this year
      for (const plan of this.plans) {
        if (year >= plan.startYear && year < (plan.startYear + plan.duration)) {
          const adjustedAmount = plan.type === 'salary' && plan.yearlyIncrease
            ? plan.amount * Math.pow(1 + plan.yearlyIncrease/100, year - plan.startYear)
            : plan.amount;

          switch (plan.type) {
            case 'savings':
              plannedAmount += adjustedAmount * 12;
              yearlyExpenses += adjustedAmount * 12;
              break;
            case 'withdrawal':
              const withdrawalAmount = plannedAmount * (adjustedAmount / 100);
              plannedAmount -= withdrawalAmount;
              yearlyIncome += withdrawalAmount;
              break;
            case 'salary':
              yearlyIncome += adjustedAmount * 12;
              break;
          }
        }
      }

      cashFlow.push(yearlyIncome - yearlyExpenses);
    }

    this.lineChartData.datasets[0].data = withoutPlans;
    this.lineChartData.datasets[1].data = withPlans;
    this.lineChartData.datasets[2].data = cashFlow;
    this.chart?.update();
  }
}
