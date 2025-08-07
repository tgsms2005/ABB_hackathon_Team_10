import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) {}

  uploadDataset(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/upload`, formData);
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