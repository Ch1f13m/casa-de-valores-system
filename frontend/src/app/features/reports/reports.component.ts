import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';

interface Report {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  formats: string[];
}

interface GeneratedReport {
  id: string;
  type: string;
  name: string;
  generatedDate: Date;
  period: string;
  format: string;
  size: string;
  status: 'COMPLETED' | 'PENDING' | 'ERROR';
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatDividerModule
  ],
  template: `
    <div class="reports-container">
      <div class="page-header">
        <h1>
          <mat-icon>assessment</mat-icon>
          Generación de Reportes
        </h1>
        <p class="subtitle">Genera y descarga reportes personalizados de tu cuenta</p>
      </div>

      <div class="reports-layout">
        <!-- Panel de Tipos de Reportes -->
        <div class="reports-catalog">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Tipos de Reportes</mat-card-title>
              <mat-card-subtitle>Selecciona el tipo de reporte que deseas generar</mat-card-subtitle>
            </mat-card-header>
            
            <mat-card-content>
              <div class="report-types-grid">
                <div class="report-type-card" 
                     *ngFor="let report of availableReports"
                     [class.selected]="selectedReportType === report.type"
                     (click)="selectReportType(report)">
                  <mat-icon [color]="selectedReportType === report.type ? 'primary' : ''">
                    {{ report.icon }}
                  </mat-icon>
                  <h3>{{ report.name }}</h3>
                  <p>{{ report.description }}</p>
                  <div class="formats">
                    <mat-chip *ngFor="let format of report.formats">{{ format }}</mat-chip>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Panel de Configuración -->
        <div class="report-configuration">
          <mat-card>
            <mat-card-header>
              <mat-card-title>
                <mat-icon>settings</mat-icon>
                Configuración del Reporte
              </mat-card-title>
            </mat-card-header>
            
            <mat-card-content>
              <form [formGroup]="reportForm" (ngSubmit)="generateReport()">
                <!-- Período -->
                <div class="form-section">
                  <h3>Período</h3>
                  <mat-divider></mat-divider>
                  
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Período predefinido</mat-label>
                    <mat-select formControlName="period" (selectionChange)="onPeriodChange()">
                      <mat-option value="CURRENT_MONTH">Mes Actual</mat-option>
                      <mat-option value="LAST_MONTH">Mes Anterior</mat-option>
                      <mat-option value="CURRENT_QUARTER">Trimestre Actual</mat-option>
                      <mat-option value="LAST_QUARTER">Trimestre Anterior</mat-option>
                      <mat-option value="CURRENT_YEAR">Año Actual</mat-option>
                      <mat-option value="LAST_YEAR">Año Anterior</mat-option>
                      <mat-option value="CUSTOM">Personalizado</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <div class="date-range" *ngIf="reportForm.get('period')?.value === 'CUSTOM'">
                    <mat-form-field appearance="outline">
                      <mat-label>Fecha Inicio</mat-label>
                      <input matInput [matDatepicker]="startPicker" formControlName="startDate">
                      <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                      <mat-datepicker #startPicker></mat-datepicker>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Fecha Fin</mat-label>
                      <input matInput [matDatepicker]="endPicker" formControlName="endDate">
                      <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                      <mat-datepicker #endPicker></mat-datepicker>
                    </mat-form-field>
                  </div>
                </div>

                <!-- Formato -->
                <div class="form-section">
                  <h3>Formato de Exportación</h3>
                  <mat-divider></mat-divider>
                  
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Formato</mat-label>
                    <mat-select formControlName="format">
                      <mat-option value="PDF">PDF</mat-option>
                      <mat-option value="EXCEL">Excel (XLSX)</mat-option>
                      <mat-option value="CSV">CSV</mat-option>
                      <mat-option value="JSON">JSON</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>

                <!-- Opciones Adicionales según tipo de reporte -->
                <div class="form-section" *ngIf="selectedReportType">
                  <h3>Opciones Adicionales</h3>
                  <mat-divider></mat-divider>

                  <!-- Opciones para Estado de Cuenta -->
                  <div *ngIf="selectedReportType === 'ACCOUNT_STATEMENT'">
                    <mat-checkbox formControlName="includeTransactions" class="full-width">
                      Incluir todas las transacciones
                    </mat-checkbox>
                    <mat-checkbox formControlName="includeBalances" class="full-width">
                      Incluir balances diarios
                    </mat-checkbox>
                    <mat-checkbox formControlName="includeSummary" class="full-width">
                      Incluir resumen ejecutivo
                    </mat-checkbox>
                  </div>

                  <!-- Opciones para Reporte Fiscal -->
                  <div *ngIf="selectedReportType === 'TAX_REPORT'">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Año Fiscal</mat-label>
                      <mat-select formControlName="fiscalYear">
                        <mat-option *ngFor="let year of fiscalYears" [value]="year">
                          {{ year }}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-checkbox formControlName="includeCapitalGains" class="full-width">
                      Incluir ganancias/pérdidas de capital
                    </mat-checkbox>
                    <mat-checkbox formControlName="includeDividends" class="full-width">
                      Incluir dividendos recibidos
                    </mat-checkbox>
                  </div>

                  <!-- Opciones para Reporte de Trading -->
                  <div *ngIf="selectedReportType === 'TRADING_ACTIVITY'">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Filtrar por símbolo</mat-label>
                      <mat-select formControlName="symbols" multiple>
                        <mat-option value="ALL">Todos</mat-option>
                        <mat-option value="AAPL">AAPL</mat-option>
                        <mat-option value="GOOGL">GOOGL</mat-option>
                        <mat-option value="MSFT">MSFT</mat-option>
                        <mat-option value="TSLA">TSLA</mat-option>
                        <mat-option value="AMZN">AMZN</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-checkbox formControlName="includeCharts" class="full-width">
                      Incluir gráficos de rendimiento
                    </mat-checkbox>
                  </div>

                  <!-- Opciones para Reporte de Performance -->
                  <div *ngIf="selectedReportType === 'PERFORMANCE'">
                    <mat-checkbox formControlName="includeBenchmark" class="full-width">
                      Comparar con benchmark (S&P 500)
                    </mat-checkbox>
                    <mat-checkbox formControlName="includeRiskMetrics" class="full-width">
                      Incluir métricas de riesgo
                    </mat-checkbox>
                    <mat-checkbox formControlName="includeDiversification" class="full-width">
                      Incluir análisis de diversificación
                    </mat-checkbox>
                  </div>
                </div>

                <!-- Botones de Acción -->
                <div class="form-actions">
                  <button mat-raised-button 
                          color="primary" 
                          type="submit"
                          [disabled]="!reportForm.valid || !selectedReportType || isGenerating">
                    <mat-icon>file_download</mat-icon>
                    {{ isGenerating ? 'Generando...' : 'Generar Reporte' }}
                  </button>
                  <button mat-button type="button" (click)="previewReport()" 
                          [disabled]="!reportForm.valid || !selectedReportType">
                    <mat-icon>visibility</mat-icon>
                    Vista Previa
                  </button>
                  <button mat-button type="button" (click)="resetForm()">
                    <mat-icon>refresh</mat-icon>
                    Limpiar
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>

          <!-- Panel de Reportes Recientes -->
          <mat-card class="recent-reports">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>history</mat-icon>
                Reportes Recientes
              </mat-card-title>
            </mat-card-header>
            
            <mat-card-content>
              <div class="reports-list" *ngIf="recentReports.length > 0">
                <mat-expansion-panel *ngFor="let report of recentReports">
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon class="report-icon">{{ getReportIcon(report.type) }}</mat-icon>
                      {{ report.name }}
                    </mat-panel-title>
                    <mat-panel-description>
                      {{ report.generatedDate | date:'short' }}
                      <mat-chip [color]="getStatusColor(report.status)">
                        {{ report.status }}
                      </mat-chip>
                    </mat-panel-description>
                  </mat-expansion-panel-header>
                  
                  <div class="report-details">
                    <div class="detail-row">
                      <span class="label">Período:</span>
                      <span class="value">{{ report.period }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Formato:</span>
                      <span class="value">{{ report.format }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Tamaño:</span>
                      <span class="value">{{ report.size }}</span>
                    </div>
                    
                    <div class="report-actions">
                      <button mat-raised-button color="primary" (click)="downloadReport(report.id)">
                        <mat-icon>download</mat-icon>
                        Descargar
                      </button>
                      <button mat-button (click)="viewReport(report.id)">
                        <mat-icon>visibility</mat-icon>
                        Ver
                      </button>
                      <button mat-button color="warn" (click)="deleteReport(report.id)">
                        <mat-icon>delete</mat-icon>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </mat-expansion-panel>
              </div>
              
              <div class="empty-state" *ngIf="recentReports.length === 0">
                <mat-icon>inbox</mat-icon>
                <p>No hay reportes generados aún</p>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-container {
      padding: 24px;
      max-width: 1600px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .page-header h1 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 8px 0;
      font-size: 32px;
    }

    .subtitle {
      color: #666;
      font-size: 16px;
      margin: 0;
    }

    .reports-layout {
      display: grid;
      grid-template-columns: 1fr 500px;
      gap: 24px;
    }

    @media (max-width: 1200px) {
      .reports-layout {
        grid-template-columns: 1fr;
      }
    }

    .report-types-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .report-type-card {
      padding: 20px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;
    }

    .report-type-card:hover {
      border-color: #3f51b5;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      transform: translateY(-2px);
    }

    .report-type-card.selected {
      border-color: #3f51b5;
      background-color: #e3f2fd;
    }

    .report-type-card mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
    }

    .report-type-card h3 {
      margin: 8px 0;
      font-size: 16px;
      font-weight: 600;
    }

    .report-type-card p {
      font-size: 13px;
      color: #666;
      margin: 8px 0;
      min-height: 40px;
    }

    .formats {
      display: flex;
      gap: 4px;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 8px;
    }

    .formats mat-chip {
      font-size: 11px;
      height: 24px;
      min-height: 24px;
    }

    .form-section {
      margin-bottom: 24px;
    }

    .form-section h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .form-section mat-divider {
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .date-range {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      flex-wrap: wrap;
    }

    .recent-reports {
      margin-top: 24px;
    }

    .reports-list {
      margin-top: 16px;
    }

    .report-icon {
      margin-right: 8px;
    }

    .report-details {
      padding: 16px 0;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .detail-row:last-of-type {
      border-bottom: none;
    }

    .detail-row .label {
      color: #666;
      font-weight: 500;
    }

    .detail-row .value {
      color: #333;
    }

    .report-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      flex-wrap: wrap;
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: #999;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    mat-card-header {
      margin-bottom: 16px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    mat-checkbox {
      display: block;
      margin-bottom: 12px;
    }
  `]
})
export class ReportsComponent implements OnInit {
  reportForm: FormGroup;
  selectedReportType: string | null = null;
  isGenerating = false;

