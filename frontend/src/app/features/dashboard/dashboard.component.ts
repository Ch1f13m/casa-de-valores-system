import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="dashboard-container">
      <h1>Dashboard - Casa de Valores</h1>
      
      <div class="dashboard-grid">
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>account_balance_wallet</mat-icon>
            <mat-card-title>Portafolio</mat-card-title>
            <mat-card-subtitle>Valor total: $125,450.75</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Gestiona tus inversiones y visualiza el rendimiento de tu portafolio.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button color="primary" routerLink="/portfolio">Ver Portafolio</button>
          </mat-card-actions>
        </mat-card>

        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>trending_up</mat-icon>
            <mat-card-title>Trading</mat-card-title>
            <mat-card-subtitle>Órdenes activas: 3</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Ejecuta operaciones de compra y venta de instrumentos financieros.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button color="primary" routerLink="/trading">Ir a Trading</button>
          </mat-card-actions>
        </mat-card>

        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>show_chart</mat-icon>
            <mat-card-title>Mercado</mat-card-title>
            <mat-card-subtitle>Datos en tiempo real</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Monitorea los precios y tendencias del mercado financiero.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button color="primary" routerLink="/market">Ver Mercado</button>
          </mat-card-actions>
        </mat-card>

        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>security</mat-icon>
            <mat-card-title>Riesgo</mat-card-title>
            <mat-card-subtitle>Nivel: Moderado</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Analiza el riesgo de tus inversiones y establecer límites.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button color="primary" routerLink="/risk">Gestionar Riesgo</button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      margin-bottom: 24px;
      color: #333;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin-top: 24px;
    }

    .dashboard-card {
      height: fit-content;
    }

    mat-icon[mat-card-avatar] {
      background-color: #3f51b5;
      color: white;
    }
  `]
})
export class DashboardComponent { }