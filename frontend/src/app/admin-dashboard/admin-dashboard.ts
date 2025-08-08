import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
 template: `
    <h3>Admin Dashboard</h3>
    <div *ngIf="stats">
      <p><strong>Total Uploads:</strong> {{stats.totalUploads}}</p>
      <p><strong>Total Records:</strong> {{stats.totalRecords}}</p>
      <p><strong>Last Upload:</strong> {{stats.lastUpload}}</p>
    </div>
    <div *ngIf="!stats">Loading...</div>
  `
})
export class AdminDashboardComponent implements OnInit {
  stats: any;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('token')}`);
    this.http.get<any>('/api/stats', { headers }).subscribe(data => this.stats = data);
  }
}