  availableReports: Report[] = [
    {
      id: '1',
      type: 'ACCOUNT_STATEMENT',
      name: 'Estado de Cuenta',
      description: 'Resumen completo de transacciones y balances',
      icon: 'account_balance',
      formats: ['PDF', 'Excel', 'CSV']
    },
    {
      id: '2',
      type: 'TAX_REPORT',
      name: 'Reporte Fiscal',
      description: 'Información para declaración de impuestos',
      icon: 'receipt_long',
      formats: ['PDF', 'Excel']
    },
    {
      id: '3',
      type: 'TRADING_ACTIVITY',
      name: 'Actividad de Trading',
      description: 'Historial detallado de operaciones',
      icon: 'show_chart',
      formats: ['PDF', 'Excel', 'CSV']
    },
    {
      id: '4',
      type: 'PERFORMANCE',
      name: 'Rendimiento',
      description: 'Análisis de rendimiento del portafolio',
      icon: 'trending_up',
      formats: ['PDF', 'Excel']
    },
    {
      id: '5',
      type: 'PORTFOLIO_SUMMARY',
      name: 'Resumen de Portafolio',
      description: 'Estado actual de inversiones',
      icon: 'pie_chart',
      formats: ['PDF', 'Excel']
    },
    {
      id: '6',
      type: 'DIVIDENDS',
      name: 'Dividendos',
      description: 'Historial de dividendos recibidos',
      icon: 'attach_money',
      formats: ['PDF', 'Excel', 'CSV']
    }
  ];

