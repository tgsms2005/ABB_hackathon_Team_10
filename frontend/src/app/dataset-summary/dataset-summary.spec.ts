import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatasetSummary } from './dataset-summary';

describe('DatasetSummary', () => {
  let component: DatasetSummary;
  let fixture: ComponentFixture<DatasetSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatasetSummary]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DatasetSummary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
