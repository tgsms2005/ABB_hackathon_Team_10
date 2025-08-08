import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule, DatePipe, PercentPipe } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-dataset-summary',
  standalone: true,
  imports: [CommonModule, DatePipe, PercentPipe],
  template: `
    <h3>Latest Dataset Summary</h3>
    <div *ngIf="summary; else noData">
      <p><strong>File Name:</strong> {{summary.fileName}}</p>
      <p><strong>Upload Date:</strong> {{summary.uploadDate | date:'short'}}</p>
      <p><strong>Total Records:</strong> {{summary.totalRecords}}</p>
      <p><strong>Total Columns:</strong> {{summary.totalColumns}}</p>
      <p><strong>Pass Rate:</strong> {{summary.passRate | percent:'1.1-2'}}</p>
      <p><strong>Date Range:</strong> {{summary.dateRange}}</p>
    </div>
    <ng-template #noData>
      <p>No dataset summary available.</p>
    </ng-template>
  `
})
export class DatasetSummaryComponent implements OnInit {
  summary: any;

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit() {
    const headers = new HttpHeaders().set('X-Username', this.authService.getUsername() || '');
    this.http.get<any[]>('/api/uploads', { headers }).subscribe(history => {
      if (history && history.length > 0) {
        this.summary = history[history.length - 1];
      }
    });
  }
}