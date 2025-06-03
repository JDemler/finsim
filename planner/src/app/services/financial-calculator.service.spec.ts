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
      events: [],
      years: 1
    };

    const results = service.calculate(params);
    expect(results[0].baselineInvestments).toBe(10000);
    expect(results[1].baselineInvestments).toBe(10500);
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
      events: [],
      years: 1
    };

    const results = service.calculate(params);
    expect(results[0].cashBalance).toBe(0);
    expect(results[1].cashBalance).toBe(12000);
  });

  it('should handle percentage-based savings if no cashflow', () => {
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
      events: [],
      years: 1
    };

    const results = service.calculate(params);
    expect(results[0].netInvestments).toBe(0);
    expect(results[0].cashBalance).toBe(10000);
    expect(results[1].netInvestments).toBe(0);
    expect(results[1].cashBalance).toBe(10000);
  });

  it('should handle percentage-based savings with cashflow', () => {
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
      },
      {
        id: 2,
        type: 'salary',
        amount: 2000,
        startYear: 0,
        duration: 1
      }],
      events: [],
      years: 1
    };

    const results = service.calculate(params);
    expect(results[0].cashBalance).toBe(10000);
    expect(results[0].netInvestments).toBe(12000);
    expect(results[1].cashBalance).toBe(22000);
    expect(results[1].netInvestments).toBe(0);
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
      events: [],
      years: 2
    };

    const results = service.calculate(params);
    expect(results[0].cashBalance).toBe(0);
    expect(results[1].cashBalance).toBe(12000);
    expect(results[2].cashBalance).toBe(25200);
  });

  it('should handle withdrawal plans', () => {
    const params: CalculationParams = {
      initialInvestment: 1000,
      initialCash: 0,
      monthlyExpenses: 0,
      interestRate: 0.05,
      plans: [{
        id: 1,
        type: 'withdrawal',
        amount: 10,
        startYear: 0,
        duration: 1
      }],
      events: [],
      years: 1
    };

    const results = service.calculate(params);
    expect(results[0].investmentBalance).toBe(1000);
    expect(results[0].cashBalance).toBe(0);
    expect(results[1].investmentBalance).toBe(945);
    expect(results[1].cashBalance).toBe(105);
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
      events: [],
      years: 1
    };

    const results = service.calculate(params);
    expect(results[0].cashBalance).toBe(5000);
    expect(results[0].investmentBalance).toBe(10000);
    expect(results[1].cashBalance).toBe(11000);
    expect(results[1].investmentBalance).toBe(16500);
  });

  it('should handle negative cash balance', () => {
    const params: CalculationParams = {
      initialInvestment: 0,
      initialCash: 1000,
      monthlyExpenses: 2000,
      interestRate: 0,
      plans: [],
      events: [],
      years: 1
    };

    const results = service.calculate(params);
    expect(results[0].cashBalance).toBe(1000);
    expect(results[1].cashBalance).toBe(-23000);
  });

  // Add more tests...
});