import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const portfolioRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./portfolio.component').then(m => m.PortfolioComponent),
    canActivate: [authGuard],
    title: 'Portafolio - Casa de Valores'
  }
];