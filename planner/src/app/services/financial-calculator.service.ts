import { Injectable } from '@angular/core';
import { Plan } from '../plan/plan.component';

export interface YearlyResult {
  year: number;
  investmentBalance: number;
  cashBalance: number;
  netInvestments: number;
  baselineInvestments: number;
}

export interface CalculationParams {
  initialInvestment: number;
  initialCash: number;
  monthlyExpenses: number;
  interestRate: number;
  plans: Plan[];
  years: number;
}

@Injectable({
  providedIn: 'root'
})
export class FinancialCalculatorService {

  calculate(params: CalculationParams): YearlyResult[] {
    const results: YearlyResult[] = [];
    let investmentBalance = params.initialInvestment;
    let cashBalance = params.initialCash;
    let baselineAmount = params.initialInvestment;

    for (let year = 0; year <= params.years; year++) {
      let yearlyIncome = 0;
      let yearlyExpenses = params.monthlyExpenses * 12;
      let yearlyInvestments = 0;
      let yearlyWithdrawals = 0;

      // 1. Process all salary plans first
      for (const plan of params.plans.filter(p => p.type === 'salary')) {
        if (this.isPlanActive(plan, year)) {
          const salary = this.calculateAdjustedAmount(plan, year);
          yearlyIncome += salary * 12;
        }
      }

      // 2. Update cash balance with income and base expenses
      cashBalance += yearlyIncome - yearlyExpenses;

      // 3. Process withdrawal plans
      for (const plan of params.plans.filter(p => p.type === 'withdrawal')) {
        if (this.isPlanActive(plan, year)) {
          const withdrawalPercentage = plan.amount;
          const withdrawalAmount = investmentBalance * (withdrawalPercentage / 100);
          investmentBalance -= withdrawalAmount;
          cashBalance += withdrawalAmount;
          yearlyWithdrawals += withdrawalAmount;
        }
      }

      // 4. Process savings plans
      for (const plan of params.plans.filter(p => p.type === 'savings')) {
        if (this.isPlanActive(plan, year)) {
          const savingsAmount = this.calculateSavingsAmount(plan, cashBalance);
          if (savingsAmount > 0) {
            investmentBalance += savingsAmount;
            cashBalance -= savingsAmount;
            yearlyInvestments += savingsAmount;
          }
        }
      }

      // 5. Apply interest for next year
      investmentBalance *= (1 + params.interestRate);
      baselineAmount *= (1 + params.interestRate);

      // Store results
      results.push({
        year,
        investmentBalance,
        cashBalance,
        netInvestments: yearlyInvestments - yearlyWithdrawals,
        baselineInvestments: baselineAmount
      });
    }

    return results;
  }

  private isPlanActive(plan: Plan, year: number): boolean {
    return year >= plan.startYear && year < (plan.startYear + plan.duration);
  }

  private calculateAdjustedAmount(plan: Plan, year: number): number {
    if (plan.type === 'salary' && plan.yearlyIncrease) {
      return plan.amount * Math.pow(1 + plan.yearlyIncrease/100, year - plan.startYear);
    }
    return plan.amount;
  }

  private calculateSavingsAmount(plan: Plan, cashBalance: number): number {
    if (plan.isPercentage) {
      return cashBalance > 0 ? cashBalance * (plan.amount / 100) : 0;
    }
    return plan.amount * 12;
  }
}