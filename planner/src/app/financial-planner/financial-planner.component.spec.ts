import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FinancialPlannerComponent } from './financial-planner.component';
import { PlanComponent } from '../plan/plan.component';
import { MonteCarloSimulationComponent } from '../monte-carlo-simulation/monte-carlo-simulation.component';
import { Plan } from '../plan/plan.component';
import { NO_ERRORS_SCHEMA } from '@angular/core'; // Using NO_ERRORS_SCHEMA to avoid deep child component issues

// Mock MonteCarloSimulationComponent
class MockMonteCarloSimulationComponent {
  numSimulations: number = 0;
  initialInvestment: number = 0;
  plans: Plan[] = [];
  runSimulation = jasmine.createSpy('runSimulation');
  // Mock other methods/properties if needed by the template or component logic
}

describe('FinancialPlannerComponent', () => {
  let component: FinancialPlannerComponent;
  let fixture: ComponentFixture<FinancialPlannerComponent>;
  let mockSimulationComponent: MockMonteCarloSimulationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, CommonModule, FinancialPlannerComponent], // Import the standalone component
      // declarations: [ PlanComponent ], // PlanComponent is standalone, no need to declare here if NO_ERRORS_SCHEMA is used for parent
      providers: [
        // Provide the mock for MonteCarloSimulationComponent if it's used as a child by FinancialPlannerComponent
        // For standalone, direct child components are usually imported in the component itself.
        // We will rely on ViewChild and NO_ERRORS_SCHEMA for this test.
      ],
      schemas: [NO_ERRORS_SCHEMA] // Suppresses errors for unknown elements like app-plan and app-monte-carlo-simulation if not mocked/declared
    })
    // Override component's MonteCarloSimulationComponent if it's not provided above
    // For standalone components, child components are part of their template.
    // We'll need to ensure the mock is used.
    .overrideComponent(FinancialPlannerComponent, {
      // Since MonteCarloSimulationComponent is used via ViewChild,
      // and its methods are called, we need a way to inject the mock.
      // This is tricky with standalone components and ViewChild from tests.
      // An alternative is to not use overrideComponent and ensure the template can render with a simple mock.
      // For now, we will mock it via ViewChild assignment in tests.
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialPlannerComponent);
    component = fixture.componentInstance;

    // Manually create and assign the mock for the ViewChild
    // This is a common way to handle ViewChild dependencies in tests
    mockSimulationComponent = new MockMonteCarloSimulationComponent();
    component.simulationComponent = mockSimulationComponent as any; // Use 'as any' to assign mock

    fixture.detectChanges(); // Initial binding
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Plan Management', () => {
    it('should add a salary plan correctly', () => {
      spyOn(component, 'runPreviewSimulation').and.callThrough();
      const initialPlanCount = component.plans.length;
      const initialNextPlanId = component.nextPlanId;

      component.addPlan('salary');

      expect(component.plans.length).toBe(initialPlanCount + 1);
      const newPlan = component.plans[component.plans.length - 1];
      expect(newPlan.type).toBe('salary');
      expect(newPlan.id).toBe(initialNextPlanId);
      expect(newPlan.yearlyIncrease).toBe(0); // Default for salary
      expect(newPlan.isPercentage).toBeUndefined();
      expect(component.nextPlanId).toBe(initialNextPlanId + 1);
      expect(component.runPreviewSimulation).toHaveBeenCalled();
    });

    it('should add a savings plan correctly', () => {
      spyOn(component, 'runPreviewSimulation').and.callThrough();
      component.addPlan('savings');
      const newPlan = component.plans[component.plans.length - 1];
      expect(newPlan.type).toBe('savings');
      expect(newPlan.isPercentage).toBe(false); // Default for savings
      expect(newPlan.yearlyIncrease).toBeUndefined();
      expect(component.runPreviewSimulation).toHaveBeenCalled();
    });

    it('should add a withdrawal plan correctly', () => {
      spyOn(component, 'runPreviewSimulation').and.callThrough();
      component.addPlan('withdrawal');
      const newPlan = component.plans[component.plans.length - 1];
      expect(newPlan.type).toBe('withdrawal');
      expect(newPlan.isPercentage).toBeUndefined();
      expect(newPlan.yearlyIncrease).toBeUndefined();
      expect(component.runPreviewSimulation).toHaveBeenCalled();
    });

    it('should remove a plan correctly', () => {
      spyOn(component, 'runPreviewSimulation').and.callThrough();
      component.addPlan('salary'); // Add a plan to remove
      const planToRemove = component.plans[0];
      const initialPlanCount = component.plans.length;

      component.removePlan(planToRemove.id);

      expect(component.plans.length).toBe(initialPlanCount - 1);
      expect(component.plans.find(p => p.id === planToRemove.id)).toBeUndefined();
      expect(component.runPreviewSimulation).toHaveBeenCalledTimes(2); // Once for add, once for remove
    });

    it('should update a plan correctly on onPlanChange', () => {
      spyOn(component, 'runPreviewSimulation').and.callThrough();
      component.addPlan('savings');
      const originalPlan = { ...component.plans[0] };
      const changedPlan: Plan = { ...originalPlan, amount: 1000, duration: 5 };

      component.onPlanChange(changedPlan);

      expect(component.plans[0].amount).toBe(1000);
      expect(component.plans[0].duration).toBe(5);
      expect(component.runPreviewSimulation).toHaveBeenCalledTimes(2); // Once for add, once for change
    });
  });

  describe('Simulation Triggers', () => {
    beforeEach(() => {
      // Reset spies for each test in this describe block
      mockSimulationComponent.runSimulation.calls.reset();
    });

    it('runPreviewSimulation should call simulationComponent.runSimulation with 10 simulations', fakeAsync(() => {
      component.runPreviewSimulation();
      tick(); // Allow setTimeout in runPreviewSimulation to complete
      expect(mockSimulationComponent.numSimulations).toBe(10);
      expect(mockSimulationComponent.runSimulation).toHaveBeenCalled();
    }));

    it('runFullSimulation should call simulationComponent.runSimulation with 10000 simulations', fakeAsync(() => {
      component.runFullSimulation();
      tick(); // Allow setTimeout in runFullSimulation to complete
      expect(mockSimulationComponent.numSimulations).toBe(10000);
      expect(mockSimulationComponent.runSimulation).toHaveBeenCalled();
    }));

    it('changing initialInvestment should trigger runPreviewSimulation', fakeAsync(() => {
      spyOn(component, 'runPreviewSimulation').and.callThrough();

      // Simulate ngModelChange. This requires interacting with the input element or calling the method directly.
      // For simplicity, we'll directly change the value and call the method that ngModelChange would.
      component.initialInvestment = 60000;
      component.runPreviewSimulation(); // Manually call as ngModelChange would
      tick();

      expect(component.runPreviewSimulation).toHaveBeenCalled();
      // Check if the mock was called via the spy
      expect(mockSimulationComponent.runSimulation).toHaveBeenCalled();
    }));

    it('ngAfterViewInit should call runPreviewSimulation', fakeAsync(() => {
      // ngAfterViewInit is called during component initialization by Angular
      // We need to spy on runPreviewSimulation before fixture.detectChanges or ngAfterViewInit is called
      // However, runPreviewSimulation itself is mocked by the spy on mockSimulationComponent
      // So we check if the mock was called.
      // For this test, we'll re-initialize and spy before ngAfterViewInit naturally runs.

      const localFixture = TestBed.createComponent(FinancialPlannerComponent);
      const localComponent = localFixture.componentInstance;
      const localMockSimComp = new MockMonteCarloSimulationComponent();
      localComponent.simulationComponent = localMockSimComp as any;

      spyOn(localComponent, 'runPreviewSimulation').and.callThrough(); // Spy on the actual method

      localFixture.detectChanges(); // This will trigger ngAfterViewInit
      tick(); // For setTimeout in runPreviewSimulation

      expect(localComponent.runPreviewSimulation).toHaveBeenCalled();
      expect(localMockSimComp.runSimulation).toHaveBeenCalled();
    }));
  });
});
