import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Position {
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

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalPnL: number;
  totalPnLPercent: number;
  dayChange: number;
  dayChangePercent: number;
  positions: Position[];
}

export interface PerformanceData {
  date: string;
  value: number;
}

export interface DiversificationMetrics {
  concentrationRisk: number;
  uniqueSectors: number;
  herfindahlIndex: number;
  volatility: number;
  sectorAllocation: { [key: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private apiUrl = `${environment.apiUrl}/portfolio`;
  private portfolioSubject = new BehaviorSubject<PortfolioSummary | null>(null);
  public portfolio$ = this.portfolioSubject.asObservable();

  constructor(private http: HttpClient) {
    // Iniciar actualización automática cada 30 segundos
    this.startRealTimeUpdates();
  }

  getPortfolioSummary(): Observable<PortfolioSummary> {
    return this.http.get<PortfolioSummary>(`${this.apiUrl}/summary`);
  }

  getPositions(): Observable<Position[]> {
    return this.http.get<Position[]>(`${this.apiUrl}/positions`);
  }

  getPerformanceData(period: string): Observable<PerformanceData[]> {
    return this.http.get<PerformanceData[]>(`${this.apiUrl}/performance`, {
      params: { period }
    });
  }

  getDiversificationMetrics(): Observable<DiversificationMetrics> {
    return this.http.get<DiversificationMetrics>(`${this.apiUrl}/diversification`);
  }

  rebalancePortfolio(targetAllocations: { [symbol: string]: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/rebalance`, { targetAllocations });
  }

  exportPortfolio(format: 'csv' | 'excel' | 'pdf'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export`, {
      params: { format },
      responseType: 'blob'
    });
  }

  private startRealTimeUpdates(): void {
    interval(30000) // Cada 30 segundos
      .pipe(
        switchMap(() => this.getPortfolioSummary())
      )
      .subscribe(portfolio => {
        this.portfolioSubject.next(portfolio);
      });
  }

  refreshPortfolio(): Observable<PortfolioSummary> {
    const portfolio$ = this.getPortfolioSummary();
    portfolio$.subscribe(portfolio => {
      this.portfolioSubject.next(portfolio);
    });
    return portfolio$;
  }

  calculateMetrics(positions: Position[]): DiversificationMetrics {
    // Calcular concentración (top 5 posiciones)
    const sortedPositions = [...positions].sort((a, b) => b.weight - a.weight);
    const concentrationRisk = sortedPositions
      .slice(0, 5)
      .reduce((sum, pos) => sum + pos.weight, 0);

    // Sectores únicos
    const uniqueSectors = new Set(positions.map(p => p.sector)).size;

    // Índice Herfindahl (concentración)
    const herfindahlIndex = positions
      .reduce((sum, pos) => sum + Math.pow(pos.weight / 100, 2), 0);

    // Agregación por sectores
    const sectorAllocation: { [key: string]: number } = {};
    positions.forEach(position => {
      if (sectorAllocation[position.sector]) {
        sectorAllocation[position.sector] += position.weight;
      } else {
        sectorAllocation[position.sector] = position.weight;
      }
    });

    // Volatilidad estimada (calculada)
    const weights = positions.map(p => p.weight / 100);
    const returns = positions.map(p => p.unrealizedPnLPercent / 100);
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * 100;

    return {
      concentrationRisk,
      uniqueSectors,
      herfindahlIndex,
      volatility,
      sectorAllocation
    };
  }
}