import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core'; // Added ViewChild, AfterViewInit
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Plan } from '../plan/plan.component';
import { MonteCarloSimulationComponent } from '../monte-carlo-simulation/monte-carlo-simulation.component';
import { PlanComponent } from '../plan/plan.component';

@Component({
  selector: 'app-financial-planner',
  standalone: true,
  imports: [CommonModule, FormsModule, MonteCarloSimulationComponent, PlanComponent],
  templateUrl: './financial-planner.component.html',
  styleUrls: ['./financial-planner.component.sass']
})
export class FinancialPlannerComponent implements OnInit, AfterViewInit { // Implemented AfterViewInit
  @ViewChild(MonteCarloSimulationComponent) simulationComponent!: MonteCarloSimulationComponent;

  initialInvestment: number = 50000;
  plans: Plan[] = [];
  nextPlanId: number = 1;

  constructor() { }

  ngOnInit(): void {
    // Initial preview simulation will be called in ngAfterViewInit
  }

  ngAfterViewInit(): void {
    // Ensures simulationComponent is initialized before calling runPreviewSimulation
    this.runPreviewSimulation();
  }

  runPreviewSimulation(): void {
    // Use setTimeout to ensure ViewChild is updated and available in the next change detection cycle
    setTimeout(() => {
      if (this.simulationComponent) {
        this.simulationComponent.numSimulations = 10;
        this.simulationComponent.runSimulation();
      } else {
        console.warn("Simulation component not available for preview.");
      }
    }, 0);
  }

  runFullSimulation(): void {
    // Use setTimeout for consistency, though direct call might also work here
    setTimeout(() => {
      if (this.simulationComponent) {
        this.simulationComponent.numSimulations = 10000;
        this.simulationComponent.runSimulation();
      } else {
        console.warn("Simulation component not available for full simulation.");
      }
    }, 0);
  }

  addPlan(type: 'salary' | 'savings' | 'withdrawal'): void {
    const newPlan: Plan = {
      id: this.nextPlanId++,
      type: type,
      amount: 0,
      startYear: 0,
      duration: 1,
      // Conditional properties
      yearlyIncrease: type === 'salary' ? 0 : undefined,
      isPercentage: type === 'savings' ? false : undefined,
    };
    this.plans = [...this.plans, newPlan];
    this.runPreviewSimulation();
  }

  removePlan(planId: number): void {
    this.plans = this.plans.filter(plan => plan.id !== planId);
    this.runPreviewSimulation();
  }

  onPlanChange(changedPlan: Plan): void {
    const index = this.plans.findIndex(plan => plan.id === changedPlan.id);
    if (index !== -1) {
      this.plans = [
        ...this.plans.slice(0, index),
        changedPlan,
        ...this.plans.slice(index + 1)
      ];
    }
    this.runPreviewSimulation();
  }
}
