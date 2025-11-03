import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Order {
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

export interface MarketData {
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

export interface OrderValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable({
  providedIn: 'root'
})
export class TradingService {
  private apiUrl = `${environment.apiUrl}/trading`;
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  public orders$ = this.ordersSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Órdenes
  getOrders(status?: string): Observable<Order[]> {
    const params: any = {};
    if (status) {
      params.status = status;
    }
    return this.http.get<Order[]>(`${this.apiUrl}/orders`, { params });
  }

  createOrder(orderData: Partial<Order>): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders`, orderData);
  }

  cancelOrder(orderId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/orders/${orderId}`);
  }

  getOrderById(orderId: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/orders/${orderId}`);
  }

  modifyOrder(orderId: string, updates: Partial<Order>): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/orders/${orderId}`, updates);
  }

  // Datos de mercado
  getMarketData(symbol: string): Observable<MarketData> {
    return this.http.get<MarketData>(`${this.apiUrl}/market/${symbol}`);
  }

  getAllMarketData(): Observable<MarketData[]> {
    return this.http.get<MarketData[]>(`${this.apiUrl}/market`);
  }

  // Validación
  validateOrder(orderData: Partial<Order>): Observable<OrderValidation> {
    return this.http.post<OrderValidation>(`${this.apiUrl}/validate`, orderData);
  }

  // Ejecución
  executeOrder(orderId: string): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders/${orderId}/execute`, {});
  }

  // Historial
  getOrderHistory(filters?: any): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders/history`, { params: filters });
  }

  // Cálculos
  calculateOrderValue(quantity: number, price: number): number {
    return quantity * price;
  }

  calculateCommission(orderValue: number, commissionRate: number = 0.001): number {
    return orderValue * commissionRate;
  }

  calculateTotalCost(quantity: number, price: number, commissionRate?: number): number {
    const orderValue = this.calculateOrderValue(quantity, price);
    const commission = this.calculateCommission(orderValue, commissionRate);
    return orderValue + commission;
  }

  // Utilidades
  getOrderStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'Pendiente',
      'EXECUTING': 'Ejecutando',
      'FILLED': 'Completada',
      'PARTIALLY_FILLED': 'Parcialmente Completada',
      'CANCELLED': 'Cancelada',
      'REJECTED': 'Rechazada'
    };
    return labels[status] || status;
  }

  getOrderTypeLabel(orderType: string): string {
    const labels: { [key: string]: string } = {
      'MARKET': 'Mercado',
      'LIMIT': 'Límite',
      'STOP': 'Stop',
      'STOP_LIMIT': 'Stop Límite'
    };
    return labels[orderType] || orderType;
  }
}
