import { Component, EventEmitter, Output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../api.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-upload-dataset',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
<div class="step-content">
  <div class="upload-container">
    <mat-card class="upload-card" [class.drag-over]="isDragOver">
      <div class="upload-area" 
           (click)="fileInput.click()" 
           (drop)="onFileDrop($event)" 
           (dragover)="onDragOver($event)" 
           (dragleave)="onDragLeave()"
           [class.drag-over]="isDragOver">
        
        <mat-icon class="upload-icon">cloud_upload</mat-icon>
        
        <p class="upload-text">
          <ng-container *ngIf="!isLoading; else loadingTemplate">
            Drag & drop your CSV file here
          </ng-container>
          <ng-template #loadingTemplate>
            Processing your file...
          </ng-template>
        </p>
        
        <p class="upload-hint">or click to browse files</p>
        
        <button mat-raised-button 
                color="primary" 
                class="upload-button"
                (click)="fileInput.click(); $event.stopPropagation()">
          Select File
        </button>
        
        <input #fileInput 
               type="file" 
               class="file-input" 
               (change)="onFileSelected($event)" 
               accept=".csv">
      </div>
      
      <div class="upload-status" 
           [class.error]="uploadError" 
           [class.loading]="isLoading">
        <mat-icon *ngIf="uploadError">error</mat-icon>
        <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
        <span>{{ uploadError || 'Ready to upload' }}</span>
      </div>
    </mat-card>
    
    <div class="metadata-container" *ngIf="metadata">
      <mat-card class="metadata-card">
        <div class="metadata-header">
          <h3>Dataset Summary</h3>
        </div>
        
        <div class="metadata-grid">
          <div class="metadata-item">
            <p class="label">File Name</p>
            <p class="value">{{ metadata.fileName }}</p>
          </div>
          
          <div class="metadata-item">
            <p class="label">Records</p>
            <p class="value">{{ metadata.totalRecords | number }}</p>
          </div>
          
          <div class="metadata-item">
            <p class="label">Columns</p>
            <p class="value">{{ metadata.totalColumns }}</p>
          </div>
          
          <div class="metadata-item">
            <p class="label">Pass Rate</p>
            <p class="value">{{ (metadata.passRate * 100) | number:'1.0-2' }}%</p>
          </div>
          
          <div class="metadata-item full-width">
            <p class="label">Date Range</p>
            <p class="value">{{ metadata.dateRange }}</p>
          </div>
        </div>
      </mat-card>
    </div>
  </div>
</div>
  `,
  styleUrls: ['./upload-dataset.component.scss']
})
export class UploadDatasetComponent {
  @Output() uploadComplete = new EventEmitter<any>();
  @ViewChild('fileInput') fileInput!: ElementRef;

  metadata: any = null;
  isDragOver = false;
  isLoading = false;
  uploadError: string | null = null;

  constructor(private apiService: ApiService) {}

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.uploadFile(file);
    }
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.uploadFile(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave() {
    this.isDragOver = false;
  }

  uploadFile(file: File) {
    this.isLoading = true;
    this.uploadError = null;
    this.apiService.uploadDataset(file).subscribe({
      next: (res: any) => {
        this.metadata = { ...res, fileName: file.name };
        this.uploadComplete.emit(this.metadata);
        this.isLoading = false;
      },
      error: (err: any) => {
        this.uploadError = err.error?.detail || err.message || 'An unknown error occurred.';
        this.isLoading = false;
      }
    });
  }
}