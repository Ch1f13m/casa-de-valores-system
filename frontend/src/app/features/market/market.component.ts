import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { interval, Subscription } from 'rxjs';

interface MarketStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  marketCap: string;
  pe: number;
  sector: string;
}

interface MarketIndex {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
}

interface TopMover {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
}

@Component({
  selector: 'app-market',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTabsModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <div class="market-container">
      <div class="market-header">
        <h1>
          <mat-icon>show_chart</mat-icon>
          Datos de Mercado
        </h1>
        <p class="subtitle">Información en tiempo real del mercado financiero</p>
      </div>

      <!-- Market Indices -->
      <div class="indices-section">
        <h2>Índices Principales</h2>
        <div class="indices-grid">
          @for (index of marketIndices(); track index.symbol) {
            <mat-card class="index-card">
              <mat-card-content>
                <div class="index-header">
                  <h3>{{ index.name }}</h3>
                  <span class="index-symbol">{{ index.symbol }}</span>
                </div>
                <div class="index-value">
                  {{ index.value | number:'1.2-2' }}
                </div>
                <div class="index-change" [class.positive]="index.change > 0" [class.negative]="index.change < 0">
                  <mat-icon>{{ index.change > 0 ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                  {{ index.change > 0 ? '+' : '' }}{{ index.change | number:'1.2-2' }}
                  ({{ index.change > 0 ? '+' : '' }}{{ index.changePercent | number:'1.2-2' }}%)
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      </div>

      <mat-tab-group>
        <!-- Tab: Cotizaciones -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">list</mat-icon>
            Cotizaciones
          </ng-template>
          
          <div class="tab-content">
            <div class="actions-bar">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Buscar símbolo</mat-label>
                <input matInput placeholder="AAPL, GOOGL, MSFT..." [(ngModel)]="searchTerm">
                <mat-icon matPrefix>search</mat-icon>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Sector</mat-label>
                <mat-select [(ngModel)]="selectedSector">
                  <mat-option value="">Todos</mat-option>
                  <mat-option value="Technology">Tecnología</mat-option>
                  <mat-option value="Finance">Finanzas</mat-option>
                  <mat-option value="Healthcare">Salud</mat-option>
                  <mat-option value="Energy">Energía</mat-option>
                  <mat-option value="Consumer">Consumo</mat-option>
                </mat-select>
              </mat-form-field>
              
              <button mat-raised-button color="primary" (click)="refreshMarketData()">
                <mat-icon>refresh</mat-icon>
                Actualizar
              </button>
            </div>

            <mat-card>
              <mat-card-content>
                <div class="table-container">
                  <table mat-table [dataSource]="filteredStocks()" class="stocks-table">
                    
                    <ng-container matColumnDef="symbol">
                      <th mat-header-cell *matHeaderCellDef>Símbolo</th>
                      <td mat-cell *matCellDef="let stock">
                        <div class="stock-symbol">
                          <strong>{{ stock.symbol }}</strong>
                          <small>{{ stock.name }}</small>
                        </div>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="price">
                      <th mat-header-cell *matHeaderCellDef>Precio</th>
                      <td mat-cell *matCellDef="let stock">
                        <strong>{{ stock.price | currency:'USD':'symbol':'1.2-2' }}</strong>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="change">
                      <th mat-header-cell *matHeaderCellDef>Cambio</th>
                      <td mat-cell *matCellDef="let stock">
                        <div class="change-cell" [class.positive]="stock.change > 0" [class.negative]="stock.change < 0">
                          <mat-icon class="change-icon">
                            {{ stock.change > 0 ? 'arrow_upward' : 'arrow_downward' }}
                          </mat-icon>
                          <span>
                            {{ stock.change > 0 ? '+' : '' }}{{ stock.change | number:'1.2-2' }}
                            ({{ stock.change > 0 ? '+' : '' }}{{ stock.changePercent | number:'1.2-2' }}%)
                          </span>
                        </div>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="volume">
                      <th mat-header-cell *matHeaderCellDef>Volumen</th>
                      <td mat-cell *matCellDef="let stock">
                        {{ stock.volume | number }}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="high">
                      <th mat-header-cell *matHeaderCellDef>Máximo</th>
                      <td mat-cell *matCellDef="let stock">
                        {{ stock.high | currency:'USD':'symbol':'1.2-2' }}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="low">
                      <th mat-header-cell *matHeaderCellDef>Mínimo</th>
                      <td mat-cell *matCellDef="let stock">
                        {{ stock.low | currency:'USD':'symbol':'1.2-2' }}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="sector">
                      <th mat-header-cell *matHeaderCellDef>Sector</th>
                      <td mat-cell *matCellDef="let stock">
                        <mat-chip class="sector-chip">{{ stock.sector }}</mat-chip>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef>Acciones</th>
                      <td mat-cell *matCellDef="let stock">
                        <button mat-icon-button color="primary" matTooltip="Ver detalles">
                          <mat-icon>visibility</mat-icon>
                        </button>
                        <button mat-icon-button color="accent" matTooltip="Operar">
                          <mat-icon>add_shopping_cart</mat-icon>
                        </button>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="stockColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: stockColumns;"></tr>
                  </table>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab: Mayores Subidas/Bajadas -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">trending_up</mat-icon>
            Top Movers
          </ng-template>
          
          <div class="tab-content">
            <div class="movers-grid">
              <!-- Mayores Subidas -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon class="positive-icon">arrow_upward</mat-icon>
                    Mayores Subidas
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="movers-list">
                    @for (stock of topGainers(); track stock.symbol) {
                      <div class="mover-item positive">
                        <div class="mover-info">
                          <strong>{{ stock.symbol }}</strong>
                          <small>{{ stock.name }}</small>
                        </div>
                        <div class="mover-price">
                          <div class="price">{{ stock.price | currency:'USD':'symbol':'1.2-2' }}</div>
                          <div class="change">+{{ stock.changePercent | number:'1.2-2' }}%</div>
                        </div>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Mayores Bajadas -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon class="negative-icon">arrow_downward</mat-icon>
                    Mayores Bajadas
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="movers-list">
                    @for (stock of topLosers(); track stock.symbol) {
                      <div class="mover-item negative">
                        <div class="mover-info">
                          <strong>{{ stock.symbol }}</strong>
                          <small>{{ stock.name }}</small>
                        </div>
                        <div class="mover-price">
                          <div class="price">{{ stock.price | currency:'USD':'symbol':'1.2-2' }}</div>
                          <div class="change">{{ stock.changePercent | number:'1.2-2' }}%</div>
                        </div>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Mayor Volumen -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>bar_chart</mat-icon>
                    Mayor Volumen
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="movers-list">
                    @for (stock of mostActive(); track stock.symbol) {
                      <div class="mover-item">
                        <div class="mover-info">
                          <strong>{{ stock.symbol }}</strong>
                          <small>{{ stock.name }}</small>
                        </div>
                        <div class="mover-price">
                          <div class="price">{{ stock.price | currency:'USD':'symbol':'1.2-2' }}</div>
                          <div class="volume">{{ stock.volume | number }} vol.</div>
                        </div>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <!-- Tab: Sectores -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">pie_chart</mat-icon>
            Análisis por Sector
          </ng-template>
          
          <div class="tab-content">
            <div class="sectors-grid">
              @for (sector of sectorPerformance(); track sector.name) {
                <mat-card class="sector-card">
                  <mat-card-content>
                    <div class="sector-header">
                      <mat-icon>{{ sector.icon }}</mat-icon>
                      <h3>{{ sector.name }}</h3>
                    </div>
                    <div class="sector-stats">
                      <div class="stat">
                        <span class="label">Empresas</span>
                        <span class="value">{{ sector.companies }}</span>
                      </div>
                      <div class="stat">
                        <span class="label">Cambio Promedio</span>
                        <span class="value" [class.positive]="sector.avgChange > 0" [class.negative]="sector.avgChange < 0">
                          {{ sector.avgChange > 0 ? '+' : '' }}{{ sector.avgChange | number:'1.2-2' }}%
                        </span>
                      </div>
                      <div class="stat">
                        <span class="label">Volumen Total</span>
                        <span class="value">{{ sector.totalVolume | number }}</span>
                      </div>
                    </div>
                    <div class="sector-trend" [class.positive]="sector.avgChange > 0" [class.negative]="sector.avgChange < 0">
                      <mat-icon>{{ sector.avgChange > 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
                      {{ sector.avgChange > 0 ? 'Alcista' : 'Bajista' }}
                    </div>
                  </mat-card-content>
                </mat-card>
              }
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>

      <div class="last-update">
        <mat-icon>access_time</mat-icon>
        Última actualización: {{ lastUpdate() | date:'medium' }}
      </div>
    </div>
  `,
  styles: [`
    .market-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .market-header {
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

    /* Indices Section */
    .indices-section {
      margin-bottom: 32px;
      
      h2 {
        margin: 0 0 16px 0;
        font-size: 20px;
        color: #333;
      }
    }

    .indices-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .index-card {
      mat-card-content {
        padding: 16px;
      }
      
      .index-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        
        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
        }
        
        .index-symbol {
          font-size: 12px;
          color: #666;
        }
      }
      
      .index-value {
        font-size: 28px;
        font-weight: bold;
        margin: 8px 0;
        color: #333;
      }
      
      .index-change {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
        font-weight: 500;
        
        &.positive {
          color: #4caf50;
          
          mat-icon {
            color: #4caf50;
          }
        }
        
        &.negative {
          color: #f44336;
          
          mat-icon {
            color: #f44336;
          }
        }
        
        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }

    .tab-icon {
      margin-right: 8px;
    }

    .tab-content {
      padding: 24px 0;
    }

    .actions-bar {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      align-items: center;
      flex-wrap: wrap;
      
      .search-field {
        flex: 1;
        min-width: 300px;
      }
    }

    /* Stocks Table */
    .table-container {
      overflow-x: auto;
    }

    .stocks-table {
      width: 100%;
      
      .stock-symbol {
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
      
      .change-cell {
        display: flex;
        align-items: center;
        gap: 4px;
        font-weight: 500;
        
        &.positive {
          color: #4caf50;
          
          .change-icon {
            color: #4caf50;
          }
        }
        
        &.negative {
          color: #f44336;
          
          .change-icon {
            color: #f44336;
          }
        }
        
        .change-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }

    .sector-chip {
      font-size: 11px;
      min-height: 24px;
      background-color: #e3f2fd;
      color: #1976d2;
    }

    /* Top Movers */
    .movers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 24px;
    }

    .positive-icon {
      color: #4caf50;
    }

    .negative-icon {
      color: #f44336;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
    }

    .movers-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .mover-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      border-radius: 8px;
      background: #f5f5f5;
      
      &.positive {
        background: #e8f5e9;
        border-left: 4px solid #4caf50;
      }
      
      &.negative {
        background: #ffebee;
        border-left: 4px solid #f44336;
      }
      
      .mover-info {
        display: flex;
        flex-direction: column;
        
        strong {
          font-size: 14px;
          color: #333;
        }
        
        small {
          font-size: 12px;
          color: #666;
        }
      }
      
      .mover-price {
        text-align: right;
        
        .price {
          font-size: 16px;
          font-weight: bold;
          color: #333;
        }
        
        .change {
          font-size: 14px;
          font-weight: 500;
        }
        
        .volume {
          font-size: 12px;
          color: #666;
        }
      }
      
      &.positive .change {
        color: #4caf50;
      }
      
      &.negative .change {
        color: #f44336;
      }
    }

    /* Sectors */
    .sectors-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }

    .sector-card {
      .sector-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        
        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          color: #1976d2;
        }
        
        h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 500;
        }
      }
      
      .sector-stats {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 16px;
        
        .stat {
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
            
            &.positive {
              color: #4caf50;
            }
            
            &.negative {
              color: #f44336;
            }
          }
        }
      }
      
      .sector-trend {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px;
        border-radius: 8px;
        font-weight: 500;
        
        &.positive {
          background: #e8f5e9;
          color: #4caf50;
        }
        
        &.negative {
          background: #ffebee;
          color: #f44336;
        }
        
        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }
    }

    .last-update {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 24px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
      color: #666;
      font-size: 14px;
      
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .positive {
      color: #4caf50;
    }

    .negative {
      color: #f44336;
    }
  `]
})
export class MarketComponent implements OnInit, OnDestroy {
  searchTerm = '';
  selectedSector = '';
  stockColumns = ['symbol', 'price', 'change', 'volume', 'high', 'low', 'sector', 'actions'];
  
  marketStocks = signal<MarketStock[]>([]);
  marketIndices = signal<MarketIndex[]>([]);
  lastUpdate = signal<Date>(new Date());
  
  private updateSubscription?: Subscription;

  ngOnInit() {
    this.initializeMarketData();
    this.startAutoUpdate();
  }

  ngOnDestroy() {
    this.updateSubscription?.unsubscribe();
  }

  initializeMarketData() {
    // Índices principales
    this.marketIndices.set([
      { name: 'S&P 500', symbol: 'SPX', value: 4567.89, change: 23.45, changePercent: 0.52 },
      { name: 'Dow Jones', symbol: 'DJI', value: 35234.56, change: -45.23, changePercent: -0.13 },
      { name: 'NASDAQ', symbol: 'IXIC', value: 14123.78, change: 89.12, changePercent: 0.63 },
      { name: 'Russell 2000', symbol: 'RUT', value: 2089.45, change: 12.34, changePercent: 0.59 }
    ]);

    // Acciones
    this.marketStocks.set([
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 178.50,
        change: 2.35,
        changePercent: 1.33,
        volume: 54230000,
        high: 179.20,
        low: 176.80,
        open: 177.00,
        prevClose: 176.15,
        marketCap: '$2.8T',
        pe: 29.5,
        sector: 'Technology'
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        price: 139.75,
        change: -1.25,
        changePercent: -0.89,
        volume: 23450000,
        high: 141.20,
        low: 139.30,
        open: 140.50,
        prevClose: 141.00,
        marketCap: '$1.7T',
        pe: 25.3,
        sector: 'Technology'
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corp.',
        price: 378.20,
        change: 4.80,
        changePercent: 1.29,
        volume: 28340000,
        high: 379.50,
        low: 375.60,
        open: 376.00,
        prevClose: 373.40,
        marketCap: '$2.8T',
        pe: 32.1,
        sector: 'Technology'
      },
      {
        symbol: 'AMZN',
        name: 'Amazon.com Inc.',
        price: 145.30,
        change: 3.45,
        changePercent: 2.43,
        volume: 45670000,
        high: 146.20,
        low: 143.80,
        open: 144.20,
        prevClose: 141.85,
        marketCap: '$1.5T',
        pe: 65.4,
        sector: 'Consumer'
      },
      {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        price: 242.80,
        change: -5.20,
        changePercent: -2.10,
        volume: 98765000,
        high: 248.50,
        low: 241.30,
        open: 246.00,
        prevClose: 248.00,
        marketCap: '$770B',
        pe: 71.8,
        sector: 'Technology'
      },
      {
        symbol: 'JPM',
        name: 'JPMorgan Chase',
        price: 154.60,
        change: 1.80,
        changePercent: 1.18,
        volume: 12340000,
        high: 155.20,
        low: 153.40,
        open: 153.80,
        prevClose: 152.80,
        marketCap: '$450B',
        pe: 10.5,
        sector: 'Finance'
      },
      {
        symbol: 'JNJ',
        name: 'Johnson & Johnson',
        price: 161.30,
        change: 0.85,
        changePercent: 0.53,
        volume: 8765000,
        high: 162.10,
        low: 160.80,
        open: 161.00,
        prevClose: 160.45,
        marketCap: '$400B',
        pe: 18.2,
        sector: 'Healthcare'
      },
      {
        symbol: 'XOM',
        name: 'Exxon Mobil',
        price: 108.45,
        change: -2.15,
        changePercent: -1.94,
        volume: 19876000,
        high: 110.80,
        low: 108.20,
        open: 110.20,
        prevClose: 110.60,
        marketCap: '$450B',
        pe: 9.8,
        sector: 'Energy'
      },
      {
        symbol: 'BAC',
        name: 'Bank of America',
        price: 32.75,
        change: 0.45,
        changePercent: 1.39,
        volume: 34567000,
        high: 33.10,
        low: 32.50,
        open: 32.60,
        prevClose: 32.30,
        marketCap: '$260B',
        pe: 11.2,
        sector: 'Finance'
      },
      {
        symbol: 'WMT',
        name: 'Walmart Inc.',
        price: 168.90,
        change: 2.30,
        changePercent: 1.38,
        volume: 7654000,
        high: 169.50,
        low: 167.20,
        open: 167.80,
        prevClose: 166.60,
        marketCap: '$460B',
        pe: 28.5,
        sector: 'Consumer'
      }
    ]);

    this.lastUpdate.set(new Date());
  }

  startAutoUpdate() {
    // Actualizar precios cada 5 segundos simulando mercado en vivo
    this.updateSubscription = interval(5000).subscribe(() => {
      this.updatePrices();
    });
  }

  updatePrices() {
    const stocks = this.marketStocks();
    const updatedStocks = stocks.map(stock => {
      const priceChange = (Math.random() - 0.5) * 2; // -1 a +1
      const newPrice = stock.price + priceChange;
      const change = newPrice - stock.prevClose;
      const changePercent = (change / stock.prevClose) * 100;
      
      return {
        ...stock,
        price: newPrice,
        change,
        changePercent,
        high: Math.max(stock.high, newPrice),
        low: Math.min(stock.low, newPrice)
      };
    });
    
    this.marketStocks.set(updatedStocks);
    this.lastUpdate.set(new Date());
  }

  refreshMarketData() {
    this.updatePrices();
  }

  filteredStocks() {
    let stocks = this.marketStocks();
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      stocks = stocks.filter(stock =>
        stock.symbol.toLowerCase().includes(term) ||
        stock.name.toLowerCase().includes(term)
      );
    }
    
    if (this.selectedSector) {
      stocks = stocks.filter(stock => stock.sector === this.selectedSector);
    }
    
    return stocks;
  }

  topGainers(): TopMover[] {
    return this.marketStocks()
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5)
      .map(s => ({
        symbol: s.symbol,
        name: s.name,
        price: s.price,
        changePercent: s.changePercent,
        volume: s.volume
      }));
  }

  topLosers(): TopMover[] {
    return this.marketStocks()
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5)
      .map(s => ({
        symbol: s.symbol,
        name: s.name,
        price: s.price,
        changePercent: s.changePercent,
        volume: s.volume
      }));
  }

  mostActive(): TopMover[] {
    return this.marketStocks()
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5)
      .map(s => ({
        symbol: s.symbol,
        name: s.name,
        price: s.price,
        changePercent: s.changePercent,
        volume: s.volume
      }));
  }

  sectorPerformance() {
    const sectors = ['Technology', 'Finance', 'Healthcare', 'Energy', 'Consumer'];
    const icons = ['computer', 'account_balance', 'local_hospital', 'bolt', 'shopping_cart'];
    
    return sectors.map((sector, index) => {
      const sectorStocks = this.marketStocks().filter(s => s.sector === sector);
      const avgChange = sectorStocks.reduce((sum, s) => sum + s.changePercent, 0) / sectorStocks.length;
      const totalVolume = sectorStocks.reduce((sum, s) => sum + s.volume, 0);
      
      return {
        name: sector,
        icon: icons[index],
        companies: sectorStocks.length,
        avgChange,
        totalVolume
      };
    });
  }
}