import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

interface PortfolioPosition {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  weight: number;
  sector: string;
  lastUpdate: Date;
}

interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalPnL: number;
  totalPnLPercent: number;
  dayChange: number;
  dayChangePercent: number;
  positions: PortfolioPosition[];
}

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  template: `
    <div class="portfolio-container">
      <!-- Resumen del Portfolio -->
      <div class="portfolio-summary">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>account_balance_wallet</mat-icon>
              Resumen del Portafolio
            </mat-card-title>
            <mat-card-subtitle>Valor total actualizado en tiempo real</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <div class="summary-grid">
              <div class="summary-item">
                <h3>Valor Total</h3>
                <div class="value primary">{{ portfolio.totalValue | currency:'USD':'symbol':'1.2-2' }}</div>
              </div>
              
              <div class="summary-item">
                <h3>P&L Total</h3>
                <div class="value" [class.positive]="portfolio.totalPnL > 0" [class.negative]="portfolio.totalPnL < 0">
                  {{ portfolio.totalPnL | currency:'USD':'symbol':'1.2-2' }}
                  <span class="percentage">({{ portfolio.totalPnLPercent | number:'1.2-2' }}%)</span>
                </div>
              </div>
              
              <div class="summary-item">
                <h3>Cambio del Día</h3>
                <div class="value" [class.positive]="portfolio.dayChange > 0" [class.negative]="portfolio.dayChange < 0">
                  {{ portfolio.dayChange | currency:'USD':'symbol':'1.2-2' }}
                  <span class="percentage">({{ portfolio.dayChangePercent | number:'1.2-2' }}%)</span>
                </div>
              </div>
              
              <div class="summary-item">
                <h3>Posiciones</h3>
                <div class="value">{{ portfolio.positions.length }}</div>
              </div>
            </div>
            
            <div class="action-buttons">
              <button mat-raised-button color="primary" (click)="refreshData()">
                <mat-icon>refresh</mat-icon>
                Actualizar
              </button>
              <button mat-raised-button (click)="exportPortfolio()">
                <mat-icon>download</mat-icon>
                Exportar
              </button>
              <button mat-raised-button (click)="rebalancePortfolio()">
                <mat-icon>balance</mat-icon>
                Rebalancear
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Tabs para diferentes vistas -->
      <mat-tab-group class="portfolio-tabs">
        <!-- Posiciones -->
        <mat-tab label="Posiciones">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Posiciones Actuales</mat-card-title>
                <mat-card-subtitle>{{ portfolio.positions.length }} posiciones activas</mat-card-subtitle>
              </mat-card-header>
              
              <mat-card-content>
                <div class="table-container">
                  <table mat-table [dataSource]="portfolio.positions" class="positions-table">
                    <!-- Símbolo -->
                    <ng-container matColumnDef="symbol">
                      <th mat-header-cell *matHeaderCellDef>Símbolo</th>
                      <td mat-cell *matCellDef="let position">
                        <div class="symbol-info">
                          <strong>{{ position.symbol }}</strong>
                          <small>{{ position.name }}</small>
                        </div>
                      </td>
                    </ng-container>

                    <!-- Cantidad -->
                    <ng-container matColumnDef="quantity">
                      <th mat-header-cell *matHeaderCellDef>Cantidad</th>
                      <td mat-cell *matCellDef="let position">
                        {{ position.quantity | number:'1.0-0' }}
                      </td>
                    </ng-container>

                    <!-- Precio Promedio -->
                    <ng-container matColumnDef="avgPrice">
                      <th mat-header-cell *matHeaderCellDef>Precio Promedio</th>
                      <td mat-cell *matCellDef="let position">
                        {{ position.avgPrice | currency:'USD':'symbol':'1.2-2' }}
                      </td>
                    </ng-container>

                    <!-- Precio Actual -->
                    <ng-container matColumnDef="currentPrice">
                      <th mat-header-cell *matHeaderCellDef>Precio Actual</th>
                      <td mat-cell *matCellDef="let position">
                        <div class="price-info">
                          {{ position.currentPrice | currency:'USD':'symbol':'1.2-2' }}
                          <mat-icon class="live-indicator">fiber_manual_record</mat-icon>
                        </div>
                      </td>
                    </ng-container>

                    <!-- Valor de Mercado -->
                    <ng-container matColumnDef="marketValue">
                      <th mat-header-cell *matHeaderCellDef>Valor de Mercado</th>
                      <td mat-cell *matCellDef="let position">
                        {{ position.marketValue | currency:'USD':'symbol':'1.2-2' }}
                      </td>
                    </ng-container>

                    <!-- P&L -->
                    <ng-container matColumnDef="pnl">
                      <th mat-header-cell *matHeaderCellDef>P&L</th>
                      <td mat-cell *matCellDef="let position">
                        <div class="pnl-info" 
                             [class.positive]="position.unrealizedPnL > 0" 
                             [class.negative]="position.unrealizedPnL < 0">
                          {{ position.unrealizedPnL | currency:'USD':'symbol':'1.2-2' }}
                          <span class="percentage">({{ position.unrealizedPnLPercent | number:'1.2-2' }}%)</span>
                        </div>
                      </td>
                    </ng-container>

                    <!-- Peso -->
                    <ng-container matColumnDef="weight">
                      <th mat-header-cell *matHeaderCellDef>Peso</th>
                      <td mat-cell *matCellDef="let position">
                        <mat-chip>{{ position.weight | number:'1.1-1' }}%</mat-chip>
                      </td>
                    </ng-container>

                    <!-- Sector -->
                    <ng-container matColumnDef="sector">
                      <th mat-header-cell *matHeaderCellDef>Sector</th>
                      <td mat-cell *matCellDef="let position">
                        <mat-chip color="primary">{{ position.sector }}</mat-chip>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                  </table>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Análisis de Diversificación -->
        <mat-tab label="Diversificación">
          <div class="tab-content">
            <div class="diversification-grid">
              <!-- Gráfico de Sectores -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Distribución por Sectores</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="chart-placeholder">
                    <p>Gráfico de sectores se mostrará aquí</p>
                    <p>Distribución: Technology (52%), Automotive (19%), E-commerce (10%)</p>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Métricas de Diversificación -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Métricas de Diversificación</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="metrics-grid">
                    <div class="metric-item">
                      <h4>Concentración</h4>
                      <div class="metric-value">{{ concentrationRisk | number:'1.1-1' }}%</div>
                      <small>Top 5 posiciones</small>
                    </div>
                    
                    <div class="metric-item">
                      <h4>Sectores</h4>
                      <div class="metric-value">{{ uniqueSectors }}</div>
                      <small>Sectores únicos</small>
                    </div>
                    
                    <div class="metric-item">
                      <h4>Índice Herfindahl</h4>
                      <div class="metric-value">{{ herfindahlIndex | number:'1.3-3' }}</div>
                      <small>Medida de concentración</small>
                    </div>
                    
                    <div class="metric-item">
                      <h4>Volatilidad</h4>
                      <div class="metric-value">{{ portfolioVolatility | number:'1.2-2' }}%</div>
                      <small>Riesgo estimado</small>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <!-- Rendimiento Histórico -->
        <mat-tab label="Rendimiento">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Evolución del Portafolio</mat-card-title>
                <mat-card-subtitle>
                  <mat-form-field>
                    <mat-label>Período</mat-label>
                    <mat-select [(value)]="selectedPeriod" (selectionChange)="loadPerformanceData()">
                      <mat-option value="1M">1 Mes</mat-option>
                      <mat-option value="3M">3 Meses</mat-option>
                      <mat-option value="6M">6 Meses</mat-option>
                      <mat-option value="1Y">1 Año</mat-option>
                      <mat-option value="ALL">Todo</mat-option>
                    </mat-select>
                  </mat-form-field>
                </mat-card-subtitle>
              </mat-card-header>
              
              <mat-card-content>
                <div class="chart-placeholder">
                  <p>Gráfico de rendimiento se mostrará aquí</p>
                  <p>Período: {{ selectedPeriod }}</p>
                </div>
                
                <div class="performance-metrics">
                  <div class="metric-row">
                    <span>Retorno Total:</span>
                    <span class="value" [class.positive]="totalReturn > 0" [class.negative]="totalReturn < 0">
                      {{ totalReturn | number:'1.2-2' }}%
                    </span>
                  </div>
                  <div class="metric-row">
                    <span>Retorno Anualizado:</span>
                    <span class="value">{{ annualizedReturn | number:'1.2-2' }}%</span>
                  </div>
                  <div class="metric-row">
                    <span>Ratio Sharpe:</span>
                    <span class="value">{{ sharpeRatio | number:'1.2-2' }}</span>
                  </div>
                  <div class="metric-row">
                    <span>Máximo Drawdown:</span>
                    <span class="value negative">{{ maxDrawdown | number:'1.2-2' }}%</span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Alertas -->
        <mat-tab label="Alertas">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Alertas del Portafolio</mat-card-title>
                <mat-card-subtitle>Notificaciones y límites de riesgo</mat-card-subtitle>
              </mat-card-header>
              
              <mat-card-content>
                <div class="alerts-list">
                  <div class="alert-item" *ngFor="let alert of portfolioAlerts" 
                       [class]="alert.severity">
                    <mat-icon>{{ getAlertIcon(alert.type) }}</mat-icon>
                    <div class="alert-content">
                      <h4>{{ alert.title }}</h4>
                      <p>{{ alert.message }}</p>
                      <small>{{ alert.timestamp | date:'short' }}</small>
                    </div>
                    <button mat-icon-button (click)="dismissAlert(alert.id)">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .portfolio-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .portfolio-summary {
      margin-bottom: 24px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
    }

    .summary-item {
      text-align: center;
    }

    .summary-item h3 {
      margin: 0 0 8px 0;
      color: #666;
      font-size: 14px;
      font-weight: 500;
    }

    .value {
      font-size: 24px;
      font-weight: 600;
      color: #333;
    }

    .value.primary {
      color: #3f51b5;
    }

    .value.positive {
      color: #4caf50;
    }

    .value.negative {
      color: #f44336;
    }

    .percentage {
      font-size: 16px;
      margin-left: 8px;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .portfolio-tabs {
      margin-top: 24px;
    }

    .tab-content {
      padding: 24px 0;
    }

    .table-container {
      overflow-x: auto;
      margin-top: 16px;
    }

    .positions-table {
      width: 100%;
    }

    .symbol-info {
      display: flex;
      flex-direction: column;
    }

    .symbol-info small {
      color: #666;
      font-size: 12px;
    }

    .price-info {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .live-indicator {
      color: #4caf50;
      font-size: 12px;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }

    .pnl-info {
      display: flex;
      flex-direction: column;
    }

    .diversification-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .metric-item {
      text-align: center;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .metric-item h4 {
      margin: 0 0 8px 0;
      color: #666;
      font-size: 14px;
    }

    .metric-value {
      font-size: 20px;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }

    .metric-item small {
      color: #999;
      font-size: 12px;
    }

    .performance-metrics {
      margin-top: 24px;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .metric-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .metric-row:last-child {
      margin-bottom: 0;
    }

    .alerts-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .alert-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px;
      margin-bottom: 12px;
      border-radius: 8px;
      border-left: 4px solid;
    }

    .alert-item.high {
      background-color: #ffebee;
      border-left-color: #f44336;
    }

    .alert-item.medium {
      background-color: #fff3e0;
      border-left-color: #ff9800;
    }

    .alert-item.low {
      background-color: #e8f5e8;
      border-left-color: #4caf50;
    }

    .alert-content {
      flex: 1;
    }

    .alert-content h4 {
      margin: 0 0 4px 0;
      color: #333;
    }

    .alert-content p {
      margin: 0 0 4px 0;
      color: #666;
    }

    .alert-content small {
      color: #999;
    }

    mat-card-header {
      margin-bottom: 16px;
    }

    .chart-placeholder {
      padding: 40px;
      text-align: center;
      background-color: #f5f5f5;
      border-radius: 8px;
      color: #666;
    }

    .chart-placeholder p {
      margin: 8px 0;
    }
  `]
})
export class PortfolioComponent implements OnInit {
  portfolio: PortfolioSummary = {
    totalValue: 125450.75,
    totalCost: 118200.00,
    totalPnL: 7250.75,
    totalPnLPercent: 6.13,
    dayChange: 1240.30,
    dayChangePercent: 1.02,
    positions: []
  };

