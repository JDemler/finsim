import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoneydisplayComponent } from './moneydisplay.component';

describe('MoneydisplayComponent', () => {
  let component: MoneydisplayComponent;
  let fixture: ComponentFixture<MoneydisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoneydisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoneydisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
