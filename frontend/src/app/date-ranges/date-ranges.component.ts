import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../api.service';
 
@Component({
  selector: 'app-date-ranges',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    FormsModule
  ],
  template: `
    <div class="container">
      <div class="range-cards-container">
        <mat-card class="range-card">
          <mat-card-title>
            <mat-icon color="primary" style="vertical-align: middle;">school</mat-icon>
            Training Period
          </mat-card-title>
          <ng-container *ngIf="showFields">
            <mat-form-field appearance="fill">
              <mat-label>Start Date</mat-label>
              <input matInput [matDatepicker]="trainStartPicker" [(ngModel)]="ranges.training.start">
              <mat-datepicker-toggle matSuffix [for]="trainStartPicker"></mat-datepicker-toggle>
              <mat-datepicker #trainStartPicker></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="fill">
              <mat-label>End Date</mat-label>
              <input matInput [matDatepicker]="trainEndPicker" [(ngModel)]="ranges.training.end">
              <mat-datepicker-toggle matSuffix [for]="trainEndPicker"></mat-datepicker-toggle>
              <mat-datepicker #trainEndPicker></mat-datepicker>
            </mat-form-field>
          </ng-container>
        </mat-card>

        <mat-card class="range-card">
          <mat-card-title>
            <mat-icon color="primary" style="vertical-align: middle;">science</mat-icon>
            Testing Period
          </mat-card-title>
          <ng-container *ngIf="showFields">
            <mat-form-field appearance="fill">
              <mat-label>Start Date</mat-label>
              <input matInput [matDatepicker]="testStartPicker" [(ngModel)]="ranges.testing.start">
              <mat-datepicker-toggle matSuffix [for]="testStartPicker"></mat-datepicker-toggle>
              <mat-datepicker #testStartPicker></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="fill">
              <mat-label>End Date</mat-label>
              <input matInput [matDatepicker]="testEndPicker" [(ngModel)]="ranges.testing.end">
              <mat-datepicker-toggle matSuffix [for]="testEndPicker"></mat-datepicker-toggle>
              <mat-datepicker #testEndPicker></mat-datepicker>
            </mat-form-field>
          </ng-container>
        </mat-card>

        <mat-card class="range-card">
          <mat-card-title>
            <mat-icon color="primary" style="vertical-align: middle;">play_circle</mat-icon>
            Simulation Period
          </mat-card-title>
          <ng-container *ngIf="showFields">
            <mat-form-field appearance="fill">
              <mat-label>Start Date</mat-label>
              <input matInput [matDatepicker]="simStartPicker" [(ngModel)]="ranges.simulation.start">
              <mat-datepicker-toggle matSuffix [for]="simStartPicker"></mat-datepicker-toggle>
              <mat-datepicker #simStartPicker></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="fill">
              <mat-label>End Date</mat-label>
              <input matInput [matDatepicker]="simEndPicker" [(ngModel)]="ranges.simulation.end">
              <mat-datepicker-toggle matSuffix [for]="simEndPicker"></mat-datepicker-toggle>
              <mat-datepicker #simEndPicker></mat-datepicker>
            </mat-form-field>
          </ng-container>
        </mat-card>
      </div>

      <div class="actions">
        <button mat-raised-button color="primary" (click)="validateRanges()">
          <mat-icon>check_circle</mat-icon>
          Validate Ranges
        </button>
      </div>
      
      <div *ngIf="validationStatus" class="validation-message" [ngClass]="{'success-text': validationStatus === 'Valid'}">
        <mat-icon [color]="validationStatus === 'Valid' ? 'accent' : 'warn'">
          {{ validationStatus === 'Valid' ? 'check_circle' : 'warning' }}
        </mat-icon>
        <span>
          {{ validationMessage }}
        </span>
      </div>

      <div *ngIf="validationStatus === 'Valid'" class="summary-container">
        <p><mat-icon color="primary">school</mat-icon> Training Records: {{ recordCounts.trainingCount }}</p>
        <p><mat-icon color="primary">science</mat-icon> Testing Records: {{ recordCounts.testingCount }}</p>
        <p><mat-icon color="primary">play_circle</mat-icon> Simulation Records: {{ recordCounts.simulationCount }}</p>
      </div>
    </div>
  `,
  styleUrls: ['./date-ranges.component.scss']
})
export class DateRangesComponent implements OnInit {
  @Input() metadata: any;
  @Output() rangesValidated = new EventEmitter<any>();

  showFields = false;

  ranges: {
    training: { start: Date | null; end: Date | null };
    testing: { start: Date | null; end: Date | null };
    simulation: { start: Date | null; end: Date | null };
  } = {
    training: { start: null, end: null },
    testing: { start: null, end: null },
    simulation: { start: null, end: null },
  };

  validationStatus: string | null = null;
  validationMessage: string = '';
  recordCounts: any = {};

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    setTimeout(() => {
      this.showFields = true;
    }, 0);
  }

  validateRanges() {
    if (!this.ranges.training.start || !this.ranges.training.end ||
        !this.ranges.testing.start || !this.ranges.testing.end ||
        !this.ranges.simulation.start || !this.ranges.simulation.end) {
      this.validationStatus = 'Invalid';
      this.validationMessage = 'All date fields are required.';
      return;
    }
    const payload = {
      trainingStart: this.ranges.training.start?.toISOString(),
      trainingEnd: this.ranges.training.end?.toISOString(),
      testingStart: this.ranges.testing.start?.toISOString(),
      testingEnd: this.ranges.testing.end?.toISOString(),
      simulationStart: this.ranges.simulation.start?.toISOString(),
      simulationEnd: this.ranges.simulation.end?.toISOString(),
    };

    this.apiService.validateRanges(payload).subscribe({
      next: (res: any) => {
        this.validationStatus = res.status;
        this.validationMessage = 'Date ranges validated successfully!';
        this.recordCounts = res.counts;
        this.rangesValidated.emit(this.ranges);
      },
      error: (err: any) => {
        this.validationStatus = 'Invalid';
        this.validationMessage = err.error?.detail || 'An error occurred during validation.';
      }
    });
  }

  onNext() {
    this.rangesValidated.emit(this.ranges);
  }
}
