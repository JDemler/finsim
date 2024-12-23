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
      // Store results at the beginning of the year
      results.push({
        year,
        investmentBalance,
        cashBalance,
        netInvestments: 0, // Will be updated for this year
        baselineInvestments: baselineAmount
      });

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

      // Calculate yearly cashflow
      const yearlyCashflow = yearlyIncome - yearlyExpenses;

      // 2. Update cash balance with income and base expenses
      cashBalance += yearlyCashflow;

      // 3. Apply interest for next year
      investmentBalance *= (1 + params.interestRate);
      baselineAmount *= (1 + params.interestRate);

      // 4. Process withdrawal plans
      for (const plan of params.plans.filter(p => p.type === 'withdrawal')) {
        if (this.isPlanActive(plan, year)) {
          const withdrawalPercentage = plan.amount;
          const withdrawalAmount = investmentBalance * (withdrawalPercentage / 100);
          investmentBalance -= withdrawalAmount;
          cashBalance += withdrawalAmount;
          yearlyWithdrawals += withdrawalAmount;
        }
      }

      // 5. Process savings plans
      for (const plan of params.plans.filter(p => p.type === 'savings')) {
        if (this.isPlanActive(plan, year)) {
          const savingsAmount = this.calculateSavingsAmount(plan, yearlyCashflow);
          if (savingsAmount > 0) {
            investmentBalance += savingsAmount;
            cashBalance -= savingsAmount;
            yearlyInvestments += savingsAmount;
          }
        }
      }

      // Update netInvestments for the current year's results
      results[year].netInvestments = yearlyInvestments - yearlyWithdrawals;
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

  private calculateSavingsAmount(plan: Plan, yearlyCashflow: number): number {
    if (plan.isPercentage) {
      return yearlyCashflow > 0 ? yearlyCashflow * (plan.amount / 100) : 0;
    }
    return plan.amount * 12;
  }
}