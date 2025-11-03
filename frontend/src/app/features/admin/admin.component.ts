import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AdminService, User, SystemMetrics, AuditLog, SystemConfig } from './admin.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatPaginatorModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule
  ],
  template: `
    <div class="admin-container">
      <div class="admin-header">
        <h1>
          <mat-icon>admin_panel_settings</mat-icon>
          Administración del Sistema
        </h1>
        <p class="subtitle">Gestión centralizada del sistema Casa de Valores</p>
      </div>

      <mat-tab-group [(selectedIndex)]="selectedTabIndex" (selectedTabChange)="onTabChange($event)">
        
        <!-- Tab 1: Gestión de Usuarios -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">people</mat-icon>
            Usuarios
            <span class="badge" [matBadge]="users().length" matBadgeColor="primary"></span>
          </ng-template>
          
          <div class="tab-content">
            <div class="actions-bar">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Buscar usuarios</mat-label>
                <input matInput placeholder="Nombre, email o ID" [(ngModel)]="userSearchTerm" (input)="filterUsers()">
                <mat-icon matPrefix>search</mat-icon>
              </mat-form-field>
              
              <button mat-raised-button color="primary" (click)="openCreateUserDialog()">
                <mat-icon>person_add</mat-icon>
                Nuevo Usuario
              </button>
            </div>

            <mat-card>
              <mat-card-content>
                <div class="table-container">
                  <table mat-table [dataSource]="filteredUsers()" class="users-table">
                    
                    <ng-container matColumnDef="id">
                      <th mat-header-cell *matHeaderCellDef>ID</th>
                      <td mat-cell *matCellDef="let user">{{user.id}}</td>
                    </ng-container>

                    <ng-container matColumnDef="name">
                      <th mat-header-cell *matHeaderCellDef>Nombre</th>
                      <td mat-cell *matCellDef="let user">
                        <div class="user-info">
                          <strong>{{user.fullName}}</strong>
                          <small>{{user.username}}</small>
                        </div>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="email">
                      <th mat-header-cell *matHeaderCellDef>Email</th>
                      <td mat-cell *matCellDef="let user">{{user.email}}</td>
                    </ng-container>

                    <ng-container matColumnDef="role">
                      <th mat-header-cell *matHeaderCellDef>Rol</th>
                      <td mat-cell *matCellDef="let user">
                        <mat-chip [class]="'role-' + user.role">{{getRoleLabel(user.role)}}</mat-chip>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="status">
                      <th mat-header-cell *matHeaderCellDef>Estado</th>
                      <td mat-cell *matCellDef="let user">
                        <mat-chip [class]="user.active ? 'status-active' : 'status-inactive'">
                          {{user.active ? 'Activo' : 'Inactivo'}}
                        </mat-chip>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="lastLogin">
                      <th mat-header-cell *matHeaderCellDef>Último Acceso</th>
                      <td mat-cell *matCellDef="let user">{{user.lastLogin | date:'short'}}</td>
                    </ng-container>

                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef>Acciones</th>
                      <td mat-cell *matCellDef="let user">
                        <button mat-icon-button [matMenuTriggerFor]="menu" matTooltip="Más acciones">
                          <mat-icon>more_vert</mat-icon>
                        </button>
                        <mat-menu #menu="matMenu">
                          <button mat-menu-item (click)="editUser(user)">
                            <mat-icon>edit</mat-icon>
                            Editar
                          </button>
                          <button mat-menu-item (click)="toggleUserStatus(user)">
                            <mat-icon>{{user.active ? 'block' : 'check_circle'}}</mat-icon>
                            {{user.active ? 'Desactivar' : 'Activar'}}
                          </button>
                          <button mat-menu-item (click)="resetPassword(user)">
                            <mat-icon>vpn_key</mat-icon>
                            Reset Password
                          </button>
                          <button mat-menu-item (click)="viewUserActivity(user)" color="primary">
                            <mat-icon>history</mat-icon>
                            Ver Actividad
                          </button>
                          <mat-divider></mat-divider>
                          <button mat-menu-item (click)="deleteUser(user)" class="danger">
                            <mat-icon>delete</mat-icon>
                            Eliminar
                          </button>
                        </mat-menu>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="userColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: userColumns;"></tr>
                  </table>
                </div>

                <mat-paginator 
                  [length]="filteredUsers().length"
                  [pageSize]="10"
                  [pageSizeOptions]="[5, 10, 25, 50]"
                  (page)="onPageChange($event)">
                </mat-paginator>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab 2: Monitoreo del Sistema -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">monitoring</mat-icon>
            Monitoreo
          </ng-template>
          
          <div class="tab-content">
            <div class="metrics-grid">
              <!-- Sistema -->
              <mat-card class="metric-card">
                <mat-card-header>
                  <mat-icon class="metric-icon system">computer</mat-icon>
                  <mat-card-title>Sistema</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="metric-item">
                    <span class="label">CPU</span>
                    <div class="progress-bar">
                      <div class="progress" [style.width.%]="systemMetrics().cpu"></div>
                    </div>
                    <span class="value">{{systemMetrics().cpu}}%</span>
                  </div>
                  <div class="metric-item">
                    <span class="label">Memoria</span>
                    <div class="progress-bar">
                      <div class="progress" [style.width.%]="systemMetrics().memory"></div>
                    </div>
                    <span class="value">{{systemMetrics().memory}}%</span>
                  </div>
                  <div class="metric-item">
                    <span class="label">Disco</span>
                    <div class="progress-bar">
                      <div class="progress" [style.width.%]="systemMetrics().disk"></div>
                    </div>
                    <span class="value">{{systemMetrics().disk}}%</span>
                  </div>
                  <div class="metric-item">
                    <span class="label">Uptime</span>
                    <span class="value-text">{{systemMetrics().uptime}}</span>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Base de Datos -->
              <mat-card class="metric-card">
                <mat-card-header>
                  <mat-icon class="metric-icon database">storage</mat-icon>
                  <mat-card-title>Base de Datos</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="metric-item">
                    <span class="label">Conexiones</span>
                    <span class="value">{{systemMetrics().dbConnections}}/100</span>
                  </div>
                  <div class="metric-item">
                    <span class="label">Tamaño</span>
                    <span class="value-text">{{systemMetrics().dbSize}}</span>
                  </div>
                  <div class="metric-item">
                    <span class="label">Queries/seg</span>
                    <span class="value">{{systemMetrics().dbQueriesPerSec}}</span>
                  </div>
                  <div class="metric-item">
                    <span class="label">Último Backup</span>
                    <span class="value-text">{{systemMetrics().lastBackup | date:'short'}}</span>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- API -->
              <mat-card class="metric-card">
                <mat-card-header>
                  <mat-icon class="metric-icon api">cloud</mat-icon>
                  <mat-card-title>API Gateway</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="metric-item">
                    <span class="label">Requests/min</span>
                    <span class="value">{{systemMetrics().apiRequests}}</span>
                  </div>
                  <div class="metric-item">
                    <span class="label">Tiempo Resp. Prom.</span>
                    <span class="value-text">{{systemMetrics().apiAvgResponseTime}}ms</span>
                  </div>
                  <div class="metric-item">
                    <span class="label">Errores (24h)</span>
                    <span class="value error">{{systemMetrics().apiErrors}}</span>
                  </div>
                  <div class="metric-item">
                    <span class="label">Estado</span>
                    <mat-chip class="status-active">Operativo</mat-chip>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Usuarios -->
              <mat-card class="metric-card">
                <mat-card-header>
                  <mat-icon class="metric-icon users">group</mat-icon>
                  <mat-card-title>Usuarios</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="metric-item">
                    <span class="label">Activos Ahora</span>
                    <span class="value">{{systemMetrics().activeUsers}}</span>
                  </div>
                  <div class="metric-item">
                    <span class="label">Hoy</span>
                    <span class="value">{{systemMetrics().usersToday}}</span>
                  </div>
                  <div class="metric-item">
                    <span class="label">Este Mes</span>
                    <span class="value">{{systemMetrics().usersThisMonth}}</span>
                  </div>
                  <div class="metric-item">
                    <span class="label">Total</span>
                    <span class="value">{{systemMetrics().totalUsers}}</span>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Trading -->
              <mat-card class="metric-card">
                <mat-card-header>
                  <mat-icon class="metric-icon trading">trending_up</mat-icon>
                  <mat-card-title>Trading</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="metric-item">
                    <span class="label">Órdenes Hoy</span>
                    <span class="value">{{systemMetrics().ordersToday}}</span>
                  </div>
                  <div class="metric-item">
                    <span class="label">Volumen Hoy</span>
                    <span class="value-text">{{systemMetrics().volumeToday | currency}}</span>
                  </div>
                  <div class="metric-item">
                    <span class="label">Pendientes</span>
                    <span class="value">{{systemMetrics().pendingOrders}}</span>
                  </div>
                  <div class="metric-item">
                    <span class="label">Tasa Éxito</span>
                    <span class="value success">{{systemMetrics().successRate}}%</span>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Servicios -->
              <mat-card class="metric-card">
                <mat-card-header>
                  <mat-icon class="metric-icon services">apps</mat-icon>
                  <mat-card-title>Microservicios</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  @for (service of systemMetrics().services; track service.name) {
                    <div class="metric-item">
                      <span class="label">{{service.name}}</span>
                      <mat-chip [class]="'status-' + service.status">
                        {{service.status === 'running' ? 'Activo' : 'Inactivo'}}
                      </mat-chip>
                    </div>
                  }
                </mat-card-content>
              </mat-card>
            </div>

            <div class="actions-bar">
              <button mat-raised-button color="primary" (click)="refreshMetrics()">
                <mat-icon>refresh</mat-icon>
                Actualizar Métricas
              </button>
              <button mat-raised-button (click)="exportMetrics()">
                <mat-icon>download</mat-icon>
                Exportar Datos
              </button>
            </div>
          </div>
        </mat-tab>

        <!-- Tab 3: Logs de Auditoría -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">description</mat-icon>
            Logs de Auditoría
          </ng-template>
          
          <div class="tab-content">
            <div class="actions-bar">
              <mat-form-field appearance="outline">
                <mat-label>Tipo de Evento</mat-label>
                <mat-select [(ngModel)]="logFilter.eventType" (selectionChange)="filterLogs()">
                  <mat-option value="">Todos</mat-option>
                  <mat-option value="USER_LOGIN">Login de Usuario</mat-option>
                  <mat-option value="USER_LOGOUT">Logout de Usuario</mat-option>
                  <mat-option value="USER_CREATED">Usuario Creado</mat-option>
                  <mat-option value="USER_UPDATED">Usuario Actualizado</mat-option>
                  <mat-option value="USER_DELETED">Usuario Eliminado</mat-option>
                  <mat-option value="ORDER_CREATED">Orden Creada</mat-option>
                  <mat-option value="ORDER_EXECUTED">Orden Ejecutada</mat-option>
                  <mat-option value="CONFIG_CHANGED">Configuración Cambiada</mat-option>
                  <mat-option value="SECURITY_ALERT">Alerta de Seguridad</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Nivel</mat-label>
                <mat-select [(ngModel)]="logFilter.level" (selectionChange)="filterLogs()">
                  <mat-option value="">Todos</mat-option>
                  <mat-option value="INFO">Info</mat-option>
                  <mat-option value="WARNING">Warning</mat-option>
                  <mat-option value="ERROR">Error</mat-option>
                  <mat-option value="CRITICAL">Critical</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Rango de Fechas</mat-label>
                <mat-date-range-input [rangePicker]="picker">
                  <input matStartDate placeholder="Desde" [(ngModel)]="logFilter.startDate" (dateChange)="filterLogs()">
                  <input matEndDate placeholder="Hasta" [(ngModel)]="logFilter.endDate" (dateChange)="filterLogs()">
                </mat-date-range-input>
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-date-range-picker #picker></mat-date-range-picker>
              </mat-form-field>

              <button mat-raised-button (click)="clearLogFilters()">
                <mat-icon>clear</mat-icon>
                Limpiar Filtros
              </button>

              <button mat-raised-button color="primary" (click)="exportLogs()">
                <mat-icon>download</mat-icon>
                Exportar Logs
              </button>
            </div>

            <mat-card>
              <mat-card-content>
                <div class="table-container">
                  <table mat-table [dataSource]="filteredLogs()" class="logs-table">
                    
                    <ng-container matColumnDef="timestamp">
                      <th mat-header-cell *matHeaderCellDef>Fecha/Hora</th>
                      <td mat-cell *matCellDef="let log">{{log.timestamp | date:'short'}}</td>
                    </ng-container>

                    <ng-container matColumnDef="level">
                      <th mat-header-cell *matHeaderCellDef>Nivel</th>
                      <td mat-cell *matCellDef="let log">
                        <mat-chip [class]="'level-' + log.level">{{log.level}}</mat-chip>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="eventType">
                      <th mat-header-cell *matHeaderCellDef>Tipo de Evento</th>
                      <td mat-cell *matCellDef="let log">{{log.eventType}}</td>
                    </ng-container>

                    <ng-container matColumnDef="user">
                      <th mat-header-cell *matHeaderCellDef>Usuario</th>
                      <td mat-cell *matCellDef="let log">{{log.user}}</td>
                    </ng-container>

                    <ng-container matColumnDef="description">
                      <th mat-header-cell *matHeaderCellDef>Descripción</th>
                      <td mat-cell *matCellDef="let log">{{log.description}}</td>
                    </ng-container>

                    <ng-container matColumnDef="ipAddress">
                      <th mat-header-cell *matHeaderCellDef>IP</th>
                      <td mat-cell *matCellDef="let log">{{log.ipAddress}}</td>
                    </ng-container>

                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef>Acciones</th>
                      <td mat-cell *matCellDef="let log">
                        <button mat-icon-button (click)="viewLogDetails(log)" matTooltip="Ver detalles">
                          <mat-icon>visibility</mat-icon>
                        </button>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="logColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: logColumns;"></tr>
                  </table>
                </div>

                <mat-paginator 
                  [length]="filteredLogs().length"
                  [pageSize]="20"
                  [pageSizeOptions]="[10, 20, 50, 100]">
                </mat-paginator>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab 4: Configuración del Sistema -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">settings</mat-icon>
            Configuración
          </ng-template>
          
          <div class="tab-content">
            <form [formGroup]="configForm" (ngSubmit)="saveConfiguration()">
              
              <!-- General -->
              <mat-card class="config-section">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>tune</mat-icon>
                    Configuración General
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="form-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>Nombre del Sistema</mat-label>
                      <input matInput formControlName="systemName">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Zona Horaria</mat-label>
                      <mat-select formControlName="timezone">
                        <mat-option value="America/New_York">New York (EST)</mat-option>
                        <mat-option value="America/Los_Angeles">Los Angeles (PST)</mat-option>
                        <mat-option value="America/Chicago">Chicago (CST)</mat-option>
                        <mat-option value="America/Bogota">Bogotá (COT)</mat-option>
                        <mat-option value="Europe/London">Londres (GMT)</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Idioma por Defecto</mat-label>
                      <mat-select formControlName="defaultLanguage">
                        <mat-option value="es">Español</mat-option>
                        <mat-option value="en">English</mat-option>
                        <mat-option value="pt">Português</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Moneda por Defecto</mat-label>
                      <mat-select formControlName="defaultCurrency">
                        <mat-option value="USD">USD - Dólar</mat-option>
                        <mat-option value="COP">COP - Peso Colombiano</mat-option>
                        <mat-option value="EUR">EUR - Euro</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Seguridad -->
              <mat-card class="config-section">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>security</mat-icon>
                    Seguridad
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="form-grid">
                    <mat-slide-toggle formControlName="require2FA">
                      Requerir 2FA para todos los usuarios
                    </mat-slide-toggle>

                    <mat-form-field appearance="outline">
                      <mat-label>Tiempo de Sesión (minutos)</mat-label>
                      <input matInput type="number" formControlName="sessionTimeout">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Intentos de Login Permitidos</mat-label>
                      <input matInput type="number" formControlName="maxLoginAttempts">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Longitud Mínima de Contraseña</mat-label>
                      <input matInput type="number" formControlName="minPasswordLength">
                    </mat-form-field>

                    <mat-slide-toggle formControlName="requirePasswordChange">
                      Requerir cambio de contraseña cada 90 días
                    </mat-slide-toggle>

                    <mat-slide-toggle formControlName="enableIpWhitelist">
                      Habilitar Lista Blanca de IPs
                    </mat-slide-toggle>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Trading -->
              <mat-card class="config-section">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>show_chart</mat-icon>
                    Trading
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="form-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>Horario de Trading (Inicio)</mat-label>
                      <input matInput type="time" formControlName="tradingHoursStart">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Horario de Trading (Fin)</mat-label>
                      <input matInput type="time" formControlName="tradingHoursEnd">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Comisión por Operación (%)</mat-label>
                      <input matInput type="number" step="0.01" formControlName="commissionRate">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Monto Mínimo por Orden</mat-label>
                      <input matInput type="number" formControlName="minOrderAmount">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Monto Máximo por Orden</mat-label>
                      <input matInput type="number" formControlName="maxOrderAmount">
                    </mat-form-field>

                    <mat-slide-toggle formControlName="enableAfterHoursTrading">
                      Habilitar Trading Fuera de Horario
                    </mat-slide-toggle>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Notificaciones -->
              <mat-card class="config-section">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>notifications</mat-icon>
                    Notificaciones
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="form-grid">
                    <mat-slide-toggle formControlName="enableEmailNotifications">
                      Notificaciones por Email
                    </mat-slide-toggle>

                    <mat-slide-toggle formControlName="enableSmsNotifications">
                      Notificaciones por SMS
                    </mat-slide-toggle>

                    <mat-slide-toggle formControlName="enablePushNotifications">
                      Notificaciones Push
                    </mat-slide-toggle>

                    <mat-form-field appearance="outline">
                      <mat-label>Email del Administrador</mat-label>
                      <input matInput type="email" formControlName="adminEmail">
                    </mat-form-field>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Backups -->
              <mat-card class="config-section">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>backup</mat-icon>
                    Respaldos
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="form-grid">
                    <mat-slide-toggle formControlName="enableAutoBackup">
                      Respaldos Automáticos
                    </mat-slide-toggle>

                    <mat-form-field appearance="outline">
                      <mat-label>Frecuencia de Respaldo</mat-label>
                      <mat-select formControlName="backupFrequency">
                        <mat-option value="hourly">Cada Hora</mat-option>
                        <mat-option value="daily">Diario</mat-option>
                        <mat-option value="weekly">Semanal</mat-option>
                        <mat-option value="monthly">Mensual</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Retención de Backups (días)</mat-label>
                      <input matInput type="number" formControlName="backupRetentionDays">
                    </mat-form-field>

                    <div class="backup-actions">
                      <button mat-raised-button type="button" (click)="createBackupNow()">
                        <mat-icon>backup</mat-icon>
                        Crear Backup Ahora
                      </button>
                      <button mat-raised-button type="button" (click)="restoreBackup()">
                        <mat-icon>restore</mat-icon>
                        Restaurar Backup
                      </button>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Acciones -->
              <div class="form-actions">
                <button mat-raised-button type="button" (click)="resetConfiguration()">
                  <mat-icon>restore</mat-icon>
                  Restaurar Valores por Defecto
                </button>
                <button mat-raised-button color="primary" type="submit" [disabled]="!configForm.valid">
                  <mat-icon>save</mat-icon>
                  Guardar Configuración
                </button>
              </div>
            </form>
          </div>
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  styles: [`
    .admin-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .admin-header {
      margin-bottom: 24px;
      
      h1 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0 0 8px 0;
        font-size: 32px;
        color: #1976d2;
        
        mat-icon {
          font-size: 36px;
          width: 36px;
          height: 36px;
        }
      }
      
      .subtitle {
        margin: 0;
        color: #666;
        font-size: 16px;
      }
    }

    .tab-icon {
      margin-right: 8px;
    }

    .badge {
      margin-left: 8px;
    }

    .tab-content {
      padding: 24px 0;
    }

    .actions-bar {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      align-items: center;
      flex-wrap: wrap;
      
      .search-field {
        flex: 1;
        min-width: 300px;
      }
    }

    .table-container {
      overflow-x: auto;
    }

    .users-table, .logs-table {
      width: 100%;
      
      .user-info {
        display: flex;
        flex-direction: column;
        
        strong {
          font-size: 14px;
        }
        
        small {
          color: #666;
          font-size: 12px;
        }
      }
    }

    mat-chip {
      font-size: 12px;
      min-height: 24px;
      
      &.role-ADMIN {
        background-color: #f44336;
        color: white;
      }
      
      &.role-MANAGER {
        background-color: #ff9800;
        color: white;
      }
      
      &.role-TRADER {
        background-color: #2196f3;
        color: white;
      }
      
      &.role-CLIENT {
        background-color: #4caf50;
        color: white;
      }
      
      &.status-active, &.status-running {
        background-color: #4caf50;
        color: white;
      }
      
      &.status-inactive {
        background-color: #9e9e9e;
        color: white;
      }
      
      &.level-INFO {
        background-color: #2196f3;
        color: white;
      }
      
      &.level-WARNING {
        background-color: #ff9800;
        color: white;
      }
      
      &.level-ERROR {
        background-color: #f44336;
        color: white;
      }
      
      &.level-CRITICAL {
        background-color: #9c27b0;
        color: white;
      }
    }

    .danger {
      color: #f44336 !important;
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
    }

    .metric-card {
      mat-card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        
        .metric-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          
          &.system { color: #2196f3; }
          &.database { color: #4caf50; }
          &.api { color: #ff9800; }
          &.users { color: #9c27b0; }
          &.trading { color: #f44336; }
          &.services { color: #00bcd4; }
        }
        
        mat-card-title {
          margin: 0;
          font-size: 18px;
        }
      }
      
      .metric-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #eee;
        
        &:last-child {
          border-bottom: none;
        }
        
        .label {
          font-size: 14px;
          color: #666;
        }
        
        .value {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          
          &.error {
            color: #f44336;
          }
          
          &.success {
            color: #4caf50;
          }
        }
        
        .value-text {
          font-size: 14px;
          color: #333;
        }
        
        .progress-bar {
          flex: 1;
          height: 8px;
          background-color: #eee;
          border-radius: 4px;
          margin: 0 12px;
          overflow: hidden;
          
          .progress {
            height: 100%;
            background-color: #2196f3;
            transition: width 0.3s ease;
          }
        }
      }
    }

    /* Configuration Form */
    .config-section {
      margin-bottom: 24px;
      
      mat-card-header {
        mat-card-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 20px;
          
          mat-icon {
            color: #1976d2;
          }
        }
      }
      
      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
        
        mat-slide-toggle {
          grid-column: span 2;
        }
        
        .backup-actions {
          grid-column: span 2;
          display: flex;
          gap: 16px;
        }
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 24px;
    }

    mat-card {
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  `]
})
export class AdminComponent implements OnInit {
  selectedTabIndex = 0;
  
  // Users
  users = signal<User[]>([]);
  filteredUsers = signal<User[]>([]);
  userSearchTerm = '';
  userColumns = ['id', 'name', 'email', 'role', 'status', 'lastLogin', 'actions'];
  
  // Monitoring
  systemMetrics = signal<SystemMetrics>({
    cpu: 0,
    memory: 0,
    disk: 0,
    uptime: '',
    dbConnections: 0,
    dbSize: '',
    dbQueriesPerSec: 0,
    lastBackup: new Date(),
    apiRequests: 0,
    apiAvgResponseTime: 0,
    apiErrors: 0,
    activeUsers: 0,
    usersToday: 0,
    usersThisMonth: 0,
    totalUsers: 0,
    ordersToday: 0,
    volumeToday: 0,
    pendingOrders: 0,
    successRate: 0,
    services: []
  });
  
  // Logs
  auditLogs = signal<AuditLog[]>([]);
  filteredLogs = signal<AuditLog[]>([]);
  logFilter = {
    eventType: '',
    level: '',
    startDate: null as Date | null,
    endDate: null as Date | null
  };
  logColumns = ['timestamp', 'level', 'eventType', 'user', 'description', 'ipAddress', 'actions'];
  
  // Configuration
  configForm: FormGroup;
  
  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.configForm = this.fb.group({
      // General
      systemName: ['Casa de Valores', Validators.required],
      timezone: ['America/Bogota', Validators.required],
      defaultLanguage: ['es', Validators.required],
      defaultCurrency: ['USD', Validators.required],
      
      // Security
      require2FA: [false],
      sessionTimeout: [30, [Validators.required, Validators.min(5)]],
      maxLoginAttempts: [3, [Validators.required, Validators.min(1)]],
      minPasswordLength: [8, [Validators.required, Validators.min(6)]],
      requirePasswordChange: [true],
      enableIpWhitelist: [false],
      
      // Trading
      tradingHoursStart: ['09:30', Validators.required],
      tradingHoursEnd: ['16:00', Validators.required],
      commissionRate: [0.25, [Validators.required, Validators.min(0)]],
      minOrderAmount: [100, [Validators.required, Validators.min(1)]],
      maxOrderAmount: [1000000, [Validators.required, Validators.min(1)]],
      enableAfterHoursTrading: [false],
      
      // Notifications
      enableEmailNotifications: [true],
      enableSmsNotifications: [false],
      enablePushNotifications: [true],
      adminEmail: ['admin@casadevalores.com', [Validators.required, Validators.email]],
      
      // Backups
      enableAutoBackup: [true],
      backupFrequency: ['daily', Validators.required],
      backupRetentionDays: [30, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit() {
    this.loadUsers();
    this.loadSystemMetrics();
    this.loadAuditLogs();
    this.loadConfiguration();
  }

  onTabChange(event: any) {
    // Refresh data when switching tabs
    switch (event.index) {
      case 0:
        this.loadUsers();
        break;
      case 1:
        this.refreshMetrics();
        break;
      case 2:
        this.loadAuditLogs();
        break;
    }
  }

  // Users Methods
  loadUsers() {
    this.adminService.getUsers().subscribe((users: User[]) => {
      this.users.set(users);
      this.filteredUsers.set(users);
    });
  }

  filterUsers() {
    const term = this.userSearchTerm.toLowerCase();
    const filtered = this.users().filter(user =>
      user.fullName.toLowerCase().includes(term) ||
      user.username.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.id.toString().includes(term)
    );
    this.filteredUsers.set(filtered);
  }

  getRoleLabel(role: string): string {
    const labels: any = {
      'ADMIN': 'Administrador',
      'MANAGER': 'Gerente',
      'TRADER': 'Trader',
      'CLIENT': 'Cliente'
    };
    return labels[role] || role;
  }

  openCreateUserDialog() {
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 3000 });
  }

  editUser(user: User) {
    this.snackBar.open(`Editar usuario: ${user.fullName}`, 'Cerrar', { duration: 3000 });
  }

  toggleUserStatus(user: User) {
    const action = user.active ? 'desactivar' : 'activar';
    if (confirm(`¿Está seguro de ${action} al usuario ${user.fullName}?`)) {
      this.adminService.toggleUserStatus(user.id).subscribe(() => {
        this.snackBar.open(`Usuario ${action}do exitosamente`, 'Cerrar', { duration: 3000 });
        this.loadUsers();
      });
    }
  }

  resetPassword(user: User) {
    if (confirm(`¿Enviar email de reset de contraseña a ${user.email}?`)) {
      this.adminService.resetUserPassword(user.id).subscribe(() => {
        this.snackBar.open('Email de reset enviado exitosamente', 'Cerrar', { duration: 3000 });
      });
    }
  }

  viewUserActivity(user: User) {
    this.snackBar.open(`Ver actividad de: ${user.fullName}`, 'Cerrar', { duration: 3000 });
  }

  deleteUser(user: User) {
    if (confirm(`¿Está seguro de eliminar permanentemente al usuario ${user.fullName}? Esta acción no se puede deshacer.`)) {
      this.adminService.deleteUser(user.id).subscribe(() => {
        this.snackBar.open('Usuario eliminado exitosamente', 'Cerrar', { duration: 3000 });
        this.loadUsers();
      });
    }
  }

  onPageChange(event: PageEvent) {
    // Handle pagination
  }

  // Monitoring Methods
  loadSystemMetrics() {
    this.adminService.getSystemMetrics().subscribe((metrics: SystemMetrics) => {
      this.systemMetrics.set(metrics);
    });
  }

  refreshMetrics() {
    this.loadSystemMetrics();
    this.snackBar.open('Métricas actualizadas', 'Cerrar', { duration: 2000 });
  }

  exportMetrics() {
    this.adminService.exportMetrics().subscribe(() => {
      this.snackBar.open('Métricas exportadas exitosamente', 'Cerrar', { duration: 3000 });
    });
  }

  // Logs Methods
  loadAuditLogs() {
    this.adminService.getAuditLogs().subscribe((logs: AuditLog[]) => {
      this.auditLogs.set(logs);
      this.filteredLogs.set(logs);
    });
  }

  filterLogs() {
    let filtered = this.auditLogs();
    
    if (this.logFilter.eventType) {
      filtered = filtered.filter(log => log.eventType === this.logFilter.eventType);
    }
    
    if (this.logFilter.level) {
      filtered = filtered.filter(log => log.level === this.logFilter.level);
    }
    
    if (this.logFilter.startDate) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= this.logFilter.startDate!);
    }
    
    if (this.logFilter.endDate) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= this.logFilter.endDate!);
    }
    
    this.filteredLogs.set(filtered);
  }

  clearLogFilters() {
    this.logFilter = {
      eventType: '',
      level: '',
      startDate: null,
      endDate: null
    };
    this.filteredLogs.set(this.auditLogs());
  }

  viewLogDetails(log: AuditLog) {
    this.snackBar.open(`Ver detalles del log ID: ${log.id}`, 'Cerrar', { duration: 3000 });
  }

  exportLogs() {
    this.adminService.exportLogs(this.filteredLogs()).subscribe(() => {
      this.snackBar.open('Logs exportados exitosamente', 'Cerrar', { duration: 3000 });
    });
  }

  // Configuration Methods
  loadConfiguration() {
    this.adminService.getConfiguration().subscribe((config: SystemConfig) => {
      this.configForm.patchValue(config);
    });
  }

  saveConfiguration() {
    if (this.configForm.valid) {
      this.adminService.updateConfiguration(this.configForm.value).subscribe(() => {
        this.snackBar.open('Configuración guardada exitosamente', 'Cerrar', { duration: 3000 });
      });
    }
  }

  resetConfiguration() {
    if (confirm('¿Está seguro de restaurar los valores por defecto? Se perderán los cambios actuales.')) {
      this.adminService.getDefaultConfiguration().subscribe((config: SystemConfig) => {
        this.configForm.patchValue(config);
        this.snackBar.open('Configuración restaurada', 'Cerrar', { duration: 3000 });
      });
    }
  }

  createBackupNow() {
    this.snackBar.open('Creando backup...', 'Cerrar', { duration: 2000 });
    this.adminService.createBackup().subscribe(() => {
      this.snackBar.open('Backup creado exitosamente', 'Cerrar', { duration: 3000 });
    });
  }

  restoreBackup() {
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 3000 });
  }
}
