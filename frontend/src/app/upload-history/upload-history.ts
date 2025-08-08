import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule, DatePipe, PercentPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-upload-history',
  standalone: true,
  imports: [CommonModule, MatTableModule, DatePipe, PercentPipe],
  template: `
    <h3>Upload History</h3>
    <table *ngIf="history.length > 0" mat-table [dataSource]="history" class="mat-elevation-z8">
      <ng-container matColumnDef="fileName">
        <th mat-header-cell *matHeaderCellDef>File Name</th>
        <td mat-cell *matCellDef="let h">{{h.fileName}}</td>
      </ng-container>
      <ng-container matColumnDef="uploadDate">
        <th mat-header-cell *matHeaderCellDef>Date</th>
        <td mat-cell *matCellDef="let h">{{h.uploadDate | date:'short'}}</td>
      </ng-container>
      <ng-container matColumnDef="totalRecords">
        <th mat-header-cell *matHeaderCellDef>Records</th>
        <td mat-cell *matCellDef="let h">{{h.totalRecords}}</td>
      </ng-container>
      <ng-container matColumnDef="totalColumns">
        <th mat-header-cell *matHeaderCellDef>Columns</th>
        <td mat-cell *matCellDef="let h">{{h.totalColumns}}</td>
      </ng-container>
      <ng-container matColumnDef="passRate">
        <th mat-header-cell *matHeaderCellDef>Pass Rate</th>
        <td mat-cell *matCellDef="let h">{{h.passRate | percent:'1.1-2'}}</td>
      </ng-container>
      <ng-container matColumnDef="dateRange">
        <th mat-header-cell *matHeaderCellDef>Date Range</th>
        <td mat-cell *matCellDef="let h">{{h.dateRange}}</td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
    </table>
    <div *ngIf="history.length === 0">No uploads yet.</div>
  `,
  styles: [`table { width: 100%; margin-top: 1em; }`]
})
export class UploadHistoryComponent implements OnInit {
  history: any[] = [];
  displayedColumns = ['fileName', 'uploadDate', 'totalRecords', 'totalColumns', 'passRate', 'dateRange'];

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit() {
    const headers = new HttpHeaders().set('X-Username', this.authService.getUsername() || '');
    this.http.get<any[]>('/api/uploads', { headers }).subscribe(data => this.history = data || []);
  }
}