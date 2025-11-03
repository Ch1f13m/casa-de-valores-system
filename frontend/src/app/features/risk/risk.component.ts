import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';

interface RiskMetric {
  name: string;
  value: number;
  threshold: number;
  status: 'safe' | 'warning' | 'danger';
  description: string;
}

interface PositionRisk {
  symbol: string;
  name: string;
  exposure: number;
  var95: number;
  var99: number;
  beta: number;
  volatility: number;
  sharpeRatio: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface RiskLimit {
  category: string;
  current: number;
  limit: number;
  usage: number;
  status: 'safe' | 'warning' | 'exceeded';
}

interface RiskAlert {
  id: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  position?: string;
}

@Component({
  selector: 'app-risk',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatBadgeModule
  ],
  template: `
    <div class="risk-container">
      <div class="risk-header">
        <h1>
          <mat-icon>security</mat-icon>
          Gestión de Riesgo
        </h1>
        <p class="subtitle">Análisis y gestión de riesgos de inversión</p>
      </div>

      <!-- Risk Overview -->
      <div class="overview-section">
        <h2>Resumen de Riesgo del Portafolio</h2>
        <div class="metrics-grid">
          @for (metric of riskMetrics(); track metric.name) {
            <mat-card class="metric-card" [class]="'status-' + metric.status">
              <mat-card-content>
                <div class="metric-header">
                  <div class="metric-icon" [class]="'icon-' + metric.status">
                    <mat-icon>
                      @if (metric.status === 'safe') {
                        check_circle
                      } @else if (metric.status === 'warning') {
                        warning
                      } @else {
                        error
                      }
                    </mat-icon>
                  </div>
                  <h3>{{ metric.name }}</h3>
                </div>
                <div class="metric-value">
                  {{ metric.value | number:'1.2-2' }}%
                </div>
                <div class="metric-threshold">
                  Límite: {{ metric.threshold }}%
                </div>
                <mat-progress-bar 
                  mode="determinate" 
                  [value]="(metric.value / metric.threshold) * 100"
                  [class]="'progress-' + metric.status">
                </mat-progress-bar>
                <p class="metric-description">{{ metric.description }}</p>
              </mat-card-content>
            </mat-card>
          }
        </div>
      </div>

      <!-- Risk Alerts -->
      @if (riskAlerts().length > 0) {
        <div class="alerts-section">
          <h2>
            <mat-icon [matBadge]="riskAlerts().length" matBadgeColor="warn">notifications_active</mat-icon>
            Alertas de Riesgo
          </h2>
          <div class="alerts-list">
            @for (alert of riskAlerts(); track alert.id) {
              <mat-card class="alert-card" [class]="'severity-' + alert.severity">
                <mat-card-content>
                  <div class="alert-header">
                    <mat-icon>
                      @if (alert.severity === 'critical') {
                        error
                      } @else if (alert.severity === 'warning') {
                        warning
                      } @else {
                        info
                      }
                    </mat-icon>
                    <span class="alert-time">{{ alert.timestamp | date:'short' }}</span>
                  </div>
                  <p class="alert-message">{{ alert.message }}</p>
                  @if (alert.position) {
                    <mat-chip class="position-chip">{{ alert.position }}</mat-chip>
                  }
                </mat-card-content>
              </mat-card>
            }
          </div>
        </div>
      }

      <mat-tab-group>
        <!-- Tab: Position Risk Analysis -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">analytics</mat-icon>
            Análisis por Posición
          </ng-template>
          
          <div class="tab-content">
            <mat-card>
              <mat-card-content>
                <div class="table-container">
                  <table mat-table [dataSource]="positionRisks()" class="positions-table">
                    
                    <ng-container matColumnDef="symbol">
                      <th mat-header-cell *matHeaderCellDef>Activo</th>
                      <td mat-cell *matCellDef="let position">
                        <div class="position-info">
                          <strong>{{ position.symbol }}</strong>
                          <small>{{ position.name }}</small>
                        </div>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="exposure">
                      <th mat-header-cell *matHeaderCellDef>Exposición</th>
                      <td mat-cell *matCellDef="let position">
                        {{ position.exposure | currency:'USD':'symbol':'1.0-0' }}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="var95">
                      <th mat-header-cell *matHeaderCellDef>VaR 95%</th>
                      <td mat-cell *matCellDef="let position">
                        <span class="var-value">-{{ position.var95 | currency:'USD':'symbol':'1.0-0' }}</span>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="var99">
                      <th mat-header-cell *matHeaderCellDef>VaR 99%</th>
                      <td mat-cell *matCellDef="let position">
                        <span class="var-value">-{{ position.var99 | currency:'USD':'symbol':'1.0-0' }}</span>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="beta">
                      <th mat-header-cell *matHeaderCellDef>Beta</th>
                      <td mat-cell *matCellDef="let position">
                        {{ position.beta | number:'1.2-2' }}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="volatility">
                      <th mat-header-cell *matHeaderCellDef>Volatilidad</th>
                      <td mat-cell *matCellDef="let position">
                        {{ position.volatility | number:'1.2-2' }}%
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="sharpe">
                      <th mat-header-cell *matHeaderCellDef>Sharpe Ratio</th>
                      <td mat-cell *matCellDef="let position">
                        {{ position.sharpeRatio | number:'1.2-2' }}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="riskLevel">
                      <th mat-header-cell *matHeaderCellDef>Nivel de Riesgo</th>
                      <td mat-cell *matCellDef="let position">
                        <mat-chip [class]="'risk-' + position.riskLevel">
                          {{ getRiskLevelLabel(position.riskLevel) }}
                        </mat-chip>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="positionColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: positionColumns;"></tr>
                  </table>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab: Risk Limits -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">rule</mat-icon>
            Límites de Riesgo
          </ng-template>
          
          <div class="tab-content">
            <div class="limits-grid">
              @for (limit of riskLimits(); track limit.category) {
                <mat-card class="limit-card">
                  <mat-card-header>
                    <mat-card-title>{{ limit.category }}</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="limit-stats">
                      <div class="stat-row">
                        <span class="label">Actual:</span>
                        <span class="value">{{ limit.current | currency:'USD':'symbol':'1.0-0' }}</span>
                      </div>
                      <div class="stat-row">
                        <span class="label">Límite:</span>
                        <span class="value">{{ limit.limit | currency:'USD':'symbol':'1.0-0' }}</span>
                      </div>
                      <div class="stat-row">
                        <span class="label">Uso:</span>
                        <span class="value" [class]="'usage-' + limit.status">
                          {{ limit.usage | number:'1.0-0' }}%
                        </span>
                      </div>
                    </div>
                    <mat-progress-bar 
                      mode="determinate" 
                      [value]="limit.usage"
                      [class]="'progress-' + limit.status">
                    </mat-progress-bar>
                    <div class="limit-status" [class]="'status-' + limit.status">
                      <mat-icon>
                        @if (limit.status === 'safe') {
                          check_circle
                        } @else if (limit.status === 'warning') {
                          warning
                        } @else {
                          error
                        }
                      </mat-icon>
                      {{ getLimitStatusLabel(limit.status) }}
                    </div>
                  </mat-card-content>
                </mat-card>
              }
            </div>
          </div>
        </mat-tab>

        <!-- Tab: Stress Testing -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">science</mat-icon>
            Pruebas de Estrés
          </ng-template>
          
          <div class="tab-content">
            <div class="stress-test-grid">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>trending_down</mat-icon>
                    Caída del Mercado (-20%)
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="scenario-result">
                    <div class="result-item">
                      <span class="label">Pérdida Estimada:</span>
                      <span class="value negative">-$25,090</span>
                    </div>
                    <div class="result-item">
                      <span class="label">Impacto en Portafolio:</span>
                      <span class="value">-20.00%</span>
                    </div>
                    <div class="result-item">
                      <span class="label">Posiciones Afectadas:</span>
                      <span class="value">5 de 5</span>
                    </div>
                  </div>
                  <button mat-raised-button color="primary" (click)="runStressTest('market_crash')">
                    <mat-icon>play_arrow</mat-icon>
                    Ejecutar Escenario
                  </button>
                </mat-card-content>
              </mat-card>

              <mat-card>
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>local_fire_department</mat-icon>
                    Crisis de Liquidez
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="scenario-result">
                    <div class="result-item">
                      <span class="label">Pérdida Estimada:</span>
                      <span class="value negative">-$18,817</span>
                    </div>
                    <div class="result-item">
                      <span class="label">Impacto en Portafolio:</span>
                      <span class="value">-15.00%</span>
                    </div>
                    <div class="result-item">
                      <span class="label">Spread Aumenta:</span>
                      <span class="value">+200 bps</span>
                    </div>
                  </div>
                  <button mat-raised-button color="primary" (click)="runStressTest('liquidity_crisis')">
                    <mat-icon>play_arrow</mat-icon>
                    Ejecutar Escenario
                  </button>
                </mat-card-content>
              </mat-card>

              <mat-card>
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>arrow_upward</mat-icon>
                    Subida de Tasas (+2%)
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="scenario-result">
                    <div class="result-item">
                      <span class="label">Pérdida Estimada:</span>
                      <span class="value negative">-$12,545</span>
                    </div>
                    <div class="result-item">
                      <span class="label">Impacto en Portafolio:</span>
                      <span class="value">-10.00%</span>
                    </div>
                    <div class="result-item">
                      <span class="label">Duración Portafolio:</span>
                      <span class="value">6.3 años</span>
                    </div>
                  </div>
                  <button mat-raised-button color="primary" (click)="runStressTest('rate_hike')">
                    <mat-icon>play_arrow</mat-icon>
                    Ejecutar Escenario
                  </button>
                </mat-card-content>
              </mat-card>

              <mat-card>
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>public</mat-icon>
                    Crisis Geopolítica
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="scenario-result">
                    <div class="result-item">
                      <span class="label">Pérdida Estimada:</span>
                      <span class="value negative">-$31,363</span>
                    </div>
                    <div class="result-item">
                      <span class="label">Impacto en Portafolio:</span>
                      <span class="value">-25.00%</span>
                    </div>
                    <div class="result-item">
                      <span class="label">Volatilidad:</span>
                      <span class="value">+150%</span>
                    </div>
                  </div>
                  <button mat-raised-button color="primary" (click)="runStressTest('geopolitical')">
                    <mat-icon>play_arrow</mat-icon>
                    Ejecutar Escenario
                  </button>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <!-- Tab: Risk Reports -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">assessment</mat-icon>
            Reportes
          </ng-template>
          
          <div class="tab-content">
            <div class="reports-grid">
              <mat-card class="report-card">
                <mat-card-content>
                  <mat-icon class="report-icon">description</mat-icon>
                  <h3>Reporte Diario de Riesgo</h3>
                  <p>Resumen de métricas y exposiciones del día</p>
                  <div class="report-actions">
                    <button mat-raised-button color="primary">
                      <mat-icon>file_download</mat-icon>
                      Descargar PDF
                    </button>
                    <button mat-button>
                      <mat-icon>email</mat-icon>
                      Enviar por Email
                    </button>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card class="report-card">
                <mat-card-content>
                  <mat-icon class="report-icon">bar_chart</mat-icon>
                  <h3>Análisis VaR Histórico</h3>
                  <p>Value at Risk calculado con datos históricos</p>
                  <div class="report-actions">
                    <button mat-raised-button color="primary">
                      <mat-icon>file_download</mat-icon>
                      Descargar Excel
                    </button>
                    <button mat-button>
                      <mat-icon>visibility</mat-icon>
                      Ver Online
                    </button>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card class="report-card">
                <mat-card-content>
                  <mat-icon class="report-icon">table_chart</mat-icon>
                  <h3>Matriz de Correlación</h3>
                  <p>Correlaciones entre activos del portafolio</p>
                  <div class="report-actions">
                    <button mat-raised-button color="primary">
                      <mat-icon>file_download</mat-icon>
                      Descargar CSV
                    </button>
                    <button mat-button>
                      <mat-icon>bubble_chart</mat-icon>
                      Visualizar
                    </button>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card class="report-card">
                <mat-card-content>
                  <mat-icon class="report-icon">policy</mat-icon>
                  <h3>Cumplimiento Regulatorio</h3>
                  <p>Verificación de límites y normativas</p>
                  <div class="report-actions">
                    <button mat-raised-button color="primary">
                      <mat-icon>file_download</mat-icon>
                      Descargar PDF
                    </button>
                    <button mat-button>
                      <mat-icon>send</mat-icon>
                      Enviar a Compliance
                    </button>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .risk-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .risk-header {
      margin-bottom: 24px;
      
      h1 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0 0 8px 0;
        font-size: 32px;
        color: #1976d2;
        
        mat-icon {
          font-size: 36px;
          width: 36px;
          height: 36px;
        }
      }
      
      .subtitle {
        margin: 0;
        color: #666;
        font-size: 16px;
      }
    }

    /* Overview Section */
    .overview-section {
      margin-bottom: 32px;
      
      h2 {
        margin: 0 0 16px 0;
        font-size: 20px;
        color: #333;
      }
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .metric-card {
      &.status-safe {
        border-left: 4px solid #4caf50;
      }
      
      &.status-warning {
        border-left: 4px solid #ff9800;
      }
      
      &.status-danger {
        border-left: 4px solid #f44336;
      }
      
      .metric-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
        
        .metric-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          
          &.icon-safe {
            background: #e8f5e9;
            color: #4caf50;
          }
          
          &.icon-warning {
            background: #fff3e0;
            color: #ff9800;
          }
          
          &.icon-danger {
            background: #ffebee;
            color: #f44336;
          }
          
          mat-icon {
            font-size: 24px;
            width: 24px;
            height: 24px;
          }
        }
        
        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
        }
      }
      
      .metric-value {
        font-size: 32px;
        font-weight: bold;
        margin: 8px 0;
        color: #333;
      }
      
      .metric-threshold {
        font-size: 14px;
        color: #666;
        margin-bottom: 8px;
      }
      
      mat-progress-bar {
        margin: 12px 0;
        
        &.progress-safe ::ng-deep .mdc-linear-progress__bar-inner {
          border-color: #4caf50 !important;
        }
        
        &.progress-warning ::ng-deep .mdc-linear-progress__bar-inner {
          border-color: #ff9800 !important;
        }
        
        &.progress-danger ::ng-deep .mdc-linear-progress__bar-inner {
          border-color: #f44336 !important;
        }
      }
      
      .metric-description {
        font-size: 12px;
        color: #666;
        margin: 8px 0 0 0;
      }
    }

    /* Alerts Section */
    .alerts-section {
      margin-bottom: 32px;
      
      h2 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0 0 16px 0;
        font-size: 20px;
        color: #333;
      }
    }

    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .alert-card {
      &.severity-critical {
        border-left: 4px solid #f44336;
        background: #ffebee;
      }
      
      &.severity-warning {
        border-left: 4px solid #ff9800;
        background: #fff3e0;
      }
      
      &.severity-info {
        border-left: 4px solid #2196f3;
        background: #e3f2fd;
      }
      
      .alert-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
        
        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
        
        .alert-time {
          font-size: 12px;
          color: #666;
        }
      }
      
      .alert-message {
        margin: 8px 0;
        font-size: 14px;
        color: #333;
      }
      
      .position-chip {
        font-size: 11px;
        min-height: 24px;
      }
    }

    .tab-icon {
      margin-right: 8px;
    }

    .tab-content {
      padding: 24px 0;
    }

    /* Position Risk Table */
    .table-container {
      overflow-x: auto;
    }

    .positions-table {
      width: 100%;
      
      .position-info {
        display: flex;
        flex-direction: column;
        
        strong {
          font-size: 14px;
          color: #1976d2;
        }
        
        small {
          color: #666;
          font-size: 12px;
        }
      }
      
      .var-value {
        color: #f44336;
        font-weight: 500;
      }
    }

    mat-chip {
      &.risk-low {
        background-color: #e8f5e9;
        color: #4caf50;
      }
      
      &.risk-medium {
        background-color: #fff3e0;
        color: #ff9800;
      }
      
      &.risk-high {
        background-color: #ffebee;
        color: #f44336;
      }
    }

    /* Risk Limits */
    .limits-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
    }

    .limit-card {
      mat-card-title {
        font-size: 18px;
        font-weight: 500;
      }
      
      .limit-stats {
        margin: 16px 0;
        
        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
          
          .label {
            font-size: 14px;
            color: #666;
          }
          
          .value {
            font-size: 16px;
            font-weight: 500;
            color: #333;
            
            &.usage-safe {
              color: #4caf50;
            }
            
            &.usage-warning {
              color: #ff9800;
            }
            
            &.usage-exceeded {
              color: #f44336;
            }
          }
        }
      }
      
      mat-progress-bar {
        margin: 16px 0;
      }
      
      .limit-status {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        border-radius: 8px;
        font-weight: 500;
        
        &.status-safe {
          background: #e8f5e9;
          color: #4caf50;
        }
        
        &.status-warning {
          background: #fff3e0;
          color: #ff9800;
        }
        
        &.status-exceeded {
          background: #ffebee;
          color: #f44336;
        }
      }
    }

    /* Stress Testing */
    .stress-test-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }

    .scenario-result {
      margin: 16px 0 24px 0;
      
      .result-item {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid #eee;
        
        .label {
          font-size: 14px;
          color: #666;
        }
        
        .value {
          font-size: 16px;
          font-weight: 500;
          color: #333;
          
          &.negative {
            color: #f44336;
          }
        }
      }
    }

    /* Reports */
    .reports-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }

    .report-card {
      text-align: center;
      
      .report-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #1976d2;
        margin: 16px auto;
      }
      
      h3 {
        margin: 16px 0 8px 0;
        font-size: 18px;
        font-weight: 500;
      }
      
      p {
        color: #666;
        font-size: 14px;
        margin: 0 0 24px 0;
      }
      
      .report-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
    }

    .negative {
      color: #f44336;
    }

    .positive {
      color: #4caf50;
    }
  `]
})
export class RiskComponent implements OnInit {
  positionColumns = ['symbol', 'exposure', 'var95', 'var99', 'beta', 'volatility', 'sharpe', 'riskLevel'];
  
