import { Routes } from '@angular/router';

export const marketRoutes: Routes = [
  { path: '', loadComponent: () => import('./market.component').then(m => m.MarketComponent) }
];