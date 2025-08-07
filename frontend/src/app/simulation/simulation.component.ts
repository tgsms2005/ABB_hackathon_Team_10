import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../api.service';
import { takeWhile } from 'rxjs/operators';
import { Subject, interval } from 'rxjs';

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    DatePipe
  ],
  template: `
    <div class="container">
      <div class="actions">
        <button mat-raised-button color="primary" (click)="startSimulation()" [disabled]="isSimulating">
          <mat-icon>play_arrow</mat-icon> {{ isSimulating ? 'Simulating...' : 'Start Simulation' }}
        </button>
      </div>

      <div *ngIf="isSimulationComplete" class="status-message success-message">
        <mat-icon color="accent">check_circle</mat-icon> Simulation completed.
      </div>

      <div class="stats-container">
        <mat-card class="stat-card">
          <p class="label">Total Predictions</p>
          <p class="value">{{ stats.total }}</p>
        </mat-card>
        <mat-card class="stat-card">
          <p class="label">Pass Count</p>
          <p class="value pass-count">{{ stats.pass }}</p>
        </mat-card>
        <mat-card class="stat-card">
          <p class="label">Fail Count</p>
          <p class="value fail-count">{{ stats.fail }}</p>
        </mat-card>
        <mat-card class="stat-card">
          <p class="label">Avg Confidence</p>
          <p class="value">{{ stats.avgConfidence.toFixed(2) }}%</p>
        </mat-card>
      </div>

      <mat-card class="table-card">
        <h3>Live Prediction Stream</h3>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Sample ID</th>
                <th>Prediction</th>
                <th>Confidence (%)</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let result of liveResults">
                <td>{{ result.timestamp | date:'mediumTime' }}</td>
                <td>{{ result.id }}</td>
                <td><span class="prediction-{{ result.prediction === 1 ? 'pass' : 'fail' }}">{{ result.prediction === 1 ? 'Pass' : 'Fail' }}</span></td>
                <td>{{ (result.confidence * 100).toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </mat-card>
    </div>
  `,
  styleUrls: ['./simulation.component.scss']
})
export class SimulationComponent implements OnInit, OnDestroy {
  @Input() simulationRange: any;

  isSimulating = false;
  isSimulationComplete = false;
  liveResults: any[] = [];
  stats = {
    total: 0,
    pass: 0,
    fail: 0,
    totalConfidence: 0,
    avgConfidence: 0
  };

  private destroy$ = new Subject<void>();
  private allPredictions: any[] = [];
  private simulationIndex = 0;

  constructor(private apiService: ApiService) {}

  ngOnInit() {}

  startSimulation() {
    this.resetSimulation();
    this.isSimulating = true;

    this.apiService.simulatePredictions(this.simulationRange).subscribe({
      next: (res: any) => {
        this.allPredictions = res.results;
        interval(1000)
          .pipe(takeWhile(() => this.simulationIndex < this.allPredictions.length))
          .subscribe({
            next: () => {
              this.processPrediction(this.allPredictions[this.simulationIndex]);
              this.simulationIndex++;
            },
            complete: () => {
              this.isSimulating = false;
              this.isSimulationComplete = true;
            }
          });
      },
      error: (err: any) => {
        this.isSimulating = false;
        console.error('Simulation failed:', err);
      }
    });
  }

  processPrediction(prediction: any) {
    this.liveResults.unshift(prediction);
    if (this.liveResults.length > 10) {
      this.liveResults.pop();
    }

    this.stats.total++;
    if (prediction.prediction === 1) {
      this.stats.pass++;
    } else {
      this.stats.fail++;
    }
    this.stats.totalConfidence += prediction.confidence;
    this.stats.avgConfidence = (this.stats.totalConfidence / this.stats.total) * 100;
  }

  resetSimulation() {
    this.isSimulating = false;
    this.isSimulationComplete = false;
    this.liveResults = [];
    this.stats = { total: 0, pass: 0, fail: 0, totalConfidence: 0, avgConfidence: 0 };
    this.allPredictions = [];
    this.simulationIndex = 0;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}