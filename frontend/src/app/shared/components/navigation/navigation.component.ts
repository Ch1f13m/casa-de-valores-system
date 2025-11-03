import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatMenuModule,
    MatBadgeModule
  ],
  template: `
    <mat-toolbar color="primary" class="toolbar">
      <button mat-icon-button (click)="toggleSidenav()" class="menu-button">
        <mat-icon>menu</mat-icon>
      </button>
      
      <span class="app-title">Casa de Valores</span>
      
      <span class="nav-spacer"></span>
      
      <div class="nav-user">
        <button mat-icon-button [matMenuTriggerFor]="notificationMenu">
          <mat-icon matBadge="3" matBadgeColor="warn">notifications</mat-icon>
        </button>
        
        <button mat-button [matMenuTriggerFor]="userMenu" class="user-button">
          <mat-icon>account_circle</mat-icon>
          <span>{{ currentUser?.full_name || currentUser?.username }}</span>
        </button>
      </div>
    </mat-toolbar>

    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #sidenav mode="side" opened class="sidenav">
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          
          <a mat-list-item routerLink="/portfolio" routerLinkActive="active">
            <mat-icon matListItemIcon>account_balance_wallet</mat-icon>
            <span matListItemTitle>Portafolios</span>
          </a>
          
          <a mat-list-item routerLink="/trading" routerLinkActive="active">
            <mat-icon matListItemIcon>trending_up</mat-icon>
            <span matListItemTitle>Trading</span>
          </a>
          
          <a mat-list-item routerLink="/market" routerLinkActive="active">
            <mat-icon matListItemIcon>show_chart</mat-icon>
            <span matListItemTitle>Mercado</span>
          </a>
          
          <a mat-list-item routerLink="/risk" routerLinkActive="active">
            <mat-icon matListItemIcon>security</mat-icon>
            <span matListItemTitle>Riesgo</span>
          </a>
          
          <a mat-list-item routerLink="/reports" routerLinkActive="active">
            <mat-icon matListItemIcon>description</mat-icon>
            <span matListItemTitle>Reportes</span>
          </a>
          
          <mat-divider></mat-divider>
          
          <a mat-list-item routerLink="/admin" routerLinkActive="active">
            <mat-icon matListItemIcon>admin_panel_settings</mat-icon>
            <span matListItemTitle>Administración</span>
          </a>
          
          <a mat-list-item routerLink="/profile" routerLinkActive="active">
            <mat-icon matListItemIcon>person</mat-icon>
            <span matListItemTitle>Perfil</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>
      
      <mat-sidenav-content>
        <ng-content></ng-content>
      </mat-sidenav-content>
    </mat-sidenav-container>

    <!-- User Menu -->
    <mat-menu #userMenu="matMenu">
      <button mat-menu-item routerLink="/profile">
        <mat-icon>person</mat-icon>
        <span>Mi Perfil</span>
      </button>
      <button mat-menu-item (click)="logout()">
        <mat-icon>logout</mat-icon>
        <span>Cerrar Sesión</span>
      </button>
    </mat-menu>

    <!-- Notification Menu -->
    <mat-menu #notificationMenu="matMenu">
      <div class="notification-header">
        <h3>Notificaciones</h3>
      </div>
      <button mat-menu-item>
        <mat-icon>info</mat-icon>
        <span>Nueva orden ejecutada</span>
      </button>
      <button mat-menu-item>
        <mat-icon>warning</mat-icon>
        <span>Límite de riesgo alcanzado</span>
      </button>
      <button mat-menu-item>
        <mat-icon>trending_up</mat-icon>
        <span>Alerta de precio activada</span>
      </button>
    </mat-menu>
  `,
  styles: [`
    .toolbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
    }

    .menu-button {
      display: none;
    }

    .app-title {
      font-weight: 500;
    }

    .nav-spacer {
      flex: 1 1 auto;
    }

    .nav-user {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .user-button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .sidenav-container {
      position: fixed;
      top: 64px;
      bottom: 0;
      left: 0;
      right: 0;
    }

    .sidenav {
      width: 250px;
      background: #fafafa;
    }

    .sidenav mat-nav-list {
      padding-top: 16px;
    }

    .sidenav a.active {
      background-color: rgba(63, 81, 181, 0.1);
      color: #3f51b5;
    }

    .notification-header {
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .notification-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .menu-button {
        display: block;
      }

      .sidenav {
        position: fixed;
        z-index: 999;
      }
    }
  `]
})
export class NavigationComponent {
  currentUser = this.authService.getCurrentUser();

  constructor(private authService: AuthService) {}

  toggleSidenav() {
    // Implementation for mobile sidenav toggle
  }

  logout() {
    this.authService.logout();
  }
}