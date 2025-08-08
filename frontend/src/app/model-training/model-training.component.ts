import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../api.service';
@Component({
  selector: 'app-model-training',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule, 
    MatProgressBarModule
  ],
  template: `
    <div class="container">
      <h2 style="margin-bottom: 0; color: var(--primary-color); font-weight: 600;">
        <mat-icon style="vertical-align: middle;">model_training</mat-icon>
        Model Training
      </h2>
      <div class="actions">
        <button mat-raised-button color="primary" (click)="trainModel()" [disabled]="isTraining">
          <mat-icon>play_arrow</mat-icon> Train Model
        </button>
      </div>

      <div *ngIf="isTraining" class="status-box">
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        <p>
          <mat-icon color="primary" style="vertical-align: middle;">hourglass_top</mat-icon>
          Training in progress... This may take a few moments.
        </p>
      </div>

      <div *ngIf="metrics" class="metrics-container">
        <mat-card class="metric-card">
          <p class="label"><mat-icon color="primary">check_circle</mat-icon> Accuracy</p>
          <p class="value">{{ (metrics.accuracy * 100).toFixed(2) }}%</p>
        </mat-card>
        <mat-card class="metric-card">
          <p class="label"><mat-icon color="primary">precision_manufacturing</mat-icon> Precision</p>
          <p class="value">{{ (metrics.precision * 100).toFixed(2) }}%</p>
        </mat-card>
        <mat-card class="metric-card">
          <p class="label"><mat-icon color="primary">replay</mat-icon> Recall</p>
          <p class="value">{{ (metrics.recall * 100).toFixed(2) }}%</p>
        </mat-card>
        <mat-card class="metric-card">
          <p class="label"><mat-icon color="primary">functions</mat-icon> F1-Score</p>
          <p class="value">{{ (metrics.f1_score * 100).toFixed(2) }}%</p>
        </mat-card>
      </div>
    </div>
  `,
  styleUrls: ['./model-training.component.scss']
})

export class ModelTrainingComponent {
  @Input() dateRanges: any;
  @Output() trainingComplete = new EventEmitter<any>();

  isTraining = false;
  metrics: any = null;

  constructor(private apiService: ApiService) {}

  trainModel() {
    this.isTraining = true;
    this.metrics = null;
    const payload = {
      trainStart: this.dateRanges.trainStart?.toISOString(),
      trainEnd: this.dateRanges.trainEnd?.toISOString(),
      testStart: this.dateRanges.testStart?.toISOString(),
      testEnd: this.dateRanges.testEnd?.toISOString(),
    };

    this.apiService.trainModel(payload).subscribe({
      next: (res: any) => {
        this.isTraining = false;
        this.metrics = res.metrics;
        this.trainingComplete.emit(res);
      },
      error: (err: any) => {
        this.isTraining = false;
        console.error('Training failed:', err);
      }
    });
  }
}