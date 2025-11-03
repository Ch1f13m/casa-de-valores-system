import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReportRequest {
  type: string;
  period: string;
  startDate?: Date;
  endDate?: Date;
  format: string;
  options?: any;
}

export interface ReportResponse {
  id: string;
  type: string;
  name: string;
  generatedDate: Date;
  period: string;
  format: string;
  size: string;
  status: 'COMPLETED' | 'PENDING' | 'ERROR';
  downloadUrl?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  defaultOptions: any;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  // Generación de reportes
  generateReport(request: ReportRequest): Observable<ReportResponse> {
    return this.http.post<ReportResponse>(`${this.apiUrl}/generate`, request);
  }

  // Obtener reportes generados
  getReports(filters?: any): Observable<ReportResponse[]> {
    const params: any = {};
    if (filters) {
      Object.assign(params, filters);
    }
    return this.http.get<ReportResponse[]>(`${this.apiUrl}`, { params });
  }

  // Obtener un reporte específico
  getReportById(reportId: string): Observable<ReportResponse> {
    return this.http.get<ReportResponse>(`${this.apiUrl}/${reportId}`);
  }

  // Descargar reporte
  downloadReport(reportId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${reportId}/download`, {
      responseType: 'blob'
    });
  }

  // Vista previa de reporte
  previewReport(request: ReportRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/preview`, request);
  }

  // Eliminar reporte
  deleteReport(reportId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${reportId}`);
  }

  // Plantillas de reportes
  getReportTemplates(): Observable<ReportTemplate[]> {
    return this.http.get<ReportTemplate[]>(`${this.apiUrl}/templates`);
  }

  // Guardar configuración de reporte como plantilla
  saveTemplate(template: Partial<ReportTemplate>): Observable<ReportTemplate> {
    return this.http.post<ReportTemplate>(`${this.apiUrl}/templates`, template);
  }

  // Programar generación automática
  scheduleReport(schedule: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/schedule`, schedule);
  }

  // Obtener reportes programados
  getScheduledReports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/schedule`);
  }

  // Enviar reporte por email
  emailReport(reportId: string, emailData: { to: string[], subject?: string, message?: string }): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${reportId}/email`, emailData);
  }

  // Utilidades
  getReportTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'ACCOUNT_STATEMENT': 'Estado de Cuenta',
      'TAX_REPORT': 'Reporte Fiscal',
      'TRADING_ACTIVITY': 'Actividad de Trading',
      'PERFORMANCE': 'Rendimiento',
      'PORTFOLIO_SUMMARY': 'Resumen de Portafolio',
      'DIVIDENDS': 'Dividendos'
    };
    return labels[type] || type;
  }

  getFormatExtension(format: string): string {
    const extensions: { [key: string]: string } = {
      'PDF': '.pdf',
      'EXCEL': '.xlsx',
      'CSV': '.csv',
      'JSON': '.json'
    };
    return extensions[format] || '.pdf';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
