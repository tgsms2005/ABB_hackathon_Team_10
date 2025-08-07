import { Component, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UploadDatasetComponent } from './upload-dataset/upload-dataset.component';
import { DateRangesComponent } from './date-ranges/date-ranges.component';
import { ModelTrainingComponent } from './model-training/model-training.component';
import { SimulationComponent } from './simulation/simulation.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    HttpClientModule,
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    UploadDatasetComponent,
    DateRangesComponent,
    ModelTrainingComponent,
    SimulationComponent
  ],
  template: `
    <header class="app-header">
      <mat-toolbar color="primary">
    <div class="header-content">
      <span class="app-title">IntelliInspect: Predictive Quality Control</span>
      <button mat-icon-button class="toggle-theme" (click)="toggleTheme()" [attr.aria-label]="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'">
        <mat-icon>{{ isDarkMode ? 'wb_sunny' : 'brightness_3' }}</mat-icon>
      </button>
    </div>
  </mat-toolbar>
    </header>

    <div class="main-container">
      <mat-card class="content-card">
        <mat-tab-group animationDuration="0ms" [(selectedIndex)]="currentStep">

          <mat-tab label="1. Upload Dataset" [disabled]="!canGoToStep[0]">
            <div class="step-content">
              <app-upload-dataset (uploadComplete)="onUploadComplete($event)"></app-upload-dataset>
            </div>
            <div class="actions" *ngIf="datasetMetadata">
                <button mat-raised-button color="primary" (click)="onNextStep()">Next</button>
            </div>
          </mat-tab>

          <mat-tab label="2. Date Ranges" [disabled]="!canGoToStep[1]">
            <div class="step-content">
              <app-date-ranges (rangesValidated)="onRangesValidated($event)" [metadata]="datasetMetadata"></app-date-ranges>
            </div>
            <div class="actions">
                <button mat-button (click)="onPreviousStep()">Previous</button>
                <button mat-raised-button color="primary" [disabled]="!trainingRanges" (click)="onNextStep()">Next</button>
            </div>
          </mat-tab>

          <mat-tab label="3. Model Training" [disabled]="!canGoToStep[2]">
            <div class="step-content">
              <app-model-training (trainingComplete)="onTrainingComplete($event)" [dateRanges]="trainingRanges"></app-model-training>
            </div>
            <div class="actions">
                <button mat-button (click)="onPreviousStep()">Previous</button>
                <button mat-raised-button color="primary" [disabled]="!canGoToStep[3]" (click)="onNextStep()">Next</button>
            </div>
          </mat-tab>

          <mat-tab label="4. Simulation" [disabled]="!canGoToStep[3]">
            <div class="step-content">
              <app-simulation [simulationRange]="simulationRange"></app-simulation>
            </div>
            <div class="actions">
                <button mat-button (click)="onPreviousStep()">Previous</button>
            </div>
          </mat-tab>

        </mat-tab-group>
      </mat-card>
    </div>
    
    <footer class="app-footer">
      <p>&copy; 2025 IntelliInspect. All rights reserved.</p>
    </footer>
  `,
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  @HostBinding('class.dark-theme') isDarkMode = false;
  currentStep = 0;
  canGoToStep = [true, false, false, false];
  datasetMetadata: any;
  trainingRanges: any;
  simulationRange: any;

  onUploadComplete(metadata: any) {
    this.datasetMetadata = metadata;
    this.canGoToStep[1] = true;
  }

  onRangesValidated(ranges: any) {
    this.trainingRanges = {
      trainStart: ranges.training.start,
      trainEnd: ranges.training.end,
      testStart: ranges.testing.start,
      testEnd: ranges.testing.end
    };
    this.simulationRange = {
      simulationStart: ranges.simulation.start,
      simulationEnd: ranges.simulation.end
    };
    this.canGoToStep[2] = true;
  }

  onTrainingComplete(event: any) {
    this.canGoToStep[3] = true;
  }

  onNextStep() {
    this.currentStep++;
  }

  onPreviousStep() {
    this.currentStep--;
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
}