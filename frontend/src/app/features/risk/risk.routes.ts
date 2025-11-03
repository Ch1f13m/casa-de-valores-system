import { Routes } from '@angular/router';

export const riskRoutes: Routes = [
  { path: '', loadComponent: () => import('./risk.component').then(m => m.RiskComponent) }
];