  riskMetrics = signal<RiskMetric[]>([]);
  positionRisks = signal<PositionRisk[]>([]);
  riskLimits = signal<RiskLimit[]>([]);
  riskAlerts = signal<RiskAlert[]>([]);

  ngOnInit() {
    this.initializeRiskData();
  }

  initializeRiskData() {
    // Risk Metrics
    this.riskMetrics.set([
      {
        name: 'VaR 95% (1 día)',
        value: 2.45,
        threshold: 5.00,
        status: 'safe',
        description: 'Pérdida máxima esperada con 95% de confianza'
      },
      {
        name: 'Concentración',
        value: 38.50,
        threshold: 40.00,
        status: 'warning',
        description: 'Porcentaje del portafolio en la mayor posición'
      },
      {
        name: 'Volatilidad Portafolio',
        value: 18.75,
        threshold: 25.00,
        status: 'safe',
        description: 'Desviación estándar anualizada de retornos'
      },
      {
        name: 'Beta del Portafolio',
        value: 1.12,
        threshold: 1.50,
        status: 'safe',
        description: 'Sensibilidad del portafolio al mercado'
      }
    ]);

    // Position Risks
    this.positionRisks.set([
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        exposure: 48234.50,
        var95: 1182.15,
        var99: 1773.23,
        beta: 1.18,
        volatility: 24.50,
        sharpeRatio: 1.45,
        riskLevel: 'medium'
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        exposure: 27950.00,
        var95: 698.75,
        var99: 1048.13,
        beta: 1.05,
        volatility: 22.30,
        sharpeRatio: 1.52,
        riskLevel: 'medium'
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corp.',
        exposure: 28365.00,
        var95: 567.30,
        var99: 850.95,
        beta: 0.95,
        volatility: 19.20,
        sharpeRatio: 1.68,
        riskLevel: 'low'
      },
      {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        exposure: 14568.00,
        var95: 728.40,
        var99: 1092.60,
        beta: 1.85,
        volatility: 45.80,
        sharpeRatio: 0.92,
        riskLevel: 'high'
      },
      {
        symbol: 'AMZN',
        name: 'Amazon.com Inc.',
        exposure: 12184.00,
        var95: 365.52,
        var99: 548.28,
        beta: 1.12,
        volatility: 28.50,
        sharpeRatio: 1.25,
        riskLevel: 'medium'
      }
    ]);

