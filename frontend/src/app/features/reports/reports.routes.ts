import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const reportsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./reports.component').then(m => m.ReportsComponent),
    canActivate: [authGuard],
    title: 'Reportes - Casa de Valores'
  }
];