  recentReports: GeneratedReport[] = [];
  fiscalYears: number[] = [];

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.reportForm = this.fb.group({
      period: ['CURRENT_MONTH', Validators.required],
      startDate: [null],
      endDate: [null],
      format: ['PDF', Validators.required],
      // Opciones para Estado de Cuenta
      includeTransactions: [true],
      includeBalances: [true],
      includeSummary: [true],
      // Opciones para Reporte Fiscal
      fiscalYear: [new Date().getFullYear()],
      includeCapitalGains: [true],
      includeDividends: [true],
      // Opciones para Trading Activity
      symbols: [['ALL']],
      includeCharts: [true],
      // Opciones para Performance
      includeBenchmark: [true],
      includeRiskMetrics: [true],
      includeDiversification: [true]
    });
  }

  ngOnInit() {
    // Generar años fiscales
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 10; i++) {
      this.fiscalYears.push(currentYear - i);
    }

    // Cargar reportes recientes simulados
    this.loadRecentReports();
  }

  selectReportType(report: Report) {
    this.selectedReportType = report.type;
    // Resetear formato según los disponibles para este reporte
    const defaultFormat = report.formats.includes('PDF') ? 'PDF' : report.formats[0];
    this.reportForm.patchValue({ format: defaultFormat });
  }

  onPeriodChange() {
    const period = this.reportForm.get('period')?.value;
    if (period === 'CUSTOM') {
      this.reportForm.get('startDate')?.setValidators([Validators.required]);
      this.reportForm.get('endDate')?.setValidators([Validators.required]);
    } else {
      this.reportForm.get('startDate')?.clearValidators();
      this.reportForm.get('endDate')?.clearValidators();
    }
    this.reportForm.get('startDate')?.updateValueAndValidity();
    this.reportForm.get('endDate')?.updateValueAndValidity();
  }

  generateReport() {
    if (!this.reportForm.valid || !this.selectedReportType) {
      return;
    }

    this.isGenerating = true;
    const selectedReport = this.availableReports.find(r => r.type === this.selectedReportType);

    this.snackBar.open(
      `Generando ${selectedReport?.name}...`,
      'Cerrar',
      { duration: 2000 }
    );

    // Simular generación de reporte
    setTimeout(() => {
      const newReport: GeneratedReport = {
        id: 'RPT-' + Date.now(),
        type: this.selectedReportType!,
        name: selectedReport?.name || 'Reporte',
        generatedDate: new Date(),
        period: this.getPeriodLabel(),
        format: this.reportForm.get('format')?.value,
        size: this.getRandomSize(),
        status: 'COMPLETED'
      };

      this.recentReports = [newReport, ...this.recentReports];
      this.isGenerating = false;

      this.snackBar.open(
        'Reporte generado exitosamente',
        'Descargar',
        { duration: 5000 }
      ).onAction().subscribe(() => {
        this.downloadReport(newReport.id);
      });
    }, 3000);
  }

  previewReport() {
    this.snackBar.open('Generando vista previa...', 'Cerrar', { duration: 2000 });
    // Implementar vista previa
  }

  resetForm() {
    this.reportForm.reset({
      period: 'CURRENT_MONTH',
      format: 'PDF',
      includeTransactions: true,
      includeBalances: true,
      includeSummary: true,
      fiscalYear: new Date().getFullYear(),
      includeCapitalGains: true,
      includeDividends: true,
      symbols: ['ALL'],
      includeCharts: true,
      includeBenchmark: true,
      includeRiskMetrics: true,
      includeDiversification: true
    });
    this.selectedReportType = null;
  }

  downloadReport(reportId: string) {
    const report = this.recentReports.find(r => r.id === reportId);
    this.snackBar.open(
      `Descargando ${report?.name}...`,
      'Cerrar',
      { duration: 2000 }
    );
    // Implementar descarga real
  }

  viewReport(reportId: string) {
    this.snackBar.open('Abriendo reporte...', 'Cerrar', { duration: 2000 });
    // Implementar visualización
  }

  deleteReport(reportId: string) {
    this.recentReports = this.recentReports.filter(r => r.id !== reportId);
    this.snackBar.open('Reporte eliminado', 'Cerrar', { duration: 2000 });
  }

  getPeriodLabel(): string {
    const period = this.reportForm.get('period')?.value;
    const labels: { [key: string]: string } = {
      'CURRENT_MONTH': 'Mes Actual',
      'LAST_MONTH': 'Mes Anterior',
      'CURRENT_QUARTER': 'Trimestre Actual',
      'LAST_QUARTER': 'Trimestre Anterior',
      'CURRENT_YEAR': 'Año Actual',
      'LAST_YEAR': 'Año Anterior',
      'CUSTOM': 'Personalizado'
    };
    return labels[period] || period;
  }

  getRandomSize(): string {
    const sizes = ['245 KB', '1.2 MB', '567 KB', '890 KB', '1.5 MB'];
    return sizes[Math.floor(Math.random() * sizes.length)];
  }

  getReportIcon(type: string): string {
    const report = this.availableReports.find(r => r.type === type);
    return report?.icon || 'description';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'primary';
      case 'PENDING': return 'accent';
      case 'ERROR': return 'warn';
      default: return '';
    }
  }

  loadRecentReports() {
    // Simular reportes recientes
    this.recentReports = [
      {
        id: 'RPT-001',
        type: 'ACCOUNT_STATEMENT',
        name: 'Estado de Cuenta',
        generatedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        period: 'Mes Anterior',
        format: 'PDF',
        size: '1.2 MB',
        status: 'COMPLETED'
      },
      {
        id: 'RPT-002',
        type: 'PERFORMANCE',
        name: 'Rendimiento',
        generatedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        period: 'Trimestre Actual',
        format: 'Excel',
        size: '567 KB',
        status: 'COMPLETED'
      }
    ];
  }
}
