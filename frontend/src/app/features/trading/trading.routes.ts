import { Routes } from '@angular/router';

export const tradingRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./trading.component').then(m => m.TradingComponent)
  }
];