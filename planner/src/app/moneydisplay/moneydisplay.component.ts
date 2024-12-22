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
      },
      {
        data: [],
        label: 'Net Investments',
        borderColor: 'rgba(156,39,176,1)',
        pointBackgroundColor: 'rgba(156,39,176,1)',
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
      amount: type === 'withdrawal' ? 4 : 1000,
      isPercentage: false,
      startYear: 0,
      duration: 10,
      yearlyIncrease: type === 'salary' ? 2 : undefined
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
    const netInvestments = [];
    let baseAmount = this.totalMoney;
    let plannedAmount = this.totalMoney;

    // Clear previous data
    this.lineChartData.datasets[0].data = [];
    this.lineChartData.datasets[1].data = [];
    this.lineChartData.datasets[2].data = [];
    this.lineChartData.datasets[3].data = [];
    this.lineChartData.labels = [];

    // Calculate for next 25 years
    for (let year = 0; year <= 25; year++) {
      let yearlyIncome = 0;
      let yearlyExpenses = 0;
      let yearlyInvestments = 0;
      let yearlyWithdrawals = 0;

      // First calculate income (salary and withdrawals)
      for (const plan of this.plans) {
        if (year >= plan.startYear && year < (plan.startYear + plan.duration)) {
          const adjustedAmount = plan.type === 'salary' && plan.yearlyIncrease
            ? plan.amount * Math.pow(1 + plan.yearlyIncrease/100, year - plan.startYear)
            : plan.amount;

          if (plan.type === 'salary') {
            yearlyIncome += adjustedAmount * 12;
          } else if (plan.type === 'withdrawal') {
            const withdrawalAmount = plannedAmount * (adjustedAmount / 100);
            plannedAmount -= withdrawalAmount;
            yearlyIncome += withdrawalAmount;
            yearlyWithdrawals += withdrawalAmount;
          }
        }
      }

      // Then calculate savings based on cash flow
      for (const plan of this.plans) {
        if (plan.type === 'savings' && year >= plan.startYear && year < (plan.startYear + plan.duration)) {
          if (plan.isPercentage) {
            // Calculate savings as percentage of positive cash flow
            const currentCashFlow = yearlyIncome - yearlyExpenses;
            if (currentCashFlow > 0) {
              const savingsAmount = currentCashFlow * (plan.amount / 100);
              plannedAmount += savingsAmount;
              yearlyExpenses += savingsAmount;
              yearlyInvestments += savingsAmount;
            }
          } else {
            // Fixed monthly savings
            const savingsAmount = plan.amount * 12;
            plannedAmount += savingsAmount;
            yearlyExpenses += savingsAmount;
            yearlyInvestments += savingsAmount;
          }
        }
      }

      withoutPlans.push(baseAmount);
      withPlans.push(plannedAmount);
      cashFlow.push(yearlyIncome - yearlyExpenses);
      netInvestments.push(yearlyInvestments - yearlyWithdrawals);

      this.lineChartData.labels?.push('Year ' + year);

      // Apply interest for next year
      baseAmount *= (1 + this.interestRate);
      plannedAmount *= (1 + this.interestRate);
    }

    this.lineChartData.datasets[0].data = withoutPlans;
    this.lineChartData.datasets[1].data = withPlans;
    this.lineChartData.datasets[2].data = cashFlow;
    this.lineChartData.datasets[3].data = netInvestments;
    this.chart?.update();
  }
}
