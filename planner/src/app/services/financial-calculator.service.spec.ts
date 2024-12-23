import { TestBed } from '@angular/core/testing';
import { FinancialCalculatorService, CalculationParams } from './financial-calculator.service';
import { Plan } from '../plan/plan.component';

describe('FinancialCalculatorService', () => {
  let service: FinancialCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FinancialCalculatorService);
  });

  it('should calculate baseline investment growth', () => {
    const params: CalculationParams = {
      initialInvestment: 10000,
      initialCash: 0,
      monthlyExpenses: 0,
      interestRate: 0.05,
      plans: [],
      years: 1
    };

    const results = service.calculate(params);
    expect(results[1].baselineInvestments).toBeCloseTo(10500);
  });

  it('should handle salary income', () => {
    const params: CalculationParams = {
      initialInvestment: 0,
      initialCash: 0,
      monthlyExpenses: 1000,
      interestRate: 0.05,
      plans: [{
        id: 1,
        type: 'salary',
        amount: 2000,
        startYear: 0,
        duration: 1,
        yearlyIncrease: 0
      }],
      years: 1
    };

    const results = service.calculate(params);
    // Yearly: (2000 * 12) - (1000 * 12) = 12000
    expect(results[1].cashBalance).toBe(12000);
  });

  it('should handle percentage-based savings', () => {
    const params: CalculationParams = {
      initialInvestment: 0,
      initialCash: 10000,
      monthlyExpenses: 0,
      interestRate: 0.05,
      plans: [{
        id: 1,
        type: 'savings',
        amount: 50,
        isPercentage: true,
        startYear: 0,
        duration: 1
      }],
      years: 1
    };

    const results = service.calculate(params);
    expect(results[0].netInvestments).toBe(5000); // 50% of 10000
    expect(results[0].cashBalance).toBe(5000);
  });

  it('should handle salary with yearly increase', () => {
    const params: CalculationParams = {
      initialInvestment: 0,
      initialCash: 0,
      monthlyExpenses: 0,
      interestRate: 0,
      plans: [{
        id: 1,
        type: 'salary',
        amount: 1000,
        startYear: 0,
        duration: 2,
        yearlyIncrease: 10
      }],
      years: 2
    };

    const results = service.calculate(params);
    expect(results[0].cashBalance).toBe(12000);  // First year: 1000 * 12
    expect(results[1].cashBalance).toBe(25200);  // Second year: (1000 * 1.1) * 12 + 12000
  });

  it('should handle withdrawal plans', () => {
    const params: CalculationParams = {
      initialInvestment: 100000,
      initialCash: 0,
      monthlyExpenses: 0,
      interestRate: 0.05,
      plans: [{
        id: 1,
        type: 'withdrawal',
        amount: 10,  // 10% withdrawal
        startYear: 0,
        duration: 1
      }],
      years: 1
    };

    const results = service.calculate(params);
    expect(results[0].investmentBalance).toBe(90000);  // 100000 - 10%
    expect(results[0].cashBalance).toBe(10000);  // Withdrawn amount
  });

  it('should handle multiple concurrent plans', () => {
    const params: CalculationParams = {
      initialInvestment: 10000,
      initialCash: 5000,
      monthlyExpenses: 1000,
      interestRate: 0.05,
      plans: [
        {
          id: 1,
          type: 'salary',
          amount: 2000,
          startYear: 0,
          duration: 1
        },
        {
          id: 2,
          type: 'savings',
          amount: 500,
          startYear: 0,
          duration: 1
        }
      ],
      years: 1
    };

    const results = service.calculate(params);
    // Initial cash: 5000
    // Yearly salary: 24000
    // Yearly expenses: -12000
    // Yearly savings: -6000
    expect(results[0].cashBalance).toBe(11000);
    expect(results[0].investmentBalance).toBeCloseTo(16900); // 10000 + 6000 savings + 5% interest
  });

  it('should handle negative cash balance', () => {
    const params: CalculationParams = {
      initialInvestment: 0,
      initialCash: 1000,
      monthlyExpenses: 2000,
      interestRate: 0,
      plans: [],
      years: 1
    };

    const results = service.calculate(params);
    expect(results[1].cashBalance).toBe(-23000); // 1000 - (2000 * 12)
  });

  // Add more tests...
});