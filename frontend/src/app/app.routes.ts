import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.dashboardRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'portfolio',
    loadChildren: () => import('./features/portfolio/portfolio.routes').then(m => m.portfolioRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'trading',
    loadChildren: () => import('./features/trading/trading.routes').then(m => m.tradingRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'market',
    loadChildren: () => import('./features/market/market.routes').then(m => m.marketRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'risk',
    loadChildren: () => import('./features/risk/risk.routes').then(m => m.riskRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadChildren: () => import('./features/profile/profile.routes').then(m => m.profileRoutes),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];