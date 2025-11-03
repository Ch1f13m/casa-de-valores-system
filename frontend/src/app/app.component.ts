import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';

import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
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
    <div class="app-container" *ngIf="authService.isAuthenticated()">
      <!-- Header Toolbar -->
      <mat-toolbar color="primary" class="app-toolbar">
        <button mat-icon-button (click)="toggleSidenav()" class="menu-button">
          <mat-icon>menu</mat-icon>
        </button>
        <span class="app-title">Casa de Valores</span>
        <span class="spacer"></span>
        
        <!-- Notifications bell -->
        <button mat-icon-button [matMenuTriggerFor]="notificationMenu" class="notification-button">
          <mat-icon [matBadge]="notificationCount" matBadgeColor="warn" matBadgeSize="small">notifications</mat-icon>
        </button>
        
        <mat-menu #notificationMenu="matMenu" class="notification-menu">
          <div class="notification-header">
            <h4>Notificaciones</h4>
          </div>
          <mat-divider></mat-divider>
          <button mat-menu-item class="notification-item">
            <mat-icon>trending_up</mat-icon>
            <div class="notification-content">
              <span class="notification-title">Nueva oportunidad de trading</span>
              <span class="notification-time">Hace 5 min</span>
            </div>
          </button>
          <button mat-menu-item class="notification-item">
            <mat-icon>account_balance_wallet</mat-icon>
            <div class="notification-content">
              <span class="notification-title">Actualización de portafolio</span>
              <span class="notification-time">Hace 15 min</span>
            </div>
          </button>
          <button mat-menu-item class="notification-item">
            <mat-icon>security</mat-icon>
            <div class="notification-content">
              <span class="notification-title">Alerta de riesgo</span>
              <span class="notification-time">Hace 1 hora</span>
            </div>
          </button>
          <mat-divider></mat-divider>
          <button mat-menu-item class="view-all-notifications">
            <span>Ver todas las notificaciones</span>
          </button>
        </mat-menu>
        
        <!-- User menu -->
        <button mat-icon-button [matMenuTriggerFor]="userMenu">
          <mat-icon>account_circle</mat-icon>
        </button>
        <span class="user-name">{{ getCurrentUserName() }}</span>
        
        <mat-menu #userMenu="matMenu">
          <button mat-menu-item routerLink="/profile">
            <mat-icon>person</mat-icon>
            <span>Perfil</span>
          </button>
          <button mat-menu-item (click)="logout()">
            <mat-icon>exit_to_app</mat-icon>
            <span>Cerrar Sesión</span>
          </button>
        </mat-menu>
      </mat-toolbar>

      <!-- Sidenav Container -->
      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav #sidenav [mode]="'over'" [opened]="false" class="sidenav">
          <mat-nav-list>
            <h3 matSubheader>Navegación</h3>
            
            <a mat-list-item routerLink="/dashboard" (click)="sidenav.close()">
              <mat-icon matListIcon>dashboard</mat-icon>
              <span>Dashboard</span>
            </a>
            
            <a mat-list-item routerLink="/portfolio" (click)="sidenav.close()">
              <mat-icon matListIcon>account_balance_wallet</mat-icon>
              <span>Portafolios</span>
            </a>
            
            <a mat-list-item routerLink="/trading" (click)="sidenav.close()">
              <mat-icon matListIcon>trending_up</mat-icon>
              <span>Trading</span>
            </a>
            
            <a mat-list-item routerLink="/market" (click)="sidenav.close()">
              <mat-icon matListIcon>show_chart</mat-icon>
              <span>Mercado</span>
            </a>
            
            <a mat-list-item routerLink="/risk" (click)="sidenav.close()">
              <mat-icon matListIcon>security</mat-icon>
              <span>Riesgo</span>
            </a>
            
            <a mat-list-item routerLink="/profile" (click)="sidenav.close()">
              <mat-icon matListIcon>person</mat-icon>
              <span>Perfil</span>
            </a>
            
            <mat-divider></mat-divider>
            
            <a mat-list-item (click)="logout()">
              <mat-icon matListIcon>exit_to_app</mat-icon>
              <span>Cerrar Sesión</span>
            </a>
          </mat-nav-list>
        </mat-sidenav>

        <!-- Main Content -->
        <mat-sidenav-content class="main-content">
          <router-outlet></router-outlet>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>

    <!-- Login view when not authenticated -->
    <div *ngIf="!authService.isAuthenticated()">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .app-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .app-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .menu-button {
      margin-right: 16px;
    }

    .app-title {
      font-size: 18px;
      font-weight: 500;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .user-name {
      margin-left: 8px;
      font-size: 14px;
    }

    .notification-button {
      margin-right: 8px;
    }

    .notification-menu {
      width: 350px;
      max-width: 90vw;
    }

    .notification-header {
      padding: 16px;
      background-color: #f5f5f5;
    }

    .notification-header h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: #333;
    }

    .notification-item {
      height: auto !important;
      padding: 12px 16px !important;
      line-height: normal !important;
      white-space: normal !important;
    }

    .notification-item mat-icon {
      margin-right: 12px;
      color: #666;
    }

    .notification-content {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .notification-title {
      font-size: 14px;
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
    }

    .notification-time {
      font-size: 12px;
      color: #666;
    }

    .view-all-notifications {
      text-align: center;
      color: #1976d2;
      font-weight: 500;
    }

    .sidenav-container {
      flex: 1;
      height: calc(100vh - 64px);
    }

    .sidenav {
      width: 250px;
      background-color: #fafafa;
      border-right: 1px solid #e0e0e0;
    }

    .sidenav mat-nav-list {
      padding-top: 16px;
    }

    .sidenav a[mat-list-item] {
      height: 48px;
      margin: 4px 8px;
      border-radius: 8px;
      transition: background-color 0.3s ease;
    }

    .sidenav a[mat-list-item]:hover {
      background-color: #e3f2fd;
    }

    .sidenav a[mat-list-item].active {
      background-color: #bbdefb;
      color: #1976d2;
    }

    .main-content {
      overflow: auto;
    }

    mat-divider {
      margin: 16px 0;
    }

    @media (max-width: 768px) {
      .user-name {
        display: none;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'Casa de Valores';
  notificationCount = 3; // Número de notificaciones no leídas
  @ViewChild('sidenav') sidenav!: MatSidenav;

  constructor(public authService: AuthService) {}

  ngOnInit() {
    // Initialize app
    this.authService.checkAuthStatus();
  }

  toggleSidenav() {
    this.sidenav.toggle();
  }

  getCurrentUserName(): string {
    const user = this.authService.getCurrentUser();
    return user ? user.username : 'Usuario';
  }

  logout() {
    this.authService.logout();
  }
}