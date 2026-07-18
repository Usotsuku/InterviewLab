import { Component, signal, ElementRef, viewChild, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CvUploadStore } from '../../cv-upload.store';
import { IlButtonComponent } from '../../../../shared/components/button/button.component';
import { IlBadgeComponent } from '../../../../shared/components/badge/badge.component';
import { IlSpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

@Component({
  selector: 'il-cv-upload',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, IlButtonComponent, IlBadgeComponent, IlSpinnerComponent],
  templateUrl: './cv-upload.component.html',
})
export class IlCvUploadComponent {
  private readonly _store = inject(CvUploadStore);

  readonly store = this._store;
  readonly isDragOver = signal(false);
  readonly clientError = signal<string | null>(null);

  readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files.item(0);
    if (file) this._handleFile(file);
  }

  openFilePicker(): void {
    this.fileInput().nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    if (file) this._handleFile(file);
    input.value = '';
  }

  async onDelete(): Promise<void> {
    await this._store.deleteCv();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  private async _handleFile(file: File): Promise<void> {
    this.clientError.set(null);

    const error = this._validateFile(file);
    if (error) {
      this.clientError.set(error);
      return;
    }

    if (this._store.hasCv()) {
      await this._store.replace(file);
    } else {
      await this._store.upload(file);
    }
  }

  private _validateFile(file: File): string | null {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return 'Only PDF files are accepted.';
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return 'File exceeds maximum size of 10MB.';
    }
    if (file.size === 0) {
      return 'Uploaded file is empty.';
    }
    return null;
  }
}
