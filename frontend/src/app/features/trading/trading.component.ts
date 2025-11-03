import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';

interface Order {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
  quantity: number;
  price?: number;
  stopPrice?: number;
  status: 'PENDING' | 'EXECUTING' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'REJECTED';
  filledQuantity: number;
  timestamp: Date;
  expirationDate?: Date;
  totalAmount: number;
}

interface MarketData {
  symbol: string;
  name: string;
  lastPrice: number;
  change: number;
  changePercent: number;
  bid: number;
  ask: number;
  volume: number;
  high: number;
  low: number;
}

@Component({
  selector: 'app-trading',
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
    MatTableModule,
    MatTabsModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatRadioModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatBadgeModule
  ],
  template: `
    <div class="trading-container">
      <!-- Header con datos de mercado -->
      <div class="market-header">
        <mat-card>
          <mat-card-content>
            <div class="market-ticker">
              <div class="ticker-item" *ngFor="let stock of watchlist">
                <span class="symbol">{{ stock.symbol }}</span>
                <span class="price" [class.positive]="stock.change > 0" [class.negative]="stock.change < 0">
                  {{ stock.lastPrice | currency:'USD':'symbol':'1.2-2' }}
                </span>
                <span class="change" [class.positive]="stock.change > 0" [class.negative]="stock.change < 0">
                  {{ stock.change > 0 ? '+' : '' }}{{ stock.changePercent | number:'1.2-2' }}%
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="trading-layout">
        <!-- Panel de Trading -->
        <div class="trading-panel">
          <mat-card>
            <mat-card-header>
              <mat-card-title>
                <mat-icon>trending_up</mat-icon>
                Nueva Orden
              </mat-card-title>
            </mat-card-header>
            
            <mat-card-content>
              <form [formGroup]="orderForm" (ngSubmit)="submitOrder()">
                <!-- Selección de Acción -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Símbolo</mat-label>
                  <mat-select formControlName="symbol" (selectionChange)="onSymbolChange()">
                    <mat-option *ngFor="let stock of availableStocks" [value]="stock.symbol">
                      {{ stock.symbol }} - {{ stock.name }}
                    </mat-option>
                  </mat-select>
                  <mat-error *ngIf="orderForm.get('symbol')?.hasError('required')">
                    Selecciona un símbolo
                  </mat-error>
                </mat-form-field>

                <!-- Datos de mercado del símbolo seleccionado -->
                <div class="selected-stock-info" *ngIf="selectedStock">
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="label">Último precio:</span>
                      <span class="value">\${{ selectedStock.lastPrice | number:'1.2-2' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">Bid:</span>
                      <span class="value">\${{ selectedStock.bid | number:'1.2-2' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">Ask:</span>
                      <span class="value">\${{ selectedStock.ask | number:'1.2-2' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">Cambio:</span>
                      <span class="value" [class.positive]="selectedStock.change > 0" [class.negative]="selectedStock.change < 0">
                        {{ selectedStock.change > 0 ? '+' : '' }}{{ selectedStock.changePercent | number:'1.2-2' }}%
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Tipo de Operación -->
                <mat-radio-group formControlName="type" class="radio-group">
                  <mat-radio-button value="BUY" color="primary">Compra</mat-radio-button>
                  <mat-radio-button value="SELL" color="warn">Venta</mat-radio-button>
                </mat-radio-group>

                <!-- Tipo de Orden -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Tipo de Orden</mat-label>
                  <mat-select formControlName="orderType" (selectionChange)="onOrderTypeChange()">
                    <mat-option value="MARKET">Mercado</mat-option>
                    <mat-option value="LIMIT">Límite</mat-option>
                    <mat-option value="STOP">Stop</mat-option>
                    <mat-option value="STOP_LIMIT">Stop Límite</mat-option>
                  </mat-select>
                </mat-form-field>

                <!-- Cantidad -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Cantidad</mat-label>
                  <input matInput type="number" formControlName="quantity" 
                         (input)="calculateTotal()" min="1">
                  <mat-error *ngIf="orderForm.get('quantity')?.hasError('required')">
                    Ingresa la cantidad
                  </mat-error>
                  <mat-error *ngIf="orderForm.get('quantity')?.hasError('min')">
                    La cantidad debe ser mayor a 0
                  </mat-error>
                </mat-form-field>

                <!-- Precio Límite (si aplica) -->
                <mat-form-field appearance="outline" class="full-width" 
                                *ngIf="orderForm.get('orderType')?.value === 'LIMIT' || 
                                       orderForm.get('orderType')?.value === 'STOP_LIMIT'">
                  <mat-label>Precio Límite</mat-label>
                  <input matInput type="number" formControlName="price" 
                         (input)="calculateTotal()" step="0.01">
                  <span matPrefix>$&nbsp;</span>
                  <mat-error *ngIf="orderForm.get('price')?.hasError('required')">
                    Ingresa el precio límite
                  </mat-error>
                </mat-form-field>

                <!-- Precio Stop (si aplica) -->
                <mat-form-field appearance="outline" class="full-width" 
                                *ngIf="orderForm.get('orderType')?.value === 'STOP' || 
                                       orderForm.get('orderType')?.value === 'STOP_LIMIT'">
                  <mat-label>Precio Stop</mat-label>
                  <input matInput type="number" formControlName="stopPrice" step="0.01">
                  <span matPrefix>$&nbsp;</span>
                  <mat-error *ngIf="orderForm.get('stopPrice')?.hasError('required')">
                    Ingresa el precio stop
                  </mat-error>
                </mat-form-field>

                <!-- Resumen de la Orden -->
                <div class="order-summary" *ngIf="orderForm.valid">
                  <h3>Resumen de la Orden</h3>
                  <div class="summary-grid">
                    <div class="summary-item">
                      <span class="label">Operación:</span>
                      <span class="value" [class.buy]="orderForm.get('type')?.value === 'BUY'"
                                         [class.sell]="orderForm.get('type')?.value === 'SELL'">
                        {{ orderForm.get('type')?.value === 'BUY' ? 'COMPRA' : 'VENTA' }}
                      </span>
                    </div>
                    <div class="summary-item">
                      <span class="label">Cantidad:</span>
                      <span class="value">{{ orderForm.get('quantity')?.value }} acciones</span>
                    </div>
                    <div class="summary-item">
                      <span class="label">Precio estimado:</span>
                      <span class="value">\${{ getEstimatedPrice() | number:'1.2-2' }}</span>
                    </div>
                    <div class="summary-item total">
                      <span class="label">Total estimado:</span>
                      <span class="value">\${{ estimatedTotal | number:'1.2-2' }}</span>
                    </div>
                  </div>
                </div>

                <!-- Validación de Fondos -->
                <div class="funds-check" *ngIf="orderForm.get('type')?.value === 'BUY'">
                  <div class="funds-info" [class.insufficient]="!hasSufficientFunds()">
                    <mat-icon>{{ hasSufficientFunds() ? 'check_circle' : 'warning' }}</mat-icon>
                    <span>Fondos disponibles: \${{ availableFunds | number:'1.2-2' }}</span>
                  </div>
                </div>

                <!-- Botones -->
                <div class="form-actions">
                  <button mat-raised-button 
                          [color]="orderForm.get('type')?.value === 'BUY' ? 'primary' : 'warn'"
                          type="submit"
                          [disabled]="!orderForm.valid || !hasSufficientFunds()">
                    <mat-icon>{{ orderForm.get('type')?.value === 'BUY' ? 'add_shopping_cart' : 'remove_shopping_cart' }}</mat-icon>
                    {{ orderForm.get('type')?.value === 'BUY' ? 'Comprar' : 'Vender' }}
                  </button>
                  <button mat-button type="button" (click)="resetForm()">
                    <mat-icon>refresh</mat-icon>
                    Limpiar
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Panel de Órdenes -->
        <div class="orders-panel">
          <mat-card>
            <mat-card-header>
              <mat-card-title>
                <mat-icon [matBadge]="pendingOrders.length" matBadgeColor="warn">receipt_long</mat-icon>
                Mis Órdenes
              </mat-card-title>
            </mat-card-header>
            
            <mat-card-content>
              <mat-tab-group>
                <!-- Órdenes Activas -->
                <mat-tab label="Activas ({{ pendingOrders.length }})">
                  <div class="orders-list">
                    <table mat-table [dataSource]="pendingOrders" *ngIf="pendingOrders.length > 0">
                      <ng-container matColumnDef="symbol">
                        <th mat-header-cell *matHeaderCellDef>Símbolo</th>
                        <td mat-cell *matCellDef="let order">{{ order.symbol }}</td>
                      </ng-container>

                      <ng-container matColumnDef="type">
                        <th mat-header-cell *matHeaderCellDef>Tipo</th>
                        <td mat-cell *matCellDef="let order">
                          <mat-chip [color]="order.type === 'BUY' ? 'primary' : 'warn'">
                            {{ order.type === 'BUY' ? 'COMPRA' : 'VENTA' }}
                          </mat-chip>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="orderType">
                        <th mat-header-cell *matHeaderCellDef>Orden</th>
                        <td mat-cell *matCellDef="let order">{{ order.orderType }}</td>
                      </ng-container>

                      <ng-container matColumnDef="quantity">
                        <th mat-header-cell *matHeaderCellDef>Cantidad</th>
                        <td mat-cell *matCellDef="let order">
                          {{ order.filledQuantity }}/{{ order.quantity }}
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="price">
                        <th mat-header-cell *matHeaderCellDef>Precio</th>
                        <td mat-cell *matCellDef="let order">
                          \${{ order.price || 'Mercado' }}
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="status">
                        <th mat-header-cell *matHeaderCellDef>Estado</th>
                        <td mat-cell *matCellDef="let order">
                          <mat-chip [color]="getStatusColor(order.status)">
                            {{ getStatusLabel(order.status) }}
                          </mat-chip>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="actions">
                        <th mat-header-cell *matHeaderCellDef>Acciones</th>
                        <td mat-cell *matCellDef="let order">
                          <button mat-icon-button color="warn" 
                                  (click)="cancelOrder(order.id)"
                                  matTooltip="Cancelar orden">
                            <mat-icon>cancel</mat-icon>
                          </button>
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="orderColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: orderColumns;"></tr>
                    </table>

                    <div class="empty-state" *ngIf="pendingOrders.length === 0">
                      <mat-icon>inbox</mat-icon>
                      <p>No tienes órdenes activas</p>
                    </div>
                  </div>
                </mat-tab>

                <!-- Historial -->
                <mat-tab label="Historial ({{ completedOrders.length }})">
                  <div class="orders-list">
                    <table mat-table [dataSource]="completedOrders" *ngIf="completedOrders.length > 0">
                      <ng-container matColumnDef="timestamp">
                        <th mat-header-cell *matHeaderCellDef>Fecha</th>
                        <td mat-cell *matCellDef="let order">
                          {{ order.timestamp | date:'short' }}
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="symbol">
                        <th mat-header-cell *matHeaderCellDef>Símbolo</th>
                        <td mat-cell *matCellDef="let order">{{ order.symbol }}</td>
                      </ng-container>

                      <ng-container matColumnDef="type">
                        <th mat-header-cell *matHeaderCellDef>Tipo</th>
                        <td mat-cell *matCellDef="let order">
                          <mat-chip [color]="order.type === 'BUY' ? 'primary' : 'warn'">
                            {{ order.type === 'BUY' ? 'COMPRA' : 'VENTA' }}
                          </mat-chip>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="quantity">
                        <th mat-header-cell *matHeaderCellDef>Cantidad</th>
                        <td mat-cell *matCellDef="let order">{{ order.quantity }}</td>
                      </ng-container>

                      <ng-container matColumnDef="price">
                        <th mat-header-cell *matHeaderCellDef>Precio</th>
                        <td mat-cell *matCellDef="let order">
                          \${{ order.price | number:'1.2-2' }}
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="total">
                        <th mat-header-cell *matHeaderCellDef>Total</th>
                        <td mat-cell *matCellDef="let order">
                          \${{ order.totalAmount | number:'1.2-2' }}
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="status">
                        <th mat-header-cell *matHeaderCellDef>Estado</th>
                        <td mat-cell *matCellDef="let order">
                          <mat-chip [color]="getStatusColor(order.status)">
                            {{ getStatusLabel(order.status) }}
                          </mat-chip>
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="historyColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: historyColumns;"></tr>
                    </table>

                    <div class="empty-state" *ngIf="completedOrders.length === 0">
                      <mat-icon>history</mat-icon>
                      <p>No hay órdenes en el historial</p>
                    </div>
                  </div>
                </mat-tab>
              </mat-tab-group>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .trading-container {
      padding: 24px;
      max-width: 1600px;
      margin: 0 auto;
    }

    .market-header {
      margin-bottom: 24px;
    }

    .market-ticker {
      display: flex;
      gap: 32px;
      overflow-x: auto;
      padding: 8px 0;
    }

    .ticker-item {
      display: flex;
      flex-direction: column;
      min-width: 120px;
    }

    .ticker-item .symbol {
      font-weight: 600;
      font-size: 14px;
      color: #666;
    }

    .ticker-item .price {
      font-size: 18px;
      font-weight: 600;
      margin: 4px 0;
    }

    .ticker-item .change {
      font-size: 14px;
    }

    .trading-layout {
      display: grid;
      grid-template-columns: 400px 1fr;
      gap: 24px;
    }

    @media (max-width: 1024px) {
      .trading-layout {
        grid-template-columns: 1fr;
      }
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .radio-group {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;
    }

    .selected-stock-info {
      background-color: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
    }

    .info-item .label {
      color: #666;
      font-size: 14px;
    }

    .info-item .value {
      font-weight: 600;
    }

    .positive {
      color: #4caf50;
    }

    .negative {
      color: #f44336;
    }

    .order-summary {
      background-color: #e3f2fd;
      padding: 16px;
      border-radius: 8px;
      margin: 24px 0;
    }

    .order-summary h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      color: #1976d2;
    }

    .summary-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }

    .summary-item.total {
      border-top: 2px solid #1976d2;
      margin-top: 8px;
      padding-top: 12px;
      font-weight: 600;
      font-size: 18px;
    }

    .summary-item .buy {
      color: #2196f3;
    }

    .summary-item .sell {
      color: #f44336;
    }

    .funds-check {
      margin: 16px 0;
    }

    .funds-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background-color: #e8f5e9;
      border-radius: 8px;
      color: #2e7d32;
    }

    .funds-info.insufficient {
      background-color: #ffebee;
      color: #c62828;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .form-actions button {
      flex: 1;
    }

    .orders-list {
      margin-top: 16px;
      max-height: 600px;
      overflow-y: auto;
    }

    .orders-list table {
      width: 100%;
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: #999;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    mat-card-header {
      margin-bottom: 24px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class TradingComponent implements OnInit {
  orderForm: FormGroup;
  selectedStock: MarketData | null = null;
  estimatedTotal = 0;
  availableFunds = 50000; // Fondos simulados

  // Datos de mercado simulados
  availableStocks: MarketData[] = [
    { symbol: 'AAPL', name: 'Apple Inc.', lastPrice: 157.80, change: 2.35, changePercent: 1.51, bid: 157.75, ask: 157.85, volume: 50234567, high: 158.50, low: 155.20 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', lastPrice: 2780.15, change: -15.30, changePercent: -0.55, bid: 2779.80, ask: 2780.50, volume: 1234567, high: 2795.00, low: 2770.00 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', lastPrice: 325.60, change: 3.85, changePercent: 1.20, bid: 325.55, ask: 325.65, volume: 25678901, high: 327.00, low: 323.50 },
    { symbol: 'TSLA', name: 'Tesla Inc.', lastPrice: 398.20, change: -8.45, changePercent: -2.08, bid: 398.10, ask: 398.30, volume: 45678123, high: 405.00, low: 395.50 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', lastPrice: 152.30, change: 1.25, changePercent: 0.83, bid: 152.25, ask: 152.35, volume: 35678234, high: 153.20, low: 151.00 }
  ];

  watchlist: MarketData[] = [];

  // Órdenes
  pendingOrders: Order[] = [];
  completedOrders: Order[] = [];

  orderColumns: string[] = ['symbol', 'type', 'orderType', 'quantity', 'price', 'status', 'actions'];
  historyColumns: string[] = ['timestamp', 'symbol', 'type', 'quantity', 'price', 'total', 'status'];

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.orderForm = this.fb.group({
      symbol: ['', Validators.required],
      type: ['BUY', Validators.required],
      orderType: ['MARKET', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      price: [null],
      stopPrice: [null]
    });
  }

  ngOnInit() {
    // Simular watchlist
    this.watchlist = this.availableStocks.slice(0, 4);

    // Simular órdenes pendientes
    this.loadMockOrders();

    // Actualizar precios en tiempo real (simulado)
    setInterval(() => {
      this.updateMarketPrices();
    }, 5000);
  }

  onSymbolChange() {
    const symbol = this.orderForm.get('symbol')?.value;
    this.selectedStock = this.availableStocks.find(s => s.symbol === symbol) || null;
    this.calculateTotal();
  }

  onOrderTypeChange() {
    const orderType = this.orderForm.get('orderType')?.value;
    
    // Configurar validadores según el tipo de orden
    if (orderType === 'LIMIT' || orderType === 'STOP_LIMIT') {
      this.orderForm.get('price')?.setValidators([Validators.required, Validators.min(0.01)]);
    } else {
      this.orderForm.get('price')?.clearValidators();
    }

    if (orderType === 'STOP' || orderType === 'STOP_LIMIT') {
      this.orderForm.get('stopPrice')?.setValidators([Validators.required, Validators.min(0.01)]);
    } else {
      this.orderForm.get('stopPrice')?.clearValidators();
    }

    this.orderForm.get('price')?.updateValueAndValidity();
    this.orderForm.get('stopPrice')?.updateValueAndValidity();
    this.calculateTotal();
  }

  getEstimatedPrice(): number {
    const orderType = this.orderForm.get('orderType')?.value;
    
    if (orderType === 'MARKET' && this.selectedStock) {
      return this.orderForm.get('type')?.value === 'BUY' 
        ? this.selectedStock.ask 
        : this.selectedStock.bid;
    }
    
    return this.orderForm.get('price')?.value || 0;
  }

  calculateTotal() {
    const quantity = this.orderForm.get('quantity')?.value || 0;
    const price = this.getEstimatedPrice();
    this.estimatedTotal = quantity * price;
  }

  hasSufficientFunds(): boolean {
    if (this.orderForm.get('type')?.value === 'SELL') {
      return true; // Validar posiciones en caso real
    }
    return this.estimatedTotal <= this.availableFunds;
  }

  submitOrder() {
    if (!this.orderForm.valid || !this.hasSufficientFunds()) {
      return;
    }

    const formValue = this.orderForm.value;
    const newOrder: Order = {
      id: 'ORD-' + Date.now(),
      symbol: formValue.symbol,
      type: formValue.type,
      orderType: formValue.orderType,
      quantity: formValue.quantity,
      price: formValue.price,
      stopPrice: formValue.stopPrice,
      status: 'PENDING',
      filledQuantity: 0,
      timestamp: new Date(),
      totalAmount: this.estimatedTotal
    };

    this.pendingOrders = [newOrder, ...this.pendingOrders];

    this.snackBar.open(
      `Orden de ${formValue.type === 'BUY' ? 'compra' : 'venta'} enviada exitosamente`,
      'Cerrar',
      { duration: 3000 }
    );

    // Simular ejecución de la orden
    setTimeout(() => {
      this.executeOrder(newOrder.id);
    }, 3000);

    this.resetForm();
  }

  executeOrder(orderId: string) {
    const orderIndex = this.pendingOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;

    const order = this.pendingOrders[orderIndex];
    order.status = 'FILLED';
    order.filledQuantity = order.quantity;

    // Mover a completadas
    this.completedOrders = [order, ...this.completedOrders];
    this.pendingOrders = this.pendingOrders.filter(o => o.id !== orderId);

    this.snackBar.open(
      `Orden ${order.symbol} ejecutada exitosamente`,
      'Ver',
      { duration: 5000 }
    );
  }

  cancelOrder(orderId: string) {
    const orderIndex = this.pendingOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;

    const order = this.pendingOrders[orderIndex];
    order.status = 'CANCELLED';

    this.completedOrders = [order, ...this.completedOrders];
    this.pendingOrders = this.pendingOrders.filter(o => o.id !== orderId);

    this.snackBar.open('Orden cancelada', 'Cerrar', { duration: 3000 });
  }

  resetForm() {
    this.orderForm.reset({
      type: 'BUY',
      orderType: 'MARKET',
      quantity: 1
    });
    this.selectedStock = null;
    this.estimatedTotal = 0;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'FILLED': return 'primary';
      case 'PENDING': case 'EXECUTING': return 'accent';
      case 'CANCELLED': case 'REJECTED': return 'warn';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'Pendiente',
      'EXECUTING': 'Ejecutando',
      'FILLED': 'Completada',
      'PARTIALLY_FILLED': 'Parcial',
      'CANCELLED': 'Cancelada',
      'REJECTED': 'Rechazada'
    };
    return labels[status] || status;
  }

  updateMarketPrices() {
    this.availableStocks.forEach(stock => {
      const change = (Math.random() - 0.5) * 2; // Cambio aleatorio ±1%
      stock.lastPrice *= (1 + change / 100);
      stock.bid = stock.lastPrice - 0.05;
      stock.ask = stock.lastPrice + 0.05;
      stock.change = change;
      stock.changePercent = change;
    });

    // Actualizar watchlist
    this.watchlist = this.availableStocks.slice(0, 4);

    // Actualizar stock seleccionado si existe
    if (this.selectedStock) {
      const updated = this.availableStocks.find(s => s.symbol === this.selectedStock?.symbol);
      if (updated) {
        this.selectedStock = updated;
        this.calculateTotal();
      }
    }
  }

  loadMockOrders() {
    this.pendingOrders = [
      {
        id: 'ORD-001',
        symbol: 'AAPL',
        type: 'BUY',
        orderType: 'LIMIT',
        quantity: 50,
        price: 155.00,
        status: 'PENDING',
        filledQuantity: 0,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        totalAmount: 7750.00
      }
    ];

    this.completedOrders = [
      {
        id: 'ORD-002',
        symbol: 'MSFT',
        type: 'BUY',
        orderType: 'MARKET',
        quantity: 25,
        price: 323.50,
        status: 'FILLED',
        filledQuantity: 25,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        totalAmount: 8087.50
      },
      {
        id: 'ORD-003',
        symbol: 'GOOGL',
        type: 'SELL',
        orderType: 'MARKET',
        quantity: 10,
        price: 2795.00,
        status: 'FILLED',
        filledQuantity: 10,
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
        totalAmount: 27950.00
      }
    ];
  }
}