  displayedColumns: string[] = ['symbol', 'quantity', 'avgPrice', 'currentPrice', 'marketValue', 'pnl', 'weight', 'sector'];
  selectedPeriod = '3M';
  
  // Métricas de diversificación
  concentrationRisk = 0;
  uniqueSectors = 0;
  herfindahlIndex = 0;
  portfolioVolatility = 0;
  
  // Métricas de rendimiento
  totalReturn = 0;
  annualizedReturn = 0;
  sharpeRatio = 0;
  maxDrawdown = 0;

  // Configuración de gráficos
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    interaction: {
      intersect: false
    },
    scales: {
      y: {
        beginAtZero: false
      }
    }
  };

  // Datos de gráficos
  sectorChartData: any = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: ['#3f51b5', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4']
    }]
  };

  performanceChartData: any = {
    labels: [],
    datasets: [{
      label: 'Valor del Portafolio',
      data: [],
      borderColor: '#3f51b5',
      fill: false
    }]
  };

  portfolioAlerts: any[] = [];

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.loadPortfolioData();
    this.loadPerformanceData();
    this.calculateDiversificationMetrics();
    this.loadAlerts();
    
    // Simular actualización en tiempo real
    setInterval(() => {
      this.updateRealTimePrices();
    }, 30000); // Cada 30 segundos
  }

  loadPortfolioData() {
    // Simular datos del portafolio
    this.portfolio.positions = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        quantity: 100,
        avgPrice: 150.25,
        currentPrice: 157.80,
        marketValue: 15780,
        unrealizedPnL: 755,
        unrealizedPnLPercent: 5.02,
        weight: 12.6,
        sector: 'Technology',
        lastUpdate: new Date()
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        quantity: 50,
        avgPrice: 2650.30,
        currentPrice: 2780.15,
        marketValue: 139007.50,
        unrealizedPnL: 6492.50,
        unrealizedPnLPercent: 4.89,
        weight: 11.1,
        sector: 'Technology',
        lastUpdate: new Date()
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corp.',
        quantity: 75,
        avgPrice: 310.40,
        currentPrice: 325.60,
        marketValue: 24420,
        unrealizedPnL: 1140,
        unrealizedPnLPercent: 4.90,
        weight: 19.5,
        sector: 'Technology',
        lastUpdate: new Date()
      },
      {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        quantity: 60,
        avgPrice: 420.75,
        currentPrice: 398.20,
        marketValue: 23892,
        unrealizedPnL: -1353,
        unrealizedPnLPercent: -5.36,
        weight: 19.0,
        sector: 'Automotive',
        lastUpdate: new Date()
      },
      {
        symbol: 'AMZN',
        name: 'Amazon.com Inc.',
        quantity: 80,
        avgPrice: 145.60,
        currentPrice: 152.30,
        marketValue: 12184,
        unrealizedPnL: 536,
        unrealizedPnLPercent: 4.60,
        weight: 9.7,
        sector: 'E-commerce',
        lastUpdate: new Date()
      }
    ];

    this.updateChartsData();
  }

  updateChartsData() {
    // Actualizar datos de gráfico de sectores
    const sectorData = this.aggregateBySector();
    this.sectorChartData.labels = Object.keys(sectorData);
    this.sectorChartData.datasets[0].data = Object.values(sectorData);
  }

  aggregateBySector(): { [key: string]: number } {
    const sectorData: { [key: string]: number } = {};
    
    this.portfolio.positions.forEach(position => {
      if (sectorData[position.sector]) {
        sectorData[position.sector] += position.weight;
      } else {
        sectorData[position.sector] = position.weight;
      }
    });

    return sectorData;
  }

  calculateDiversificationMetrics() {
    // Concentración de top 5 posiciones
    const sortedPositions = [...this.portfolio.positions]
      .sort((a, b) => b.weight - a.weight);
    this.concentrationRisk = sortedPositions
      .slice(0, 5)
      .reduce((sum, pos) => sum + pos.weight, 0);

    // Número de sectores únicos
    this.uniqueSectors = new Set(this.portfolio.positions.map(p => p.sector)).size;

    // Índice Herfindahl
    this.herfindahlIndex = this.portfolio.positions
      .reduce((sum, pos) => sum + Math.pow(pos.weight / 100, 2), 0);

    // Volatilidad estimada (simulada)
    this.portfolioVolatility = 15.6;
  }

  loadPerformanceData() {
    // Simular datos de rendimiento histórico
    const dates = this.generateDateRange(this.selectedPeriod);
    const values = this.generatePerformanceData(dates.length);

    this.performanceChartData.labels = dates;
    this.performanceChartData.datasets[0].data = values;

    // Calcular métricas de rendimiento
    this.totalReturn = ((values[values.length - 1] - values[0]) / values[0]) * 100;
    this.annualizedReturn = this.totalReturn * (365 / dates.length);
    this.sharpeRatio = 1.25;
    this.maxDrawdown = -8.4;
  }

  generateDateRange(period: string): string[] {
    const dates = [];
    const now = new Date();
    let days = 90; // Default 3 months

    switch (period) {
      case '1M': days = 30; break;
      case '3M': days = 90; break;
      case '6M': days = 180; break;
      case '1Y': days = 365; break;
      case 'ALL': days = 730; break;
    }

    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      dates.push(date.toLocaleDateString());
    }

    return dates;
  }

  generatePerformanceData(length: number): number[] {
    const data = [];
    let baseValue = 118000;
    
    for (let i = 0; i < length; i++) {
      baseValue += (Math.random() - 0.48) * 500; // Slight upward trend
      data.push(baseValue);
    }

    return data;
  }

  loadAlerts() {
    this.portfolioAlerts = [
      {
        id: 1,
        type: 'concentration',
        severity: 'high',
        title: 'Alta Concentración',
        message: 'El 52% del portafolio está concentrado en tecnología',
        timestamp: new Date()
      },
      {
        id: 2,
        type: 'volatility',
        severity: 'medium',
        title: 'Incremento de Volatilidad',
        message: 'La volatilidad del portafolio ha aumentado un 15% esta semana',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 3,
        type: 'loss',
        severity: 'medium',
        title: 'Pérdida en TSLA',
        message: 'Tesla ha caído -5.36% desde tu precio de compra',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
      }
    ];
  }

  updateRealTimePrices() {
    this.portfolio.positions.forEach(position => {
      // Simular cambio de precio aleatorio
      const change = (Math.random() - 0.5) * 0.02; // ±1% change
      position.currentPrice *= (1 + change);
      position.marketValue = position.quantity * position.currentPrice;
      position.unrealizedPnL = position.marketValue - (position.quantity * position.avgPrice);
      position.unrealizedPnLPercent = (position.unrealizedPnL / (position.quantity * position.avgPrice)) * 100;
      position.lastUpdate = new Date();
    });

    // Recalcular totales
    this.portfolio.totalValue = this.portfolio.positions.reduce((sum, pos) => sum + pos.marketValue, 0);
    this.portfolio.totalCost = this.portfolio.positions.reduce((sum, pos) => sum + (pos.quantity * pos.avgPrice), 0);
    this.portfolio.totalPnL = this.portfolio.totalValue - this.portfolio.totalCost;
    this.portfolio.totalPnLPercent = (this.portfolio.totalPnL / this.portfolio.totalCost) * 100;

    // Recalcular pesos
    this.portfolio.positions.forEach(position => {
      position.weight = (position.marketValue / this.portfolio.totalValue) * 100;
    });

    this.updateChartsData();
  }

  refreshData() {
    this.snackBar.open('Actualizando datos del portafolio...', '', { duration: 2000 });
    this.updateRealTimePrices();
  }

  exportPortfolio() {
    this.snackBar.open('Exportando portafolio...', '', { duration: 2000 });
    // Implementar exportación
  }

  rebalancePortfolio() {
    this.snackBar.open('Iniciando rebalanceo...', '', { duration: 2000 });
    // Implementar rebalanceo
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'concentration': return 'warning';
      case 'volatility': return 'trending_up';
      case 'loss': return 'trending_down';
      default: return 'info';
    }
  }

  dismissAlert(alertId: number) {
    this.portfolioAlerts = this.portfolioAlerts.filter(alert => alert.id !== alertId);
  }
}