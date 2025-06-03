import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, NgFor, NgIf, PercentPipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { PlanComponent, Plan } from '../plan/plan.component';
import annotationPlugin from 'chartjs-plugin-annotation';
import { FinancialCalculatorService, FinancialEvent } from '../services/financial-calculator.service';

@Component({
  selector: 'app-moneydisplay',
  imports: [FormsModule, CurrencyPipe, PercentPipe, NgIf, BaseChartDirective, NgFor, PlanComponent],
  templateUrl: './moneydisplay.component.html',
  styleUrl: './moneydisplay.component.sass'
})
export class MoneydisplayComponent {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  totalMoney = 1000;
  startingCash = 5000;
  monthlyExpenses = 2000;
  interestRate = 0.05;
  plans: Plan[] = [];
  events: FinancialEvent[] = [];
  nextPlanId = 1;
  investedAmount = 0;

  constructor(private calculator: FinancialCalculatorService) {
    Chart.register(annotationPlugin);
  }

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
        label: 'Cash Balance',
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
    },
    plugins: {
      annotation: {
          annotations: {
            'box-1': {
              // Indicates the type of annotation
              type: 'box',
              xMin: 0,
              xMax: 5,
              yMin: 50,
              yMax: 1000,
              backgroundColor: 'rgba(0,0,0,0.15)',
              borderColor: 'rgba(0,0,0,0)',
              label: {
                display: true,
                content: 'Plan 1: Savings',
                position: 'start'
              }
            }
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

  addKid(year: number) {
    this.events.push({
      type: 'kid',
      year,
      monthlyExpenseIncrease: 500, // Default €500 per month
      salaryReductionPercent: 20,  // Default 20% reduction
      salaryReductionYears: 3      // Default 3 years reduction
    });
    this.calculateProjections();
  }

  removeEvent(year: number, type: string) {
    this.events = this.events.filter(e => !(e.year === year && e.type === type));
    this.calculateProjections();
  }

  calculateProjections() {
    const results = this.calculator.calculate({
      initialInvestment: this.totalMoney,
      initialCash: this.startingCash,
      monthlyExpenses: this.monthlyExpenses,
      interestRate: this.interestRate,
      plans: this.plans,
      events: this.events,
      years: 25
    });

    // Update chart data
    this.lineChartData.datasets[0].data = results.map(r => r.baselineInvestments);
    this.lineChartData.datasets[1].data = results.map(r => r.investmentBalance);
    this.lineChartData.datasets[2].data = results.map(r => r.cashBalance);
    this.lineChartData.datasets[3].data = results.map(r => r.netInvestments);
    this.lineChartData.labels = results.map(r => "Year " + r.year);

    this.investedAmount = this.totalMoney +
      results.reduce((sum, r) => sum + r.netInvestments, 0);

    // Create new chart options with updated annotations
    this.lineChartOptions = {
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
        },
        percentages: {
          beginAtZero: true,
          position: 'right',
          min: 0,
          max: 100,
          grid: {
            drawOnChartArea: false
          },
          display: false
        }
      },
      plugins: {
        annotation: {
          annotations: {
            ...this.plans.reduce((acc, plan, index) => {
              // Calculate vertical position for each annotation
              const heightPerAnnotation = 8;
              const spacing = 1;
              const yStart = index * (heightPerAnnotation + spacing);

              // Color based on plan type
              const colors = {
                savings: 'rgba(77,183,96,0.15)',
                withdrawal: 'rgba(255,140,0,0.15)',
                salary: 'rgba(33,150,243,0.15)'
              };

              // Find plans that start in the same year
              const plansStartingSameYear = this.plans.filter(p => p.startYear === plan.startYear);
              const positionInGroup = plansStartingSameYear.findIndex(p => p.id === plan.id);
              const labelOffset = positionInGroup * 120;

              acc[`plan-${plan.id}`] = {
                type: 'box',
                yScaleID: 'percentages',
                xMin: plan.startYear,
                xMax: plan.startYear + plan.duration,
                yMin: `0`,
                yMax: `${yStart + heightPerAnnotation}%`,
                backgroundColor: colors[plan.type],
                borderColor: 'rgba(0,0,0,0)',
                label: {
                  display: true,
                  content: `Plan ${plan.id}: ${plan.type}`,
                  position: {
                    x: 'start',
                    y: 'center'
                  },
                  font: {
                    size: 11
                  },
                  color: 'rgba(0,0,0,0.7)',
                  padding: {
                    top: 4,
                    bottom: 4,
                    left: 6,
                    right: 6
                  },
                  xAdjust: labelOffset
                }
              };
              return acc;
            }, {} as any),
            ...this.events.reduce((acc, event, index) => {
              const heightPerAnnotation = 8;
              const spacing = 1;
              const yStart = -((index + 1) * (heightPerAnnotation + spacing)); // Negative to start from bottom

              if (event.type === 'kid') {
                acc[`event-kid-${event.year}`] = {
                  type: 'box',
                  yScaleID: 'percentages',
                  xMin: event.year,
                  xMax: event.year + 18, // Kid expenses last 18 years
                  yMin: index * 5,// `${yStart}%`,
                  yMax: index * 5 + 5,// `${yStart + heightPerAnnotation}%`,
                  backgroundColor: 'rgba(233,30,99,0.15)', // Pink for kids
                  borderColor: 'rgba(233,30,99,0.55)',
                  label: {
                    display: true,
                    content: `Kid born: Year ${event.year}`,
                    position: {
                      x: 'start',
                      y: 'center'
                    },
                    font: {
                      size: 11
                    },
                    color: 'rgba(0,0,0,0.7)',
                    padding: {
                      top: 4,
                      bottom: 4,
                      left: 6,
                      right: 6
                    }
                  }
                };
              }
              return acc;
            }, {} as any)
          }
        }
      }
    };

    if (this.chart) {
      this.chart.update();
    }
  }
}