    // Risk Limits
    this.riskLimits.set([
      {
        category: 'Exposición Individual',
        current: 48234,
        limit: 50000,
        usage: 96.5,
        status: 'warning'
      },
      {
        category: 'Exposición Sectorial (Tech)',
        current: 125450,
        limit: 150000,
        usage: 83.6,
        status: 'safe'
      },
      {
        category: 'VaR Total del Portafolio',
        current: 3068,
        limit: 6272,
        usage: 48.9,
        status: 'safe'
      },
      {
        category: 'Apalancamiento',
        current: 0,
        limit: 50000,
        usage: 0,
        status: 'safe'
      },
      {
        category: 'Liquidez Mínima',
        current: 50000,
        limit: 25000,
        usage: 200,
        status: 'exceeded'
      },
      {
        category: 'Beta Máximo',
        current: 1.12,
        limit: 1.50,
        usage: 74.7,
        status: 'safe'
      }
    ]);

    // Risk Alerts
    this.riskAlerts.set([
      {
        id: 1,
        severity: 'warning',
        message: 'La concentración en AAPL está cerca del límite (96.5%)',
        timestamp: new Date(),
        position: 'AAPL'
      },
      {
        id: 2,
        severity: 'critical',
        message: 'Liquidez mínima excedida. Considere reducir posiciones',
        timestamp: new Date(Date.now() - 3600000)
      },
      {
        id: 3,
        severity: 'info',
        message: 'Alta volatilidad detectada en TSLA (+45.8%)',
        timestamp: new Date(Date.now() - 7200000),
        position: 'TSLA'
      }
    ]);
  }

  getRiskLevelLabel(level: string): string {
    const labels: any = {
      'low': 'Bajo',
      'medium': 'Medio',
      'high': 'Alto'
    };
    return labels[level] || level;
  }

  getLimitStatusLabel(status: string): string {
    const labels: any = {
      'safe': 'Dentro del Límite',
      'warning': 'Cerca del Límite',
      'exceeded': 'Límite Excedido'
    };
    return labels[status] || status;
  }

  runStressTest(scenario: string) {
    console.log('Running stress test:', scenario);
    // Aquí se ejecutaría el análisis de estrés
  }
}