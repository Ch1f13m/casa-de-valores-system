import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const tradingRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./trading.component').then(m => m.TradingComponent),
    canActivate: [authGuard],
    title: 'Trading - Casa de Valores'
  }
];