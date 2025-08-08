import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';


@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = '/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  uploadDataset(file: File): Observable<any> {
  const formData = new FormData();
  formData.append('file', file);
  const username = this.authService.getUsername() || '';
  console.log('Uploading as user:', username);
  const headers = new HttpHeaders().set('X-Username', this.authService.getUsername() || '');
  return this.http.post(`${this.apiUrl}/upload`, formData, { headers });
}

  getUploadHistory(): Observable<any> {
    const headers = new HttpHeaders().set('X-Username', this.authService.getUsername() || '');
    return this.http.get(`${this.apiUrl}/uploads`, { headers });
  }

  validateRanges(ranges: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/validate-ranges`, ranges);
  }

  trainModel(trainConfig: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/train`, trainConfig);
  }

  simulatePredictions(simulationConfig: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/simulate`, simulationConfig);
  }
}